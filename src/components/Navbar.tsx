import { Link } from "react-router-dom";
import { Trophy, Users, LogIn, LogOut, Home, Award, Calendar, HelpCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";
import NavLink from "./NavLink";
import { memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Navbar = memo(() => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { to: "/", label: "Início", icon: <Home className="h-4 w-4" />, end: true },
    { to: "/atletas", label: "Atletas", icon: <Users className="h-4 w-4" /> },
    { to: "/ranking", label: "Ranking", icon: <Award className="h-4 w-4" /> },
    { to: "/feed", label: "Conquistas", icon: <Trophy className="h-4 w-4" /> },
    { to: "/torneios", label: "Torneios", icon: <Calendar className="h-4 w-4" /> },
    { to: "/historico-progressao", label: "Progressão", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <nav 
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl shadow-sm" 
      role="navigation" 
      aria-label="Menu principal"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-18 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2 lg:gap-3 group shrink-0" 
          aria-label="Categoria Certa - Página inicial"
        >
          <Trophy 
            className="h-7 w-7 lg:h-8 lg:w-8 text-primary transition-transform group-hover:scale-110" 
            aria-hidden="true" 
          />
          <span className="font-display font-bold text-lg lg:text-xl xl:text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden sm:inline">
            Categoria Certa
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              icon={item.icon}
              end={item.end}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Help Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Ajuda e suporte"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ajuda e Suporte</p>
            </TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Auth Buttons */}
          {user ? (
            <div className="flex items-center gap-2 ml-2">
              <Button size="sm" asChild>
                <Link to="/admin" className="font-semibold">
                  Admin
                </Link>
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild className="ml-2 font-semibold gap-2">
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                Entrar
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile: Theme Toggle + Menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <MobileMenu navItems={navItems} />
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
