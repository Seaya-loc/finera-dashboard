import { useState } from 'react';

const tabs = [
  { id: 'economico', label: 'Económico', icon: '📊' },
  { id: 'comercial', label: 'Comercial', icon: '🤝' },
  { id: 'operaciones', label: 'Operaciones', icon: '⚙️' },
  { id: 'producto', label: 'Producto', icon: '🚀' },
];

export default function Layout({ activeTab, onTabChange, children }) {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <path d="M8 8L20 4L32 8L36 20L32 32L20 36L8 32L4 20L8 8Z" fill="#1a365d"/>
            <path d="M14 16L20 12L26 16V24L20 28L14 24V16Z" fill="white"/>
          </svg>
          <span style={styles.logo}>finera</span>
          <span style={styles.logoSub}>Dashboard</span>
        </div>
        <nav style={styles.nav}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a365d',
    letterSpacing: '-0.5px',
  },
  logoSub: {
    fontSize: 14,
    color: '#718096',
    fontWeight: 400,
    marginLeft: 4,
  },
  nav: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    padding: '8px 20px',
    border: 'none',
    background: 'transparent',
    color: '#718096',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  tabActive: {
    background: '#edf2f7',
    color: '#1a365d',
    fontWeight: 600,
  },
  tabIcon: {
    fontSize: 16,
  },
  main: {
    flex: 1,
    padding: 24,
    overflow: 'auto',
  },
};
