import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, loading = false }) => {
  const colorMap = {
    blue: { accent: 'var(--accent-blue)', dim: 'var(--accent-blue-dim)', glow: 'var(--glow-blue)' },
    green: { accent: 'var(--accent-green)', dim: 'var(--accent-green-dim)', glow: 'var(--glow-green)' },
    red: { accent: 'var(--accent-red)', dim: 'var(--accent-red-dim)', glow: 'var(--glow-red)' },
    purple: { accent: 'var(--accent-purple)', dim: 'rgba(163,113,247,0.12)', glow: '0 0 20px rgba(163,113,247,0.3)' },
    orange: { accent: 'var(--accent-orange)', dim: 'rgba(240,136,62,0.12)', glow: '0 0 20px rgba(240,136,62,0.3)' },
  };
  const c = colorMap[color];

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: c.glow }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'rgba(13, 17, 23, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '100px', height: '100px',
        background: c.dim,
        borderRadius: '50%',
        filter: 'blur(30px)',
        transform: 'translate(30%, -30%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{
          width: '40px', height: '40px',
          background: c.dim,
          border: `1px solid ${c.accent}30`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {Icon && <Icon size={18} color={c.accent} strokeWidth={2} />}
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            fontSize: '0.75rem', fontWeight: 600,
            color: trend > 0 ? 'var(--accent-green)' : trend < 0 ? 'var(--accent-red)' : 'var(--text-muted)',
          }}>
            {trend > 0 ? <TrendingUp size={13} /> : trend < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {loading ? (
        <>
          <div className="skeleton" style={{ height: '28px', width: '60%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '14px', width: '80%' }} />
        </>
      ) : (
        <>
          <div style={{
            fontSize: '1.9rem', fontWeight: 800,
            color: c.accent,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            marginBottom: '6px',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {value}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '2px' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {subtitle}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default MetricCard;
