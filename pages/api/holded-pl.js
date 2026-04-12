// API route: Fetches full P&L from Holded Accounting API
// Uses Chart of Accounts endpoint (per month) to get accurate account balances
// This matches exactly what Holded's own P&L report shows
//
// Spanish PGC account mapping:
//   7xx = Ingresos (revenue)
//   640-649 = Gastos de personal (staff costs)
//   62x = Servicios exteriores / G&A
//   60x, 61x, 63x (non-623), 65x-69x = Other expenses

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

function classifyAccount(accountNum) {
  if (!accountNum) return null;
  const num = String(accountNum);
  const d1 = num.charAt(0);
  const d2 = num.substring(0, 2);
  if (d1 === '7') return 'revenue';
  if (d1 === '6') {
    if (d2 === '64') return 'staff';
    if (d2 === '62') return 'opex';
    return 'other_expense';
  }
  return null;
}

function isPlatformAccount(num, name) {
  const n = String(num);
  const nameLower = (name || '').toLowerCase();
  if (n.startsWith('6231')) return true;
  if (n.startsWith('629')) return true;
  const platformKeywords = ['biloop', 'autodespo', 'microsoft', 'cloud', 'checkit', 'power bi', 'informatica', 'software', 'saas', 'hosting'];
  return platformKeywords.some(kw => nameLower.includes(kw));
}

function getMonthTimestamps(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return {
    starttmp: Math.floor(start.getTime() / 1000),
    endtmp: Math.floor(end.getTime() / 1000),
  };
}

export default async function handler(req, res) {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const maxMonth = year < currentYear ? 12 : (year === currentYear ? currentMonth + 1 : 0);

    const monthPromises = [];
    for (let m = 0; m < maxMonth; m++) {
      const { starttmp, endtmp } = getMonthTimestamps(year, m);
      monthPromises.push(
        hGet('accounting/v1/chartofaccounts', {
          starttmp: String(starttmp),
          endtmp: String(endtmp),
          includeEmpty: '0',
        }).then(data => ({ month: m, accounts: data }))
         .catch(err => ({ month: m, accounts: [], error: err.message }))
      );
    }

    const monthResults = await Promise.all(monthPromises);
    const months = [];
    const totals = { revenue: 0, staff: 0, platforms: 0, ga: 0, opex: 0, other_expense: 0, contribution: 0, ebitda: 0, net_result: 0 };

    for (let m = 0; m < 12; m++) {
      const monthData = monthResults.find(r => r.month === m);
      const accounts = (monthData && Array.isArray(monthData.accounts)) ? monthData.accounts : [];
      let revenue = 0, staff = 0, platforms = 0, ga = 0, otherExpense = 0;
      const revenueAccounts = [], gaAccounts = [], platformAccounts = [], staffAccounts = [];

      accounts.forEach(acc => {
        const num = String(acc.num || acc.number || acc.code || '');
        const name = acc.name || '';
        const balance = parseFloat(acc.balance || 0);
        const category = classifyAccount(num);
        if (!category) return;

        if (category === 'revenue') {
          const amount = -balance;
          revenue += amount;
          revenueAccounts.push({ num, name, amount: Math.round(amount * 100) / 100 });
        } else if (category === 'staff') {
          staff += balance;
          staffAccounts.push({ num, name, amount: Math.round(balance * 100) / 100 });
        } else if (category === 'opex') {
          if (isPlatformAccount(num, name)) {
            platforms += balance;
            platformAccounts.push({ num, name, amount: Math.round(balance * 100) / 100 });
          } else {
            ga += balance;
            gaAccounts.push({ num, name, amount: Math.round(balance * 100) / 100 });
          }
        } else if (category === 'other_expense') {
          otherExpense += balance;
          gaAccounts.push({ num, name, amount: Math.round(balance * 100) / 100 });
        }
      });

      ga += otherExpense;
      const contribution = revenue - staff - platforms;
      const contributionMargin = revenue > 0 ? (contribution / revenue) * 100 : 0;
      const ebitda = contribution - ga;
      const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0;
      const netResult = ebitda;

      months.push({
        month: m, hasData: accounts.length > 0,
        revenue: Math.round(revenue * 100) / 100,
        staff: Math.round(staff * 100) / 100,
        platforms: Math.round(platforms * 100) / 100,
        ga: Math.round(ga * 100) / 100,
        contribution: Math.round(contribution * 100) / 100,
        contribution_margin: Math.round(contributionMargin * 10) / 10,
        ebitda: Math.round(ebitda * 100) / 100,
        ebitda_margin: Math.round(ebitdaMargin * 10) / 10,
        net_result: Math.round(netResult * 100) / 100,
        revenue_accounts: revenueAccounts.sort((a, b) => b.amount - a.amount),
        staff_accounts: staffAccounts.sort((a, b) => b.amount - a.amount),
        platform_accounts: platformAccounts.sort((a, b) => b.amount - a.amount),
        ga_accounts: gaAccounts.sort((a, b) => b.amount - a.amount),
      });

      if (accounts.length > 0) {
        totals.revenue += revenue;
        totals.staff += staff;
        totals.platforms += platforms;
        totals.ga += ga;
      }
    }

    totals.contribution = totals.revenue - totals.staff - totals.platforms;
    totals.ebitda = totals.contribution - totals.ga;
    totals.net_result = totals.ebitda;
    Object.keys(totals).forEach(k => { totals[k] = Math.round(totals[k] * 100) / 100; });

    const realMonths = months.filter(m => m.hasData).length;
    res.status(200).json({ year, realMonths, months, totals });
  } catch (error) {
    console.error('Holded P&L error:', error);
    res.status(500).json({ error: 'Error fetching P&L from Holded', details: error.message });
  }
}
