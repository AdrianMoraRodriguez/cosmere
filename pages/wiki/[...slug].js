import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import WikiContent from '../../components/WikiContent';
import WikiLayout, { encodeWikiSlug } from '../../components/WikiLayout';
import NotesPanel from '../../components/NotesPanel';
import NotesButton from '../../components/NotesButton';
import DMMessenger from '../../components/DMMessenger';
import PlayerMessenger from '../../components/PlayerMessenger';
import MessageButton from '../../components/MessageButton';
import { supabase } from '../../lib/supabase';

export default function WikiPage() {
  const [page, setPage] = useState(null);
  const [allPages, setAllPages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/login'); return; }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      fetch('/content/pages.json')
        .then(res => res.json())
        .then(data => {
          setAllPages(data);

          const fullSlug = Array.isArray(slug)
            ? slug.map(part => decodeURIComponent(part)).join('/')
            : decodeURIComponent(slug || '');

          const currentPage = data.find(p => p.slug === fullSlug);
          if (!currentPage) { router.push('/wiki'); return; }

          const canAccess =
            parsedUser.role === 'admin' ||
            currentPage.visibility === 'public' ||
            currentPage.allowed_users?.includes(parsedUser.username);

          if (!canAccess) {
            alert('No tienes permiso para ver esta página');
            router.push('/wiki');
            return;
          }

          setPage(currentPage);
          setLoading(false);
        })
        .catch(() => setLoading(false));

      if (parsedUser.role !== 'admin') {
        loadUnreadCount(parsedUser.username);
      }
    } catch {
      router.push('/login');
    }
  }, [slug, router]);

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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#050c18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#4d8fd6', fontSize: '16px' }}>Cargando...</div>
      </div>
    );
  }
  if (!page || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#050c18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#f87171', fontSize: '16px' }}>Página no encontrada</div>
      </div>
    );
  }

  // Accessible index pages for the sidebar
  const indexPages = allPages.filter(p => {
    if (!p.is_index) return false;
    if (user.role === 'admin') return true;
    if (p.visibility === 'public') return true;
    if (p.allowed_users?.includes(user.username)) return true;
    return false;
  });

  const content = user.role === 'admin' ? page.content_admin : page.content_player;

  // Index and subindex pages use a wider layout to accommodate photo grids.
  const isPhotoGridPage = page.is_index || page.is_subindex;

  return (
    <>
      <WikiLayout
        user={user}
        indexPages={indexPages}
        allPages={allPages}
        onLogout={handleLogout}
      >
        <div style={{ padding: '32px 40px', maxWidth: isPhotoGridPage ? '1200px' : '860px' }}>

          {/* Breadcrumb */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'none',
                border: 'none',
                color: '#3a5878',
                fontSize: '13px',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <span style={{ color: '#1a2d40', fontSize: '13px' }}>/</span>
            <span style={{ color: '#2e4a65', fontSize: '13px' }}>{page.title}</span>
          </div>

          {/* Article */}
          <article>
            {/* Title */}
            <h1 style={{
              color: '#c8daf0',
              fontSize: '26px',
              fontWeight: '700',
              margin: '0 0 14px',
              lineHeight: '1.25',
              textAlign: 'left',
            }}>
              {page.title}
            </h1>

            {/* Badges */}
            {(page.spoilers || page.visibility === 'private' || page.is_index) && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {page.spoilers && (
                  <span style={{
                    background: 'rgba(245,158,11,0.1)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    padding: '3px 10px',
                  }}>
                    Contiene spoilers
                  </span>
                )}
                {page.visibility === 'private' && (
                  <span style={{
                    background: 'rgba(239,68,68,0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    padding: '3px 10px',
                  }}>
                    Contenido privado
                  </span>
                )}
                {page.is_index && (
                  <span style={{
                    background: 'rgba(59,130,246,0.1)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    padding: '3px 10px',
                  }}>
                    Página índice
                  </span>
                )}
              </div>
            )}

            {/* Divider */}
            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, #122030 0%, transparent 100%)',
              marginBottom: '28px',
            }} />

            {/* Wiki content */}
            <div style={{ color: '#9ab4cc' }}>
              <WikiContent
                content={content}
                allPages={allPages}
                user={user}
                currentPage={page}
              />
            </div>
          </article>
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
