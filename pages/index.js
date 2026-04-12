import { useState } from 'react';
import Layout from '../components/Layout';
import Economico from '../components/Economico';
import Comercial from '../components/Comercial';
import Operaciones from '../components/Operaciones';
import Producto from '../components/Producto';

export default function Home() {
  const [activeTab, setActiveTab] = useState('economico');

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'economico' && <Economico />}
        {activeTab === 'comercial' && <Comercial />}
        {activeTab === 'operaciones' && <Operaciones />}
        {activeTab === 'producto' && <Producto />}
      </Layout>
    </>
  );
}
