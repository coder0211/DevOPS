import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Server, Activity, ArrowRight, Shield } from 'lucide-react';

const API_BASE = '/api';

const Dashboard = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/servers`);
      setServers(res.data);
    } catch (err) {
      console.error('Failed to fetch servers', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', margin: 0 }}>Infrastructure</h1>
          <p style={{ opacity: 0.6, fontSize: '1.2rem' }}>Fleet overview and health metrics.</p>
        </div>
        <Link to="/add">
          <button style={{ height: 'fit-content' }}>New Instance</button>
        </Link>
      </header>

      {loading ? (
        <div className="terminal">Loading core systems...</div>
      ) : servers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>No servers registered in the network.</p>
          <Link to="/add">
            <button>Establish First Connection</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {servers.map((server) => (
            <div key={server.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{server.name}</h3>
                  <code style={{ fontSize: '0.9rem', opacity: 0.7 }}>{server.ip}:{server.ssh_port}</code>
                </div>
                <span className={`badge ${server.status.toLowerCase()}`}>{server.status}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderTop: '2px solid #000', paddingTop: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>CPU</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{server.cpu_usage || 0}%</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>RAM</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{server.ram_usage || 0}%</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>DISK</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{server.disk_usage || 0}%</p>
                </div>
              </div>

              <Link to={`/server/${server.id}`} style={{ textDecoration: 'none', marginTop: 'auto' }}>
                <button style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                  Manage Instance <ArrowRight size={18} />
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
