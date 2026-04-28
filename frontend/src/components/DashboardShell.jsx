import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  LayoutDashboard, LogOut, Menu, X, Calendar, FileText, MessageSquare,
  Settings, Users, Wrench, BarChart3, TicketCheck, UserCog, ClipboardList,
  CreditCard, DollarSign, BookOpen, Package, Sparkles, Monitor, ShieldCheck, FileWarning
} from 'lucide-react';

const customerLinks = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/active', label: 'Active Services', icon: ShieldCheck },
  { to: '/dashboard/reports', label: 'Diagnostic Reports', icon: FileWarning },
  { to: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  { to: '/dashboard/software', label: 'Software & Apps', icon: Sparkles },
  { to: '/dashboard/devices', label: 'My Devices', icon: Monitor },
  { to: '/dashboard/scan', label: 'Security Scan', icon: ShieldCheck },
  { to: '/dashboard/invoices', label: 'Invoices & Payments', icon: FileText },
  { to: '/dashboard/history', label: 'Service History', icon: ClipboardList },
  { to: '/dashboard/tickets', label: 'Support Tickets', icon: TicketCheck },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/profile', label: 'Profile', icon: Settings },
];

const technicianLinks = [
  { to: '/technician', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/technician/customers', label: 'My Customers', icon: Users },
  { to: '/technician/appointments', label: 'Schedule', icon: Calendar },
  { to: '/technician/tickets', label: 'Tickets', icon: TicketCheck },
  { to: '/technician/messages', label: 'Messages', icon: MessageSquare },
];

const adminLinks = [
  { to: '/admin', label: 'Analytics', icon: BarChart3, end: true },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/technicians', label: 'Technicians', icon: Wrench },
  { to: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { to: '/admin/invoices', label: 'Invoices', icon: FileText },
  { to: '/admin/payments', label: 'Payments', icon: DollarSign },
  { to: '/admin/tickets', label: 'Support Tickets', icon: TicketCheck },
  { to: '/admin/software-requests', label: 'Software Requests', icon: Sparkles },
  { to: '/admin/plans', label: 'Plans & Pricing', icon: Package },
  { to: '/admin/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/admin/contact', label: 'Contact Messages', icon: MessageSquare },
];

export const DashboardShell = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const links = role === 'admin' ? adminLinks : role === 'technician' ? technicianLinks : customerLinks;
  const title = role === 'admin' ? 'Admin Console' : role === 'technician' ? 'Technician Portal' : 'Customer Dashboard';

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-200 transition-transform duration-200`}>
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/images/logo.jpeg" alt="" className="h-8 w-8 rounded bg-white p-0.5" />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-white font-display">GLOBAL TECH</span>
              <span className="text-[9px] tracking-[0.25em] text-slate-400">{role.toUpperCase()}</span>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-3 space-y-0.5">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-[#0B3B82] text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
              data-testid={`sidebar-${l.label.toLowerCase().replace(/\s|&/g, '-')}`}
            >
              <l.icon className="h-4 w-4" />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 text-sm">
            <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-400/30 grid place-items-center font-semibold text-blue-200">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="w-full mt-1 text-slate-300 hover:bg-slate-800 hover:text-white justify-start" data-testid="sidebar-logout">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden" data-testid="mobile-sidebar-toggle"><Menu className="h-5 w-5" /></button>
            <h1 className="font-display font-bold text-lg text-slate-900">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex"><Link to="/">← Back to site</Link></Button>
          </div>
        </header>
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
