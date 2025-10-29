import { Link, useLocation } from "react-router-dom";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileMenu from "./MobileMenu";
import { useAdmin } from "@/hooks/useAdmin";

const Navbar = () => {
  const location = useLocation();
  const { isAdmin } = useAdmin();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl shadow-soft">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Trophy className="h-7 w-7 text-primary transition-transform group-hover:scale-110 group-hover:rotate-12" />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform" />
          </div>
          <span className="font-display font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Categoria Certa
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive("/")
                ? "bg-primary text-primary-foreground shadow-glow"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            Início
          </Link>
          <Link
            to="/atletas"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive("/atletas")
                ? "bg-primary text-primary-foreground shadow-glow"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            Atletas
          </Link>
          <Link
            to="/ranking"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive("/ranking")
                ? "bg-primary text-primary-foreground shadow-glow"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            Ranking
          </Link>
          <Link
            to="/torneios"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive("/torneios")
                ? "bg-primary text-primary-foreground shadow-glow"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            Torneios
          </Link>
          {isAdmin && (
            <Button 
              className="ml-2 shadow-medium hover:shadow-strong transition-shadow" 
              size="sm" 
              asChild
            >
              <Link to="/admin">Admin</Link>
            </Button>
          )}
        </div>

        <MobileMenu />
      </div>
    </nav>
  );
};

export default Navbar;
