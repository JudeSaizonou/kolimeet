export default function AnimatedRings() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Cercles concentriques animés */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64">
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping"></div>
        <div className="absolute inset-4 border-2 border-primary/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute inset-8 border-2 border-primary/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64">
        <div className="absolute inset-0 border-2 border-success/20 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute inset-4 border-2 border-success/30 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-8 border-2 border-success/40 rounded-full animate-ping" style={{ animationDelay: '2.5s' }}></div>
      </div>

      <div className="absolute top-1/2 right-1/3 w-48 h-48">
        <div className="absolute inset-0 border-2 border-accent/20 rounded-full animate-ping" style={{ animationDelay: '0.7s' }}></div>
        <div className="absolute inset-3 border-2 border-accent/30 rounded-full animate-ping" style={{ animationDelay: '1.2s' }}></div>
        <div className="absolute inset-6 border-2 border-accent/40 rounded-full animate-ping" style={{ animationDelay: '1.7s' }}></div>
      </div>
    </div>
  );
}
