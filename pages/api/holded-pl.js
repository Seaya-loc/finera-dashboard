// API route: Fetches full P&L from Holded Accounting API
// Uses Daily Ledger (journal entries) + Chart of Accounts to build a monthly P&L
// Spanish PGC account mapping:
//   7xx = Ingresos (revenue)
//   640-649 = Gastos de personal (staff costs)
//   62x = Servicios exteriores (platforms/external services)
//   60x, 61x, 63x, 65x-69x = G&A / other expenses

const HOLDED_API_KEY = process.env.HOLDED_API_KEY || 'f483bffd49306706b9d00d24932cb673';
const HOLDED_BASE = 'https://api.holded.com/api';

async function hGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${HOLDED_BASE}/${path}${qs ? '?' + qs : ''}`;
  const res = await fetch(url, {
    headers: { 'key': HOLDED_API_KEY, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Holded ${res.status}: ${text}`);
  }
  return res.json();
}

// Fetch all daily ledger pages for a date range
async function fetchAllLedgerEntries(starttmp, endtmp) {
  let allEntries = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await hGet('accounting/v1/dailyledger', {
      page: String(page),
      starttmp: String(starttmp),
      endtmp: String(endtmp),
    });

    if (Array.isArray(data) && data.length > 0) {
      allEntries = allEntries.concat(data);
      // Holded paginates at 500 entries
      hasMore = data.length >= 500;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allEntries;
}

// Classify an account number into a P&L category
function classifyAccount(accountNum) {
  if (!accountNum) return null;
  const num = String(accountNum);
  const prefix1 = num.charAt(0);
  const prefix2 = num.substring(0, 2);
  const prefix3 = num.substring(0, 3);

  // Group 7: Revenue
  if (prefix1 === '7') return 'revenue';

  // Group 6: Expenses
  if (prefix1 === '6') {
    // 640-649: Staff costs (sueldos, SS, indemnizaciones, etc.)
    if (prefix2 === '64') return 'staff';
    // 620-629: External services (alquileres, reparaciones, servicios profesionales, seguros, servicios bancarios, publicidad, suministros, otros servicios)
    if (prefix2 === '62') return 'platforms';
    // Everything else in group 6 = G&A
    return 'ga';
  }

  // Group 1-5: Balance sheet items (not P&L)
  // Group 8-9: Special accounts
  return null;
}

export default async function handler(req, res) {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Timestamps for the year range
    const startDate = new Date(year, 0, 1); // Jan 1
    const endDate = new Date(year, 11, 31, 23, 59, 59); // Dec 31
    const starttmp = Math.floor(startDate.getTime() / 1000);
    const endtmp = Math.floor(endDate.getTime() / 1000);

    // Fetch Chart of Accounts and Daily Ledger in parallel
    const [chartOfAccounts, ledgerEntries] = await Promise.all([
      hGet('accounting/v1/chartofaccounts', { includeEmpty: '0' }),
      fetchAllLedgerEntries(starttmp, endtmp),
    ]);

    // Build account number lookup from Chart of Accounts
    const accountMap = {};
    if (Array.isArray(chartOfAccounts)) {
      chartOfAccounts.forEach(acc => {
        // Holded may return accounts with various field names
        const num = acc.num || acc.number || acc.code || acc.accountNum || '';
        const name = acc.name || acc.description || '';
        accountMap[acc.id || num] = { num: String(num), name };
      });
    }

    // Initialize monthly P&L buckets
    const monthly = {};
    for (let m = 0; m < 12; m++) {
      monthly[m] = { revenue: 0, staff: 0, platforms: 0, ga: 0 };
    }

    // Debug info
    let processedEntries = 0;
    let skippedEntries = 0;
    let sampleEntries = [];

    // Process each ledger entry
    // Holded's Daily Ledger may return entries in different formats.
    // Common structure: each entry has date, entries[] array with account/debit/credit
    // Or: flat entries with account, debit, credit, date
    ledgerEntries.forEach((entry, idx) => {
      // Save first 3 entries as samples for debugging
      if (idx < 3) sampleEntries.push(entry);

      // Handle nested entries format (entry with sub-entries)
      if (entry.entries && Array.isArray(entry.entries)) {
        const entryDate = new Date((entry.date || entry.timestamp || 0) * 1000);
        const month = entryDate.getMonth();

        entry.entries.forEach(subEntry => {
          const accountId = subEntry.account || subEntry.accountId || subEntry.accountNum || '';
          const accountInfo = accountMap[accountId] || { num: String(accountId), name: '' };
          const accountNum = accountInfo.num || String(accountId);
          const category = classifyAccount(accountNum);

          if (category && monthly[month]) {
            const debit = parseFloat(subEntry.debit || subEntry.debe || 0);
            const credit = parseFloat(subEntry.credit || subEntry.haber || 0);

            // For revenue accounts (7xx): credit increases, debit decreases
            if (category === 'revenue') {
              monthly[month].revenue += credit - debit;
            } else {
              // For expense accounts (6xx): debit increases, credit decreases
              monthly[month][category] += debit - credit;
            }
            processedEntries++;
          } else {
            skippedEntries++;
          }
        });
      }
      // Handle flat entry format
      else {
        const entryDate = new Date((entry.date || entry.timestamp || entry.created || 0) * 1000);
        const month = entryDate.getMonth();
        const accountId = entry.account || entry.accountId || entry.accountNum || '';
        const accountInfo = accountMap[accountId] || { num: String(accountId), name: '' };
        const accountNum = accountInfo.num || String(accountId);
        const category = classifyAccount(accountNum);

        if (category && monthly[month] !== undefined) {
          const debit = parseFloat(entry.debit || entry.debe || 0);
          const credit = parseFloat(entry.credit || entry.haber || 0);

          if (category === 'revenue') {
            monthly[month].revenue += credit - debit;
          } else {
            monthly[month][category] += debit - credit;
          }
          processedEntries++;
        } else {
          skippedEntries++;
        }
      }
    });

    // Compute derived metrics
    const result = {
      year,
      months: [],
      totals: { revenue: 0, staff: 0, platforms: 0, ga: 0, contribution: 0, ebitda: 0, net_result: 0 },
      debug: {
        totalLedgerEntries: ledgerEntries.length,
        chartOfAccountsCount: Array.isArray(chartOfAccounts) ? chartOfAccounts.length : 0,
        processedEntries,
        skippedEntries,
        sampleEntries: sampleEntries.slice(0, 2),
        sampleAccounts: Object.values(accountMap).slice(0, 10),
      },
    };

    for (let m = 0; m < 12; m++) {
      const { revenue, staff, platforms, ga } = monthly[m];
      const contribution = revenue - staff - platforms;
      const contributionMargin = revenue > 0 ? (contribution / revenue) * 100 : 0;
      const ebitda = contribution - ga;
      const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
      // Net result ≈ EBITDA for now (proper calculation needs financial results + taxes)
      const net_result = ebitda;

      result.months.push({
        month: m,
        revenue: Math.round(revenue * 100) / 100,
        staff: Math.round(staff * 100) / 100,
        platforms: Math.round(platforms * 100) / 100,
        ga: Math.round(ga * 100) / 100,
        contribution: Math.round(contribution * 100) / 100,
        contribution_margin: Math.round(contributionMargin * 10) / 10,
        ebitda: Math.round(ebitda * 100) / 100,
        ebitda_margin: Math.round(ebitdaMargin * 10) / 10,
        net_result: Math.round(net_result * 100) / 100,
      });

      // Accumulate totals
      result.totals.revenue += revenue;
      result.totals.staff += staff;
      result.totals.platforms += platforms;
      result.totals.ga += ga;
    }

    result.totals.contribution = result.totals.revenue - result.totals.staff - result.totals.platforms;
    result.totals.ebitda = result.totals.contribution - result.totals.ga;
    result.totals.net_result = result.totals.ebitda;

    // Round totals
    Object.keys(result.totals).forEach(k => {
      result.totals[k] = Math.round(result.totals[k] * 100) / 100;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Holded P&L error:', error);
    res.status(500).json({
      error: 'Error fetching P&L from Holded',
      details: error.message,
      hint: 'Check that HOLDED_API_KEY is set and the Accounting module is enabled in Holded.',
    });
  }
}
