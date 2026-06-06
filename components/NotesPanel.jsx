import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function NotesPanel({ username, isOpen, onClose }) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && username) {
      loadNotes();
    }
  }, [isOpen, username]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaign_notes')
        .select('content, updated_at')
        .eq('page_slug', 'general_notes')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading notes:', error);
        return;
      }

      if (data) {
        setNotes(data.content || '');
        setLastSaved(new Date(data.updated_at));
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotes = async (content) => {
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('campaign_notes')
        .upsert({
          page_slug: 'general_notes',
          username: username,
          content: content,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_slug,username'
        });

      if (error) {
        console.error('Error saving notes:', error);
      } else {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotesChange = (e) => {
    const newContent = e.target.value;
    setNotes(newContent);

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      saveNotes(newContent);
    }, 2000);

    setSaveTimeout(timeout);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000);
    
    if (diff < 60) return 'Guardado hace unos segundos';
    if (diff < 3600) return `Guardado hace ${Math.floor(diff / 60)} minutos`;
    
    return `Guardado a las ${lastSaved.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed right-0 top-0 h-full w-full lg:w-[85vw] xl:w-[75vw] bg-gradient-to-br from-blue-900 via-emerald-800 to-purple-900 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Header del panel */}
        <div className="bg-black/40 backdrop-blur-lg border-b border-white/20 p-8 sticky top-0 z-[75]">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-4xl font-bold text-white flex items-center">
              <span className="mr-3 text-5xl">📝</span>
              Mis Notas de Campaña
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-red-300 text-4xl transition-colors hover:scale-110 transform duration-200 p-2 hover:bg-red-500/20 rounded-lg relative z-[80]"
              style={{ marginRight: '-200px' }}
              aria-label="Cerrar panel de notas"
            >
              ✕
            </button>
          </div>
          <p className="text-emerald-300 text-lg">
            Tus notas personales - visibles solo para ti
          </p>
          {lastSaved && (
            <p className="text-blue-300 text-sm mt-3 font-semibold">
              {isSaving ? '💾 Guardando...' : `✅ ${formatLastSaved()}`}
            </p>
          )}
          {isLoading && (
            <p className="text-yellow-300 text-sm mt-2">⏳ Cargando notas...</p>
          )}
        </div>

        {/* Contenido del panel */}
        <div className="p-8">
          <textarea
            value={notes}
            onChange={handleNotesChange}
            disabled={isLoading}
            placeholder="✍️ Escribe aquí tus notas generales de la campaña...

💡 Algunas ideas de qué escribir:

- 📌 Recordatorios de cosas importantes
- 🔍 Teorías sobre la trama
- ❓ Preguntas para el DM
- 🎯 Objetivos del personaje
- 👥 Relaciones con otros personajes
- 📜 Eventos importantes de la sesión
- 💭 Pensamientos y reflexiones
- 🗺️ Lugares visitados
- ⚔️ Combates memorables

✨ Se guarda automáticamente cada 2 segundos."
            className="w-full h-[calc(100vh-280px)] bg-white/10 backdrop-blur-lg border-2 border-white/30 rounded-xl p-6 text-white text-lg placeholder-emerald-300/60 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 focus:border-emerald-400 resize-none transition-all duration-200 disabled:opacity-50"
            style={{ minHeight: '500px', fontSize: '16px', lineHeight: '1.6' }}
          />
        </div>

        {/* Tips en el footer */}
        <div className="p-8 pt-0">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <p className="font-bold mb-3 text-white text-lg flex items-center">
              <span className="mr-2">💡</span>
              Consejos útiles:
            </p>
            <ul className="space-y-2 text-emerald-200">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Usa <code className="bg-white/20 px-2 py-1 rounded text-sm">**negrita**</code> o <code className="bg-white/20 px-2 py-1 rounded text-sm">*cursiva*</code> para dar formato</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Puedes acceder a tus notas desde cualquier página de la wiki</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Solo tú puedes ver y editar estas notas - son completamente privadas</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Se guardan automáticamente en la nube - no perderás tu trabajo</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Perfecto para tomar notas durante la sesión en vivo</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}