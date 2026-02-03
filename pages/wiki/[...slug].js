import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import WikiContent from '../../components/WikiContent';
import NotesPanel from '../../components/NotesPanel';
import NotesButton from '../../components/NotesButton';

export default function WikiPage() {
  const [page, setPage] = useState(null);
  const [allPages, setAllPages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
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

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/wiki');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-emerald-800 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }
  
  if (!page || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-emerald-800 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Página no encontrada</div>
      </div>
    );
  }

  const content = user.role === 'admin' ? page.content_admin : page.content_player;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-emerald-800 to-purple-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="text-emerald-300 hover:text-white transition-colors flex items-center bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg"
              >
                <span className="mr-2">←</span>
                Volver atrás
              </button>
              <Link 
                href="/wiki" 
                className="text-emerald-300 hover:text-white transition-colors flex items-center"
              >
                <span className="mr-2">🏠</span>
                Índice principal
              </Link>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{user.username}</p>
              <p className="text-emerald-300 text-sm">
                {user.role === 'admin' ? '👑 DM' : '⚔️ Jugador'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <article className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-white mb-4 text-center">{page.title}</h1>
          
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
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

          <div className="text-gray-100">
            <WikiContent 
              content={content} 
              allPages={allPages} 
              user={user}
              currentPage={page}
            />
          </div>
        </article>
      </div>

      {/* Botón flotante de notas - solo para jugadores */}
      {user.role !== 'admin' && (
        <NotesButton onClick={() => setNotesOpen(true)} />
      )}

      {/* Panel de notas */}
      <NotesPanel 
        username={user.username}
        isOpen={notesOpen}
        onClose={() => setNotesOpen(false)}
      />
    </div>
  );
}