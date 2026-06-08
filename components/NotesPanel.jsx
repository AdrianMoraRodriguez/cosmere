import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';

const S = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:60 },
  panel: {
    position:'fixed', right:0, top:0, height:'100%', width:'min(960px,100%)',
    background:'var(--bg-panel)', borderLeft:'1px solid var(--border)',
    boxShadow:'-8px 0 40px rgba(0,0,0,0.6)', zIndex:70,
    display:'flex', flexDirection:'column', overflow:'hidden',
    fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  header: {
    height:56, background:'var(--bg-panel)', borderBottom:'1px solid var(--border)',
    display:'flex', alignItems:'center', padding:'0 20px', gap:'12px', flexShrink:0,
  },
  headerLeft: { display:'flex', alignItems:'center', gap:'8px', flex:1, minWidth:0 },
  headerIcon: { color:'#10b981', fontSize:'16px', flexShrink:0 },
  headerTitle: { color:'var(--text-2)', fontWeight:'700', fontSize:'14px', letterSpacing:'0.01em' },
  saveStatus: { fontSize:'12px', color:'var(--text-5)', marginLeft:'auto', whiteSpace:'nowrap', flexShrink:0 },
  closeBtn: { background:'none', border:'none', color:'var(--text-5)', fontSize:'18px', cursor:'pointer', padding:'6px', borderRadius:'6px', lineHeight:1, transition:'color 0.15s', flexShrink:0 },
  tabBar: { display:'flex', borderBottom:'1px solid var(--border)', background:'var(--bg-panel)', flexShrink:0 },
  tab: (active) => ({
    padding:'10px 20px', fontSize:'13px', fontWeight:'600', cursor:'pointer',
    border:'none', background:'transparent',
    color: active ? 'var(--text-2)' : 'var(--text-5)',
    borderBottom: active ? '2px solid #10b981' : '2px solid transparent',
    transition:'color 0.15s',
    letterSpacing:'0.02em',
  }),
  body: { flex:1, overflow:'hidden', display:'flex', flexDirection:'column' },
  textarea: {
    flex:1, resize:'none', outline:'none', border:'none',
    background:'var(--bg-panel)', color:'var(--text-2)', fontSize:'14px',
    padding:'24px 28px', lineHeight:1.75, fontFamily:'inherit',
    caretColor:'#10b981',
  },
  preview: {
    flex:1, overflowY:'auto', padding:'24px 28px',
    color:'var(--text-3)', fontSize:'14px', lineHeight:1.75,
  },
  footer: {
    borderTop:'1px solid var(--border)', padding:'12px 20px',
    background:'var(--bg-panel)', display:'flex', gap:'16px', alignItems:'center', flexShrink:0,
  },
  tip: { fontSize:'12px', color:'var(--text-6)' },
  tipCode: { background:'var(--bg-card)', border:'1px solid var(--border-input)', borderRadius:'4px', padding:'1px 5px', color:'var(--accent-2)', fontFamily:'monospace', fontSize:'11px' },
};

// Minimal markdown prose styles for the preview pane
const previewStyles = `
  .notes-preview p { margin: 0.6rem 0; }
  .notes-preview strong { color: #f59e0b; font-weight: 600; }
  .notes-preview em { color: #93b8d8; font-style: italic; }
  .notes-preview h1 { color: var(--text-1); font-size: 1.4rem; font-weight: 700; margin: 1.4rem 0 0.5rem; }
  .notes-preview h2 { color: var(--accent-2); font-size: 1.1rem; font-weight: 600; margin: 1.2rem 0 0.4rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; }
  .notes-preview h3 { color: var(--accent-2); font-size: 1rem; font-weight: 600; margin: 1rem 0 0.4rem; }
  .notes-preview ul, .notes-preview ol { padding-left: 1.4rem; margin: 0.5rem 0; }
  .notes-preview li { margin: 0.3rem 0; }
  .notes-preview code { background: rgba(255,255,255,0.07); padding: 0.1rem 0.3rem; border-radius: 4px; color: #f59e0b; font-size: 0.88em; }
  .notes-preview blockquote { border-left: 3px solid #1e4080; padding-left: 1rem; margin-left: 0; font-style: italic; color: var(--text-4); }
  .notes-preview hr { border: none; border-top: 1px solid var(--border); margin: 1.2rem 0; }
  .notes-preview a { color: var(--accent-2); text-decoration: underline; }
`;

export default function NotesPanel({ username, isOpen, onClose }) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState('edit');

  useEffect(() => { if (isOpen && username) loadNotes(); }, [isOpen, username]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('campaign_notes').select('content, updated_at')
        .eq('page_slug', 'general_notes').eq('username', username).single();
      if (error && error.code !== 'PGRST116') { console.error(error); return; }
      if (data) { setNotes(data.content || ''); setLastSaved(new Date(data.updated_at)); }
    } finally { setIsLoading(false); }
  };

  const saveNotes = async (content) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('campaign_notes').upsert(
        { page_slug: 'general_notes', username, content, updated_at: new Date().toISOString() },
        { onConflict: 'page_slug,username' }
      );
      if (!error) setLastSaved(new Date());
    } finally { setIsSaving(false); }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(() => saveNotes(val), 2000));
  };

  const fmtSaved = () => {
    if (!lastSaved) return '';
    const diff = Math.floor((Date.now() - lastSaved) / 1000);
    if (diff < 60) return 'Guardado';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
    return lastSaved.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{previewStyles}</style>
      <div style={S.overlay} onClick={onClose} />
      <div style={S.panel}>

        {/* Header */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <span style={S.headerIcon}>📝</span>
            <span style={S.headerTitle}>Mis Notas</span>
            {isLoading && <span style={{ color:'var(--text-6)', fontSize:'12px' }}>cargando...</span>}
          </div>
          <span style={S.saveStatus}>
            {isSaving ? 'Guardando...' : lastSaved ? fmtSaved() : ''}
          </span>
          <button
            style={S.closeBtn} onClick={onClose}
            onMouseEnter={e => e.target.style.color='#f87171'}
            onMouseLeave={e => e.target.style.color='var(--text-5)'}
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={S.tabBar}>
          <button style={S.tab(tab === 'edit')} onClick={() => setTab('edit')}>Editar</button>
          <button style={S.tab(tab === 'preview')} onClick={() => setTab('preview')}>Vista previa</button>
        </div>

        {/* Body */}
        <div style={S.body}>
          {tab === 'edit' ? (
            <textarea
              style={S.textarea}
              value={notes}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Escribe aquí tus notas de campaña...

Puedes usar markdown:
  **negrita**   *cursiva*
  ## Título     > cita
  - lista       `código`

Se guarda automáticamente."
            />
          ) : (
            <div style={S.preview} className="notes-preview">
              {notes.trim() ? (
                <ReactMarkdown>{notes}</ReactMarkdown>
              ) : (
                <span style={{ color:'var(--text-6)', fontStyle:'italic' }}>Nada que previsualizar todavía...</span>
              )}
            </div>
          )}
        </div>

        {/* Footer tips */}
        <div style={S.footer}>
          <span style={S.tip}>
            <span style={S.tipCode}>**negrita**</span>
            {' '}&nbsp;
            <span style={S.tipCode}>*cursiva*</span>
            {' '}&nbsp;
            <span style={S.tipCode}>## título</span>
            {' '}&nbsp;
            <span style={S.tipCode}>- lista</span>
          </span>
          <span style={{ ...S.tip, marginLeft:'auto' }}>Solo tú puedes ver estas notas · se guardan en la nube</span>
        </div>
      </div>
    </>
  );
}
