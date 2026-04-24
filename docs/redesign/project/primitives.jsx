// primitives.jsx — shared UI primitives for all mocks.
// Exports to window: Icon, Button, Badge, Score, Avatar, AppShell, Sidebar,
// Header, Card, Input, Textarea, Select, Checkbox, ProgressBar, Tabs, Kbd,
// Dialog, Tooltip (lite), Divider.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── Icons — a curated Lucide-style set ──────────────────────────
// All 20x20 by default, stroke-based, so they read like Lucide.
const _IconPaths = {
  search:    'M10.5 17a6.5 6.5 0 1 1 4.6-1.9l3.4 3.4',
  bell:      'M9 3.5a5.5 5.5 0 0 1 5.5 5.5v2.3l1.4 2.5A1 1 0 0 1 15 15H3a1 1 0 0 1-.9-1.2L3.5 11V9A5.5 5.5 0 0 1 9 3.5zM7 16.5a2 2 0 0 0 4 0',
  plus:      'M10 4.5v11M4.5 10h11',
  minus:     'M4.5 10h11',
  check:     'M4.5 10.5l3.5 3.5 7.5-8',
  x:         'M5 5l10 10M15 5L5 15',
  chevRight: 'M8 5l5 5-5 5',
  chevLeft:  'M12 5l-5 5 5 5',
  chevDown:  'M5 8l5 5 5-5',
  chevUp:    'M5 12l5-5 5 5',
  arrowRight:'M4 10h12M12 5l5 5-5 5',
  arrowLeft: 'M16 10H4M8 5l-5 5 5 5',
  users:     'M13 6.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM3 17a7 7 0 0 1 14 0',
  user:      'M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3.5 17.5a6.5 6.5 0 0 1 13 0',
  building:  'M4 17V4h12v13M7 7h2M11 7h2M7 11h2M11 11h2M7 15h2M11 15h2',
  clipboard: 'M7.5 4.5h5a1 1 0 0 1 1 1V6h2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2v-.5a1 1 0 0 1 1-1zM7.5 4.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5V6h-5V4.5z',
  grid:      'M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5',
  list:      'M4 6h12M4 10h12M4 14h12',
  settings:  'M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM15.5 10a5.5 5.5 0 0 0-.1-1.1l1.4-1-1.5-2.6-1.6.6a5.5 5.5 0 0 0-1.9-1.1l-.3-1.7H8.5l-.3 1.7a5.5 5.5 0 0 0-1.9 1.1l-1.6-.6L3.2 7.9l1.4 1a5.5 5.5 0 0 0 0 2.2l-1.4 1 1.5 2.6 1.6-.6a5.5 5.5 0 0 0 1.9 1.1l.3 1.7h3l.3-1.7a5.5 5.5 0 0 0 1.9-1.1l1.6.6 1.5-2.6-1.4-1a5.5 5.5 0 0 0 .1-1.1z',
  logout:    'M9 17H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M13 14l4-4-4-4M7 10h10',
  play:      'M6 4.5v11l9-5.5-9-5.5z',
  pause:     'M6 4h3v12H6zM11 4h3v12h-3z',
  stop:      'M5 5h10v10H5z',
  mic:       'M10 3a2.5 2.5 0 0 0-2.5 2.5v5a2.5 2.5 0 0 0 5 0v-5A2.5 2.5 0 0 0 10 3zM5.5 9.5a4.5 4.5 0 0 0 9 0M10 14v3M7.5 17h5',
  micOff:    'M3 3l14 14M10 3a2.5 2.5 0 0 0-2.5 2.5v3m0 3a2.5 2.5 0 0 0 5 0v-1M5.5 9.5a4.5 4.5 0 0 0 .8 2.5m8.2-2.5a4.5 4.5 0 0 1-.6 2.3M10 14v3M7.5 17h5',
  video:     'M3.5 5.5h10v9h-10zM13.5 9l3-2v6l-3-2',
  videoOff:  'M3 3l14 14M3.5 5.5v9h8m2 0V10m0-1V5.5h-6.5M16.5 7v6l-3-2',
  camera:    'M4 6.5h2.5l1-1.5h5l1 1.5H16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  clock:     'M10 5v5l3 2M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z',
  calendar:  'M4 6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6zM7 3.5v3M13 3.5v3M4 9h12',
  star:      'M10 3l2.3 4.6 5.1.7-3.7 3.6.9 5.1L10 14.6 5.4 17l.9-5.1L2.6 8.3l5.1-.7z',
  shield:    'M10 3l6 2v5a7 7 0 0 1-6 7 7 7 0 0 1-6-7V5z',
  sparkles:  'M10 3v3M10 14v3M4 9.5h3M13 9.5h3M6.5 6l1.5 1.5M12 12l1.5 1.5M13.5 6l-1.5 1.5M8 12l-1.5 1.5',
  sparkle:   'M10 2.5l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z',
  trash:     'M4 6h12M8 6V4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V6M6 6l.5 10a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1L14 6',
  edit:      'M13.5 3.5l3 3-9 9H4.5v-3z',
  copy:      'M7 7V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2M5 16h7a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1z',
  archive:   'M3 5.5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-.5V16a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V8.5H4a1 1 0 0 1-1-1v-2zM8 11h4',
  filter:    'M4 5h12l-4.5 6v4l-3 1.5V11z',
  sort:      'M5 7l3-3 3 3M5 13l3 3 3-3',
  upload:    'M10 13V3m0 0l-4 4m4-4l4 4M4 17h12',
  download:  'M10 3v10m0 0l-4-4m4 4l4-4M4 17h12',
  mail:      'M3.5 5h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 6l7 5 7-5',
  help:      'M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM7.5 8a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.4V13M10 15h0',
  info:      'M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM10 9v4.5M10 6.5h0',
  warning:   'M10 4l8 13H2zM10 9v3.5M10 15h0',
  zap:       'M11 3L4 12h5l-1 6 7-9h-5z',
  link:      'M8.5 11.5l3-3M7.5 7.5l1-1a3 3 0 0 1 4.2 4.2l-1 1M12.5 12.5l-1 1a3 3 0 0 1-4.2-4.2l1-1',
  eye:       'M10 5C5 5 2 10 2 10s3 5 8 5 8-5 8-5-3-5-8-5zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff:    'M3 3l14 14M6.5 6.5A11 11 0 0 0 2 10s3 5 8 5a8 8 0 0 0 3.5-.8M13 13a3 3 0 1 1-3.9-4.4',
  thumbsUp:  'M5 9v7a1 1 0 0 0 1 1h1V9zM8 9l2-5a2 2 0 0 1 2 2v2.5H16a1 1 0 0 1 1 1.1l-.8 6A1 1 0 0 1 15.2 17H8z',
  thumbsDown:'M5 11V4a1 1 0 0 1 1-1h1v8zM8 11l2 5a2 2 0 0 0 2-2v-2.5h4a1 1 0 0 0 1-1.1l-.8-6A1 1 0 0 0 15.2 3H8z',
  fire:      'M10 2s1 2 1 4-2 3-2 5a3 3 0 0 0 6 0c0-2-1-3-1-5 3 2 4 5 4 7a7 7 0 0 1-14 0c0-3 3-5 6-11z',
  chart:     'M4 16V4M4 16h12M7 13V9M10 13V6M13 13v-2',
  tag:       'M4 4h6l6 6-6 6-6-6V4zM7 7h0',
  flag:      'M5 3v14M5 4h10l-2 3 2 3H5',
  gauge:     'M4.5 14.5a6 6 0 1 1 11 0M10 11l3-3',
  refresh:   'M4 10a6 6 0 0 1 10-4.5M16 10a6 6 0 0 1-10 4.5M14 3v3h3M6 17v-3H3',
  menu:      'M3 6h14M3 10h14M3 14h14',
  more:      'M5 10h0M10 10h0M15 10h0',
  moreV:     'M10 5h0M10 10h0M10 15h0',
  dot:       'M10 10h0',
  drag:      'M8 6h0M12 6h0M8 10h0M12 10h0M8 14h0M12 14h0',
  pin:       'M8 3l4 4-1 1 2 3-3-1-3 3v-3L3 8z',
  book:      'M4 4h5a2 2 0 0 1 2 2v11a2 2 0 0 0-2-2H4zM16 4h-5a2 2 0 0 0-2 2v11a2 2 0 0 1 2-2h5z',
  briefcase: 'M3 7h14v9H3zM7 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
  home:      'M3 10l7-6 7 6v7a1 1 0 0 1-1 1h-3v-5H9v5H6a1 1 0 0 1-1-1v-7z',
  sliders:   'M4 5h7M14 5h2M4 10h2M9 10h7M4 15h9M16 15h0M11 3.5v3M6 8.5v3M13 13.5v3',
  file:      'M5 3h7l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM12 3v4h4',
  lock:      'M5 9h10v7H5zM7 9V6a3 3 0 0 1 6 0v3',
  crown:     'M3 15l2-8 4 4 3-6 3 6 4-4 2 8z',
  trend:     'M4 14l4-4 3 3 5-5M12 8h4v4',
  speech:    'M4 5h12v8H8l-4 3z',
  mouse:     'M6 4h8a2 2 0 0 1 2 2v8a4 4 0 0 1-8 0v-2M10 4v6',
  screen:    'M3 4h14v10H3zM3 17h14M10 14v3',
  phone:     'M4 4h5l1 4-2 1 3 4 1-2 4 1v5a2 2 0 0 1-2 2C7 19 1 13 1 6a2 2 0 0 1 2-2',
  expand:    'M4 4h5M4 4v5M16 4h-5M16 4v5M4 16h5M4 16v-5M16 16h-5M16 16v-5',
  compress:  'M9 4v5H4M11 4v5h5M9 16v-5H4M11 16v-5h5',
  globe:     'M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM2.5 10h15M10 2.5c2 2 3 5 3 7.5s-1 5.5-3 7.5c-2-2-3-5-3-7.5s1-5.5 3-7.5z',
  rocket:    'M10 3c4 0 7 3 7 7l-3 3-4-4zM10 13l-3 3-3-3 3-3M7 13l-1 3 3-1',
  palette:   'M10 3a7 7 0 1 0 0 14 2 2 0 0 0 1.5-3.4 2 2 0 0 1 1.5-3.4h1a4 4 0 0 0-4-7zM6 9h0M8 6h0M12 6h0M14 9h0',
  layers:    'M10 3l7 4-7 4-7-4zM3 10l7 4 7-4M3 14l7 4 7-4',
  signal:    'M4 13v3M8 11v5M12 9v7M16 7v9',
  circle:    'M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z',
  loader:    'M10 3v3M10 14v3M3 10h3M14 10h3M5 5l2 2M13 13l2 2M5 15l2-2M13 7l2-2',
  face:      'M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM7 8h0M13 8h0M7 12a4 4 0 0 0 6 0',
  triangle:  'M10 4l7 12H3z',
  code:      'M7 6l-4 4 4 4M13 6l4 4-4 4',
  ai:        'M6 4l1.5 3L10.5 8.5 7.5 10 6 13l-1.5-3L1.5 8.5l3-1.5zM14 10l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z',
};

