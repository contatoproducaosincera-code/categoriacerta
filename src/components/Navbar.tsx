import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Ranking Beach Tennis</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
            Início
          </Link>
          <Link to="/atletas" className="text-sm font-medium transition-colors hover:text-primary">
            Atletas
          </Link>
          <Link to="/ranking" className="text-sm font-medium transition-colors hover:text-primary">
            Ranking
          </Link>
          <Link to="/torneios" className="text-sm font-medium transition-colors hover:text-primary">
            Torneios
          </Link>
          <Button variant="default" size="sm" asChild>
            <Link to="/admin">Admin</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">Admin</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
