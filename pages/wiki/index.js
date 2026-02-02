import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function WikiIndex() {
  const [pages, setPages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

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
          setPages(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading pages:', err);
          setError(err.message);
          setLoading(false);
        });
    } catch (err) {
      console.error('Error parsing user data:', err);
      router.push('/login');
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-emerald-800 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-emerald-800 to-purple-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }
  
  if (!user) return null;

  const accessiblePages = pages.filter(page => {
    if (user.role === 'admin') return true;
    if (page.visibility === 'public') return true;
    if (page.allowed_users?.includes(user.username)) return true;
    return false;
  });

  const indexPages = accessiblePages.filter(page => page.is_index);
  
  const filteredPages = searchTerm
    ? accessiblePages.filter(page =>
        page.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : accessiblePages;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-emerald-800 to-purple-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-white">📚 Wiki del Cosmere</h1>
              <p className="text-emerald-300 text-sm">Archivo de las Tormentas - Campaña RPG</p>
            </div>
            <div className="absolute right-6 flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-medium">{user.username}</p>
                <p className="text-emerald-300 text-sm">
                  {user.role === 'admin' ? '👑 Dungeon Master' : '⚔️ Jugador'}
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg border border-red-500/50 transition-all duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="🔍 Buscar páginas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg px-6 py-3 text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Index Pages */}
        {!searchTerm && indexPages.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center">
              <span className="mr-2">📑</span>
              Páginas Índice
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {indexPages.map(page => (
                <Link
                  key={page.slug}
                  href={`/wiki/${page.slug}`}
                  className="group relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg p-6 hover:bg-white/20 transition-all duration-200 hover:scale-105"
                >
                  <h3 className="font-bold text-white text-lg mb-2 group-hover:text-emerald-300 transition-colors text-center">
                    {page.title}
                  </h3>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {page.spoilers && (
                      <span className="inline-block bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded border border-yellow-500/50">
                        ⚠️ Spoilers
                      </span>
                    )}
                    {page.visibility === 'private' && (
                      <span className="inline-block bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded border border-red-500/50">
                        🔒 Privado
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Pages */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center">
            <span className="mr-2">📖</span>
            {searchTerm ? 'Resultados de búsqueda' : 'Todas las Páginas'}
            <span className="ml-2 text-emerald-300 text-lg">({filteredPages.length})</span>
          </h2>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg overflow-hidden">
            {filteredPages.map((page, index) => (
              <Link
                key={page.slug}
                href={`/wiki/${page.slug}`}
                className={`block px-6 py-4 hover:bg-white/10 transition-all duration-200 ${
                  index !== filteredPages.length - 1 ? 'border-b border-white/10' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <h3 className="text-white font-medium">{page.title}</h3>
                    <p className="text-emerald-300 text-sm mt-1">{page.slug}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {page.is_index && (
                      <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded border border-blue-500/50">
                        📑 Índice
                      </span>
                    )}
                    {page.spoilers && (
                      <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded border border-yellow-500/50">
                        ⚠️ Spoilers
                      </span>
                    )}
                    {page.visibility === 'private' && (
                      <span className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded border border-red-500/50">
                        🔒 Privado
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}