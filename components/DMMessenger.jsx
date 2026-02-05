import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DMMessenger({ isOpen, onClose }) {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [recentMessages, setRecentMessages] = useState([]);
  const [players] = useState(['Aitor', 'Nico', 'Dani', 'Salva', 'JJ', 'Iker', 'Jose']); // Lista de jugadores

  useEffect(() => {
    if (isOpen) {
      loadRecentMessages();
    }
  }, [isOpen]);

  const loadRecentMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('dm_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setRecentMessages(data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const sendMessage = async () => {
    if (!recipient || !message.trim()) {
      alert('Selecciona un jugador y escribe un mensaje');
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from('dm_messages')
        .insert({
          recipient_username: recipient,
          message: message.trim(),
        });

      if (error) {
        console.error('Error sending message:', error);
        alert('Error al enviar el mensaje');
      } else {
        alert(`✅ Mensaje enviado a ${recipient}`);
        setMessage('');
        loadRecentMessages();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
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
        loadRecentMessages();
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
      
      <div className="fixed right-0 top-0 h-full w-full lg:w-[600px] bg-gradient-to-br from-purple-900 via-red-900 to-purple-900 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Header */}
        <div className="bg-black/40 backdrop-blur-lg border-b border-white/20 p-6 sticky top-0 z-[75]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-bold text-white flex items-center">
              <span className="mr-3 text-4xl">📨</span>
              Mensajes Privados DM
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-red-300 text-3xl transition-colors hover:scale-110 transform duration-200 p-2 hover:bg-red-500/20 rounded-lg"
            >
              ✕
            </button>
          </div>
          <p className="text-red-300 text-sm">
            Envía mensajes privados a tus jugadores
          </p>
        </div>

        {/* Formulario de envío */}
        <div className="p-6 border-b border-white/10">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-white font-bold mb-4 text-lg">✉️ Nuevo Mensaje</h3>
            
            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">
                Para:
              </label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Selecciona un jugador...</option>
                {players.map(player => (
                  <option key={player} value={player} className="bg-purple-900">
                    {player}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">
                Mensaje:
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje secreto para el jugador..."
                className="w-full h-32 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-red-300/50 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={sending || !recipient || !message.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              {sending ? 'Enviando...' : '📤 Enviar Mensaje'}
            </button>
          </div>
        </div>

        {/* Mensajes recientes */}
        <div className="p-6">
          <h3 className="text-white font-bold mb-4 text-lg">📜 Mensajes Recientes</h3>
          {recentMessages.length === 0 ? (
            <div className="text-red-300 text-center py-8 italic">
              No hay mensajes enviados aún
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.map(msg => (
                <div
                  key={msg.id}
                  className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-white font-bold">Para: {msg.recipient_username}</span>
                      <span className={`ml-3 text-xs ${msg.read ? 'text-green-300' : 'text-yellow-300'}`}>
                        {msg.read ? '✓ Leído' : '○ No leído'}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="text-gray-200 text-sm mb-2">{msg.message}</p>
                  <p className="text-red-300 text-xs">
                    {new Date(msg.created_at).toLocaleString('es-ES')}
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