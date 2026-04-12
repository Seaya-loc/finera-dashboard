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
          <svg width="30" height="28" viewBox="0 0 28 26" fill="none">
            <path d="M10.1018 20.2366L1.68808 25.226C1.2308 25.4972 0.652473 25.1661 0.65488 24.6344L0.675712 20.0318C0.676801 19.7913 0.804093 19.569 1.01098 19.4463L4.87305 17.1566" fill="#04253A"/>
            <path d="M17.2695 9.79211L22.2434 6.83109C22.4583 6.70312 22.726 6.70267 22.9414 6.8299L26.8175 9.11959C27.2655 9.38423 27.2659 10.0323 26.8182 10.2974L17.2747 15.949L17.2695 9.79211Z" fill="#04253A"/>
            <path d="M17.3179 15.951V9.83176L1.79436 0.609427C1.34 0.339495 0.764175 0.664678 0.760702 1.19317L0.731093 5.6996C0.729497 5.94256 0.856867 6.16815 1.06573 6.29228L17.3179 15.951Z" fill="#04253A"/>
            <path d="M11.0938 19.6444V19.5411V16.5663V13.8763C11.0938 13.6356 10.9673 13.4126 10.7607 13.289L1.77741 7.91783C1.32223 7.64568 0.743868 7.97107 0.742092 8.50141C0.737741 9.80019 0.730736 11.8913 0.725586 13.4287" fill="#04253A"/>
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
    color: '#04253A',
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
    color: '#04253A',
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
