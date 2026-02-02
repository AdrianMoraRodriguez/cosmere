import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import WikiContent from '../../components/WikiContent';

export default function WikiPage() {
  const [page, setPage] = useState(null);
  const [allPages, setAllPages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

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
            router.push('/wiki');
            return;
          }

          const canAccess = parsedUser.role === 'admin' ||
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
        .catch(err => {
          console.error('Error loading page:', err);
          setLoading(false);
        });
    } catch (err) {
      console.error('Error parsing user data:', err);
      router.push('/login');
    }
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }
  
  if (!page || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Página no encontrada</div>
      </div>
    );
  }

  const content = user.role === 'admin' ? page.content_admin : page.content_player;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link 
              href="/wiki" 
              className="text-purple-300 hover:text-white transition-colors flex items-center"
            >
              <span className="mr-2">←</span>
              Volver al índice
            </Link>
            <div className="text-right">
              <p className="text-white font-medium">{user.username}</p>
              <p className="text-purple-300 text-sm">
                {user.role === 'admin' ? '👑 DM' : '⚔️ Jugador'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <article className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-8 shadow-2xl">
          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-4">{page.title}</h1>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {page.spoilers && (
              <span className="bg-yellow-500/20 text-yellow-300 text-sm px-3 py-1 rounded-lg border border-yellow-500/50">
                ⚠️ Esta página contiene spoilers
              </span>
            )}
            {page.visibility === 'private' && (
              <span className="bg-red-500/20 text-red-300 text-sm px-3 py-1 rounded-lg border border-red-500/50">
                🔒 Contenido privado
              </span>
            )}
            {page.is_index && (
              <span className="bg-blue-500/20 text-blue-300 text-sm px-3 py-1 rounded-lg border border-blue-500/50">
                📑 Página índice
              </span>
            )}
          </div>

          {/* Content */}
          <div className="text-gray-100">
            <WikiContent 
              content={content} 
              allPages={allPages} 
              user={user} 
            />
          </div>
        </article>
      </div>
    </div>
  );
}