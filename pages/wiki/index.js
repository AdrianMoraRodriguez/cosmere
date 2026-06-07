import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import WikiLayout, { getPageMeta, isMainIndexPage, encodeWikiSlug } from '../../components/WikiLayout';
import NotesPanel from '../../components/NotesPanel';
import NotesButton from '../../components/NotesButton';
import DMMessenger from '../../components/DMMessenger';
import PlayerMessenger from '../../components/PlayerMessenger';
import MessageButton from '../../components/MessageButton';
import { supabase } from '../../lib/supabase';

// ─── Card for index pages ─────────────────────────────────────────────────────

const ICON_SVG = {
  users: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  person: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  book: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  lightning: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  shield: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  info: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  alert: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  gear: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  star: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  page: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

function IndexCard({ page }) {
  const meta = getPageMeta(page);
  const icon = ICON_SVG[meta.iconKey] || ICON_SVG.page;
  const href = `/wiki/${encodeWikiSlug(page.slug)}`;

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#0a1628',
        border: '1px solid #122030',
        borderRadius: '10px',
        padding: '18px 18px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#1e4080';
          e.currentTarget.style.background = '#0c1e38';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#122030';
          e.currentTarget.style.background = '#0a1628';
        }}
      >
        {/* Icon row + spoilers badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ color: '#4d8fd6' }}>{icon}</span>
          {page.spoilers && (
            <span style={{
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '5px',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 7px',
              letterSpacing: '0.03em',
            }}>
              Spoilers
            </span>
          )}
        </div>

        {/* Title + subtitle */}
        <div>
          <div style={{
            color: '#c8daf0',
            fontWeight: '600',
            fontSize: '14.5px',
            lineHeight: '1.3',
            marginBottom: '4px',
          }}>
            {page.title}
          </div>
          {meta.subtitle && (
            <div style={{ color: '#3a5878', fontSize: '12px' }}>
              {meta.subtitle}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Row for all-pages list ───────────────────────────────────────────────────

function PageRow({ page, isLast }) {
  const href = `/wiki/${encodeWikiSlug(page.slug)}`;
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: isLast ? 'none' : '1px solid #0d1e2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background 0.12s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = '#0c1c30'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div>
          <div style={{ color: '#b8ccdf', fontSize: '13.5px', fontWeight: '500' }}>{page.title}</div>
          <div style={{ color: '#263c52', fontSize: '11.5px', marginTop: '2px' }}>{page.slug}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '12px' }}>
          {page.is_index && (
            <span style={{
              background: 'rgba(59,130,246,0.12)',
              color: '#60a5fa',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: '5px',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 7px',
            }}>Índice</span>
          )}
          {page.spoilers && (
            <span style={{
              background: 'rgba(245,158,11,0.12)',
              color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '5px',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 7px',
            }}>Spoilers</span>
          )}
          {page.visibility === 'private' && (
            <span style={{
              background: 'rgba(239,68,68,0.12)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '5px',
              fontSize: '10px',
              fontWeight: '600',
              padding: '2px 7px',
            }}>Privado</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WikiIndex() {
  const [pages, setPages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/login'); return; }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      fetch('/content/pages.json')
        .then(res => res.json())
        .then(data => {
          setPages(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });

      if (parsedUser.role !== 'admin') {
        loadUnreadCount(parsedUser.username);
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  const loadUnreadCount = async (username) => {
    try {
      const { data, error } = await supabase
        .from('dm_messages')
        .select('id')
        .eq('recipient_username', username)
        .eq('read', false);
      if (!error && data) setUnreadCount(data.length);
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Loading / error screens (before layout is available)
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#050c18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#4d8fd6', fontSize: '16px' }}>Cargando...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#050c18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#f87171', fontSize: '16px' }}>Error: {error}</div>
      </div>
    );
  }
  if (!user) return null;

  // Filter by access
  const accessiblePages = pages.filter(page => {
    if (user.role === 'admin') return true;
    if (page.visibility === 'public') return true;
    if (page.allowed_users?.includes(user.username)) return true;
    return false;
  });

  const indexPages = accessiblePages.filter(p => p.is_index);
  const mainIndexPages = indexPages.filter(isMainIndexPage);

  const filteredPages = searchTerm
    ? accessiblePages.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : accessiblePages;

  return (
    <>
      <WikiLayout
        user={user}
        indexPages={indexPages}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        onLogout={handleLogout}
      >
        <div style={{ padding: '32px 36px', maxWidth: '1100px' }}>

          {/* Page header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{
              color: '#c8daf0',
              fontSize: '22px',
              fontWeight: '700',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontVariant: 'small-caps',
              margin: 0,
              textAlign: 'left',
            }}>
              Páginas Índice
            </h1>
            <p style={{ color: '#2e4a65', fontSize: '13px', marginTop: '4px' }}>
              {accessiblePages.length} páginas en total · Archivo de las Tormentas
            </p>
          </div>

          {/* Index cards grid (hidden while searching) */}
          {!searchTerm && mainIndexPages.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '40px',
            }}>
              {mainIndexPages.map(page => (
                <IndexCard key={page.slug} page={page} />
              ))}
            </div>
          )}

          {/* All pages section */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              marginBottom: '12px',
            }}>
              <h2 style={{
                color: '#3a5878',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                margin: 0,
                textAlign: 'left',
              }}>
                {searchTerm ? 'Resultados de búsqueda' : 'Todas las páginas'}
              </h2>
              <span style={{ color: '#2e4060', fontSize: '11px' }}>({filteredPages.length})</span>
            </div>

            <div style={{
              background: '#0a1628',
              border: '1px solid #122030',
              borderRadius: '10px',
              overflow: 'hidden',
            }}>
              {filteredPages.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#2e4a65', fontSize: '14px' }}>
                  No se encontraron páginas
                </div>
              ) : (
                filteredPages.map((page, i) => (
                  <PageRow key={page.slug} page={page} isLast={i === filteredPages.length - 1} />
                ))
              )}
            </div>
          </div>
        </div>
      </WikiLayout>

      {/* Floating buttons */}
      {user.role === 'admin' ? (
        <MessageButton onClick={() => setMessagesOpen(true)} isDM={true} />
      ) : (
        <>
          <NotesButton onClick={() => setNotesOpen(true)} />
          <MessageButton onClick={() => setMessagesOpen(true)} unreadCount={unreadCount} />
        </>
      )}

      {/* Panels */}
      {user.role === 'admin' ? (
        <DMMessenger isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
      ) : (
        <>
          <NotesPanel username={user.username} isOpen={notesOpen} onClose={() => setNotesOpen(false)} />
          <PlayerMessenger
            username={user.username}
            isOpen={messagesOpen}
            onClose={() => {
              setMessagesOpen(false);
              loadUnreadCount(user.username);
            }}
          />
        </>
      )}
    </>
  );
}
