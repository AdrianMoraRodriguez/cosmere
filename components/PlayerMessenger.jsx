import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PlayerMessenger({ username, isOpen, onClose }) {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen && username) {
      loadUsers();
      loadConversations();
    }
  }, [isOpen, username]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/content/pages.json');
      const pages = await response.json();
      
      const allUsers = new Set(['DM']);
      pages.forEach(page => {
        if (page.allowed_users && Array.isArray(page.allowed_users)) {
          page.allowed_users.forEach(user => {
            if (user !== username) {
              allUsers.add(user);
            }
          });
        }
      });
      
      setUsers(Array.from(allUsers).sort());
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers(['DM']);
    }
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('dm_messages')
        .select('*')
        .or(`sender_username.eq.${username},recipient_username.eq.${username}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      const convMap = new Map();
      data?.forEach(msg => {
        const other = msg.sender_username === username ? msg.recipient_username : msg.sender_username;
        if (!convMap.has(other) || new Date(msg.created_at) > new Date(convMap.get(other).created_at)) {
          convMap.set(other, {
            user: other,
            lastMessage: msg.message,
            lastTime: msg.created_at,
            unread: msg.recipient_username === username && !msg.read
          });
        }
      });

      setConversations(Array.from(convMap.values()));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadMessages = async (otherUser) => {
    try {
      const { data, error } = await supabase
        .from('dm_messages')
        .select('*')
        .or(`and(sender_username.eq.${username},recipient_username.eq.${otherUser}),and(sender_username.eq.${otherUser},recipient_username.eq.${username})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);

      const unreadIds = data?.filter(m => m.recipient_username === username && !m.read).map(m => m.id) || [];
      if (unreadIds.length > 0) {
        await supabase
          .from('dm_messages')
          .update({ read: true })
          .in('id', unreadIds);
        
        loadConversations();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const sendMessage = async () => {
  const targetUser = selectedConversation || recipient;
  
  if (!targetUser || !message.trim()) {
    alert('Selecciona un usuario y escribe un mensaje');
    return;
  }

  setSending(true);

  try {
    const { error } = await supabase
      .from('dm_messages')
      .insert({
        sender_username: username,
        recipient_username: targetUser,
        message: message.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje');
    } else {
      // NOTIFICAR POR TELEGRAM AL DESTINATARIO
      try {
        await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderUsername: username,
            recipientUsername: targetUser,
            message: message.trim()
          })
        });
      } catch (err) {
        console.error('Error notifying Telegram:', err);
      }

      setMessage('');
      if (selectedConversation) {
        loadMessages(selectedConversation);
      }
      loadConversations();
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Error al enviar el mensaje');
  } finally {
    setSending(false);
  }
};

  const handleBack = () => {
    setSelectedConversation(null);
    setRecipient('');
    setMessage('');
    loadConversations();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed right-0 top-0 h-full w-full lg:w-[900px] bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out overflow-hidden flex">
        {/* Lista de conversaciones */}
        <div className="w-1/3 border-r border-white/20 flex flex-col">
          <div className="bg-black/40 backdrop-blur-lg border-b border-white/20 p-4">
            <h3 className="text-white font-bold text-lg">💬 Mensajes</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                No hay conversaciones
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.user}
                  onClick={() => setSelectedConversation(conv.user)}
                  className={`w-full p-4 border-b border-white/10 text-left hover:bg-white/10 transition-all ${
                    selectedConversation === conv.user ? 'bg-white/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-semibold">
                      {conv.user === 'DM' ? '👑 ' : '⚔️ '}
                      {conv.user}
                    </span>
                    {conv.unread && (
                      <span className="bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                        NUEVO
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm truncate">{conv.lastMessage}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(conv.lastTime).toLocaleString('es-ES', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Área de conversación */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
<div className="bg-black/40 backdrop-blur-lg border-b border-white/20 p-4 flex justify-between items-center relative">
  <div className="flex items-center gap-3">
    {selectedConversation && (
      <button
        onClick={handleBack}
        className="text-white hover:text-emerald-300 transition-colors"
        title="Volver a conversaciones"
      >
        ← 
      </button>
    )}
    {selectedConversation ? (
      <h2 className="text-white font-bold text-xl flex items-center">
        {selectedConversation === 'DM' ? '👑' : '⚔️'} {selectedConversation}
      </h2>
    ) : (
      <h2 className="text-white font-bold text-xl">📬 Mensajería</h2>
    )}
  </div>
  <button
    onClick={onClose}
    className="text-white hover:text-red-300 text-3xl transition-colors hover:bg-red-500/20 rounded-lg p-2 absolute right-4 top-1/2 -translate-y-1/2 z-[80]"
    style={{ marginRight: '-200px' }}
    aria-label="Cerrar mensajería"
  >
    ✕
  </button>
</div>

          {selectedConversation ? (
            <>
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isMine = msg.sender_username === username;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isMine
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input de mensaje */}
              <div className="border-t border-white/20 p-4">
                <div className="flex gap-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="2"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !message.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 rounded-lg transition-all disabled:cursor-not-allowed"
                  >
                    {sending ? '...' : '📤'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Nueva conversación */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-white text-xl font-bold mb-4">Iniciar nueva conversación</h3>
                  
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona un usuario...</option>
                    {users.map(user => (
                      <option key={user} value={user} className="bg-purple-900">
                        {user === 'DM' ? '👑 ' : '⚔️ '}{user}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="w-full h-32 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                  />

                  <button
                    onClick={sendMessage}
                    disabled={sending || !recipient || !message.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all disabled:cursor-not-allowed"
                  >
                    {sending ? 'Enviando...' : '📤 Enviar Mensaje'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}