import { useState } from 'react';

export default function Comercial() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div style={{ height: 'calc(100vh - 108px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a365d' }}>Pipeline Comercial</h2>
          <p style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>
            Vista integrada del pipeline de ventas de Finera
          </p>
        </div>
        <a
          href="https://pipeline-finera.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 16px',
            background: '#1a365d',
            color: '#fff',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Abrir en nueva pestaña ↗
        </a>
      </div>

      <div style={{
        flex: 1,
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        position: 'relative',
        background: '#fff',
      }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#fff',
            zIndex: 2,
          }}>
            <div style={{ textAlign: 'center', color: '#718096' }}>
              <div style={{
                width: 32,
                height: 32,
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #3182ce',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }} />
              <p style={{ marginTop: 16 }}>Cargando pipeline...</p>
            </div>
          </div>
        )}
        <iframe
          src="https://pipeline-finera.vercel.app/"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          onLoad={() => setIsLoading(false)}
          title="Finera Pipeline"
        />
      </div>
    </div>
  );
}