function Icon({ name, size = 16, stroke = 1.75, className = '', style, ...rest }) {
  const d = _IconPaths[name];
  if (!d) return <span style={{display:'inline-block', width:size, height:size}} />;
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

// ─── Button ─────────────────────────────────────────────────────
function Button({ variant = 'default', size = 'md', children, icon, iconRight, className = '', style, ...rest }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontWeight: 500,
    borderRadius: 'var(--r-md)',
    border: '1px solid transparent',
    cursor: 'default',
    transition: 'all .12s ease',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    userSelect: 'none',
  };
  const sizes = {
    xs: { height: 24, padding: '0 8px', fontSize: 12 },
    sm: { height: 30, padding: '0 10px', fontSize: 13 },
    md: { height: 36, padding: '0 14px', fontSize: 14 },
    lg: { height: 42, padding: '0 18px', fontSize: 15 },
  };
  const variants = {
    primary: { background: 'var(--p-600)', color: '#fff', boxShadow: '0 1px 0 rgba(255,255,255,.12) inset, 0 1px 2px rgba(67,56,202,.3)' },
    default: { background: '#fff', color: 'var(--n-800)', border: '1px solid var(--n-200)', boxShadow: 'var(--sh-xs)' },
    ghost:   { background: 'transparent', color: 'var(--n-700)' },
    subtle:  { background: 'var(--n-100)', color: 'var(--n-800)' },
    danger:  { background: 'var(--error-600)', color: '#fff', boxShadow: '0 1px 0 rgba(255,255,255,.12) inset, 0 1px 2px rgba(185,28,28,.3)' },
    success: { background: 'var(--success-600)', color: '#fff', boxShadow: '0 1px 0 rgba(255,255,255,.12) inset, 0 1px 2px rgba(5,150,105,.3)' },
    outlineDanger: { background: '#fff', color: 'var(--error-700)', border: '1px solid var(--error-200, #fecaca)' },
  };
  return (
    <button className={className} style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : size === 'xs' ? 12 : 14} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 18 : size === 'xs' ? 12 : 14} />}
    </button>
  );
}

