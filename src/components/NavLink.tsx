import { Link, useLocation } from "react-router-dom";
import { memo, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  end?: boolean;
}

const NavLink = memo(({ to, children, icon, className, onClick, end = false }: NavLinkProps) => {
  const location = useLocation();
  
  const isActive = end 
    ? location.pathname === to 
    : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {icon}
      {children}
    </Link>
  );
});

NavLink.displayName = "NavLink";

export default NavLink;
