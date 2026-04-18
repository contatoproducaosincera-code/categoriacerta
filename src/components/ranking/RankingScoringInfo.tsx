import { Link } from "react-router-dom";

export const RankingScoringInfo = () => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-accent/30 border border-border rounded-xl p-4 md:p-6">
      <h3 className="font-bold text-base md:text-lg mb-4 text-center md:text-left">
        📊 Sistema de Pontuação
      </h3>
      
      {/* Score grid - always visible */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 text-center mb-4">
        <div className="bg-background/60 rounded-lg p-3 md:p-4">
          <div className="text-2xl md:text-3xl font-bold text-yellow-600">+100</div>
          <div className="text-xs md:text-sm text-muted-foreground mt-1">🥇 1º Lugar</div>
        </div>
        <div className="bg-background/60 rounded-lg p-3 md:p-4">
          <div className="text-2xl md:text-3xl font-bold text-gray-500">+80</div>
          <div className="text-xs md:text-sm text-muted-foreground mt-1">🥈 2º Lugar</div>
        </div>
        <div className="bg-background/60 rounded-lg p-3 md:p-4">
          <div className="text-2xl md:text-3xl font-bold text-amber-700">+60</div>
          <div className="text-xs md:text-sm text-muted-foreground mt-1">🥉 3º Lugar</div>
        </div>
      </div>
      
      {/* Rules - stacked on mobile */}
      <div className="space-y-2 text-sm text-muted-foreground bg-background/40 rounded-lg p-3">
        <p className="flex items-start gap-2">
          <span className="flex-shrink-0">📈</span>
          <span><strong>Suba de categoria:</strong> 300 pts (Iniciante → D), 500 pts (D → C), 800 pts (C → B)</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="flex-shrink-0">👑</span>
          <span><strong>Categoria B:</strong> Categoria máxima do ranking</span>
        </p>
        <p className="flex items-start gap-2 text-xs opacity-80">
          <span className="flex-shrink-0">💡</span>
          <span>Apenas pontos ativos contam para subida de categoria!</span>
        </p>
      </div>
      
      {/* Link to progression history */}
      <div className="mt-4 pt-4 border-t border-border text-center md:text-left">
        <Link 
          to="/historico-progressao" 
          className="text-primary hover:underline font-medium inline-flex items-center gap-2 text-sm md:text-base"
        >
          📈 Ver histórico de progressões
        </Link>
      </div>
    </div>
  );
};
