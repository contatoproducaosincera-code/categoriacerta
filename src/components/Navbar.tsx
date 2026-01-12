import { Link, useLocation } from "react-router-dom";
import { Trophy, Users, LogIn, LogOut, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";
import { memo } from "react";

const Navbar = memo(() => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  const handleAuthAction = async () => {
    if (user) {
      await signOut();
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl shadow-sm" role="navigation" aria-label="Menu principal">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-18 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 lg:gap-3 group" aria-label="Categoria Certa - Página inicial">
          <Trophy className="h-7 w-7 lg:h-8 lg:w-8 text-primary transition-transform group-hover:scale-110" aria-hidden="true" />
          <span className="font-display font-bold text-lg lg:text-xl xl:text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Categoria Certa
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            to="/"
            className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all ${
              isActive("/")
                ? "bg-primary text-primary-foreground scale-105"
                : "hover:bg-accent/80 hover:text-accent-foreground hover:scale-105"
            }`}
          >
            Início
          </Link>
          <Link
            to="/atletas"
            className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all ${
              isActive("/atletas")
                ? "bg-primary text-primary-foreground scale-105"
                : "hover:bg-accent/80 hover:text-accent-foreground hover:scale-105"
            }`}
          >
            Atletas
          </Link>
          <Link
            to="/ranking"
            className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all ${
              isActive("/ranking")
                ? "bg-primary text-primary-foreground scale-105"
                : "hover:bg-accent/80 hover:text-accent-foreground hover:scale-105"
            }`}
          >
            Ranking
          </Link>
          <Link
            to="/feed"
            className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all flex items-center gap-1.5 ${
              isActive("/feed")
                ? "bg-primary text-primary-foreground scale-105"
                : "hover:bg-accent/80 hover:text-accent-foreground hover:scale-105"
            }`}
          >
            <Users className="h-4 w-4" />
            Feed
          </Link>
          <Link
            to="/torneios"
            className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all ${
              isActive("/torneios")
                ? "bg-primary text-primary-foreground scale-105"
                : "hover:bg-accent/80 hover:text-accent-foreground hover:scale-105"
            }`}
          >
            Torneios
          </Link>
          <Link
            to="/historico-progressao"
            className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all flex items-center gap-1.5 ${
              isActive("/historico-progressao")
                ? "bg-primary text-primary-foreground scale-105"
                : "hover:bg-accent/80 hover:text-accent-foreground hover:scale-105"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Progressão
          </Link>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {user ? (
            <>
              <Button 
                className="ml-2 lg:ml-3 transition-all hover:scale-105" 
                size="sm" 
                asChild
              >
                <Link to="/admin" className="font-semibold">Admin</Link>
              </Button>
              <Button 
                className="ml-2 transition-all hover:scale-105" 
                size="sm"
                variant="outline"
                onClick={handleAuthAction}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </>
          ) : (
            <Button 
              className="ml-2 lg:ml-3 transition-all hover:scale-105 font-semibold" 
              size="sm" 
              asChild
            >
              <Link to="/auth" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span>Entrar</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile: Theme Toggle + Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
