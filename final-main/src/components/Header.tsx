import { Link, NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const linkClass = ({ isActive }: {isActive: boolean}) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`;

  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
        <Link to="/" className="font-bold text-lg">PoliScope</Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/" className={linkClass} end>Chat</NavLink>
          <NavLink to="/bills" className={linkClass}>Bills</NavLink>
          <NavLink to="/transparency" className={linkClass}>Transparency</NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
