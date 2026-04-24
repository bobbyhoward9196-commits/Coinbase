import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import PhoneNoticeBanner from './PhoneNoticeBanner';
import {
  Shield, Menu, X, Headphones, LogOut, User, LayoutDashboard, Phone
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from './ui/dropdown-menu';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/book', label: 'Book Service' },
  { to: '/support', label: 'Support' },
  { to: '/contact', label: 'Contact' },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const dashPath =
    user?.role === 'admin' ? '/admin'
    : user?.role === 'technician' ? '/technician'
    : '/dashboard';

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-lg" data-testid="site-navbar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" data-testid="nav-logo-link">
          <img src="/images/logo.jpeg" alt="Global Tech Solutions" className="h-9 w-9 rounded object-contain" />
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-[#0B3B82] font-display">GLOBAL TECH</span>
            <span className="text-[10px] font-medium tracking-[0.25em] text-slate-500">S O L U T I O N S</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {publicLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                  isActive ? 'text-[#0B3B82] bg-blue-50' : 'text-slate-700 hover:text-[#0B3B82] hover:bg-slate-50'
                }`
              }
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s/g,'-')}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a href="tel:18007418000" className="hidden xl:flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-[#0B3B82] mr-2" data-testid="nav-phone">
            <Phone className="h-4 w-4" /> 1-800-741-800
          </a>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-slate-300" data-testid="user-menu-trigger">
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="capitalize">{user.role} Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(dashPath)} data-testid="menu-dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-slate-700" data-testid="nav-login-btn">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="bg-[#0B3B82] hover:bg-[#0a3270] text-white" data-testid="nav-book-btn">
                <Link to="/book">Book Support</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          data-testid="mobile-menu-toggle"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <nav className="flex flex-col px-4 py-3">
            {publicLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-2 text-sm font-medium ${isActive ? 'text-[#0B3B82]' : 'text-slate-700'}`
                }
                data-testid={`mobile-nav-link-${l.label.toLowerCase().replace(/\s/g,'-')}`}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {user ? (
                <>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link to={dashPath}>Dashboard</Link>
                  </Button>
                  <Button variant="destructive" onClick={() => { handleLogout(); setOpen(false); }}>Sign out</Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="bg-[#0B3B82] text-white" onClick={() => setOpen(false)}>
                    <Link to="/book">Book Support</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export const Footer = () => (
  <footer className="bg-slate-900 text-slate-300" data-testid="site-footer">
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/images/logo.jpeg" alt="Global Tech Solutions" className="h-10 w-10 rounded bg-white p-0.5 object-contain" />
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-white font-display">GLOBAL TECH</span>
              <span className="text-[10px] font-medium tracking-[0.25em] text-slate-400">S O L U T I O N S</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Reliable technical support for homes and businesses — trusted since the early 2000s.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Shield className="h-3.5 w-3.5" />
            <span>Certified technicians · Encrypted sessions</span>
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-white uppercase tracking-wider">Services</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/services" className="hover:text-white">Computer Repair</Link></li>
            <li><Link to="/services" className="hover:text-white">Antivirus & Malware</Link></li>
            <li><Link to="/services" className="hover:text-white">Wi-Fi & Network</Link></li>
            <li><Link to="/services" className="hover:text-white">Remote Support</Link></li>
            <li><Link to="/services" className="hover:text-white">Business IT</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-white uppercase tracking-wider">Company</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
            <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link to="/support" className="hover:text-white">Support Center</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/login" className="hover:text-white">Customer Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold text-white uppercase tracking-wider">Get in touch</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-400" /> 1-800-741-800</li>
            <li className="flex items-center gap-2"><Headphones className="h-4 w-4 text-blue-400" /> 24/7 Emergency line</li>
            <li className="text-slate-400 text-xs">United States · Serving homes & SMBs</li>
          </ul>
          <Button asChild className="mt-5 bg-[#1E6FD9] hover:bg-[#1a5fc0] text-white" data-testid="footer-book-btn">
            <Link to="/book">Book Support</Link>
          </Button>
        </div>
      </div>

      <div className="mt-10 border-t border-slate-800 pt-6 text-xs text-slate-500 space-y-2">
        <p data-testid="footer-disclaimer">
          <span className="font-semibold text-slate-400">Disclaimer:</span> Global Tech Solutions is an independent technical support provider.
          We are not affiliated with, endorsed, or sponsored by Microsoft, Apple, Google, or any other third-party brand unless explicitly stated as an authorized partner. All trademarks belong to their respective owners.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Global Tech Solutions. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-white">
    <PhoneNoticeBanner />
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);
