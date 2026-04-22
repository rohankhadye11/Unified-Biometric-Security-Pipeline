import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Shield, AlertTriangle, Users, Activity, Eye, ZapOff,
  UserPlus, Upload, ChevronDown, ChevronUp, Crosshair,
  Server, Lock, Unlock, ScanFace,
} from 'lucide-react';
import Navbar from './Navbar.jsx';
import MetricCard from './MetricCard.jsx';
import LogTable from './LogTable.jsx';

const API = 'http://localhost:8000';

export default function App() {
  const [alert, setAlert] = useState(null);
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [metrics, setMetrics] = useState({ total: 0, threats: 0, authorized: 0, zones: 1 });
  const [prevAlertFile, setPrevAlertFile] = useState(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const fileInputRef = useRef(null);

  // Fetch latest alert & update metrics
  const fetchAlert = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/latest-alert`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAlert(data);
      setBackendOnline(true);

      // Trigger toast if new intruder image arrives
      if (data.filename && data.filename !== prevAlertFile) {
        setPrevAlertFile(data.filename);
        if (data.status?.toLowerCase().includes('intruder')) {
          toast.error('🚨 INTRUDER DETECTED — Threat logged and alert sent!', { duration: 5000 });
          setMetrics(m => ({ ...m, total: m.total + 1, threats: m.threats + 1 }));
        } else if (data.status?.toLowerCase().includes('authorized')) {
          toast.success('✅ Authorized Personnel Recognized', { duration: 3000 });
          setMetrics(m => ({ ...m, total: m.total + 1, authorized: m.authorized + 1 }));
        }
      }
    } catch {
      setBackendOnline(false);
    }
  }, [prevAlertFile]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(`${API}/api/logs`);
      const data = await res.json();
      setLogs(data);
      // Derive metrics from logs
      const threats = data.filter(l => l.status?.toLowerCase().includes('intruder')).length;
      setMetrics({ total: data.length, threats, authorized: data.length - threats, zones: 1 });
    } catch {}
    setLogsLoading(false);
  }, []);

  useEffect(() => {
    fetchAlert();
    fetchLogs();
    const interval = setInterval(fetchAlert, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !file) {
      toast.error('Please provide both a name and photo.');
      return;
    }
    setUploading(true);
    setUploadStatus('');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/api/register-face`, { method: 'POST', body: formData });
      const data = await res.json();
      toast.success(data.message || 'Face registered successfully!');
      setUploadStatus('success');
      setName('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      toast.error('Registration failed. Check the backend.');
      setUploadStatus('error');
    }
    setUploading(false);
  };

  const isIntruder = alert?.status?.toLowerCase().includes('intruder');
  const threatLevel = metrics.threats === 0 ? 'LOW' : metrics.threats < 5 ? 'MEDIUM' : 'HIGH';
  const threatColor = threatLevel === 'LOW' ? 'green' : threatLevel === 'MEDIUM' ? 'orange' : 'red';

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar systemStatus={alert?.status} />

      {/* Offline Banner */}
      <AnimatePresence>
        {!backendOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ background: 'rgba(248,81,73,0.1)', borderBottom: '1px solid rgba(248,81,73,0.2)', padding: '10px 2rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--accent-red)' }}
          >
            <ZapOff size={15} /> Backend offline — Vision Engine not responding
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>

        {/* Page Title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Security Operations{' '}
            <span style={{ background: 'linear-gradient(90deg, #38bdf8, #a371f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Command Center
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
            Real-time biometric threat detection and access control
          </p>
        </motion.div>

        {/* Metric Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}
        >
          <MetricCard title="Total Scans" value={metrics.total} subtitle="All detection events" icon={ScanFace} color="blue" />
          <MetricCard title="Threat Level" value={threatLevel} subtitle={`${metrics.threats} intruder events`} icon={AlertTriangle} color={threatColor} />
          <MetricCard title="Authorized" value={metrics.authorized} subtitle="Recognized personnel" icon={Users} color="green" />
          <MetricCard title="Active Zones" value={metrics.zones} subtitle="Camera feeds online" icon={Activity} color="purple" />
        </motion.div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '20px', marginBottom: '24px' }}>

          {/* Live Threat Feed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              background: 'rgba(13,17,23,0.8)',
              border: `1px solid ${isIntruder ? 'rgba(248,81,73,0.3)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '20px', padding: '24px',
              boxShadow: isIntruder ? '0 0 40px rgba(248,81,73,0.08)' : 'none',
              transition: 'all 0.5s ease',
            }}
          >
            {/* Feed Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={18} color="var(--text-secondary)" />
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Live Threat Feed</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '5px 12px', borderRadius: '20px',
                background: isIntruder ? 'var(--accent-red-dim)' : 'var(--accent-green-dim)',
                border: `1px solid ${isIntruder ? 'rgba(248,81,73,0.3)' : 'rgba(63,185,80,0.3)'}`,
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em',
                color: isIntruder ? 'var(--accent-red)' : 'var(--accent-green)',
              }}>
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: isIntruder ? 0.8 : 1.5, repeat: Infinity }}
                  style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}
                />
                {alert ? alert.status : 'Connecting...'}
              </div>
            </div>

            {/* Detection Image */}
            <div style={{
              borderRadius: '14px', overflow: 'hidden',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.04)',
              minHeight: '360px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {/* Scan-line effect */}
              {alert?.filename && (
                <motion.div
                  animate={{ y: ['0%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: '2px',
                    background: isIntruder
                      ? 'linear-gradient(90deg, transparent, rgba(248,81,73,0.6), transparent)'
                      : 'linear-gradient(90deg, transparent, rgba(56,189,248,0.4), transparent)',
                    zIndex: 2, pointerEvents: 'none',
                  }}
                />
              )}

              <AnimatePresence mode="wait">
                {alert?.filename ? (
                  <motion.div
                    key={alert.filename}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ width: '100%', position: 'relative' }}
                  >
                    <img
                      src={`${API}/alerts/${alert.filename}`}
                      alt="Detection"
                      style={{
                        width: '100%', display: 'block',
                        filter: isIntruder ? 'saturate(0.8)' : 'none',
                      }}
                    />
                    {/* Corner brackets (Palantir style) */}
                    {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map(corner => (
                      <div key={corner} style={{
                        position: 'absolute',
                        top: corner.includes('top') ? 12 : 'auto',
                        bottom: corner.includes('bottom') ? 12 : 'auto',
                        left: corner.includes('Left') ? 12 : 'auto',
                        right: corner.includes('Right') ? 12 : 'auto',
                        width: '20px', height: '20px',
                        borderTop: corner.includes('top') ? `2px solid ${isIntruder ? 'var(--accent-red)' : 'var(--accent-blue)'}` : 'none',
                        borderBottom: corner.includes('bottom') ? `2px solid ${isIntruder ? 'var(--accent-red)' : 'var(--accent-blue)'}` : 'none',
                        borderLeft: corner.includes('Left') ? `2px solid ${isIntruder ? 'var(--accent-red)' : 'var(--accent-blue)'}` : 'none',
                        borderRight: corner.includes('Right') ? `2px solid ${isIntruder ? 'var(--accent-red)' : 'var(--accent-blue)'}` : 'none',
                      }} />
                    ))}
                    {/* Timestamp */}
                    <div style={{
                      position: 'absolute', bottom: 12, left: 12,
                      background: 'rgba(6,9,18,0.85)', backdropFilter: 'blur(10px)',
                      padding: '5px 12px', borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace',
                      color: 'var(--text-secondary)',
                    }}>
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : ''}
                    </div>
                    {/* Threat badge */}
                    {isIntruder && (
                      <motion.div
                        animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1, repeat: Infinity }}
                        style={{
                          position: 'absolute', top: 12, right: 12,
                          background: 'rgba(248,81,73,0.9)', padding: '4px 10px',
                          borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                          letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '5px',
                        }}
                      >
                        <Crosshair size={12} /> THREAT
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="radar"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', color: 'var(--accent-green)' }}
                  >
                    {/* Radar Widget */}
                    <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          position: 'absolute',
                          inset: `${i * 20}px`,
                          borderRadius: '50%',
                          border: '1px solid rgba(63,185,80,0.2)',
                        }} />
                      ))}
                      <motion.div
                        animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        style={{
                          position: 'absolute', inset: 0, borderRadius: '50%',
                          background: 'conic-gradient(from 0deg, transparent 70%, rgba(63,185,80,0.5) 100%)',
                        }}
                      />
                      <Shield size={24} color="rgba(63,185,80,0.6)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      Monitoring active zones <br />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No anomalies detected</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Admin Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              background: 'rgba(13,17,23,0.8)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '20px', padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(163,113,247,0.1)', border: '1px solid rgba(163,113,247,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={16} color="var(--accent-purple)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Personnel Registration</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Add authorized identities to the system</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '16px 0' }} />

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '7px' }}>
                  OPERATOR ID / CODENAME
                </label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Agent_Omega_7"
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem',
                    fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'all 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(56,189,248,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>

              {/* File Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '7px' }}>
                  BIOMETRIC FACIAL SCAN
                </label>
                <input type="file" accept="image/*" ref={fileInputRef}
                  onChange={e => setFile(e.target.files[0])}
                  style={{ display: 'none' }} id="file-bio"
                />
                <label htmlFor="file-bio" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '12px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: file ? 'var(--accent-blue)' : 'var(--text-muted)',
                  fontSize: '0.85rem', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'; e.currentTarget.style.background = 'rgba(56,189,248,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  <Upload size={15} />
                  {file ? file.name : 'Upload Face Image'}
                </label>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={uploading}
                whileHover={{ scale: uploading ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '12px',
                  background: uploading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #38bdf8, #a371f7)',
                  border: 'none', borderRadius: '10px',
                  color: uploading ? 'var(--text-muted)' : 'white',
                  fontSize: '0.9rem', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: uploading ? 'none' : '0 4px 20px rgba(56,189,248,0.3)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {uploading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Server size={16} />
                  </motion.div>
                ) : (
                  <Lock size={16} />
                )}
                {uploading ? 'Registering...' : 'Authorize Access'}
              </motion.button>
            </form>

            {/* Info Panel */}
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(63,185,80,0.04)', borderRadius: '10px', border: '1px solid rgba(63,185,80,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Unlock size={12} color="var(--accent-green)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-green)', letterSpacing: '0.05em' }}>SYSTEM STATUS</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Vision engine active · MTCNN face detection enabled · Facenet matching model loaded
              </div>
            </div>
          </motion.div>
        </div>

        {/* Logs Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <button
            onClick={() => { setShowLogs(v => !v); if (!showLogs) fetchLogs(); }}
            style={{
              width: '100%', padding: '14px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px', color: 'var(--text-secondary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '0.88rem', fontWeight: 600, marginBottom: showLogs ? '16px' : '0',
              transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Activity size={15} />
            {showLogs ? 'Collapse Event Log' : 'View Security Event Log'}
            {showLogs ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          <AnimatePresence>
            {showLogs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <LogTable logs={logs} loading={logsLoading} onRefresh={fetchLogs} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '40px 0 20px', color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
          BIOMETRIC-OS v2.0 · UNIFIED SECURITY PIPELINE · ALL SYSTEMS NOMINAL
        </div>
      </div>
    </div>
  );
}
