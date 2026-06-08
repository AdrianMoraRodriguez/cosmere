import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import WikiContent from '../../components/WikiContent';
import WikiLayout, { encodeWikiSlug } from '../../components/WikiLayout';
import NotesPanel from '../../components/NotesPanel';
import NotesButton from '../../components/NotesButton';
import DMMessenger from '../../components/DMMessenger';
import PlayerMessenger from '../../components/PlayerMessenger';
import MessageButton from '../../components/MessageButton';
import { getHubConfig, getVirtualSubpage } from '../../lib/characterHubs';
import { supabase } from '../../lib/supabase';

// ─── Hub card (shown on hub pages instead of content) ─────────────────────────

function HubCard({ href, icon, label, description, available }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: '#0a1628',
          border: '1px solid #122030',
          borderRadius: '12px',
          padding: '32px 24px',
          textAlign: 'center',
          cursor: available ? 'pointer' : 'default',
          transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
          opacity: available ? 1 : 0.45,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}
        onMouseEnter={e => {
          if (!available) return;
          e.currentTarget.style.borderColor = '#2563eb';
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.15)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#122030';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ fontSize: '44px', lineHeight: 1 }}>{icon}</div>
        <div style={{ color: '#c8daf0', fontWeight: '700', fontSize: '17px' }}>{label}</div>
        <div style={{ color: '#3a5878', fontSize: '13px', lineHeight: 1.5 }}>{description}</div>
        {!available && (
          <div style={{
            marginTop: '6px',
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: '6px',
            padding: '4px 12px',
            color: '#2e5272',
            fontSize: '11px',
            fontStyle: 'italic',
          }}>
            Próximamente
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Stories grid for Short Stories sub-page ─────────────────────────────────

function StoriesGrid({ stories, baseHref }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: '10px',
    }}>
      {stories.map(story => (
        <Link
          key={story.key}
          href={`${baseHref}/${encodeURIComponent(story.key)}`}
          style={{ textDecoration: 'none' }}
        >
          <div
            style={{
              background: '#0a1628',
              border: '1px solid #122030',
              borderRadius: '8px',
              padding: '14px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
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
            <div style={{ color: '#3a5878', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '4px' }}>
              #{story.key}
            </div>
            <div style={{ color: '#b8ccdf', fontWeight: '600', fontSize: '13px', lineHeight: 1.3 }}>
              {story.label}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Placeholder for sub-pages without content yet ───────────────────────────

function PlaceholderContent({ subpage }) {
  return (
    <div style={{
      background: '#0a1628',
      border: '1px solid #122030',
      borderRadius: '12px',
      padding: '64px 32px',
      textAlign: 'center',
      marginTop: '8px',
    }}>
      <div style={{ fontSize: '56px', lineHeight: 1, marginBottom: '20px' }}>{subpage.icon}</div>
      <div style={{ color: '#4d6a80', fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>
        {subpage.label}
      </div>
      <div style={{ color: '#2e4060', fontSize: '14px', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
        {subpage.description}
      </div>
      <div style={{
        display: 'inline-block',
        marginTop: '28px',
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '8px',
        padding: '8px 20px',
        color: '#2e5272',
        fontSize: '13px',
        fontStyle: 'italic',
      }}>
        Contenido próximamente disponible
      </div>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function WikiPage() {
  const [page, setPage] = useState(null);
  const [allPages, setAllPages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [virtualSubpage, setVirtualSubpage] = useState(null);
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

          if (!currentPage) {
            // Check if this is a virtual sub-page (e.g. Yara Elorin/Diario)
            const vsp = getVirtualSubpage(fullSlug);
            if (vsp) {
              const parentPage = data.find(p => p.slug === vsp.hubSlug);
              if (parentPage) {
                const canAccess =
                  parsedUser.role === 'admin' ||
                  parentPage.visibility === 'public' ||
                  parentPage.allowed_users?.includes(parsedUser.username);
                if (canAccess) {
                  setPage(parentPage);
                  setVirtualSubpage(vsp);
                  setLoading(false);
                  return;
                }
              }
            }
            router.push('/wiki');
            return;
          }

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
          setVirtualSubpage(null);
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
        .from('dm_messages').select('id')
        .eq('recipient_username', username).eq('read', false);
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

  const indexPages = allPages.filter(p => {
    if (!p.is_index) return false;
    if (user.role === 'admin') return true;
    if (p.visibility === 'public') return true;
    if (p.allowed_users?.includes(user.username)) return true;
    return false;
  });

  const content = user.role === 'admin' ? page.content_admin : page.content_player;

  // Hub detection: only applies when NOT viewing a virtual sub-page
  const hubConfig = !virtualSubpage ? getHubConfig(page.slug) : null;
  const isHubPage = !!hubConfig;

  // Extract portrait image for hub pages (same regex as WikiContent)
  const hubImageUrl = isHubPage ? (() => {
    const match = content?.match(/!\[.*?\]\(\/([^)]+)\)/);
    return match ? `/content/public/${match[1]}` : null;
  })() : null;
  const isPhotoGridPage = !virtualSubpage && !isHubPage && (page.is_index || page.is_subindex);

  // For virtual sub-pages the "displayed page title" is the sub-page name
  const displayTitle = virtualSubpage ? virtualSubpage.subpage.label : page.title;
  const displayPage = virtualSubpage ? { ...page, title: displayTitle, spoilers: false, visibility: 'public', is_index: false } : page;

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
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.back()}
              style={{ background: 'none', border: 'none', color: '#3a5878', fontSize: '13px', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            {virtualSubpage && (
              <>
                <span style={{ color: '#1a2d40', fontSize: '13px' }}>/</span>
                <Link
                  href={`/wiki/${encodeWikiSlug(virtualSubpage.hubSlug)}`}
                  style={{ color: '#3a5878', fontSize: '13px', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#60a5fa'}
                  onMouseLeave={e => e.target.style.color = '#3a5878'}
                >
                  {page.title}
                </Link>
              </>
            )}
            <span style={{ color: '#1a2d40', fontSize: '13px' }}>/</span>
            <span style={{ color: '#2e4a65', fontSize: '13px' }}>{displayTitle}</span>
          </div>

          {/* Article */}
          <article>
            {/* Title */}
            <h1 style={{ color: '#c8daf0', fontSize: '26px', fontWeight: '700', margin: '0 0 14px', lineHeight: '1.25', textAlign: 'left' }}>
              {displayTitle}
            </h1>

            {/* Badges */}
            {!virtualSubpage && (displayPage.spoilers || displayPage.visibility === 'private' || displayPage.is_index) && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {displayPage.spoilers && (
                  <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', padding: '3px 10px' }}>
                    Contiene spoilers
                  </span>
                )}
                {displayPage.visibility === 'private' && (
                  <span style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', padding: '3px 10px' }}>
                    Contenido privado
                  </span>
                )}
                {displayPage.is_index && (
                  <span style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', padding: '3px 10px' }}>
                    Página índice
                  </span>
                )}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, #122030 0%, transparent 100%)', marginBottom: '28px' }} />

            {/* Content: hub cards / virtual subpage / normal */}
            {isHubPage ? (
              <div>
                {/* Portrait photo */}
                {hubImageUrl && (
                  <div style={{ marginBottom: '28px' }}>
                    <img
                      src={hubImageUrl}
                      alt={page.title}
                      style={{
                        width: '280px',
                        height: '280px',
                        objectFit: 'cover',
                        objectPosition: 'top center',
                        borderRadius: '10px',
                        border: '1px solid #122030',
                        display: 'block',
                      }}
                    />
                  </div>
                )}
                {/* Sub-page cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {hubConfig.subpages.map(sub => (
                    <HubCard
                      key={sub.key}
                      href={`/wiki/${encodeWikiSlug(`${page.slug}/${sub.key}`)}`}
                      icon={sub.icon}
                      label={sub.label}
                      description={sub.description}
                      available={sub.contentSource === 'parent' || sub.contentSource !== 'placeholder'}
                    />
                  ))}
                </div>
              </div>
            ) : virtualSubpage ? (
              virtualSubpage.subpage.contentSource === 'parent' ? (
                <div style={{ color: '#9ab4cc' }}>
                  <WikiContent content={content} allPages={allPages} user={user} currentPage={page} />
                </div>
              ) : virtualSubpage.subpage.contentSource === 'stories' ? (
                <StoriesGrid
                  stories={virtualSubpage.subpage.stories}
                  baseHref={`/wiki/${encodeWikiSlug(`${virtualSubpage.hubSlug}/${virtualSubpage.subpage.key}`)}`}
                />
              ) : (
                <PlaceholderContent subpage={virtualSubpage.subpage} />
              )
            ) : (
              <div style={{ color: '#9ab4cc' }}>
                <WikiContent content={content} allPages={allPages} user={user} currentPage={page} />
              </div>
            )}
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
            onClose={() => { setMessagesOpen(false); loadUnreadCount(user.username); }}
          />
        </>
      )}
    </>
  );
}
