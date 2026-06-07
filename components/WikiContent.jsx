import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';

// Extract the first image URL from a page's markdown content
function extractFirstImage(page, userRole) {
  const content = userRole === 'admin' ? page?.content_admin : page?.content_player;
  if (!content) return null;
  const match = content.match(/!\[.*?\]\(\/([^)]+)\)/);
  return match ? `/content/public/${match[1]}` : null;
}

// Decode a wiki href like "/wiki/A/B%20C" → slug "A/B C"
function hrefToSlug(href) {
  if (!href) return '';
  return href
    .replace(/^\/wiki\//, '')
    .split('/')
    .map(s => { try { return decodeURIComponent(s); } catch { return s; } })
    .join('/');
}

// Photo card shared between photo-grid pages
function PhotoCard({ href, children, imageUrl, spoilers, isPrivate }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: '#0a1628',
          border: '1px solid #122030',
          borderRadius: '10px',
          overflow: 'hidden',
          transition: 'border-color 0.2s, transform 0.2s',
          cursor: 'pointer',
          height: '100%',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#2563eb';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#122030';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={String(children)}
            style={{
              width: '100%',
              height: '190px',
              objectFit: 'cover',
              objectPosition: 'top center',
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '190px',
            background: 'linear-gradient(135deg, #0d1e33 0%, #0a1628 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#1e3a5f" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{ color: '#b8ccdf', fontWeight: '600', fontSize: '13px', lineHeight: '1.3' }}>
            {children}
          </div>
          {(spoilers || isPrivate) && (
            <div style={{ display: 'flex', gap: '5px', marginTop: '7px', flexWrap: 'wrap' }}>
              {spoilers && (
                <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '4px', fontSize: '10px', fontWeight: '600', padding: '1px 6px' }}>
                  Spoilers
                </span>
              )}
              {isPrivate && (
                <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '4px', fontSize: '10px', fontWeight: '600', padding: '1px 6px' }}>
                  Privado
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function WikiContent({ content, allPages, user, currentPage }) {
  if (!content) {
    return <div style={{ padding: '16px', color: '#5a7898' }}>No hay contenido disponible</div>;
  }
  if (!allPages || !Array.isArray(allPages)) {
    return <div style={{ padding: '16px', color: '#5a7898' }}>Error cargando páginas</div>;
  }

  const isIndexOrSubindex = currentPage?.is_index || currentPage?.is_subindex;

  // ── Step 1: images ──────────────────────────────────────────────────────────
  let processedContent = content.replace(
    /!\[(.*?)\]\(\/([^)]+)\)/g,
    (_match, alt, imagePath) => {
      const fullPath = `/content/public/${imagePath}`;
      return `\n\n<img src="${fullPath}" alt="${alt}" style="max-width:100%;height:auto;border-radius:8px;margin:24px 0;border:1px solid #122030;" />\n\n`;
    }
  );

  // ── Step 2: internal [[links]] ──────────────────────────────────────────────
  // Also collect slugs of resolved index-link targets to detect photo-grid later
  const resolvedIndexTargets = [];

  processedContent = processedContent.replace(
    /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g,
    (match, target, anchor, alias) => {
      const text = alias || target;

      let targetPage = allPages.find(p => {
        if (p.title.toLowerCase() === target.toLowerCase()) return true;
        if (p.slug.toLowerCase() === target.toLowerCase()) return true;
        const lastPart = p.slug.split('/').at(-1);
        return lastPart?.toLowerCase() === target.toLowerCase();
      });

      if (!targetPage) {
        targetPage = allPages.find(p => {
          const re = new RegExp(
            `(^|/)${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/|$)`, 'i'
          );
          return re.test(p.slug);
        });
      }

      if (!targetPage) return '';

      const canAccess =
        user?.role === 'admin' ||
        targetPage.visibility === 'public' ||
        targetPage.allowed_users?.includes(user?.username);

      if (!canAccess) return '';

      const encodedSlug = targetPage.slug.split('/').map(encodeURIComponent).join('/');
      const anchorPart = anchor ? `#${encodeURIComponent(anchor)}` : '';

      if (isIndexOrSubindex || targetPage.is_index || targetPage.is_subindex) {
        resolvedIndexTargets.push(targetPage);
        return `<index-link href="/wiki/${encodedSlug}${anchorPart}" spoilers="${targetPage.spoilers || false}" private="${targetPage.visibility === 'private'}">${text}</index-link>`;
      }

      return `[${text}](/wiki/${encodedSlug}${anchorPart})`;
    }
  );

  // ── Step 3: dm-section block spacing ───────────────────────────────────────
  processedContent = processedContent
    .replace(/<dm-section>/g, '\n\n<dm-section>\n\n')
    .replace(/<\/dm-section>/g, '\n\n</dm-section>\n\n');

  // ── Step 4: auto-detect photo-grid ─────────────────────────────────────────
  // Use photo-grid if this is an index/subindex page AND at least one linked
  // subpage has an image in its content (i.e. it's a character/entity page).
  const isPhotoGridPage = isIndexOrSubindex &&
    resolvedIndexTargets.some(p => extractFirstImage(p, user?.role) !== null);

  if (isPhotoGridPage) {
    const SLOT = '\n%%PHOTO_GRID%%\n';
    const collected = [];
    let slotPlaced = false;

    // Replace each index-link: first becomes a slot marker, rest are removed
    processedContent = processedContent.replace(
      /<index-link\b[^>]*>[^<]*<\/index-link>/g,
      match => {
        collected.push(match);
        if (!slotPlaced) { slotPlaced = true; return SLOT; }
        return '';
      }
    );

    // Swap marker for a single unified grid (auto-fill fills the available width)
    if (collected.length > 0) {
      const gridStyle = [
        'display:grid',
        'grid-template-columns:repeat(auto-fill,minmax(155px,1fr))',
        'gap:14px',
        'margin:24px 0',
      ].join(';');
      const grid = `<div style="${gridStyle}">\n${collected.join('\n')}\n</div>`;
      processedContent = processedContent.replace(SLOT, grid);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{

          // DM-only section
          'dm-section': ({ children }) => {
            if (user?.role !== 'admin') return null;
            return (
              <div style={{
                background: 'rgba(127,29,29,0.15)',
                borderLeft: '3px solid #991b1b',
                borderRadius: '0 8px 8px 0',
                padding: '16px 20px',
                margin: '20px 0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', color: '#fca5a5', fontWeight: '600', fontSize: '13px', marginBottom: '10px', gap: '8px' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Información DM
                </div>
                <div style={{ color: '#9ab4cc' }}>{children}</div>
              </div>
            );
          },

          // Index / character link
          'index-link': ({ href, children, spoilers, private: isPrivate }) => {

            // ── Photo card (when grid is active) ───────────────────────────
            if (isPhotoGridPage) {
              const slug = hrefToSlug(href);
              const linkedPage = allPages.find(p => p.slug === slug);
              const imageUrl = extractFirstImage(linkedPage, user?.role);
              return (
                <PhotoCard
                  href={href}
                  imageUrl={imageUrl}
                  spoilers={spoilers === 'true'}
                  isPrivate={isPrivate === 'true'}
                >
                  {children}
                </PhotoCard>
              );
            }

            // ── Regular index link ──────────────────────────────────────────
            return (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                <Link href={href} style={{
                  display: 'inline-block',
                  background: '#0a1628',
                  border: '1px solid #122030',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  minWidth: '180px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1e4080'; e.currentTarget.style.background = '#0c1e38'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#122030'; e.currentTarget.style.background = '#0a1628'; }}
                >
                  <span style={{ color: '#b8ccdf', fontWeight: '600', fontSize: '14px', display: 'block' }}>{children}</span>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                    {spoilers === 'true' && (
                      <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '4px', fontSize: '10px', fontWeight: '600', padding: '1px 6px' }}>
                        Spoilers
                      </span>
                    )}
                    {isPrivate === 'true' && (
                      <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '4px', fontSize: '10px', fontWeight: '600', padding: '1px 6px' }}>
                        Privado
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          },

          // Normal links
          a: ({ href, children }) => {
            if (href?.startsWith('/wiki/')) {
              return (
                <Link href={href} style={{ color: '#4d8fd6', textDecoration: 'underline', textDecorationColor: 'rgba(77,143,214,0.4)' }}>
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', textDecorationColor: 'rgba(96,165,250,0.4)' }}>
                {children}
              </a>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
