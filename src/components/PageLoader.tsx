export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-primary/20" style={{ animationDuration: '2s' }} />
      </div>
      <p className="text-sm text-slate-600 animate-pulse">Chargement...</p>
    </div>
  </div>
);
