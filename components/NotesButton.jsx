export default function NotesButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Mis notas de campaña"
      style={{
        position:'fixed', right:'28px', bottom:'160px', zIndex:30,
        background:'linear-gradient(135deg,#064e3b,#065f46)',
        border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:'50%', width:'52px', height:'52px',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 4px 20px rgba(0,0,0,0.5)',
        cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 6px 28px rgba(0,0,0,0.6)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.5)'; }}
    >
      <span style={{ fontSize:'20px', lineHeight:1 }}>📝</span>
    </button>
  );
}
