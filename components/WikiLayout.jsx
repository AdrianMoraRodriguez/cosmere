import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function PageIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ─── Page metadata mapping ────────────────────────────────────────────────────

const PAGE_META = {
  'asociaciones': { iconKey: 'users',     subtitle: 'Facciones y grupos' },
  'personajes':   { iconKey: 'person',    subtitle: 'PNJs y aliados' },
  'historia':     { iconKey: 'book',      subtitle: 'Lore y cronología' },
  'potencias':    { iconKey: 'lightning', subtitle: 'Sistemas de magia' },
  'caminos':      { iconKey: 'shield',    subtitle: 'Clases y juramentos' },
  'información':  { iconKey: 'info',      subtitle: 'Reglas y referencias' },
  'informacion':  { iconKey: 'info',      subtitle: 'Reglas y referencias' },
  'enemigos':     { iconKey: 'alert',     subtitle: 'Antagonistas' },
  'fabriales':    { iconKey: 'gear',      subtitle: 'Objetos mágicos' },
  'party':        { iconKey: 'star',      subtitle: 'Los Caminapiedras' },
};

const ICON_MAP = {
  home:      HomeIcon,
  users:     UsersIcon,
  person:    PersonIcon,
  book:      BookIcon,
  lightning: LightningIcon,
  shield:    ShieldIcon,
  info:      InfoIcon,
  alert:     AlertIcon,
  gear:      GearIcon,
  star:      StarIcon,
  page:      PageIcon,
};

const MAIN_KEYWORDS = ['asociaciones', 'personajes', 'historia', 'potencias', 'caminos', 'información', 'informacion'];

export function getPageMeta(page) {
  const text = (page.title + ' ' + page.slug).toLowerCase();
  for (const [key, meta] of Object.entries(PAGE_META)) {
    if (text.includes(key)) return meta;
  }
  return { iconKey: 'page', subtitle: '' };
}

export function isMainIndexPage(page) {
  const text = (page.title + ' ' + page.slug).toLowerCase();
  return MAIN_KEYWORDS.some(kw => text.includes(kw));
}

export function encodeWikiSlug(slug) {
  return slug.split('/').map(encodeURIComponent).join('/');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{
      color: '#2e4a65',
      fontSize: '10px',
      fontWeight: '700',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      padding: '10px 10px 4px',
    }}>
      {children}
    </div>
  );
}

function NavItem({ href, iconKey, label, active, hasSpoilers }) {
  const Icon = ICON_MAP[iconKey] || PageIcon;
  return (
    <Link href={href} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '9px',
      padding: '6px 10px',
      borderRadius: '6px',
      marginBottom: '1px',
      textDecoration: 'none',
      color: active ? '#c8daf0' : '#5a7898',
      background: active ? '#0f2040' : 'transparent',
      borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
      transition: 'background 0.12s, color 0.12s',
      fontSize: '13px',
      fontWeight: active ? '500' : '400',
    }}>
      <span style={{ color: active ? '#60a5fa' : '#3a5878', flexShrink: 0 }}>
        <Icon />
      </span>
      <span style={{ flex: 1, lineHeight: 1.3 }}>{label}</span>
      {hasSpoilers && (
        <span style={{
          width: '6px', height: '6px',
          borderRadius: '50%',
          background: '#f59e0b',
          flexShrink: 0,
        }} />
      )}
    </Link>
  );
}

