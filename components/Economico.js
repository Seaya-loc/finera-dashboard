import { useState, useEffect } from 'react';

// âââ Constants âââ
const MONTH_NAMES_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Platform account names that are TRUE platforms (rest â G&A)
const TRUE_PLATFORM_KEYWORDS = ['biloop', 'autodespo', 'aelis', 'next step'];
function isTruePlatform(name) {
  const n = (name || '').toLowerCase();
  return TRUE_PLATFORM_KEYWORDS.some(kw => n.includes(kw));
}

// âââ Formatting âââ
function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return 'â';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function fmtPct(n) {
  if (n === null || n === undefined || isNaN(n)) return 'â';
  return `${n.toFixed(1)}%`;
}

// âââ Detect client MoM status for coloring âââ
function getClientStatus(monthly, monthIdx) {
  const cur = monthly[monthIdx] || 0;
  const prev = monthIdx > 0 ? (monthly[monthIdx - 1] || 0) : null;
  if (prev === null) return cur > 0 ? 'existing' : 'none';
  if (prev === 0 && cur > 0) return 'new';
  if (prev > 0 && cur === 0) return 'churn';
  if (cur > prev) return 'upsell';
  if (cur < prev && cur > 0) return 'downsell';
  return 'existing';
}

const statusColors = {
  new: '#38a169', upsell: '#38a169', churn: '#e53e3e', downsell: '#e53e3e',
  existing: '#2d3748', none: '#a0aec0',
};
const statusLabels = {
  new: 'New', upsell: 'Upsell', churn: 'Churn', downsell: 'Downsell', existing: '', none: '',
};

