import { useState, useEffect } from 'react';

// ─── Constants ───
const REAL_MONTHS = 4; // Number of months with real (closed) accounting data
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ─── Formatting ───
function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
}

// ─── KPI Card ───
function KPICard({ label, value, subtitle, trend, color = '#1a365d' }) {
  return (
    <div style={kpiStyles.card}>
      <div style={kpiStyles.label}>{label}</div>
      <div style={{ ...kpiStyles.value, color }}>{value}</div>
      {subtitle && <div style={kpiStyles.subtitle}>{subtitle}</div>}
      {trend !== undefined && trend !== null && (
        <div style={{ ...kpiStyles.trend, color: trend >= 0 ? '#38a169' : '#e53e3e' }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

const kpiStyles = {
  card: { background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', flex: '1 1 200px', minWidth: 180 },
  label: { fontSize: 12, color: '#718096', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 28, fontWeight: 700, marginTop: 4 },
  subtitle: { fontSize: 12, color: '#a0aec0', marginTop: 2 },
  trend: { fontSize: 13, fontWeight: 600, marginTop: 6 },
};

// ─── Simple Bar Chart ───
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
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.5s ease',
            opacity: d.value === 0 ? 0.2 : 1,
          }} />
          <span style={{ fontSize: 10, color: '#a0aec0' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── P&L Table Row helpers ───
function makeRow(label, values, opts = {}) {
  const { bold, bg, color: textColor } = opts;
  return (
    <tr style={{ background: bg || 'transparent' }}>
      <td style={{ ...tdStyle, fontWeight: bold ? 700 : 400, color: textColor || '#2d3748', position: 'sticky', left: 0, background: bg || '#fff', zIndex: 1 }}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: bold ? 700 : 400, color: textColor || '#2d3748' }}>
          {fmt(v)}
        </td>
      ))}
    </tr>
  );
}

function makePctRow(label, values, opts = {}) {
  const { bg } = opts;
  return (
    <tr style={{ background: bg || '#f7fafc' }}>
      <td style={{ ...tdStyle, fontStyle: 'italic', color: '#718096', position: 'sticky', left: 0, background: bg || '#f7fafc', zIndex: 1 }}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} style={{ ...tdStyle, textAlign: 'right', fontStyle: 'italic', color: '#718096' }}>
          {fmtPct(v)}
        </td>
      ))}
    </tr>
  );
}

const tdStyle = {
  padding: '8px 12px',
  borderBottom: '1px solid #edf2f7',
  fontSize: 13,
  whiteSpace: 'nowrap',
};

const thStyle = {
  padding: '10px 12px',
  borderBottom: '2px solid #e2e8f0',
  color: '#718096',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  textAlign: 'right',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  background: '#fff',
  zIndex: 2,
};

