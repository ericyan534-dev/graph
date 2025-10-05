import { Link, NavLink } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:text-foreground"
  }`;

const Header = () => {
  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold">
          PoliScope
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/" className={linkClass} end>
            Chat
          </NavLink>
          <NavLink to="/bills" className={linkClass}>
            Bills
          </NavLink>
          <NavLink to="/transparency" className={linkClass}>
            Transparency
          </NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};

export default Header;
