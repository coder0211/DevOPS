import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Play, Activity, Globe, Trash2, Cpu, Settings, Terminal as TerminalIcon } from 'lucide-react';

const API_BASE = '/api';

const ServerDetails = () => {
  const { id } = useParams();
  const [server, setServer] = useState(null);
  const [taskID, setTaskID] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    fetchServer();
    fetchDomains();
    
    const interval = setInterval(() => {
      if (server) fetchStats();
    }, 5000); // Update stats every 5s

    return () => clearInterval(interval);
  }, [id, server?.id]);

  const fetchServer = async () => {
    try {
      const res = await axios.get(`${API_BASE}/servers/${id}`);
      setServer(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/servers/${id}/stats`);
      setServer(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDomains = async () => {
    try {
      const res = await axios.get(`${API_BASE}/servers/${id}/domains`);
      setDomains(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startInit = async () => {
    try {
      const res = await axios.post(`${API_BASE}/servers/${id}/init`);
      setTaskID(res.data.task_id);
      setLogs(['Initializing core sequences...', 'Connecting to remote host...']);
    } catch (err) {
      console.error(err);
      alert('Initialization failed to start.');
    }
  };

  if (loading) return <div className="terminal">Querying Node {id}...</div>;
  if (!server) return <div>Node not found.</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem', borderBottom: '4px solid #000', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>{server.name}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <code style={{ fontSize: '1.2rem', backgroundColor: '#000', color: '#fff', padding: '0.2rem 0.5rem' }}>{server.ip}:{server.ssh_port}</code>
              <span className={`badge ${server.status.toLowerCase()}`} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>{server.status}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={startInit} disabled={server.status === 'INITIALIZING'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Play size={18} /> INITIALIZE
            </button>
            <button style={{ borderStyle: 'dashed', backgroundColor: 'transparent' }}><Settings size={18} /> CONFIG</button>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        {/* Left Col: Monitoring & Console */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={24} /> Health Matrix
          </h2>
          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {['CPU', 'RAM', 'DISK'].map((stat) => (
              <div key={stat} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>{stat}</p>
                <div style={{ height: '150px', width: '100%', border: '2px solid #000', position: 'relative', overflow: 'hidden' }}>
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${server[stat.toLowerCase() + '_usage'] || 0}%` }}
                        style={{ position: 'absolute', bottom: 0, width: '100%', background: '#000' }}
                    />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 900, fontSize: '1.5rem', mixBlendMode: 'difference', color: '#fff' }}>
                        {Math.round(server[stat.toLowerCase() + '_usage'] || 0)}%
                    </div>
                </div>
              </div>
            ))}
          </div>

          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
            <TerminalIcon size={24} /> Execution Logs
          </h2>
          <div className="terminal">
            {logs.length === 0 ? " > NO ACTIVE TASKS" : logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '0.25rem' }}>{'>'} {log}</div>
            ))}
            {taskID && <div style={{ borderTop: '1px solid #333', marginTop: '1rem', paddingTop: '0.5rem', fontSize: '0.75rem', color: '#666' }}>Watching task {taskID}...</div>}
          </div>
        </section>

        {/* Right Col: Domains */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Globe size={24} /> Domains & Proxy
            </h2>
            <button style={{ padding: '0.5rem 1rem' }}>+ NEW</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {domains.length === 0 ? (
                <div className="card" style={{ borderStyle: 'dashed', opacity: 0.6, textAlign: 'center' }}>
                    No domains configured for this node.
                </div>
            ) : domains.map(domain => (
                <div key={domain.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ margin: 0 }}>{domain.name}</h4>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{'PROXY -> LOCALHOST:'}{domain.target_port}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button style={{ padding: '0.4rem', boxShadow: '2px 2px 0px #000' }}><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 'auto', backgroundColor: '#000', color: '#fff' }}>
            <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Node Information</h4>
            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>UPTIME</span> <span>{server.uptime || 'N/A'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>DOCKER</span> <span>{server.docker_version || 'N/A'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>OS</span> <span>Ubuntu 22.04 LTS</span></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ServerDetails;
