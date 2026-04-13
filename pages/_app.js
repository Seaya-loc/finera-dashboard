import '../styles/globals.css';
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';

// ââ Auth Context ââ
const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
    setLoading(false);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  }

  // Don't protect the login page
  const isLoginPage = router.pathname === '/login';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#718096' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #3182ce', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user && !isLoginPage) {
    // Redirect to login
    if (typeof window !== 'undefined') {
      router.replace('/login');
    }
    return null;
  }

  if (user && isLoginPage) {
    // Already logged in, redirect to dashboard
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}
