export default function MessageButton({ onClick, unreadCount = 0, isDM = false }) {
  return (
    <button
      onClick={onClick}
      className={`fixed ${isDM ? 'bottom-8 left-8' : 'bottom-32 right-8'} z-30 ${
        isDM 
          ? 'bg-gradient-to-br from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700'
          : 'bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
      } text-white rounded-full p-6 shadow-2xl transition-all duration-300 hover:scale-110 group`}
      title={isDM ? "Enviar mensajes a jugadores" : "Mensajes del DM"}
    >
      <div className="relative">
        <span className="text-5xl">{isDM ? '📨' : '📬'}</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-900 font-bold text-sm h-8 w-8 rounded-full flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </div>
      <span className={`absolute ${isDM ? 'left-full ml-4' : 'right-full mr-4'} top-1/2 -translate-y-1/2 bg-black/90 text-white px-4 py-2 rounded-lg text-base font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl`}>
        {isDM ? '📨 Mensajería DM' : '📬 Tus Mensajes'}
      </span>
    </button>
  );
}