// ─── Main Component ───
export default function Economico() {
  const [bpData, setBpData] = useState(null);
  const [holdedPL, setHoldedPL] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subTab, setSubTab] = useState('metricas');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setError(null);
    try {
      // Load BP data and Holded P&L in parallel
      const [bpRes, plRes] = await Promise.all([
        fetch('/bp_data.json'),
        fetch('/api/holded-pl?year=2026'),
      ]);

      if (bpRes.ok) {
        const bp = await bpRes.json();
        setBpData(bp);
      }

      if (plRes.ok) {
        const pl = await plRes.json();
        setHoldedPL(pl);
      } else {
        // If Holded fails, we still show BP data
        console.warn('Holded P&L not available, using BP data only');
      }
    } catch (e) {
      setError(e.message);
    }
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

  // Use Holded data for real months, BP data for forecast months
  // Build merged arrays: real from Holded (months 0..REAL_MONTHS-1), forecast from BP
  const bp = bpData || {};
  const pl = holdedPL;

  // Revenue per month (merged: Holded real + BP forecast)
  const revenues = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS && pl && pl.months && pl.months[m]) return pl.months[m].revenue;
    return bp.revenues ? bp.revenues[m] : 0;
  });

  const staffCost = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS && pl && pl.months && pl.months[m]) return pl.months[m].staff;
    return bp.staff_cost ? bp.staff_cost[m] : 0;
  });

  const platforms = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS && pl && pl.months && pl.months[m]) return pl.months[m].platforms;
    return bp.platforms ? bp.platforms[m] : 0;
  });

  const gaCosts = Array.from({ length: 12 }, (_, m) => {
    if (m < REAL_MONTHS && pl && pl.months && pl.months[m]) return pl.months[m].ga;
    return bp.ga_costs ? bp.ga_costs[m] : 0;
  });

  // Derived metrics
  const contribution = revenues.map((r, m) => r - staffCost[m] - platforms[m]);
  const contributionMargin = revenues.map((r, m) => r > 0 ? (contribution[m] / r) * 100 : 0);
  const ebitda = contribution.map((c, m) => c - gaCosts[m]);
  const ebitdaMargin = revenues.map((r, m) => r > 0 ? (ebitda[m] / r) * 100 : 0);
  const netResult = ebitda.map(e => e); // Simplified; real = EBITDA - financials - taxes

  // Cash from BP (manual for now)
  const cashAccumulated = bp.cash_accumulated || Array(12).fill(0);

  // KPI calculations
  const totalRevenue = revenues.reduce((a, b) => a + b, 0);
  const totalExpenses = staffCost.reduce((a, b) => a + b, 0)
    + platforms.reduce((a, b) => a + b, 0)
    + gaCosts.reduce((a, b) => a + b, 0);
  const totalEBITDA = ebitda.reduce((a, b) => a + b, 0);
  const totalNetResult = netResult.reduce((a, b) => a + b, 0);
  const lastCash = cashAccumulated[cashAccumulated.length - 1] || 0;

  // MoM growth for last real month
  const lastRealMonth = Math.min(REAL_MONTHS - 1, 11);
  const prevMonth = lastRealMonth > 0 ? lastRealMonth - 1 : null;
  const revGrowth = prevMonth !== null && revenues[prevMonth] > 0
    ? ((revenues[lastRealMonth] - revenues[prevMonth]) / revenues[prevMonth]) * 100
    : null;

  // Client-level data from BP
  const clients = bp.clients || [];

  return (
    <div>
      {/* Sub-navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'metricas', label: 'Métricas principales' },
          { key: 'pl', label: 'P&L y Previsión de Caja' },
          { key: 'cierre', label: 'Cierre de Año' },
        ].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)} style={{
            ...subTabStyle,
            ...(subTab === t.key ? subTabActive : {}),
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: 16, marginBottom: 20, color: '#c53030', fontSize: 13 }}>
          Error: {error}
          <button onClick={loadAllData} style={{ marginLeft: 12, color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Reintentar
          </button>
        </div>
      )}

      {!holdedPL && (
        <div style={{ background: '#fffff0', border: '1px solid #fefcbf', borderRadius: 8, padding: 12, marginBottom: 20, color: '#975a16', fontSize: 12 }}>
          Datos contables de Holded no disponibles. Mostrando datos del Business Plan. Despliega en Vercel con HOLDED_API_KEY para ver datos reales.
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: Métricas principales */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {subTab === 'metricas' && (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <KPICard label="Ingresos" value={fmt(totalRevenue)} subtitle="Acumulado 2026" trend={revGrowth} />
            <KPICard label="Gastos" value={fmt(totalExpenses)} subtitle="Acumulado 2026" />
            <KPICard label="EBITDA" value={fmt(totalEBITDA)} subtitle="Acumulado 2026"
              color={totalEBITDA >= 0 ? '#38a169' : '#e53e3e'} />
            <KPICard label="Resultado Neto" value={fmt(totalNetResult)} subtitle="Acumulado 2026"
              color={totalNetResult >= 0 ? '#38a169' : '#e53e3e'} />
            <KPICard label="Caja" value={fmt(lastCash)} subtitle="Previsión cierre" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Ingresos mensuales</h3>
              <SimpleBarChart data={MONTH_NAMES.map((l, i) => ({
                label: l, value: revenues[i], highlight: i < REAL_MONTHS,
              }))} barColor="#3182ce" />
            </div>
            <div style={cardStyle}>
              <h3 style={cardTitle}>EBITDA mensual</h3>
              <SimpleBarChart data={MONTH_NAMES.map((l, i) => ({
                label: l, value: ebitda[i], highlight: i < REAL_MONTHS,
              }))} barColor="#38a169" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Gastos totales mensuales</h3>
              <SimpleBarChart data={MONTH_NAMES.map((l, i) => ({
                label: l, value: staffCost[i] + platforms[i] + gaCosts[i], highlight: i < REAL_MONTHS,
              }))} barColor="#e53e3e" />
            </div>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Caja acumulada</h3>
              <SimpleBarChart data={MONTH_NAMES.map((l, i) => ({
                label: l, value: cashAccumulated[i], highlight: i < REAL_MONTHS,
              }))} barColor="#805ad5" />
            </div>
          </div>

          <p style={{ fontSize: 11, color: '#a0aec0', marginTop: 16 }}>
            Barras resaltadas = meses con datos reales de Holded ({REAL_MONTHS} meses). El resto son previsiones del Business Plan.
          </p>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: P&L y Previsión de Caja */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {subTab === 'pl' && (
        <div style={{ ...cardStyle, overflowX: 'auto' }}>
          <h3 style={{ ...cardTitle, marginBottom: 20 }}>Cuenta de Resultados y Previsión de Caja — 2026</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: 0, background: '#fff', zIndex: 3, minWidth: 180 }}>
                  Concepto
                </th>
                {MONTH_NAMES.map((m, i) => (
                  <th key={i} style={thStyle}>{m}</th>
                ))}
                <th style={{ ...thStyle, borderLeft: '2px solid #e2e8f0' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Client breakdown */}
              {clients.map((c, ci) => {
                const vals = c.monthly || Array(12).fill(0);
                return (
                  <tr key={ci} style={{ background: ci % 2 === 0 ? '#fff' : '#f7fafc' }}>
                    <td style={{ ...tdStyle, fontSize: 12, color: '#4a5568', position: 'sticky', left: 0, background: ci % 2 === 0 ? '#fff' : '#f7fafc', zIndex: 1 }}>
                      {c.name}
                    </td>
                    {vals.map((v, i) => (
                      <td key={i} style={{ ...tdStyle, textAlign: 'right', fontSize: 12 }}>{fmt(v)}</td>
                    ))}
                    <td style={{ ...tdStyle, textAlign: 'right', fontSize: 12, fontWeight: 600, borderLeft: '2px solid #e2e8f0' }}>
                      {fmt(vals.reduce((a, b) => a + b, 0))}
                    </td>
                  </tr>
                );
              })}

              {/* Revenues total */}
              {makeRowWithTotal('INGRESOS', revenues, { bold: true, bg: '#ebf8ff' })}

              {/* Separator */}
              <tr><td colSpan={14} style={{ height: 8 }} /></tr>

              {/* Staff cost */}
              {makeRowWithTotal('Coste de personal', staffCost, { bold: false })}

              {/* Platforms */}
              {makeRowWithTotal('Plataformas', platforms, { bold: false })}

              {/* Contribution */}
              {makeRowWithTotal('CONTRIBUCIÓN', contribution, { bold: true, bg: '#f0fff4' })}
              {makePctRowWithTotal('% Margen de contribución', contributionMargin)}

              {/* Separator */}
              <tr><td colSpan={14} style={{ height: 8 }} /></tr>

              {/* G&A */}
              {makeRowWithTotal('Gastos generales (G&A)', gaCosts, { bold: false })}

              {/* EBITDA */}
              {makeRowWithTotal('EBITDA', ebitda, { bold: true, bg: '#fefcbf' })}
              {makePctRowWithTotal('% Margen EBITDA', ebitdaMargin)}

              {/* Net result */}
              {makeRowWithTotal('RESULTADO NETO', netResult, { bold: true, bg: '#fed7e2' })}

              {/* Separator */}
              <tr><td colSpan={14} style={{ height: 8 }} /></tr>

              {/* Cash */}
              <tr style={{ background: '#c6f6d5' }}>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#276749', position: 'sticky', left: 0, background: '#c6f6d5', zIndex: 1 }}>
                  CAJA ACUMULADA
                </td>
                {cashAccumulated.map((v, i) => (
                  <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#276749' }}>
                    {fmt(v)}
                  </td>
                ))}
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#276749', borderLeft: '2px solid #e2e8f0' }}>
                  {fmt(cashAccumulated[11])}
                </td>
              </tr>
            </tbody>
          </table>

          <p style={{ fontSize: 11, color: '#a0aec0', marginTop: 16 }}>
            * Los primeros {REAL_MONTHS} meses incluyen datos reales de la contabilidad de Holded. El resto son previsiones del Business Plan.
            La caja se mantiene manual hasta conectar la API del banco.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: Cierre de Año */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {subTab === 'cierre' && (
        <div style={{ ...cardStyle, overflowX: 'auto' }}>
          <h3 style={{ ...cardTitle, marginBottom: 8 }}>Cierre de Año — Real vs. Previsión</h3>
          <p style={{ fontSize: 12, color: '#718096', marginBottom: 20 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: '#c6f6d5', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />
            Real (R) = datos cerrados de Holded &nbsp;
            <span style={{ display: 'inline-block', width: 12, height: 12, background: '#fefcbf', borderRadius: 2, marginRight: 4, verticalAlign: 'middle' }} />
            Previsión (P) = Business Plan
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: 0, background: '#fff', zIndex: 3, minWidth: 180 }}>
                  Concepto
                </th>
                {MONTH_NAMES.map((m, i) => (
                  <th key={i} style={{
                    ...thStyle,
                    background: i < REAL_MONTHS ? '#c6f6d5' : '#fefcbf',
                  }}>
                    {m} {i < REAL_MONTHS ? '(R)' : '(P)'}
                  </th>
                ))}
                <th style={{ ...thStyle, borderLeft: '2px solid #e2e8f0' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {makeCierreRow('INGRESOS', revenues, { bold: true, bg: '#ebf8ff' })}
              {makeCierreRow('Coste de personal', staffCost)}
              {makeCierreRow('Plataformas', platforms)}
              {makeCierreRow('CONTRIBUCIÓN', contribution, { bold: true, bg: '#f0fff4' })}
              {makeCierrePctRow('% Margen contribución', contributionMargin)}
              <tr><td colSpan={14} style={{ height: 4 }} /></tr>
              {makeCierreRow('Gastos generales (G&A)', gaCosts)}
              {makeCierreRow('EBITDA', ebitda, { bold: true, bg: '#fefcbf' })}
              {makeCierrePctRow('% Margen EBITDA', ebitdaMargin)}
              {makeCierreRow('RESULTADO NETO', netResult, { bold: true, bg: '#fed7e2' })}
              <tr><td colSpan={14} style={{ height: 4 }} /></tr>
              {makeCierreRow('CAJA ACUMULADA', cashAccumulated, { bold: true, bg: '#c6f6d5', color: '#276749' })}
            </tbody>
          </table>

          {/* Summary cards */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 24 }}>
            <div style={{ flex: '1 1 200px', background: '#f0fff4', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#38a169', fontWeight: 600 }}>YTD Real ({REAL_MONTHS} meses)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#276749', marginTop: 4 }}>
                {fmt(revenues.slice(0, REAL_MONTHS).reduce((a, b) => a + b, 0))} ingresos
              </div>
              <div style={{ fontSize: 13, color: '#38a169' }}>
                EBITDA: {fmt(ebitda.slice(0, REAL_MONTHS).reduce((a, b) => a + b, 0))}
              </div>
            </div>
            <div style={{ flex: '1 1 200px', background: '#fffff0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#975a16', fontWeight: 600 }}>Previsión ({12 - REAL_MONTHS} meses)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#744210', marginTop: 4 }}>
                {fmt(revenues.slice(REAL_MONTHS).reduce((a, b) => a + b, 0))} ingresos
              </div>
              <div style={{ fontSize: 13, color: '#975a16' }}>
                EBITDA: {fmt(ebitda.slice(REAL_MONTHS).reduce((a, b) => a + b, 0))}
              </div>
            </div>
            <div style={{ flex: '1 1 200px', background: '#ebf8ff', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#3182ce', fontWeight: 600 }}>Total Año 2026</div>
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

// ─── Row helpers with Total column ───
function makeRowWithTotal(label, values, opts = {}) {
  const { bold, bg, color: textColor } = opts;
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <tr style={{ background: bg || 'transparent' }}>
      <td style={{ ...tdStyle, fontWeight: bold ? 700 : 400, color: textColor || '#2d3748', position: 'sticky', left: 0, background: bg || '#fff', zIndex: 1 }}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} style={{ ...tdStyle, textAlign: 'right', fontWeight: bold ? 700 : 400, color: textColor || '#2d3748' }}>
          {fmt(v)}
        </td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: textColor || '#2d3748', borderLeft: '2px solid #e2e8f0' }}>
        {fmt(total)}
      </td>
    </tr>
  );
}

function makePctRowWithTotal(label, values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return (
    <tr style={{ background: '#f7fafc' }}>
      <td style={{ ...tdStyle, fontStyle: 'italic', color: '#718096', position: 'sticky', left: 0, background: '#f7fafc', zIndex: 1 }}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} style={{ ...tdStyle, textAlign: 'right', fontStyle: 'italic', color: '#718096' }}>
          {fmtPct(v)}
        </td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', fontStyle: 'italic', color: '#718096', borderLeft: '2px solid #e2e8f0' }}>
        {fmtPct(avg)}
      </td>
    </tr>
  );
}

// ─── Cierre rows with real/forecast coloring ───
function makeCierreRow(label, values, opts = {}) {
  const { bold, bg, color: textColor } = opts;
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <tr style={{ background: bg || 'transparent' }}>
      <td style={{ ...tdStyle, fontWeight: bold ? 700 : 400, color: textColor || '#2d3748', position: 'sticky', left: 0, background: bg || '#fff', zIndex: 1 }}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} style={{
          ...tdStyle, textAlign: 'right', fontWeight: bold ? 700 : 400,
          color: textColor || '#2d3748',
          background: i < REAL_MONTHS ? 'rgba(198,246,213,0.3)' : 'rgba(254,252,191,0.3)',
        }}>
          {fmt(v)}
        </td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: textColor || '#2d3748', borderLeft: '2px solid #e2e8f0' }}>
        {fmt(total)}
      </td>
    </tr>
  );
}

function makeCierrePctRow(label, values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return (
    <tr style={{ background: '#f7fafc' }}>
      <td style={{ ...tdStyle, fontStyle: 'italic', color: '#718096', position: 'sticky', left: 0, background: '#f7fafc', zIndex: 1 }}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} style={{
          ...tdStyle, textAlign: 'right', fontStyle: 'italic', color: '#718096',
          background: i < REAL_MONTHS ? 'rgba(198,246,213,0.15)' : 'rgba(254,252,191,0.15)',
        }}>
          {fmtPct(v)}
        </td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', fontStyle: 'italic', color: '#718096', borderLeft: '2px solid #e2e8f0' }}>
        {fmtPct(avg)}
      </td>
    </tr>
  );
}

// ─── Styles ───
const subTabStyle = {
  padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff',
  borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  color: '#718096', fontFamily: 'inherit', transition: 'all 0.2s',
};

const subTabActive = {
  background: '#1a365d', color: '#fff', borderColor: '#1a365d',
};

const cardStyle = {
  background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0',
};

const cardTitle = {
  fontSize: 15, fontWeight: 600, color: '#1a365d', marginBottom: 16,
};

const spinnerStyle = {
  width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #3182ce',
  borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto',
};
