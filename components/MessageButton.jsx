export default function MessageButton({ onClick, unreadCount = 0, isDM = false }) {
  const bottom = isDM ? '32px' : '96px';
  const bg = isDM
    ? 'linear-gradient(135deg,#4c1d95,#6d28d9)'
    : 'linear-gradient(135deg,#1e3a8a,#2563eb)';

  return (
    <button
      onClick={onClick}
      title={isDM ? 'Mensajería DM' : 'Tus mensajes'}
      style={{
        position:'fixed', right:'28px', bottom, zIndex:30,
        background:bg, border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:'50%', width:'52px', height:'52px',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 4px 20px rgba(0,0,0,0.5)',
        cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 6px 28px rgba(0,0,0,0.6)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.5)'; }}
    >
      <span style={{ fontSize:'20px', lineHeight:1 }}>{isDM ? '📨' : '📬'}</span>
      {unreadCount > 0 && (
        <span style={{
          position:'absolute', top:'-4px', right:'-4px',
          background:'#f59e0b', color:'#431407',
          fontWeight:'800', fontSize:'10px',
          height:'18px', minWidth:'18px', borderRadius:'99px',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'0 4px',
        }}>
          {unreadCount}
        </span>
      )}
    </button>
  );
}
