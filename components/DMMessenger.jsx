import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const S = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:60 },
  panel: {
    position:'fixed', right:0, top:0, height:'100%', width:'min(900px,100%)',
    background:'var(--bg-panel)', borderLeft:'1px solid var(--border)',
    boxShadow:'-8px 0 40px rgba(0,0,0,0.6)', zIndex:70,
    display:'flex', overflow:'hidden',
    fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    backdropFilter:'blur(16px)',
  },
  sidebar: { width:240, flexShrink:0, background:'var(--bg-panel)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column' },
  sidebarHeader: { padding:'16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' },
  sidebarTitle: { color:'var(--text-2)', fontWeight:'700', fontSize:'13px', letterSpacing:'0.06em', textTransform:'uppercase' },
  convItem: (active) => ({
    width:'100%', padding:'12px 14px', borderBottom:'1px solid var(--border)', textAlign:'left',
    background: active ? 'var(--bg-active)' : 'transparent',
    borderLeft: active ? '2px solid #7c3aed' : '2px solid transparent',
    cursor:'pointer', transition:'background 0.12s',
  }),
  convName: { color:'var(--text-2)', fontWeight:'600', fontSize:'13px' },
  convPreview: { color:'var(--text-5)', fontSize:'11.5px', marginTop:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'160px' },
  convTime: { color:'var(--text-7)', fontSize:'10.5px', marginTop:'2px' },
  unreadBadge: { background:'#f59e0b', color:'#431407', fontSize:'9px', fontWeight:'800', padding:'1px 6px', borderRadius:'99px', letterSpacing:'0.05em' },
  main: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg-panel)' },
  header: { height:56, background:'var(--bg-panel)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', padding:'0 16px', gap:'10px', flexShrink:0 },
  headerTitle: { color:'var(--text-2)', fontWeight:'600', fontSize:'14px', flex:1 },
  closeBtn: { background:'none', border:'none', color:'var(--text-5)', fontSize:'18px', cursor:'pointer', padding:'6px', borderRadius:'6px', lineHeight:1, transition:'color 0.15s' },
  backBtn: { background:'none', border:'none', color:'var(--text-5)', fontSize:'16px', cursor:'pointer', padding:'4px 8px', borderRadius:'6px', lineHeight:1 },
  messages: { flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'10px' },
  msgMine: { alignSelf:'flex-end', maxWidth:'70%', background:'linear-gradient(135deg,#4c1d95,#6d28d9)', borderRadius:'12px 12px 2px 12px', padding:'10px 14px' },
  msgOther: { alignSelf:'flex-start', maxWidth:'70%', background:'var(--bg-hover)', border:'1px solid #0f2a45', borderRadius:'12px 12px 12px 2px', padding:'10px 14px' },
  msgText: { color:'#e2e8f0', fontSize:'13.5px', whiteSpace:'pre-wrap', lineHeight:1.5 },
  msgTime: { color:'rgba(255,255,255,0.35)', fontSize:'10.5px', marginTop:'4px', textAlign:'right' },
  inputArea: { borderTop:'1px solid var(--border)', padding:'12px 16px', display:'flex', gap:'8px', alignItems:'flex-end', background:'var(--bg-panel)' },
  textarea: { flex:1, background:'var(--bg-input)', border:'1px solid var(--border-input)', borderRadius:'8px', padding:'8px 12px', color:'var(--text-2)', fontSize:'13.5px', resize:'none', outline:'none', fontFamily:'inherit', lineHeight:1.5 },
  sendBtn: (disabled) => ({ background: disabled ? 'var(--btn-disabled-bg)' : '#6d28d9', border:'none', borderRadius:'8px', padding:'8px 16px', color: disabled ? 'var(--btn-disabled-text)' : 'white', cursor: disabled ? 'not-allowed' : 'pointer', fontSize:'13px', fontWeight:'600', transition:'background 0.15s', whiteSpace:'nowrap' }),
  emptyState: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px', gap:'16px' },
  emptyTitle: { color:'var(--text-2)', fontWeight:'600', fontSize:'16px', textAlign:'center' },
  select: { width:'100%', background:'var(--bg-input)', border:'1px solid var(--border-input)', borderRadius:'8px', padding:'9px 12px', color:'var(--text-2)', fontSize:'13.5px', outline:'none', marginBottom:'10px' },
  bigTextarea: { width:'100%', height:'120px', background:'var(--bg-input)', border:'1px solid var(--border-input)', borderRadius:'8px', padding:'10px 12px', color:'var(--text-2)', fontSize:'13.5px', resize:'none', outline:'none', fontFamily:'inherit', lineHeight:1.5, marginBottom:'10px' },
  bigSendBtn: (disabled) => ({ width:'100%', background: disabled ? 'var(--btn-disabled-bg)' : '#6d28d9', border:'none', borderRadius:'8px', padding:'11px', color: disabled ? 'var(--btn-disabled-text)' : 'white', cursor: disabled ? 'not-allowed' : 'pointer', fontSize:'14px', fontWeight:'600', transition:'background 0.15s' }),
};

