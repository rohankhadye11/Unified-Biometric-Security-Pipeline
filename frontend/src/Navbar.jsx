import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Wifi, Camera, Clock } from 'lucide-react';

const Navbar = ({ systemStatus }) => {
  const isOnline = systemStatus?.toLowerCase().includes('online') || systemStatus?.toLowerCase().includes('monitoring') || systemStatus?.toLowerCase().includes('authorized');

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(6, 9, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, #38bdf8, #a371f7)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(56,189,248,0.3)',
        }}>
          <Shield size={20} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
            BiometricOS
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            SECURITY COMMAND CENTER
          </div>
        </div>
      </div>

      {/* Center Nav Links */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {['Dashboard', 'Alerts', 'Logs', 'Admin'].map((item) => (
          <button key={item} style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer',
            padding: '6px 14px', borderRadius: '8px',
            fontSize: '0.85rem', fontWeight: 500,
            transition: 'all 0.2s ease',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Camera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <Camera size={14} />
          <span>CAM-01</span>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: isOnline ? 'var(--accent-green)' : 'var(--text-muted)',
            boxShadow: isOnline ? 'var(--glow-green)' : 'none',
          }} />
        </div>

        {/* Network */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <Wifi size={14} />
          <span style={{ color: 'var(--accent-blue)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>
            192.168.0.104
          </span>
        </div>

        {/* Clock */}
        <LiveClock />

        {/* System Status Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '5px 12px', borderRadius: '20px',
          background: isOnline ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
          border: `1px solid ${isOnline ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
          fontSize: '0.75rem', fontWeight: 600,
          color: isOnline ? 'var(--accent-green)' : 'var(--accent-red)',
          letterSpacing: '0.05em',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'currentColor',
            animation: 'pulse-dot 1.5s infinite',
          }} />
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>
    </motion.nav>
  );
};

const LiveClock = () => {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
      <Clock size={13} />
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </div>
  );
};

export default Navbar;
