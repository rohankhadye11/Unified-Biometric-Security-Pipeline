import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, ChevronUp, ChevronDown, Shield, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const LogTable = ({ logs, loading, onRefresh }) => {
  const [sortDir, setSortDir] = useState('desc');

  const sorted = [...logs].sort((a, b) => {
    const diff = new Date(a.timestamp) - new Date(b.timestamp);
    return sortDir === 'desc' ? -diff : diff;
  });

  const handleDownload = () => {
    window.open('http://localhost:8000/api/logs/download', '_blank');
  };

  return (
    <div style={{
      background: 'rgba(13,17,23,0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '20px',
      overflow: 'hidden',
    }}>
      {/* Table Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>Security Event Log</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {logs.length} entries recorded
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onRefresh} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem',
            transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={handleDownload} style={{
            background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', color: 'var(--accent-blue)',
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600,
            transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(56,189,248,0.1)'}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0, zIndex: 1 }}>
              <th
                onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600,
                  color: 'var(--text-muted)', letterSpacing: '0.08em', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.06)', userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  TIMESTAMP {sortDir === 'desc' ? <ChevronDown size={12}/> : <ChevronUp size={12}/>}
                </span>
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>IDENTITY</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>STATUS</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>SIGNAL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(4).fill(0).map((_, j) => (
                    <td key={j} style={{ padding: '14px 24px' }}>
                      <div className="skeleton" style={{ height: '16px', width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No events recorded yet. The system is monitoring.
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {sorted.map((log, i) => {
                  const isIntruder = log.status?.toLowerCase().includes('intruder') || log.name?.toLowerCase().includes('intruder');
                  return (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.2s',
                        background: isIntruder ? 'rgba(248,81,73,0.03)' : 'transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = isIntruder ? 'rgba(248,81,73,0.03)' : 'transparent'}
                    >
                      <td style={{ padding: '13px 24px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.77rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '13px 24px', fontSize: '0.85rem', fontWeight: 500 }}>
                        {log.name}
                      </td>
                      <td style={{ padding: '13px 24px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                          background: isIntruder ? 'var(--accent-red-dim)' : 'var(--accent-green-dim)',
                          color: isIntruder ? 'var(--accent-red)' : 'var(--accent-green)',
                          border: `1px solid ${isIntruder ? 'rgba(248,81,73,0.2)' : 'rgba(63,185,80,0.2)'}`,
                        }}>
                          {isIntruder ? <AlertTriangle size={11}/> : <Shield size={11}/>}
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 24px' }}>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: isIntruder ? 'var(--accent-red)' : 'var(--accent-green)',
                          boxShadow: isIntruder ? 'var(--glow-red)' : 'var(--glow-green)',
                        }} />
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogTable;