export default function DMMessenger({ isOpen, onClose }) {
  const username = 'DM';
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => { if (isOpen) { loadUsers(); loadConversations(); } }, [isOpen]);
  useEffect(() => { if (selectedConversation) loadMessages(selectedConversation); }, [selectedConversation]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadUsers = async () => {
    try {
      const pages = await fetch('/content/pages.json').then(r => r.json());
      const all = new Set();
      pages.forEach(p => p.allowed_users?.forEach(u => all.add(u)));
      setUsers(Array.from(all).sort());
    } catch {}
  };

  const loadConversations = async () => {
    const { data } = await supabase.from('dm_messages').select('*')
      .or(`sender_username.eq.${username},recipient_username.eq.${username}`)
      .order('created_at', { ascending: false });
    const map = new Map();
    data?.forEach(msg => {
      const other = msg.sender_username === username ? msg.recipient_username : msg.sender_username;
      if (!map.has(other) || new Date(msg.created_at) > new Date(map.get(other).lastTime)) {
        map.set(other, { user: other, lastMessage: msg.message, lastTime: msg.created_at, unread: msg.recipient_username === username && !msg.read });
      }
    });
    setConversations(Array.from(map.values()));
  };

  const loadMessages = async (other) => {
    const { data } = await supabase.from('dm_messages').select('*')
      .or(`and(sender_username.eq.${username},recipient_username.eq.${other}),and(sender_username.eq.${other},recipient_username.eq.${username})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    const unread = data?.filter(m => m.recipient_username === username && !m.read).map(m => m.id) || [];
    if (unread.length) { await supabase.from('dm_messages').update({ read: true }).in('id', unread); loadConversations(); }
  };

  const sendMessage = async () => {
    const target = selectedConversation || recipient;
    if (!target || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from('dm_messages').insert({ sender_username: username, recipient_username: target, message: message.trim() });
    setSending(false);
    if (!error) { setMessage(''); selectedConversation ? loadMessages(selectedConversation) : null; loadConversations(); }
  };

  const handleBack = () => { setSelectedConversation(null); setRecipient(''); setMessage(''); loadConversations(); };

  if (!isOpen) return null;

  const fmtTime = (iso) => new Date(iso).toLocaleString('es-ES', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

  return (
    <>
      <div style={S.overlay} onClick={onClose} />
      <div style={S.panel}>

        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <span style={S.sidebarTitle}>Mensajes</span>
            <span style={{ color:'#4c1d95', fontSize:'16px' }}>👑</span>
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding:'24px', textAlign:'center', color:'var(--text-6)', fontSize:'12px' }}>Sin conversaciones</div>
            ) : conversations.map(c => (
              <button key={c.user} onClick={() => setSelectedConversation(c.user)} style={S.convItem(selectedConversation === c.user)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={S.convName}>{c.user}</span>
                  {c.unread && <span style={S.unreadBadge}>NUEVO</span>}
                </div>
                <div style={S.convPreview}>{c.lastMessage}</div>
                <div style={S.convTime}>{fmtTime(c.lastTime)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={S.main}>
          <div style={S.header}>
            {selectedConversation && <button style={S.backBtn} onClick={handleBack}>←</button>}
            <span style={S.headerTitle}>
              {selectedConversation ? `DM → ${selectedConversation}` : 'Mensajería DM'}
            </span>
            <button style={S.closeBtn} onClick={onClose} onMouseEnter={e => e.target.style.color='#f87171'} onMouseLeave={e => e.target.style.color='var(--text-5)'}>✕</button>
          </div>

          {selectedConversation ? (
            <>
              <div style={S.messages}>
                {messages.map(msg => {
                  const mine = msg.sender_username === username;
                  return (
                    <div key={msg.id} style={mine ? S.msgMine : S.msgOther}>
                      <div style={S.msgText}>{msg.message}</div>
                      <div style={S.msgTime}>{new Date(msg.created_at).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })}</div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div style={S.inputArea}>
                <textarea
                  style={S.textarea} rows={2} value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Escribe un mensaje... (Enter para enviar)"
                />
                <button style={S.sendBtn(sending || !message.trim())} onClick={sendMessage} disabled={sending || !message.trim()}>
                  {sending ? '...' : 'Enviar'}
                </button>
              </div>
            </>
          ) : (
            <div style={S.emptyState}>
              <div style={{ fontSize:'40px' }}>👑</div>
              <div style={S.emptyTitle}>Enviar mensaje a jugador</div>
              <div style={{ width:'100%', maxWidth:'360px' }}>
                <select style={S.select} value={recipient} onChange={e => setRecipient(e.target.value)}>
                  <option value="">Selecciona un jugador...</option>
                  {users.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <textarea style={S.bigTextarea} value={message} onChange={e => setMessage(e.target.value)} placeholder="Escribe tu mensaje..." />
                <button style={S.bigSendBtn(sending || !recipient || !message.trim())} onClick={sendMessage} disabled={sending || !recipient || !message.trim()}>
                  {sending ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
