import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Server, AlertCircle } from 'lucide-react';

const API_BASE = '/api';

const Monitoring = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/servers`);
      setServers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="terminal">Scanning network...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem' }}>Global Monitoring</h1>
        <p style={{ opacity: 0.6 }}>Real-time telemetry from all active nodes.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {servers.map(server => (
          <div key={server.id} className="card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', alignItems: 'center', gap: '2rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>{server.name}</h3>
              <code style={{ fontSize: '0.8rem', opacity: 0.5 }}>{server.ip}</code>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>CPU</p>
              <div style={{ height: '4px', background: '#eee', width: '100%', marginBottom: '0.5rem' }}>
                <div style={{ height: '100%', background: '#000', width: `${server.cpu_usage || 0}%` }} />
              </div>
              <span style={{ fontWeight: 700 }}>{server.cpu_usage || 0}%</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>RAM</p>
              <div style={{ height: '4px', background: '#eee', width: '100%', marginBottom: '0.5rem' }}>
                <div style={{ height: '100%', background: '#000', width: `${server.ram_usage || 0}%` }} />
              </div>
              <span style={{ fontWeight: 700 }}>{server.ram_usage || 0}%</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 900, marginBottom: '0.25rem' }}>DISK</p>
              <div style={{ height: '4px', background: '#eee', width: '100%', marginBottom: '0.5rem' }}>
                <div style={{ height: '100%', background: '#000', width: `${server.disk_usage || 0}%` }} />
              </div>
              <span style={{ fontWeight: 700 }}>{server.disk_usage || 0}%</span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${server.status.toLowerCase()}`}>{server.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Monitoring;