function getUserInitials(username) {
  if (!username) return 'U';
  const parts = username.trim().split(/[\s_-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

// ─── Main layout ──────────────────────────────────────────────────────────────

export default function WikiLayout({ user, indexPages = [], allPages = [], children, searchTerm, onSearch, onLogout }) {
  const router = useRouter();
  const isWikiHome = router.pathname === '/wiki';

  const mainPages = indexPages.filter(isMainIndexPage);
  const morePages  = indexPages.filter(p => !isMainIndexPage(p));

  // ── Search state ────────────────────────────────────────────────────────────
  const [localQuery, setLocalQuery] = useState(searchTerm || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchWrapRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
    setLocalQuery('');
    onSearch?.('');
  }, [router.asPath]);

  const canSee = (page) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (page.visibility === 'public') return true;
    return page.allowed_users?.includes(user.username);
  };

  const searchResults = localQuery.length >= 2
    ? allPages
        .filter(p => canSee(p) && (
          p.title.toLowerCase().includes(localQuery.toLowerCase()) ||
          p.slug.toLowerCase().includes(localQuery.toLowerCase())
        ))
        .slice(0, 9)
    : [];

  const handleQueryChange = (val) => {
    setLocalQuery(val);
    onSearch?.(val);
    setDropdownOpen(val.length >= 2);
  };

  const goToResult = (page) => {
    setLocalQuery('');
    setDropdownOpen(false);
    onSearch?.('');
    router.push(`/wiki/${encodeWikiSlug(page.slug)}`);
  };

  function checkActive(slug) {
    try {
      const decoded = decodeURIComponent(router.asPath);
      return decoded === `/wiki/${slug}` || decoded.startsWith(`/wiki/${slug}/`);
    } catch {
      return false;
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: '#050c18',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
    }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: '230px',
        flexShrink: 0,
        background: '#07101f',
        borderRight: '1px solid #0f1e30',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 14px 14px', borderBottom: '1px solid #0f1e30' }}>
          <Link href="/wiki" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              color: '#4d8fd6',
              fontWeight: '700',
              fontSize: '12.5px',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}>
              Wiki del Cosmere
            </div>
            <div style={{ color: '#243a52', fontSize: '10.5px', marginTop: '3px' }}>
              Archivo de las Tormentas · RPG
            </div>
          </Link>
        </div>

        {/* Scrollable nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px 16px' }}>
          <SectionLabel>Inicio</SectionLabel>
          <NavItem href="/wiki" iconKey="home" label="Todas las páginas" active={isWikiHome} />

          {mainPages.length > 0 && (
            <>
              <SectionLabel>Páginas Índice</SectionLabel>
              {mainPages.map(page => (
                <NavItem
                  key={page.slug}
                  href={`/wiki/${encodeWikiSlug(page.slug)}`}
                  iconKey={getPageMeta(page).iconKey}
                  label={page.title}
                  active={checkActive(page.slug)}
                  hasSpoilers={page.spoilers}
                />
              ))}
            </>
          )}

          {morePages.length > 0 && (
            <>
              <SectionLabel>Más</SectionLabel>
              {morePages.map(page => (
                <NavItem
                  key={page.slug}
                  href={`/wiki/${encodeWikiSlug(page.slug)}`}
                  iconKey={getPageMeta(page).iconKey}
                  label={page.title}
                  active={checkActive(page.slug)}
                  hasSpoilers={page.spoilers}
                />
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* ── Right side ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          height: '56px',
          background: '#07101f',
          borderBottom: '1px solid #0f1e30',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '16px',
          flexShrink: 0,
        }}>

          {/* Search with dropdown */}
          <div ref={searchWrapRef} style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#2e4a65', pointerEvents: 'none', zIndex: 1 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar páginas..."
              value={localQuery}
              onChange={e => handleQueryChange(e.target.value)}
              onFocus={e => {
                e.target.style.borderColor = '#2563eb';
                if (localQuery.length >= 2) setDropdownOpen(true);
              }}
              onBlur={e => { e.target.style.borderColor = '#152030'; }}
              onKeyDown={e => {
                if (e.key === 'Escape') { setDropdownOpen(false); e.target.blur(); }
                if (e.key === 'Enter' && searchResults.length > 0) goToResult(searchResults[0]);
              }}
              style={{
                width: '100%',
                background: '#0b1628',
                border: '1px solid #152030',
                borderRadius: dropdownOpen && searchResults.length > 0 ? '8px 8px 0 0' : '8px',
                padding: '6px 12px 6px 30px',
                color: '#b8ccdf',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
            />

            {/* Dropdown */}
            {dropdownOpen && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0, right: 0,
                background: '#07101f',
                border: '1px solid #2563eb',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 200,
                maxHeight: '320px',
                overflowY: 'auto',
              }}>
                {searchResults.map((page, i) => (
                  <button
                    key={page.slug}
                    onMouseDown={e => { e.preventDefault(); goToResult(page); }}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: i < searchResults.length - 1 ? '1px solid #0a1828' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#0c1e38'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: '#b8ccdf', fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {page.title}
                      </div>
                      <div style={{ color: '#2e4060', fontSize: '11px', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {page.slug}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      {page.spoilers && (
                        <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '4px', fontSize: '10px', fontWeight: '600', padding: '1px 5px' }}>
                          Spoilers
                        </span>
                      )}
                      {page.visibility === 'private' && (
                        <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '4px', fontSize: '10px', fontWeight: '600', padding: '1px 5px' }}>
                          Privado
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#b8ccdf', fontSize: '13px', fontWeight: '500' }}>{user?.username}</div>
              <div style={{ color: '#2e4a65', fontSize: '11px' }}>
                {user?.role === 'admin' ? 'Dungeon Master' : 'Jugador'}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              style={{
                width: '33px', height: '33px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1a3a8a 100%)',
                border: '1.5px solid #2563eb',
                color: '#e2e8f0',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '0.03em',
                flexShrink: 0,
              }}
            >
              {getUserInitials(user?.username)}
            </button>
          </div>
        </header>

        {/* Main scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', background: '#050c18' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