// ─── Badge ──────────────────────────────────────────────────────
function Badge({ tone = 'neutral', children, dot, icon, size = 'md', style, ...rest }) {
  const tones = {
    neutral: { bg: 'var(--n-100)', fg: 'var(--n-700)', dot: 'var(--n-400)' },
    success: { bg: 'var(--success-50)', fg: 'var(--success-700)', dot: 'var(--success-500)' },
    warning: { bg: 'var(--warning-50)', fg: 'var(--warning-700)', dot: 'var(--warning-500)' },
    error:   { bg: 'var(--error-50)',   fg: 'var(--error-700)',   dot: 'var(--error-500)' },
    info:    { bg: 'var(--info-50)',    fg: 'var(--info-600)',    dot: 'var(--info-500)' },
    primary: { bg: 'var(--p-50)',       fg: 'var(--p-700)',       dot: 'var(--p-500)' },
    outline: { bg: '#fff', fg: 'var(--n-700)', dot: 'var(--n-400)', border: 'var(--n-200)' },
  };
  const t = tones[tone];
  const sizes = {
    sm: { fontSize: 11, padding: '1px 6px', height: 18, gap: 4 },
    md: { fontSize: 12, padding: '2px 8px', height: 22, gap: 5 },
    lg: { fontSize: 13, padding: '3px 10px', height: 26, gap: 6 },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--r-full)',
      background: t.bg, color: t.fg, fontWeight: 500,
      border: t.border ? `1px solid ${t.border}` : 'none',
      ...sizes[size], ...style,
    }} {...rest}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot, flexShrink: 0 }} />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