// âââ KPI Card âââ
function KPICard({ label, value, subtitle, trend, color = '#1a365d' }) {
  return (
    <div style={kpiStyles.card}>
      <div style={kpiStyles.label}>{label}</div>
      <div style={{ ...kpiStyles.value, color }}>{value}</div>
      {subtitle && <div style={kpiStyles.subtitle}>{subtitle}</div>}
      {trend !== undefined && trend !== null && (
        <div style={{ ...kpiStyles.trend, color: trend >= 0 ? '#38a169' : '#e53e3e' }}>
          {trend >= 0 ? 'â²' : 'â¼'} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
const kpiStyles = {
  card: { background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', flex: '1 1 180px', minWidth: 160 },
  label: { fontSize: 12, color: '#718096', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 26, fontWeight: 700, marginTop: 4 },
  subtitle: { fontSize: 12, color: '#a0aec0', marginTop: 2 },
  trend: { fontSize: 13, fontWeight: 600, marginTop: 6 },
};

// âââ Simple Bar Chart âââ
function SimpleBarChart({ data, barColor = '#3182ce' }) {
  const max = Math.max(...data.map(d => Math.abs(d.value)), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#718096', fontWeight: 500 }}>
            {Math.abs(d.value) > 0 ? `${(d.value / 1000).toFixed(0)}k` : ''}
          </span>
          <div style={{
            width: '100%', maxWidth: 40,
            height: `${(Math.abs(d.value) / max) * 120}px`,
            background: d.value < 0 ? '#e53e3e' : (d.highlight ? '#1a365d' : barColor),
            borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease',
            opacity: d.value === 0 ? 0.2 : 1,
          }} />
          <span style={{ fontSize: 10, color: '#a0aec0' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// âââ Main Component âââ
export default function Economico() {
  const [bpData, setBpData] = useState(null);
  const [holdedPL, setHoldedPL] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subTab, setSubTab] = useState('metricas');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showRecurringDetail, setShowRecurringDetail] = useState(false);
  const [showNonRecurringDetail, setShowNonRecurringDetail] = useState(false);
  const [showPlatformDetail, setShowPlatformDetail] = useState(false);
  const [showGADetail, setShowGADetail] = useState(false);

  useEffect(() => { loadAllData(); }, []);

  // When holdedPL loads and selectedMonth is null, set it to REAL_MONTHS
  useEffect(() => {
    if (holdedPL && selectedMonth === null) {
      setSelectedMonth(holdedPL.realMonths);
    }
  }, [holdedPL, selectedMonth]);

  async function loadAllData() {
    setLoading(true);
    setError(null);
    try {
      const [bpRes, plRes] = await Promise.all([
        fetch('/bp_data.json'),
        fetch('/api/holded-pl?year=2026'),
      ]);
      if (bpRes.ok) setBpData(await bpRes.json());
      if (plRes.ok) {
        setHoldedPL(await plRes.json());
      } else {
        console.warn('Holded P&L not available, using BP data only');
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <div style={{ textAlign: 'center', color: '#718096' }}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: 16 }}>Cargando datos de Holded y Business Plan...</p>
        </div>
      </div>
    );
  }

  const bp = bpData || {};
  const pl = holdedPL;
  const REAL_MONTHS = pl ? pl.realMonths : 0;
  const displayMonths = selectedMonth || REAL_MONTHS || 0;

  // ââ Merge data: Holded real + BP forecast ââ
  const revenues = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS && pl && pl.months && pl.months[m]) return pl.months[m].revenue;
    return bp.revenues ? bp.revenues[m] : 0;
  });
  const staffCost = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS && pl && pl.months && pl.months[m]) return pl.months[m].staff;
    return bp.staff_cost ? Math.abs(bp.staff_cost[m]) : 0;
  });

  // ââ Account breakdowns from Holded ââ
  const revenueAccountsByMonth = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS && pl && pl.months && pl.months[m]) return pl.months[m].revenue_accounts || [];
    return [];
  });
  const gaAccountsByMonth = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS && pl && pl.months && pl.months[m]) return pl.months[m].ga_accounts || [];
    return [];
  });
  const platformAccountsByMonth = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS && pl && pl.months && pl.months[m]) return pl.months[m].platform_accounts || [];
    return [];
  });

  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // NEW STRUCTURE: Split revenue, platforms, amortizaciÃ³n
  // ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  // ââ MRR (recurring) from account 705000000 ââ
  const mrrByMonth = revenueAccountsByMonth.map(accs => {
    const recurring = accs.filter(a => String(a.num).startsWith('70500000'));
    return recurring.reduce((s, a) => s + a.amount, 0);
  });

  // ââ Non-recurring revenue (compute directly from account data for real months) ââ
  const nonRecurringByMonth = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS) {
      return revenueAccountsByMonth[m]
        .filter(a => !String(a.num).startsWith('70500000'))
        .reduce((s, a) => s + a.amount, 0);
    }
    return revenues[m] - mrrByMonth[m];
  });

  // ââ Recalculate revenues for real months to ensure they match exactly ââ
  const revenuesCorrected = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS) return mrrByMonth[m] + nonRecurringByMonth[m];
    return revenues[m];
  });

  // ââ Non-recurring revenue account detail ââ
  const allNonRecurringAccounts = {};
  revenueAccountsByMonth.forEach(accs => {
    accs.filter(a => !String(a.num).startsWith('70500000')).forEach(a => {
      if (!allNonRecurringAccounts[a.num]) allNonRecurringAccounts[a.num] = a.name;
    });
  });

  // ââ TRUE Platforms (Biloop, Autodespo, AELIS, Next Step) ââ
  const truePlatformsByMonth = platformAccountsByMonth.map(accs => {
    return accs.filter(a => isTruePlatform(a.name)).reduce((s, a) => s + a.amount, 0);
  });
  // Fill with BP data for forecast months
  const platformsCostTotal = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS) return truePlatformsByMonth[m];
    return bp.platforms ? Math.abs(bp.platforms[m]) : 0;
  });

  // ââ Non-true platforms â go to G&A ââ
  const fakePlatformsByMonth = platformAccountsByMonth.map(accs => {
    return accs.filter(a => !isTruePlatform(a.name)).reduce((s, a) => s + a.amount, 0);
  });

  // ââ AmortizaciÃ³n (68x accounts, currently inside ga_accounts) ââ
  const amortizationByMonth = gaAccountsByMonth.map(accs => {
    return accs.filter(a => String(a.num).startsWith('68')).reduce((s, a) => s + a.amount, 0);
  });

  // ââ G&A = original G&A + fake platforms - amortizaciÃ³n ââ
  const gaCosts = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS && pl && pl.months && pl.months[m]) {
      const originalGA = pl.months[m].ga;
      return originalGA + fakePlatformsByMonth[m] - amortizationByMonth[m];
    }
    return bp.ga_costs ? Math.abs(bp.ga_costs[m]) : 0;
  });

  // ââ Collect unique accounts for detail views ââ
  const allTruePlatformAccounts = {};
  platformAccountsByMonth.forEach(accs => {
    accs.filter(a => isTruePlatform(a.name)).forEach(a => {
      if (!allTruePlatformAccounts[a.num]) allTruePlatformAccounts[a.num] = a.name;
    });
  });

  const allGAAccounts = {};
  // Add non-true platform accounts to G&A
  platformAccountsByMonth.forEach(accs => {
    accs.filter(a => !isTruePlatform(a.name)).forEach(a => {
      if (!allGAAccounts[a.num]) allGAAccounts[a.num] = a.name;
    });
  });
  // Add original G&A accounts (excluding amortizaciÃ³n)
  gaAccountsByMonth.forEach(accs => {
    accs.filter(a => !String(a.num).startsWith('68')).forEach(a => {
      if (!allGAAccounts[a.num]) allGAAccounts[a.num] = a.name;
    });
  });

  const allAmortAccounts = {};
  gaAccountsByMonth.forEach(accs => {
    accs.filter(a => String(a.num).startsWith('68')).forEach(a => {
      if (!allAmortAccounts[a.num]) allAmortAccounts[a.num] = a.name;
    });
  });

  // Helper: get amount for a specific account in a given month across all source arrays
  function getAccountAmount(num, m) {
    // Check in platform accounts
    const pAcc = (platformAccountsByMonth[m] || []).find(a => String(a.num) === String(num));
    if (pAcc) return pAcc.amount;
    // Check in GA accounts
    const gAcc = (gaAccountsByMonth[m] || []).find(a => String(a.num) === String(num));
    if (gAcc) return gAcc.amount;
    return 0;
  }

  // ââ Derived metrics ââ
  const contribution = revenuesCorrected.map((r, m) => r - staffCost[m] - platformsCostTotal[m]);
  const contributionMargin = revenuesCorrected.map((r, m) => r > 0 ? (contribution[m] / r) * 100 : 0);
  const ebitda = contribution.map((c, m) => c - gaCosts[m]);
  const amortTotal = amortizationByMonth;
  const netResult = ebitda.map((e, m) => e - amortTotal[m]);
  const cashAccumulated = bp.cash_accumulated || Array(12).fill(0);

  // ââ KPI totals (from displayMonths only) ââ
  const totalRevenue = revenuesCorrected.slice(0, displayMonths).reduce((a, b) => a + b, 0);
  const totalExpenses = staffCost.slice(0, displayMonths).map((s, m) => s + platformsCostTotal[m] + gaCosts[m]);
  const totalExp = totalExpenses.reduce((a, b) => a + b, 0);
  const totalEBITDA = ebitda.slice(0, displayMonths).reduce((a, b) => a + b, 0);
  const lastCash = cashAccumulated[Math.min(displayMonths - 1, 11)] || 0;
  const currentMRR = mrrByMonth[displayMonths - 1] || 0;

  const lastRealMonth = Math.min(displayMonths - 1, 11);
  const prevMonth = lastRealMonth > 0 ? lastRealMonth - 1 : null;
  const revGrowth = prevMonth !== null && revenuesCorrected[prevMonth] > 0
    ? ((revenuesCorrected[lastRealMonth] - revenuesCorrected[prevMonth]) / revenuesCorrected[prevMonth]) * 100 : null;

  // ââ Client data from BP ââ
  const clients = bp.clients || [];

  // ââ ARR = 12 * monthly recurring ââ
  const arrByMonth = mrrByMonth.map(m => m * 12);

  return (
    <div>
      {/* Month selector dropdown */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#718096' }}>Datos hasta:</label>
        <select
          value={selectedMonth || ''}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            background: '#fff',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            color: '#2d3748',
            fontFamily: 'inherit',
          }}
        >
          {Array.from({ length: REAL_MONTHS }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {MONTH_NAMES_FULL[i]} 2026
            </option>
          ))}
        </select>
      </div>

      {/* Sub-navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'metricas', label: 'MÃ©tricas principales' },
          { key: 'pl', label: 'P&L y PrevisiÃ³n de Caja' },
          { key: 'cierre', label: 'Cierre de AÃ±o' },
        ].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            ...subTabStyle, ...(subTab === t.key ? subTabActive : {}),
          }}>{t.label}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: 16, marginBottom: 20, color: '#c53030', fontSize: 13 }}>
          Error: {error}
          <button onClick={loadAllData} style={{ marginLeft: 12, color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Reintentar</button>
        </div>
      )}

      {!holdedPL && (
        <div style={{ background: '#fffff0', border: '1px solid #fefcbf', borderRadius: 8, padding: 12, marginBottom: 20, color: '#975a16', fontSize: 12 }}>
          Datos contables de Holded no disponibles. Mostrando solo datos del Business Plan.
        </div>
      )}

      {/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {/* TAB 1: MÃ©tricas principales */}
      {/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {subTab === 'metricas' && (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <KPICard label="Ingresos" value={fmt(totalRevenue)} subtitle={`Acumulado hasta ${MONTH_NAMES_FULL[displayMonths - 1] || 'â'}`} trend={revGrowth} />
            <KPICard label="Gastos" value={fmt(-totalExp)} subtitle={`Acumulado hasta ${MONTH_NAMES_FULL[displayMonths - 1] || 'â'}`} />
            <KPICard label="EBITDA" value={fmt(totalEBITDA)} subtitle={`Acumulado hasta ${MONTH_NAMES_FULL[displayMonths - 1] || 'â'}`} color={totalEBITDA >= 0 ? '#38a169' : '#e53e3e'} />
            <KPICard label="MRR actual" value={fmt(currentMRR)} subtitle={`${MONTH_NAMES[displayMonths - 1] || 'â'} 2026`} color="#3182ce" />
            <KPICard label="Caja" value={fmt(lastCash)} subtitle={`${MONTH_NAMES[displayMonths - 1] || 'â'} 2026`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Ingresos mensuales</h3>
              <SimpleBarChart data={MONTH_NAMES.slice(0, displayMonths).map((l, i) => ({
                label: l, value: revenuesCorrected[i], highlight: i < REAL_MONTHS,
              }))} barColor="#3182ce" />
            </div>
            <div style={cardStyle}>
              <h3 style={cardTitle}>EBITDA mensual</h3>
              <SimpleBarChart data={MONTH_NAMES.slice(0, displayMonths).map((l, i) => ({
                label: l, value: ebitda[i], highlight: i < REAL_MONTHS,
              }))} barColor="#38a169" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={cardStyle}>
              <h3 style={cardTitle}>MRR vs No Recurrente</h3>
              <SimpleBarChart data={MONTH_NAMES.slice(0, displayMonths).map((l, i) => ({
                label: l, value: mrrByMonth[i], highlight: i < REAL_MONTHS,
              }))} barColor="#805ad5" />
              <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 8 }}>
                Cuenta 705000000 (Prestaciones de servicios recurrentes). Solo meses reales de Holded.
              </div>
            </div>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Caja acumulada</h3>
              <SimpleBarChart data={MONTH_NAMES.slice(0, displayMonths).map((l, i) => ({
                label: l, value: cashAccumulated[i], highlight: i < REAL_MONTHS,
              }))} barColor="#805ad5" />
            </div>
          </div>

          <p style={{ fontSize: 11, color: '#a0aec0', marginTop: 16 }}>
            Barras resaltadas = meses con datos reales de Holded ({REAL_MONTHS} meses). El resto son previsiones del Business Plan.
          </p>
        </>
      )}

      {/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {/* TAB 2: P&L y PrevisiÃ³n de Caja */}
      {/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {subTab === 'pl' && (
        <>
        <div style={{ ...cardStyle, overflowX: 'auto' }}>
          <h3 style={{ ...cardTitle, marginBottom: 20 }}>Cuenta de Resultados â 2026</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: 0, background: '#fff', zIndex: 3, minWidth: 220 }}>Concepto</th>
                {MONTH_NAMES.slice(0, displayMonths).map((m, i) => (
                  <th key={i} style={{ ...thStyle, background: i < REAL_MONTHS ? '#e6fffa' : '#fff' }}>{m}</th>
                ))}
                <th style={{ ...thStyle, borderLeft: '2px solid #e2e8f0' }}>Total</th>
              </tr>
            </thead>
            <tbody>

              {/* ââ INGRESOS RECURRENTES ââ */}
              <tr style={{ cursor: 'pointer' }} onClick={() => setShowRecurringDetail(!showRecurringDetail)}>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#1a365d', position: 'sticky', left: 0, background: '#ebf8ff', zIndex: 1 }}>
                  <span style={{ marginRight: 6 }}>{showRecurringDetail ? 'â¾' : 'â¸'}</span>
                  INGRESOS RECURRENTES
                </td>
                {mrrByMonth.slice(0, displayMonths).map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#1a365d', background: '#ebf8ff' }}>{fmt(v)}</td>
                ))}
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#1a365d', background: '#ebf8ff', borderLeft: '2px solid #e2e8f0' }}>
                  {fmt(mrrByMonth.slice(0, displayMonths).reduce((a, b) => a + b, 0))}
                </td>
              </tr>

              {/* Client detail with MoM coloring */}
              {showRecurringDetail && clients.map((c, ci) => {
                const vals = c.monthly || Array(12).fill(0);
                return (
                  <tr key={`client-${ci}`} style={{ background: ci % 2 === 0 ? '#fff' : '#f7fafc' }}>
                    <td style={{ ...tdStyle, fontSize: 12, paddingLeft: 28, color: '#4a5568', position: 'sticky', left: 0, background: ci % 2 === 0 ? '#fff' : '#f7fafc', zIndex: 1 }}>
                      {c.name}
                    </td>
                    {vals.slice(0, displayMonths).map((v, i) => {
                      const status = getClientStatus(vals, i);
                      return (
                        <td key={i} style={{ ...tdStyle, textAlign: 'right', fontSize: 12, color: statusColors[status] || '#2d3748' }}>
                          {fmt(v)}
                          {statusLabels[status] && <div style={{ fontSize: 9, fontWeight: 600 }}>{statusLabels[status]}</div>}
                        </td>
                      );
                    })}
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 12, fontWeight: 600, borderLeft: '2px solid #e2e8f0' }}>
                      {fmt(vals.slice(0, displayMonths).reduce((a, b) => a + b, 0))}
                    </td>
                  </tr>
                );
              })}

              {/* ââ INGRESOS NO RECURRENTES ââ */}
              <tr style={{ cursor: 'pointer' }} onClick={() => setShowNonRecurringDetail(!showNonRecurringDetail)}>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#975a16', position: 'sticky', left: 0, background: '#fefcbf', zIndex: 1 }}>
                  <span style={{ marginRight: 6 }}>{showNonRecurringDetail ? 'â¾' : 'â¸'}</span>
                  INGRESOS NO RECURRENTES
                </td>
                {nonRecurringByMonth.slice(0, displayMonths).map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#975a16', background: '#fefcbf' }}>{fmt(v)}</td>
                ))}
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#975a16', background: '#fefcbf', borderLeft: '2px solid #e2e8f0' }}>
                  {fmt(nonRecurringByMonth.slice(0, displayMonths).reduce((a, b) => a + b, 0))}
                </td>
              </tr>

              {/* Non-recurring account detail */}
              {showNonRecurringDetail && Object.entries(allNonRecurringAccounts).map(([num, name]) => (
                <tr key={`nr-${num}`} style={{ background: '#f7fafc' }}>
                  <td style={{ ...tdStyle, fontSize: 11, paddingLeft: 28, color: '#718096', position: 'sticky', left: 0, background: '#f7fafc', zIndex: 1 }}>
                    {name}
                  </td>
                  {Array.from({ length: displayMonths }, (_, m) => {
                    const acc = (revenueAccountsByMonth[m] || []).find(a => String(a.num) === String(num));
                    return <td key={m} style={{ ...tdStyle, textAlign: 'right', fontSize: 11, color: '#718096' }}>{acc ? fmt(acc.amount) : 'â'}</td>;
                  })}
                  <td style={{ ...tdStyle, textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#718096', borderLeft: '2px solid #e2e8f0' }}>
                    {fmt(revenueAccountsByMonth.slice(0, displayMonths).reduce((sum, accs) => {
                      const a = accs.find(a => String(a.num) === String(num));
                      return sum + (a ? a.amount : 0);
                    }, 0))}
                  </td>
                </tr>
              ))}

              {/* ââ TOTAL INGRESOS ââ */}
              <tr style={{ background: '#e6fffa' }}>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#276749', position: 'sticky', left: 0, background: '#e6fffa', zIndex: 1 }}>TOTAL INGRESOS</td>
                {revenuesCorrected.slice(0, displayMonths).map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#276749' }}>{fmt(v)}</td>
                ))}
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#276749', borderLeft: '2px solid #e2e8f0' }}>{fmt(totalRevenue)}</td>
              </tr>

              <tr><td colSpan={displayMonths + 2} style={{ height: 6 }} /></tr>

              {/* ââ COSTE DE PERSONAL ââ */}
              {makeRowWithTotal('Coste de personal', staffCost, displayMonths)}

              {/* ââ PLATAFORMAS (true platforms only) ââ */}
              <tr style={{ cursor: 'pointer' }} onClick={() => setShowPlatformDetail(!showPlatformDetail)}>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#2d3748', position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                  <span style={{ marginRight: 6 }}>{showPlatformDetail ? 'â¾' : 'â¸'}</span>
                  Plataformas
                </td>
                {platformsCostTotal.slice(0, displayMonths).map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#2d3748' }}>{fmt(v)}</td>
                ))}
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#2d3748', borderLeft: '2px solid #e2e8f0' }}>{fmt(platformsCostTotal.slice(0, displayMonths).reduce((a, b) => a + b, 0))}</td>
              </tr>

              {/* Platform detail */}
              {showPlatformDetail && Object.entries(allTruePlatformAccounts).map(([num, name]) => (
                <tr key={`plat-${num}`} style={{ background: '#f7fafc' }}>
                  <td style={{ ...tdStyle, fontSize: 11, paddingLeft: 28, color: '#718096', position: 'sticky', left: 0, background: '#f7fafc', zIndex: 1 }}>
                    {name}
                  </td>
                  {Array.from({ length: displayMonths }, (_, m) => {
                    const acc = (platformAccountsByMonth[m] || []).find(a => String(a.num) === String(num));
                    return <td key={m} style={{ ...tdStyle, textAlign: 'right', fontSize: 11, color: '#718096' }}>{acc ? fmt(acc.amount) : 'â'}</td>;
                  })}
                  <td style={{ ...tdStyle, textAlign: 'right', fontSize: 11, color: '#718096', borderLeft: '2px solid #e2e8f0' }}>
                    {fmt(platformAccountsByMonth.slice(0, displayMonths).reduce((s, accs) => { const a = accs.find(a => String(a.num) === String(num)); return s + (a ? a.amount : 0); }, 0))}
                  </td>
                </tr>
              ))}

              {/* ââ CONTRIBUCIÃN ââ */}
              {makeRowWithTotal('CONTRIBUCIÃN', contribution, displayMonths, { bold: true, bg: '#f0fff4' })}
              {makePctRowWithTotal('% Margen de contribuciÃ³n', contributionMargin, displayMonths)}

              <tr><td colSpan={displayMonths + 2} style={{ height: 6 }} /></tr>

              {/* ââ G&A (includes non-true platforms + original G&A - amortizaciÃ³n) ââ */}
              <tr style={{ cursor: 'pointer' }} onClick={() => setShowGADetail(!showGADetail)}>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#2d3748', position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                  <span style={{ marginRight: 6 }}>{showGADetail ? 'â¾' : 'â¸'}</span>
                  Gastos generales (G&A)
                </td>
                {gaCosts.slice(0, displayMonths).map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#2d3748' }}>{fmt(-v)}</td>
                ))}
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#2d3748', borderLeft: '2px solid #e2e8f0' }}>{fmt(-gaCosts.slice(0, displayMonths).reduce((a, b) => a + b, 0))}</td>
              </tr>

              {/* G&A detail rows */}
              {showGADetail && Object.entries(allGAAccounts).map(([num, name]) => (
                <tr key={`ga-${num}`} style={{ background: '#f7fafc' }}>
                  <td style={{ ...tdStyle, fontSize: 11, paddingLeft: 28, color: '#718096', position: 'sticky', left: 0, background: '#f7fafc', zIndex: 1 }}>
                    {name}
                  </td>
                  {Array.from({ length: displayMonths }, (_, m) => {
                    const amount = getAccountAmount(num, m);
                    return <td key={m} style={{ ...tdStyle, textAlign: 'right', fontSize: 11, color: '#718096' }}>{amount ? fmt(-amount) : 'â'}</td>;
                  })}
                  <td style={{ ...tdStyle, textAlign: 'right', fontSize: 11, color: '#718096', borderLeft: '2px solid #e2e8f0' }}>
                    {fmt(-Array.from({ length: displayMonths }).reduce((s, _, m) => s + getAccountAmount(num, m), 0))}
                  </td>
                </tr>
              ))}

              {/* ââ EBITDA ââ */}
              {makeRowWithTotal('EBITDA', ebitda, displayMonths, { bold: true, bg: '#fefcbf' })}

              <tr><td colSpan={displayMonths + 2} style={{ height: 4 }} /></tr>

              {/* ââ AMORTIZACIÃN (below EBITDA) ââ */}
              <tr>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#6b46c1', position: 'sticky', left: 0, background: '#faf5ff', zIndex: 1 }}>
                  AmortizaciÃ³n
                </td>
                {amortTotal.slice(0, displayMonths).map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#6b46c1', background: '#faf5ff' }}>{v > 0 ? fmt(-v) : 'â'}</td>
                ))}
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#6b46c1', background: '#faf5ff', borderLeft: '2px solid #e2e8f0' }}>
                  {fmt(-amortTotal.slice(0, displayMonths).reduce((a, b) => a + b, 0))}
                </td>
              </tr>

              {/* ââ RESULTADO NETO ââ */}
              {makeRowWithTotal('RESULTADO NETO', netResult, displayMonths, { bold: true, bg: '#fed7e2' })}

              <tr><td colSpan={displayMonths + 2} style={{ height: 6 }} /></tr>

              {/* ââ CAJA ACUMULADA ââ */}
              <tr style={{ background: '#c6f6d5' }}>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#276749', position: 'sticky', left: 0, background: '#c6f6d5', zIndex: 1 }}>CAJA ACUMULADA</td>
                {cashAccumulated.slice(0, displayMonths).map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#276749' }}>{fmt(v)}</td>
                ))}
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#276749', borderLeft: '2px solid #e2e8f0' }}>{fmt(cashAccumulated[displayMonths - 1])}</td>
              </tr>
            </tbody>
          </table>

          <p style={{ fontSize: 11, color: '#a0aec0', marginTop: 16 }}>
            * Los primeros {displayMonths} meses incluyen datos reales de la contabilidad de Holded. El resto son previsiones del Business Plan.
          </p>
        </div>

        {/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
        {/* ARR TABLE (12 x Monthly Recurring Revenue) */}
        {/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
        <div style={{ ...cardStyle, overflowX: 'auto', marginTop: 24 }}>
          <h3 style={{ ...cardTitle, marginBottom: 20 }}>ARR (Annual Recurring Revenue) â 2026</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: 0, background: '#fff', zIndex: 3, minWidth: 220 }}>Concepto</th>
                {MONTH_NAMES.slice(0, displayMonths).map((m, i) => (
                  <th key={i} style={{ ...thStyle, background: i < REAL_MONTHS ? '#e6fffa' : '#fff' }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...tdStyle, color: '#319795', position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>MRR (mensual)</td>
                {mrrByMonth.slice(0, displayMonths).map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: 'right', color: '#319795' }}>{v > 0 ? fmt(v) : 'â'}</td>
                ))}
              </tr>
              <tr style={{ background: '#e6fffa' }}>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#276749', position: 'sticky', left: 0, background: '#e6fffa', zIndex: 1 }}>ARR (12 Ã MRR)</td>
                {arrByMonth.slice(0, displayMonths).map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#276749', background: '#e6fffa' }}>{v > 0 ? fmt(v) : 'â'}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: 11, color: '#a0aec0', marginTop: 12 }}>
            ARR = 12 Ã Ingresos Recurrentes mensuales (cuenta 705000000). Solo meses con datos reales de Holded.
          </p>
        </div>
        </>
      )}

      {/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {/* TAB 3: Cierre de AÃ±o */}
      {/* âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ */}
      {subTab === 'cierre' && (
        <div style={{ ...cardStyle, overflowX: 'auto' }}>
          <h3 style={{ ...cardTitle, marginBottom: 8 }}>Cierre de AÃ±o â Real vs. PrevisiÃ³n</h3>
          <p style={{ fontSize: 12, color: '#718096', marginBottom: 20 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: '#c6f6d5', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />
            Real (R) = datos cerrados de Holded &nbsp;
            <span style={{ display: 'inline-block', width: 12, height: 12, background: '#fefcbf', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />
            PrevisiÃ³n (P) = Business Plan
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: 0, background: '#fff', zIndex: 3, minWidth: 180 }}>Concepto</th>
                {MONTH_NAMES.slice(0, displayMonths).map((m, i) => (
                  <th key={i} style={{ ...thStyle, background: i < REAL_MONTHS ? '#c6f6d5' : '#fefcbf' }}>
                    {m} {i < REAL_MONTHS ? '(R)' : '(P)'}
                  </th>
                ))}
                <th style={{ ...thStyle, borderLeft: '2px solid #e2e8f0' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {makeCierreRow('Ingresos Recurrentes', mrrByMonth, displayMonths, REAL_MONTHS, { bold: true, bg: '#ebf8ff' })}
              {makeCierreRow('Ingresos No Recurrentes', nonRecurringByMonth, displayMonths, REAL_MONTHS, { bg: '#fefcbf' })}
              {makeCierreRow('TOTAL INGRESOS', revenuesCorrected, displayMonths, REAL_MONTHS, { bold: true, bg: '#e6fffa', color: '#276749' })}
              <tr><td colSpan={displayMonths + 2} style={{ height: 4 }} /></tr>
              {makeCierreRow('Coste de personal', staffCost, displayMonths, REAL_MONTHS)}
              {makeCierreRow('Plataformas', platformsCostTotal, displayMonths, REAL_MONTHS)}
              {makeCierreRow('CONTRIBUCIÃN', contribution, displayMonths, REAL_MONTHS, { bold: true, bg: '#f0fff4' })}
              {makeCierrePctRow('% Margen contribuciÃ³n', contributionMargin, displayMonths, REAL_MONTHS)}
              <tr><td colSpan={displayMonths + 2} style={{ height: 4 }} /></tr>
              {makeCierreRow('Gastos generales (G&A)', gaCosts, displayMonths, REAL_MONTHS)}
              {makeCierreRow('EBITDA', ebitda, displayMonths, REAL_MONTHS, { bold: true, bg: '#fefcbf' })}
              <tr><td colSpan={displayMonths + 2} style={{ height: 4 }} /></tr>
              {makeCierreRow('AmortizaciÃ³n', amortTotal, displayMonths, REAL_MONTHS, { color: '#6b46c1', bg: '#faf5ff' })}
              {makeCierreRow('RESULTADO NETO', netResult, displayMonths, REAL_MONTHS, { bold: true, bg: '#fed7e2' })}
              <tr><td colSpan={displayMonths + 2} style={{ height: 4 }} /></tr>
              {makeCierreRow('CAJA ACUMULADA', cashAccumulated, displayMonths, REAL_MONTHS, { bold: true, bg: '#c6f6d5', color: '#276749' })}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 24 }}>
            <div style={{ flex: '1 1 200px', background: '#f0fff4', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#38a169', fontWeight: 600 }}>YTD Real ({displayMonths} meses)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#276749', marginTop: 4 }}>
                {fmt(revenuesCorrected.slice(0, displayMonths).reduce((a, b) => a + b, 0))} ingresos
              </div>
              <div style={{ fontSize: 13, color: '#38a169' }}>
                EBITDA: {fmt(ebitda.slice(0, displayMonths).reduce((a, b) => a + b, 0))}
              </div>
            </div>
            <div style={{ flex: '1 1 200px', background: '#fffff0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#975a16', fontWeight: 600 }}>PrevisiÃ³n ({Math.max(0, 12 - displayMonths)} meses)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#744210', marginTop: 4 }}>
                {fmt(revenuesCorrected.slice(displayMonths).reduce((a, b) => a + b, 0))} ingresos
              </div>
              <div style={{ fontSize: 13, color: '#975a16' }}>
                EBITDA: {fmt(ebitda.slice(displayMonths).reduce((a, b) => a + b, 0))}
              </div>
            </div>
            <div style={{ flex: '1 1 200px', background: '#ebf8ff', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#3182ce', fontWeight: 600 }}>Total AÃ±o 2026</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1a365d', marginTop: 4 }}>
                {fmt(totalRevenue)} ingresos
              </div>
              <div style={{ fontSize: 13, color: '#3182ce' }}>
                EBITDA: {fmt(totalEBITDA)} ({totalRevenue > 0 ? ((totalEBITDA / totalRevenue) * 100).toFixed(1) : 0}%)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// âââ Row helpers âââ
function makeRowWithTotal(label, values, displayMonths, opts = {}) {
  const { bold, bg, color: textColor } = opts;
  const sliced = values.slice(0, displayMonths);
  const total = sliced.reduce((a, b) => a + b, 0);
  return (
    <tr style={{ background: bg || 'transparent' }}>
      <td style={{ ...tdStyle, fontWeight: bold ? 700 : 400, color: textColor || '#2d3748', position: 'sticky', left: 0, background: bg || '#fff', zIndex: 1 }}>{label}</td>
      {sliced.map((v, i) => (
        <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: bold ? 700 : 400, color: textColor || '#2d3748' }}>{fmt(v)}</td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: textColor || '#2d3748', borderLeft: '2px solid #e2e8f0' }}>{fmt(total)}</td>
    </tr>
  );
}

function makePctRowWithTotal(label, values, displayMonths) {
  const sliced = values.slice(0, displayMonths);
  const avg = sliced.length > 0 ? sliced.reduce((a, b) => a + b, 0) / sliced.length : 0;
  return (
    <tr style={{ background: '#f7fafc' }}>
      <td style={{ ...tdStyle, fontStyle: 'italic', color: '#718096', position: 'sticky', left: 0, background: '#f7fafc', zIndex: 1 }}>{label}</td>
      {sliced.map((v, i) => (
        <td key={i} style={{ ...tdStyle, textAlign: 'right', fontStyle: 'italic', color: '#718096' }}>{fmtPct(v)}</td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', fontStyle: 'italic', color: '#718096', borderLeft: '2px solid #e2e8f0' }}>{fmtPct(avg)}</td>
    </tr>
  );
}

function makeCierreRow(label, values, displayMonths, REAL_MONTHS, opts = {}) {
  const { bold, bg, color: textColor } = opts;
  const sliced = values.slice(0, displayMonths);
  const total = sliced.reduce((a, b) => a + b, 0);
  return (
    <tr style={{ background: bg || 'transparent' }}>
      <td style={{ ...tdStyle, fontWeight: bold ? 700 : 400, color: textColor || '#2d3748', position: 'sticky', left: 0, background: bg || '#fff', zIndex: 1 }}>{label}</td>
      {sliced.map((v, i) => (
        <td key={i} style={{
          ...tdStyle, textAlign: 'right', fontWeight: bold ? 700 : 400,
          color: textColor || '#2d3748',
          background: i < REAL_MONTHS ? 'rgba(198,246,213,0.3)' : 'rgba(254,252,191,0.3)',
        }}>{fmt(v)}</td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: textColor || '#2d3748', borderLeft: '2px solid #e2e8f0' }}>{fmt(total)}</td>
    </tr>
  );
}

function makeCierrePctRow(label, values, displayMonths, REAL_MONTHS) {
  const sliced = values.slice(0, displayMonths);
  const avg = sliced.length > 0 ? sliced.reduce((a, b) => a + b, 0) / sliced.length : 0;
  return (
    <tr style={{ background: '#f7fafc' }}>
      <td style={{ ...tdStyle, fontStyle: 'italic', color: '#718096', position: 'sticky', left: 0, background: '#f7fafc', zIndex: 1 }}>{label}</td>
      {sliced.map((v, i) => (
        <td key={i} style={{
          ...tdStyle, textAlign: 'right', fontStyle: 'italic', color: '#718096',
          background: i < REAL_MONTHS ? 'rgba(198,246,213,0.15)' : 'rgba(254,252,191,0.15)',
        }}>{fmtPct(v)}</td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', fontStyle: 'italic', color: '#718096', borderLeft: '2px solid #e2e8f0' }}>{fmtPct(avg)}</td>
    </tr>
  );
}

// âââ Styles âââ
const tdStyle = { padding: '8px 12px', borderBottom: '1px solid #edf2f7', fontSize: 13, whiteSpace: 'nowrap' };
const thStyle = { padding: '10px 12px', borderBottom: '2px solid #e2e8f0', color: '#718096', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#fff', zIndex: 2 };
const subTabStyle = { padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#718096', fontFamily: 'inherit', transition: 'all 0.2s' };
const subTabActive = { background: '#1a365d', color: '#fff', borderColor: '#1a365d' };
const cardStyle = { background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' };
const cardTitle = { fontSize: 15, fontWeight: 600, color: '#1a365d', marginBottom: 16 };
const spinnerStyle = { width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #3182ce', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' };
