import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Terminal, Shield, Cpu, Save } from 'lucide-react';

const API_BASE = '/api';

const AddServer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    ssh_port: 22,
    ssh_user: 'root',
    ssh_key_path: '/Users/hoa.nguyen3/.ssh/id_ed25519' // Pre-filled for the user's convenience
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/servers`, {
        ...formData,
        ssh_port: parseInt(formData.ssh_port)
      });
      navigate('/');
    } catch (err) {
      console.error('Failed to add server', err);
      alert('Error registering server. Verify connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem' }}>Register Instance</h1>
        <p style={{ opacity: 0.6 }}>Supply credentials for the new orchestration node.</p>
      </header>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="form-group">
          <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem' }}>IDENTIFIER</label>
          <input
            type="text"
            placeholder="e.g. Production Web-01"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem' }}>IP ADDRESS / HOST</label>
            <input
              type="text"
              placeholder="192.168.1.1"
              required
              value={formData.ip}
              onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem' }}>PORT</label>
            <input
              type="number"
              required
              value={formData.ssh_port}
              onChange={(e) => setFormData({ ...formData, ssh_port: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem' }}>SSH USER</label>
          <input
            type="text"
            required
            value={formData.ssh_user}
            onChange={(e) => setFormData({ ...formData, ssh_user: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem' }}>PRIVATE KEY PATH (LOCAL)</label>
          <input
            type="text"
            required
            value={formData.ssh_key_path}
            onChange={(e) => setFormData({ ...formData, ssh_key_path: e.target.value })}
          />
          <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.5rem' }}>
            The backend must have read access to this path.
          </p>
        </div>

        <footer style={{ marginTop: '1rem' }}>
          <button type="submit" disabled={loading} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
            {loading ? 'Registering...' : <><Save size={18} /> SAVE NODE CONFIG</>}
          </button>
        </footer>
      </form>
    </div>
  );
};

export default AddServer;
