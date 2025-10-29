import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-0 top-16 w-64 h-[calc(100vh-4rem)] bg-card border-l shadow-strong z-40 animate-slide-in-right">
            <nav className="flex flex-col gap-2 p-6">
              <Link
                to="/"
                className="px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsOpen(false)}
              >
                Início
              </Link>
              <Link
                to="/atletas"
                className="px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsOpen(false)}
              >
                Atletas
              </Link>
              <Link
                to="/ranking"
                className="px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsOpen(false)}
              >
                Ranking
              </Link>
              <Link
                to="/feed"
                className="px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <Users className="h-4 w-4" />
                Feed
              </Link>
              <Link
                to="/torneios"
                className="px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsOpen(false)}
              >
                Torneios
              </Link>
              <Button className="mt-4" asChild>
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  Admin
                </Link>
              </Button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileMenu;
