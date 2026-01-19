import { useState, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, LogOut, HelpCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

interface MobileMenuProps {
  navItems: NavItem[];
}

const MobileMenu = ({ navItems }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleClose = () => setIsOpen(false);

  const handleSignOut = async () => {
    await signOut();
    handleClose();
  };

  const isActive = (path: string, end?: boolean) => 
    end ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={handleClose}
            aria-hidden="true"
          />
          
          {/* Menu Panel */}
          <div 
            className="fixed right-0 top-16 w-72 h-[calc(100vh-4rem)] bg-card border-l shadow-xl z-40 animate-slide-in-right overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
          >
            <nav className="flex flex-col p-4">
              {/* Navigation Links */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                  Navegação
                </p>
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={handleClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive(item.to, item.end)
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Support Section */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                  Suporte
                </p>
                <button
                  onClick={handleClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all w-full text-left text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <HelpCircle className="h-4 w-4" />
                  Ajuda e Suporte
                </button>
              </div>

              <Separator className="my-4" />

              {/* Auth Section */}
              <div className="space-y-2 mt-auto">
                {user ? (
                  <>
                    <Button className="w-full justify-start gap-3" asChild>
                      <Link to="/admin" onClick={handleClose}>
                        <Shield className="h-4 w-4" />
                        Painel Admin
                      </Link>
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full justify-start gap-3"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sair da Conta
                    </Button>
                  </>
                ) : (
                  <Button className="w-full justify-start gap-3" asChild>
                    <Link to="/auth" onClick={handleClose}>
                      <LogIn className="h-4 w-4" />
                      Entrar na Plataforma
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileMenu;
