import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PlayerMessages({ username, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen && username) {
      loadMessages();
    }
  }, [isOpen, username]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('dm_messages')
        .select('*')
        .eq('recipient_username', username)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
      setUnreadCount(data?.filter(m => !m.read).length || 0);

      // Marcar como leídos
      const unreadIds = data?.filter(m => !m.read).map(m => m.id) || [];
      if (unreadIds.length > 0) {
        await supabase
          .from('dm_messages')
          .update({ read: true })
          .in('id', unreadIds);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const deleteMessage = async (id) => {
    if (!confirm('¿Eliminar este mensaje?')) return;

    try {
      const { error } = await supabase
        .from('dm_messages')
        .delete()
        .eq('id', id);

      if (!error) {
        loadMessages();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed right-0 top-0 h-full w-full lg:w-[600px] bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Header */}
        <div className="bg-black/40 backdrop-blur-lg border-b border-white/20 p-4 sm:p-6 sticky top-0 z-[75]">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
              <span className="mr-2 text-2xl sm:text-3xl">📬</span>
              Mensajes del DM
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-red-300 text-2xl transition-colors hover:scale-110 transform duration-200 p-1.5 hover:bg-red-500/20 rounded-lg"
            >
              ✕
            </button>
          </div>
          <p className="text-blue-300 text-xs sm:text-sm">
            Mensajes privados solo para ti
          </p>
        </div>

        {/* Mensajes */}
        <div className="p-3 sm:p-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-white text-base font-semibold">No tienes mensajes</p>
              <p className="text-blue-300 text-sm mt-1">El DM te enviará mensajes secretos aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">👑</span>
                      <span className="text-white font-bold text-sm sm:text-base">Dungeon Master</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!msg.read && (
                        <span className="bg-yellow-500 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold">
                          NUEVO
                        </span>
                      )}
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-lg p-3 mb-2">
                    <p className="text-white text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>
                  </div>

                  <p className="text-blue-300 text-xs">
                    📅 {new Date(msg.created_at).toLocaleString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}