// shell.jsx — AppShell, Sidebar, Header, and common chrome.
// Depends on: primitives.jsx (Icon, Avatar, Badge, Button, Input)

const { useState: _useState_shell } = React;

function Sidebar({ role = 'hr', active, compact = false }) {
  const hrItems = [
    { id: 'interviews', label: 'Interviews', icon: 'clipboard', badge: null },
    { id: 'candidates', label: 'Candidates', icon: 'users', badge: 3 },
    { id: 'companies',  label: 'Companies',  icon: 'building' },
    { id: 'review',     label: 'Pending reviews', icon: 'sparkles', badge: 2, tone: 'primary' },
  ];
  const hrLower = [
    { id: 'templates', label: 'Template library', icon: 'book', soon: true },
    { id: 'compare',   label: 'Comparison',       icon: 'layers' },
  ];
  const candItems = [
    { id: 'dashboard', label: 'My interviews', icon: 'clipboard' },
    { id: 'skills',    label: 'Skill profile',  icon: 'sparkle' },
    { id: 'results',   label: 'Results',        icon: 'chart' },
  ];
  const adminItems = [
    { id: 'users',      label: 'Users',      icon: 'users' },
    { id: 'skills',     label: 'Skill taxonomy', icon: 'tag' },
    { id: 'interviews', label: 'All invitations', icon: 'list' },
  ];

  const groups = role === 'candidate'
    ? [{ title: 'Candidate', items: candItems }]
    : role === 'admin'
    ? [{ title: 'Admin', items: adminItems }]
    : [
        { title: 'Workspace', items: hrItems },
        { title: 'Explore',   items: hrLower },
      ];

  const w = compact ? 64 : 232;
  return (
    <aside style={{
      width: w, flexShrink: 0, borderRight: '1px solid var(--n-200)',
      background: '#fff', display: 'flex', flexDirection: 'column', padding: '14px 10px',
      gap: 18,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 2px' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--p-500), var(--a-500))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '-.03em',
          boxShadow: '0 2px 8px rgba(99,102,241,.3), inset 0 1px 0 rgba(255,255,255,.3)',
        }}>Iv</div>
        {!compact && (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-.01em' }}>Ivory</div>
            <div style={{ fontSize: 10.5, color: 'var(--n-500)', marginTop: 2 }}>Acme Labs</div>
          </div>
        )}
        {!compact && <Icon name="chevDown" size={14} style={{ marginLeft: 'auto', color: 'var(--n-400)' }} />}
      </div>

      {/* Search */}
      {!compact && (
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: 8, color: 'var(--n-400)' }} />
          <input placeholder="Search…" style={{
            width: '100%', height: 30, padding: '0 36px 0 30px',
            border: '1px solid var(--n-200)', borderRadius: 'var(--r-md)',
            background: 'var(--n-50)', fontSize: 12.5, color: 'var(--n-700)', outline: 'none',
          }} />
          <span style={{
            position: 'absolute', right: 6, top: 5, fontFamily: 'var(--font-mono)', fontSize: 10,
            padding: '2px 5px', border: '1px solid var(--n-200)', borderRadius: 4, background: '#fff',
            color: 'var(--n-500)',
          }}>⌘K</span>
        </div>
      )}

      {/* Groups */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {groups.map(g => (
          <div key={g.title}>
            {!compact && (
              <div style={{
                fontSize: 10.5, fontWeight: 600, color: 'var(--n-500)',
                letterSpacing: '.08em', textTransform: 'uppercase', padding: '2px 8px 6px',
              }}>{g.title}</div>
            )}
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {g.items.map(it => {
                const isActive = active === it.id;
                return (
                  <li key={it.id}>
                    <a href="#" style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: compact ? '8px' : '7px 8px',
                      borderRadius: 'var(--r-md)',
                      color: isActive ? 'var(--p-700)' : 'var(--n-700)',
                      background: isActive ? 'var(--p-50)' : 'transparent',
                      textDecoration: 'none', fontSize: 13.5, fontWeight: isActive ? 500 : 400,
                      justifyContent: compact ? 'center' : 'flex-start',
                      position: 'relative',
                    }}>
                      <Icon name={it.icon} size={16} style={{ color: isActive ? 'var(--p-600)' : 'var(--n-500)' }} />
                      {!compact && <span>{it.label}</span>}
                      {!compact && it.soon && <Badge tone="outline" size="sm" style={{ marginLeft: 'auto' }}>Soon</Badge>}
                      {!compact && it.badge && (
                        <span style={{
                          marginLeft: 'auto',
                          background: it.tone === 'primary' ? 'var(--p-600)' : 'var(--n-200)',
                          color: it.tone === 'primary' ? '#fff' : 'var(--n-700)',
                          fontSize: 11, fontWeight: 600, padding: '0 6px', height: 18,
                          minWidth: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 999,
                        }}>{it.badge}</span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Usage card */}
      {!compact && role === 'hr' && (
        <div style={{
          borderRadius: 'var(--r-lg)',
          padding: 12, background: 'linear-gradient(135deg, var(--p-50), #fff)',
          border: '1px solid var(--p-100)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--n-700)' }}>Plus plan</div>
            <span style={{ fontSize: 10.5, color: 'var(--n-500)', fontFamily: 'var(--font-mono)' }} className="tnum">38 / 100</span>
          </div>
          <div style={{ height: 4, background: 'var(--n-150)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '38%', height: '100%', background: 'var(--p-500)' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--n-500)', marginTop: 6 }}>Interviews · resets May 1</div>
        </div>
      )}

      {/* User */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: 6,
        borderRadius: 'var(--r-md)', background: 'var(--n-50)',
      }}>
        <Avatar name="Maya Ortiz" size={28} status="online" />
        {!compact && (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--n-800)' }}>Maya Ortiz</div>
            <div style={{ fontSize: 11, color: 'var(--n-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>maya@acmelabs.co</div>
          </div>
        )}
        {!compact && <Icon name="moreV" size={14} style={{ color: 'var(--n-400)' }} />}
      </div>
    </aside>
  );
}

function Header({ title, subtitle, crumbs, actions, tabs, tabValue, onTabChange, children }) {
  return (
    <header style={{
      background: '#fff', borderBottom: '1px solid var(--n-200)',
      padding: '16px 28px 0', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          {crumbs && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--n-500)', marginBottom: 6 }}>
              {crumbs.map((c, i) => (
                <React.Fragment key={i}>
                  <span style={{ color: i === crumbs.length - 1 ? 'var(--n-800)' : 'var(--n-500)', fontWeight: i === crumbs.length - 1 ? 500 : 400 }}>{c}</span>
                  {i < crumbs.length - 1 && <Icon name="chevRight" size={12} style={{ color: 'var(--n-400)' }} />}
                </React.Fragment>
              ))}
            </div>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--n-900)', marginBottom: subtitle ? 4 : 0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 13.5, color: 'var(--n-500)' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Notif bell */}
          <button style={{
            width: 34, height: 34, borderRadius: 'var(--r-md)',
            background: 'transparent', border: '1px solid transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--n-600)', position: 'relative', cursor: 'default',
          }}>
            <Icon name="bell" size={17} />
            <span style={{
              position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%',
              background: 'var(--error-500)', boxShadow: '0 0 0 2px #fff',
            }} />
          </button>
          <button style={{
            width: 34, height: 34, borderRadius: 'var(--r-md)',
            background: 'transparent', border: '1px solid transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--n-600)', cursor: 'default',
          }}>
            <Icon name="help" size={17} />
          </button>
          {actions}
        </div>
      </div>
      {tabs && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 16, borderBottom: 'none' }}>
          {tabs.map(t => {
            const active = tabValue === t.value;
            return (
              <button key={t.value} onClick={() => onTabChange && onTabChange(t.value)} style={{
                padding: '10px 14px 12px', background: 'transparent', border: 'none', cursor: 'default',
                fontSize: 13.5, fontWeight: active ? 500 : 400,
                color: active ? 'var(--n-900)' : 'var(--n-500)',
                borderBottom: `2px solid ${active ? 'var(--p-600)' : 'transparent'}`,
                marginBottom: -1, display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {t.icon && <Icon name={t.icon} size={14} />}
                {t.label}
                {t.count !== undefined && (
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 999,
                    background: active ? 'var(--p-100)' : 'var(--n-100)',
                    color: active ? 'var(--p-700)' : 'var(--n-600)', fontWeight: 500,
                  }}>{t.count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {children}
    </header>
  );
}

function AppShell({ role = 'hr', active, children, header, compact = false, width = 1280, height = 800 }) {
  return (
    <div className="app" style={{
      width, height, display: 'flex', background: 'var(--n-50)',
      borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 0 0 1px var(--n-200), var(--sh-md)',
    }}>
      <Sidebar role={role} active={active} compact={compact} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {header}
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--n-50)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Header, AppShell });
