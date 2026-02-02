import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';

export default function WikiContent({ content, allPages, user }) {
  if (!content) {
    return <div className="p-4 text-gray-300">No hay contenido disponible</div>;
  }

  if (!allPages || !Array.isArray(allPages)) {
    return <div className="p-4 text-gray-300">Error cargando páginas</div>;
  }

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
      
      const targetPage = allPages.find(p => {
        if (p.title.toLowerCase() === target.toLowerCase()) return true;
        if (p.slug.toLowerCase() === target.toLowerCase()) return true;
        
        const slugParts = p.slug.split('/');
        const lastSlugPart = slugParts[slugParts.length - 1];
        if (lastSlugPart.toLowerCase() === target.toLowerCase()) return true;
        
        if (p.slug.toLowerCase().includes(target.toLowerCase())) return true;
        
        return false;
      });

      if (!targetPage) {
        return text;
      }

      const canAccess = user?.role === 'admin' ||
                       targetPage.visibility === 'public' ||
                       targetPage.allowed_users?.includes(user?.username);

      if (!canAccess) {
        return text;
      }

      const encodedSlug = targetPage.slug
        .split('/')
        .map(part => encodeURIComponent(part))
        .join('/');
      
      const anchorPart = anchor ? `#${encodeURIComponent(anchor)}` : '';
      
      return `[${text}](/wiki/${encodedSlug}${anchorPart})`;
    }
  );

  // TERCERO: Asegurar que dm-section esté en su propia línea
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
          color: #c084fc;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          border-bottom: 2px solid rgba(192, 132, 252, 0.3);
          padding-bottom: 0.5rem;
        }
        .prose-invert h3 {
          color: #a78bfa;
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
          border-left: 4px solid #c084fc;
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          color: #d8b4fe;
        }
      `}</style>
      
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
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
          a: ({ href, children }) => {
            if (href?.startsWith('/wiki/')) {
              return (
                <Link 
                  href={href} 
                  className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/50 hover:decoration-purple-300 transition-colors"
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