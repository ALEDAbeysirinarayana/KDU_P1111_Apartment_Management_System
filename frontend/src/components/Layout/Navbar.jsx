import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { LogOut, User, Building, KeyRound } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="glass-panel border-x-0 border-t-0 py-4 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <Building className="w-6 h-6 text-sky-400" />
        <span className="font-bold text-lg tracking-wider text-white">Apartment Management System</span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/credentials"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-xs font-semibold text-sky-300 hover:text-white transition-all"
          title="View Seed Accounts & Credentials"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Seed Accounts</span>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800/80">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-300">{user?.email}</span>
          <span className="text-[10px] font-bold tracking-widest text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded uppercase">
            {user?.role}
          </span>
        </div>

        <button
          onClick={logout}
          className="p-2 rounded-lg bg-slate-950/20 border border-slate-800/80 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-300 transition-all active:scale-95"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
