import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';
import CampaignNotes from './CampaignNotes';

export default function WikiContent({ content, allPages, user, currentPage }) {
  if (!content) {
    return <div className="p-4 text-gray-300">No hay contenido disponible</div>;
  }

  if (!allPages || !Array.isArray(allPages)) {
    return <div className="p-4 text-gray-300">Error cargando páginas</div>;
  }

  const isIndexOrSubindex = currentPage?.is_index || currentPage?.is_subindex;

  // PRIMERO: Convertir imágenes markdown a HTML con saltos de línea
  let processedContent = content.replace(
    /!\[(.*?)\]\(\/([^)]+)\)/g,
    (match, alt, imagePath) => {
      const fullPath = `/content/public/${imagePath}`;
      return `\n\n<img src="${fullPath}" alt="${alt}" class="max-w-full h-auto rounded-lg shadow-xl my-6 border border-white/20" />\n\n`;
    }
  );

  // SEGUNDO: Procesar enlaces internos [[Nota]] o [[Nota|Alias]]
  processedContent = processedContent.replace(
    /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g,
    (match, target, anchor, alias) => {
      const text = alias || target;
      
      let targetPage = allPages.find(p => {
        if (p.title.toLowerCase() === target.toLowerCase()) return true;
        if (p.slug.toLowerCase() === target.toLowerCase()) return true;
        
        const slugParts = p.slug.split('/');
        const lastSlugPart = slugParts[slugParts.length - 1];
        if (lastSlugPart.toLowerCase() === target.toLowerCase()) return true;
        
        return false;
      });

      if (!targetPage) {
        targetPage = allPages.find(p => {
          const slugLower = p.slug.toLowerCase();
          const targetLower = target.toLowerCase();
          const regex = new RegExp(`(^|/)${targetLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/|$)`, 'i');
          return regex.test(slugLower);
        });
      }

      if (!targetPage) {
        console.warn('Page not found for:', target);
        return '';
      }

      const canAccess = user?.role === 'admin' ||
                       targetPage.visibility === 'public' ||
                       targetPage.allowed_users?.includes(user?.username);

      if (!canAccess) {
        return '';
      }

      const encodedSlug = targetPage.slug
        .split('/')
        .map(part => encodeURIComponent(part))
        .join('/');
      
      const anchorPart = anchor ? `#${encodeURIComponent(anchor)}` : '';
      
      if (isIndexOrSubindex || targetPage.is_index || targetPage.is_subindex) {
        return `<index-link href="/wiki/${encodedSlug}${anchorPart}" spoilers="${targetPage.spoilers || false}" private="${targetPage.visibility === 'private'}">${text}</index-link>`;
      }
      
      return `[${text}](/wiki/${encodedSlug}${anchorPart})`;
    }
  );

  // TERCERO: Detectar si hay sección "Sucesos en la Campaña" y agregar marcador
  const hasCampaignSection = /##\s*Sucesos\s+en\s+la\s+Campaña/i.test(processedContent);
  
  if (hasCampaignSection) {
    // Agregar marcador después del título de la sección
    processedContent = processedContent.replace(
      /(##\s*Sucesos\s+en\s+la\s+Campaña)/i,
      '$1\n\n<campaign-notes-marker></campaign-notes-marker>\n\n'
    );
  }

  // CUARTO: Asegurar que dm-section esté en su propia línea
  processedContent = processedContent.replace(
    /<dm-section>/g,
    '\n\n<dm-section>\n\n'
  ).replace(
    /<\/dm-section>/g,
    '\n\n</dm-section>\n\n'
  );

  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <style jsx global>{`
        .prose-invert {
          color: #e5e7eb;
        }
        .prose-invert h1 {
          color: #ffffff;
          font-weight: bold;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .prose-invert h2 {
          color: #10b981;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          border-bottom: 2px solid rgba(16, 185, 129, 0.3);
          padding-bottom: 0.5rem;
        }
        .prose-invert h3 {
          color: #34d399;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .prose-invert p {
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          line-height: 1.7;
        }
        .prose-invert strong {
          color: #fbbf24;
          font-weight: 600;
        }
        .prose-invert ul, .prose-invert ol {
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .prose-invert li {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .prose-invert code {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          color: #fbbf24;
        }
        .prose-invert blockquote {
          border-left: 4px solid #10b981;
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: #6ee7b7;
        }
      `}</style>
      
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          'campaign-notes-marker': () => {
            // Solo mostrar el editor si el usuario tiene permiso de ver la página
            // (lo cual ya se verificó antes de llegar aquí)
            return (
              <CampaignNotes 
                pageSlug={currentPage?.slug} 
                username={user?.username} 
              />
            );
          },
          'dm-section': ({ children }) => {
            if (user?.role !== 'admin') return null;
            return (
              <div className="bg-red-900/30 backdrop-blur-lg border-l-4 border-red-500 rounded-r-lg p-6 my-6">
                <div className="flex items-center text-red-300 font-bold mb-3">
                  <span className="text-2xl mr-2">🔒</span>
                  <span>Información DM</span>
                </div>
                <div className="dm-content text-gray-200">{children}</div>
              </div>
            );
          },
          'index-link': ({ href, children, spoilers, private: isPrivate }) => {
            return (
              <div className="flex justify-center my-2">
                <Link
                  href={href}
                  className="inline-block bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg px-6 py-3 hover:bg-white/20 transition-all duration-200 hover:scale-105 min-w-[200px] text-center"
                >
                  <span className="font-semibold text-white block">{children}</span>
                  <div className="flex justify-center gap-2 mt-2">
                    {spoilers === 'true' && (
                      <span className="inline-block bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded border border-yellow-500/50">
                        ⚠️ Spoilers
                      </span>
                    )}
                    {isPrivate === 'true' && (
                      <span className="inline-block bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded border border-red-500/50">
                        🔒 Privado
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          },
          a: ({ href, children }) => {
            if (href?.startsWith('/wiki/')) {
              return (
                <Link 
                  href={href} 
                  className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/50 hover:decoration-emerald-300 transition-colors"
                >
                  {children}
                </Link>
              );
            }
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 underline decoration-blue-500/50 hover:decoration-blue-300 transition-colors"
              >
                {children}
              </a>
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}