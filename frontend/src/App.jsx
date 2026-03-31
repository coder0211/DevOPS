import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, PlusSquare, Activity, ShieldCheck, Terminal as TerminalIcon } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AddServer from './pages/AddServer';
import ServerDetails from './pages/ServerDetails';
import Monitoring from './pages/Monitoring';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutGrid size={20} /> },
    { path: '/add', label: 'Add Server', icon: <PlusSquare size={20} /> },
    { path: '/monitoring', label: 'Global Monitor', icon: <Activity size={20} /> },
  ];

  return (
    <div className="sidebar">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>DevOPS.<br/>CORE</h2>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', borderTop: '2px solid #000', paddingTop: '1rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700 }}>v1.0.0-PROD</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddServer />} />
            <Route path="/server/:id" element={<ServerDetails />} />
            <Route path="/monitoring" element={<Monitoring />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
