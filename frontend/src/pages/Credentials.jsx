import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  KeyRound,
  Search,
  CheckCircle2,
  Copy,
  LogIn,
  Building,
  UserCheck,
  Shield,
  Wrench,
  Home,
  User,
  ArrowLeft,
  Loader2,
  Sparkles,
  Phone,
  Car,
  Layers
} from 'lucide-react';

export default function Credentials() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('all');
  const [copiedField, setCopiedField] = useState(null);
  const [loggingInId, setLoggingInId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/auth/credentials`);
      if (res.data && res.data.credentials) {
        setCredentials(res.data.credentials);
      }
    } catch (err) {
      console.error('Failed to fetch credentials from API:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleQuickLogin = async (account) => {
    setLoggingInId(account.id);
    try {
      const result = await login(account.email, account.default_password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        alert(`Login failed: ${result.message}`);
      }
    } catch (error) {
      alert(`Login failed: ${error.message}`);
    } finally {
      setLoggingInId(null);
    }
  };

  // Filtering
  const filteredCredentials = credentials.filter((acc) => {
    let matchesTab = true;
    if (activeRole === 'approved') {
      matchesTab = acc.status === 'approved';
    } else if (activeRole === 'pending') {
      matchesTab = acc.status === 'pending';
    } else if (activeRole !== 'all') {
      matchesTab = acc.role.toLowerCase() === activeRole.toLowerCase();
    }

    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      (acc.full_name && acc.full_name.toLowerCase().includes(q)) ||
      (acc.email && acc.email.toLowerCase().includes(q)) ||
      (acc.role && acc.role.toLowerCase().includes(q)) ||
      (acc.status && acc.status.toLowerCase().includes(q)) ||
      (acc.unit_number && acc.unit_number.toLowerCase().includes(q)) ||
      (acc.building_name && acc.building_name.toLowerCase().includes(q)) ||
      (acc.phone_number && acc.phone_number.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return {
          bg: 'bg-purple-100 text-purple-700 border-purple-200',
          icon: <Shield className="w-3.5 h-3.5" />,
          label: 'Admin'
        };
      case 'staff':
        return {
          bg: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: <UserCheck className="w-3.5 h-3.5" />,
          label: 'Staff'
        };
      case 'maintenance':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Wrench className="w-3.5 h-3.5" />,
          label: 'Maintenance'
        };
      case 'homeowner':
        return {
          bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          icon: <Home className="w-3.5 h-3.5" />,
          label: 'Homeowner'
        };
      case 'tenant':
        return {
          bg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          icon: <User className="w-3.5 h-3.5" />,
          label: 'Tenant'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <User className="w-3.5 h-3.5" />,
          label: role
        };
    }
  };

  const counts = {
    all: credentials.length,
    approved: credentials.filter((c) => c.status === 'approved').length,
    pending: credentials.filter((c) => c.status === 'pending').length,
    admin: credentials.filter((c) => c.role === 'admin').length,
    staff: credentials.filter((c) => c.role === 'staff').length,
    maintenance: credentials.filter((c) => c.role === 'maintenance').length,
    homeowner: credentials.filter((c) => c.role === 'homeowner').length,
    tenant: credentials.filter((c) => c.role === 'tenant').length
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans select-none pb-12">
      {/* Header Banner */}
      <header className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-10 px-4 md:px-8 border-b border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login Page
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 border border-blue-400/30 rounded-xl">
                <KeyRound className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  System Test Seed Accounts & Access Credentials
                </h1>
                <p className="text-xs md:text-sm text-slate-300 mt-1 font-medium">
                  Retrieve and quick-login with 34 pre-configured seed accounts (24 Approved + 10 Pending Approval).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-800/80 backdrop-blur border border-slate-700/80 p-3 rounded-2xl">
            <div className="text-right px-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                Total Accounts
              </span>
              <span className="text-2xl font-black text-blue-400">{credentials.length}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700"></div>
            <div className="px-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                Pending Approvals
              </span>
              <span className="text-xl font-bold text-amber-400 flex items-center gap-1 mt-1">
                ⏳ {counts.pending} Pending
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        {/* Filters & Search Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 md:p-6 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Role & Status Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            {[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'approved', label: '✅ Approved', count: counts.approved },
              { key: 'pending', label: '⏳ Pending Approval', count: counts.pending },
              { key: 'admin', label: 'Admin', count: counts.admin },
              { key: 'staff', label: 'Staff', count: counts.staff },
              { key: 'maintenance', label: 'Maintenance', count: counts.maintenance },
              { key: 'homeowner', label: 'Homeowners', count: counts.homeowner },
              { key: 'tenant', label: 'Tenants', count: counts.tenant }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveRole(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeRole === tab.key
                    ? 'bg-[#133fbd] text-white shadow-md shadow-blue-900/10'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    activeRole === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 transition-all"
            />
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading seed user credentials...</p>
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <KeyRound className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No matching seed accounts found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filter selection.</p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCredentials.map((account) => {
              const badge = getRoleBadge(account.role);
              const isLoggingIn = loggingInId === account.id;
              const isPending = account.status === 'pending';

              return (
                <div
                  key={account.id}
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between group relative overflow-hidden ${
                    isPending ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200/80'
                  }`}
                >
                  {/* Top Section */}
                  <div>
                    {/* Header Row: Role & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.bg}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      {isPending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
                          ⏳ Pending Approval
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                    </div>

                    {/* Name & Unit */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center justify-between">
                      <span>{account.full_name || 'System User'}</span>
                      {account.unit_number && (
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {account.building_name ? `${account.building_name} - ` : ''}Unit {account.unit_number}
                        </span>
                      )}
                    </h3>

                    {/* Contact details */}
                    <div className="mt-3 space-y-2 text-xs font-medium text-slate-600">
                      {/* Email Row */}
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/70 p-2 rounded-xl">
                        <span className="font-mono text-[11.5px] text-slate-800 truncate pr-2">
                          {account.email}
                        </span>
                        <button
                          onClick={() => handleCopy(account.email, `email-${account.id}`)}
                          title="Copy Email"
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          {copiedField === `email-${account.id}` ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Password Row */}
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/70 p-2 rounded-xl">
                        <span className="font-mono text-[11.5px] text-slate-800 truncate pr-2">
                          Password: <strong className="text-blue-900">{account.default_password}</strong>
                        </span>
                        <button
                          onClick={() => handleCopy(account.default_password, `pass-${account.id}`)}
                          title="Copy Password"
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          {copiedField === `pass-${account.id}` ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Extra Info Pills */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                      {account.phone_number && (
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Phone className="w-3 h-3 text-slate-400" /> {account.phone_number}
                        </span>
                      )}
                      {account.vehicle_number && (
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Car className="w-3 h-3 text-slate-400" /> {account.vehicle_number}
                        </span>
                      )}
                      {account.relationship_to_owner && (
                        <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                          <Layers className="w-3 h-3 text-indigo-400" /> {account.relationship_to_owner}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleQuickLogin(account)}
                      disabled={isLoggingIn}
                      className="w-full py-2 px-3 rounded-xl bg-[#133fbd] hover:bg-[#0f3299] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.985] disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Quick Login as {badge.label}</span>
                          <LogIn className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