// ─── Score (the hero AI-score viz) ─────────────────────────────
// Default is a ring with a number inside; variants are bar + pill.
function Score({ value, size = 64, variant = 'ring', showLabel = false, label }) {
  const tone = value >= 75 ? 'success' : value >= 50 ? 'warning' : 'error';
  const color = tone === 'success' ? 'var(--success-500)' : tone === 'warning' ? 'var(--warning-500)' : 'var(--error-500)';
  const bg    = tone === 'success' ? 'var(--success-50)'  : tone === 'warning' ? 'var(--warning-50)'  : 'var(--error-50)';
  const fg    = tone === 'success' ? 'var(--success-700)' : tone === 'warning' ? 'var(--warning-700)' : 'var(--error-700)';

  if (variant === 'pill') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, background: bg, color: fg,
        borderRadius: 'var(--r-full)', padding: '4px 10px', fontWeight: 600, fontSize: 13,
      }} className="tnum">
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        {value}{showLabel && <span style={{ fontWeight: 400, opacity: .7 }}>/100</span>}
      </span>
    );
  }
  if (variant === 'bar') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 120, height: 6, background: 'var(--n-150)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
        </div>
        <span className="tnum" style={{ fontWeight: 600, color: fg, fontSize: 13, minWidth: 28 }}>{value}</span>
      </div>
    );
  }
  // Ring
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--n-150)" strokeWidth="4" fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0,
      }}>
        <div className="tnum" style={{ fontWeight: 700, fontSize: size * 0.34, color: fg, lineHeight: 1 }}>{value}</div>
        {showLabel && <div style={{ fontSize: 9, color: 'var(--n-500)', fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label || 'Score'}</div>}
      </div>
    </div>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────
const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f59e0b','#10b981','#14b8a6','#06b6d4','#0ea5e9'];
function hashStr(s){let h=0;for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0;}return Math.abs(h);}
function Avatar({ name, size = 32, src, status }) {
  const initials = (name || '?').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
  const c = AVATAR_COLORS[hashStr(name||'x') % AVATAR_COLORS.length];
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', background: src ? 'transparent' : c,
        color: '#fff', fontWeight: 600, fontSize: size * 0.4, letterSpacing: '-.02em',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundImage: src ? `url(${src})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.04)',
      }}>
        {!src && initials}
      </div>
      {status && (
        <span style={{
          position: 'absolute', right: -1, bottom: -1, width: size * 0.3, height: size * 0.3,
          borderRadius: '50%', background: status === 'online' ? 'var(--success-500)' : 'var(--n-400)',
          boxShadow: '0 0 0 2px #fff',
        }} />
      )}
    </div>
  );
}

// ─── Card ───────────────────────────────────────────────────────
function Card({ children, style, padding = 20, hover = false, ...rest }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--n-200)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--sh-xs)',
      padding,
      ...style,
    }} {...rest}>
      {children}
    </div>
  );
}

// ─── Input / Textarea / Select / Checkbox ──────────────────────
function Input({ icon, style, size = 'md', ...rest }) {
  const heights = { sm: 30, md: 36, lg: 42 };
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      {icon && <Icon name={icon} size={16} style={{ position: 'absolute', left: 10, color: 'var(--n-400)' }} />}
      <input style={{
        width: '100%', height: heights[size], padding: icon ? '0 12px 0 34px' : '0 12px',
        border: '1px solid var(--n-200)', borderRadius: 'var(--r-md)', background: '#fff',
        fontFamily: 'inherit', fontSize: 14, color: 'var(--n-900)', outline: 'none',
        boxShadow: 'var(--sh-xs)',
        ...style,
      }} {...rest} />
    </div>
  );
}
function Textarea({ style, ...rest }) {
  return (
    <textarea style={{
      width: '100%', minHeight: 80, padding: '10px 12px',
      border: '1px solid var(--n-200)', borderRadius: 'var(--r-md)', background: '#fff',
      fontFamily: 'inherit', fontSize: 14, color: 'var(--n-900)', outline: 'none', resize: 'vertical',
      lineHeight: 1.5, boxShadow: 'var(--sh-xs)', ...style,
    }} {...rest} />
  );
}
function Checkbox({ checked, label, onChange, style }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'default', ...style }}>
      <span style={{
        width: 16, height: 16, borderRadius: 4,
        border: `1.5px solid ${checked ? 'var(--p-600)' : 'var(--n-300)'}`,
        background: checked ? 'var(--p-600)' : '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .1s',
      }}>
        {checked && <Icon name="check" size={12} stroke={2.5} style={{ color: '#fff' }} />}
      </span>
      {label && <span style={{ fontSize: 13, color: 'var(--n-700)' }}>{label}</span>}
    </label>
  );
}

// ─── ProgressBar ────────────────────────────────────────────────
function ProgressBar({ value, tone = 'primary', size = 'md', style }) {
  const tones = {
    primary: 'var(--p-600)', success: 'var(--success-500)', warning: 'var(--warning-500)', error: 'var(--error-500)',
  };
  const heights = { sm: 4, md: 6, lg: 8 };
  return (
    <div style={{ width: '100%', height: heights[size], background: 'var(--n-150)', borderRadius: 999, overflow: 'hidden', ...style }}>
      <div style={{ width: `${value}%`, height: '100%', background: tones[tone], borderRadius: 999, transition: 'width .3s' }} />
    </div>
  );
}

// ─── Tabs (segmented) ──────────────────────────────────────────
function Tabs({ items, value, onChange, size = 'md' }) {
  const heights = { sm: 28, md: 32, lg: 36 };
  return (
    <div style={{ display: 'inline-flex', background: 'var(--n-100)', borderRadius: 'var(--r-md)', padding: 3, gap: 2 }}>
      {items.map(it => (
        <button
          key={it.value}
          onClick={() => onChange && onChange(it.value)}
          style={{
            height: heights[size], padding: '0 12px', border: 'none', borderRadius: 'var(--r-sm)',
            background: value === it.value ? '#fff' : 'transparent',
            color: value === it.value ? 'var(--n-900)' : 'var(--n-600)',
            fontSize: 13, fontWeight: 500, cursor: 'default',
            boxShadow: value === it.value ? 'var(--sh-xs)' : 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          {it.icon && <Icon name={it.icon} size={13} />}
          {it.label}
          {it.count !== undefined && (
            <span style={{ fontSize: 11, color: 'var(--n-500)', fontWeight: 500 }}>{it.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Kbd ────────────────────────────────────────────────────────
function Kbd({ children }) {
  return <kbd style={{
    fontFamily: 'var(--font-mono)', fontSize: 11, padding: '1px 5px',
    border: '1px solid var(--n-200)', borderBottomWidth: 2, borderRadius: 4,
    background: '#fff', color: 'var(--n-600)',
  }}>{children}</kbd>;
}

// ─── Tooltip-lite (static label above) ────────────────────────
function Divider({ vertical, style }) {
  return <div style={{
    background: 'var(--n-200)',
    ...(vertical ? { width: 1, alignSelf: 'stretch' } : { height: 1, width: '100%' }),
    ...style,
  }} />;
}

Object.assign(window, {
  Icon, Button, Badge, Score, Avatar, Card, Input, Textarea, Checkbox,
  ProgressBar, Tabs, Kbd, Divider,
});
