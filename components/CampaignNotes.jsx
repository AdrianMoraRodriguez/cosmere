import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function CampaignNotes({ pageSlug, username }) {
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);

  // Cargar notas al montar el componente
  useEffect(() => {
    loadNotes();
  }, [pageSlug, username]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_notes')
        .select('content, updated_at')
        .eq('page_slug', pageSlug)
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error loading notes:', error);
        return;
      }

      if (data) {
        setNotes(data.content || '');
        setLastSaved(new Date(data.updated_at));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const saveNotes = async (content) => {
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('campaign_notes')
        .upsert({
          page_slug: pageSlug,
          username: username,
          content: content,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_slug,username'
        });

      if (error) {
        console.error('Error saving notes:', error);
        alert('Error al guardar las notas');
      } else {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al guardar las notas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotesChange = (e) => {
    const newContent = e.target.value;
    setNotes(newContent);

    // Limpiar timeout anterior
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Guardar automáticamente después de 2 segundos sin escribir
    const timeout = setTimeout(() => {
      saveNotes(newContent);
    }, 2000);

    setSaveTimeout(timeout);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000); // segundos
    
    if (diff < 60) return 'Guardado hace unos segundos';
    if (diff < 3600) return `Guardado hace ${Math.floor(diff / 60)} minutos`;
    
    return `Guardado a las ${lastSaved.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="bg-blue-900/30 backdrop-blur-lg border-l-4 border-blue-500 rounded-r-lg p-6 my-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-blue-300 font-bold">
          <span className="text-2xl mr-2">📝</span>
          <span>Mis Notas de Campaña</span>
        </div>
        <div className="flex items-center gap-3">
          {isSaving && (
            <span className="text-blue-300 text-sm">Guardando...</span>
          )}
          {!isSaving && lastSaved && (
            <span className="text-blue-300 text-sm">{formatLastSaved()}</span>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1 rounded border border-blue-500/50 transition-all text-sm"
          >
            {isEditing ? '👁️ Ver' : '✏️ Editar'}
          </button>
        </div>
      </div>
      
      {isEditing ? (
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Escribe aquí tus notas sobre la campaña... Se guardan automáticamente."
          className="w-full min-h-[200px] bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      ) : (
        <div className="text-gray-200 whitespace-pre-wrap min-h-[100px] bg-white/5 rounded-lg p-4">
          {notes || (
            <span className="text-blue-300 italic">
              No hay notas aún. Haz clic en "✏️ Editar" para empezar a escribir.
            </span>
          )}
        </div>
      )}
    </div>
  );
}