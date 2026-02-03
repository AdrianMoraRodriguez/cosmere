export default function NotesButton({ onClick, hasUnsavedChanges = false }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-30 bg-gradient-to-br from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-full p-6 shadow-2xl transition-all duration-300 hover:scale-110 group"
      title="Mis notas de campaña"
    >
      <div className="relative">
        <span className="text-5xl">📝</span>
        {hasUnsavedChanges && (
          <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
      <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/90 text-white px-4 py-2 rounded-lg text-base font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
        📝 Mis Notas
      </span>
    </button>
  );
}