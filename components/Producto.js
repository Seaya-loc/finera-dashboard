export default function Producto() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 'calc(100vh - 200px)',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 400,
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#edf2f7',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 20px',
          fontSize: 36,
        }}>
          🚀
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1a365d', marginBottom: 8 }}>
          Producto
        </h2>
        <p style={{ fontSize: 14, color: '#718096', lineHeight: 1.6 }}>
          Esta sección se montará más adelante.
          Aquí podrás gestionar métricas de producto, roadmap y seguimiento de features.
        </p>
        <div style={{
          marginTop: 24,
          padding: '12px 20px',
          background: '#f7fafc',
          borderRadius: 8,
          fontSize: 13,
          color: '#718096',
          border: '1px dashed #e2e8f0',
        }}>
          Próximamente
        </div>
      </div>
    </div>
  );
}
