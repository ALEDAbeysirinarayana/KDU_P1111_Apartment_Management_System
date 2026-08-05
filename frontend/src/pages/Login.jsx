import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, AtSign, Loader2, Building, Eye, EyeOff, IdCard, ChevronDown, LogIn, KeyRound } from 'lucide-react';
import apartmentImage from '../assets/apartment_login.png';

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tenant');
  const [subRole, setSubRole] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const STAFF_SUB_ROLES = [
    { value: 'junior_staff',    label: 'Junior Staff' },
    { value: 'senior_staff',   label: 'Senior Staff' },
    { value: 'staff_admin',    label: 'Staff Admin' },
    { value: 'junior_manager', label: 'Junior Manager' },
    { value: 'senior_manager', label: 'Senior Manager' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      const loggedInUser = result.user;
      // Client-side role verification to ensure the chosen role matches the user's role in the DB
      if (loggedInUser.role !== role) {
        logout(); // Clear token and session
        setError(`Access denied. Account is not registered as a ${role.charAt(0).toUpperCase() + role.slice(1)}.`);
        setSubmitting(false);
      } else {
        setSubmitting(false);
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7fd] text-slate-900 flex flex-col justify-between p-3 sm:p-5 md:p-6 font-sans select-none">
      {/* Centered Main Box */}
      <div className="flex-1 flex items-center justify-center w-full my-2 sm:my-4">
        <div className="max-w-[980px] w-full bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-200/50 p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col md:flex-row gap-5 md:gap-6 lg:gap-8">
          
          {/* Left Side: Brand Panel */}
          <div className="hidden md:flex md:w-[45%] bg-[#133fbd] rounded-2xl p-5 lg:p-7 text-white flex-col justify-between relative overflow-hidden shadow-inner">
            {/* Soft decorative glow background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 text-white/95 font-semibold text-base tracking-tight">
                <Building className="w-4.5 h-4.5 text-blue-200" />
                <span>Aura Management</span>
              </div>
              <h1 className="text-2xl lg:text-[28px] font-black tracking-tight leading-[1.18] mt-5 lg:mt-6 text-white">
                Apartment Management System (AMS)
              </h1>
              <p className="text-xs text-blue-100/80 mt-2 font-medium leading-relaxed">
                Centralized management for residents, billing, maintenance, and facility bookings.
              </p>
            </div>

            {/* Middle: Apartment Image */}
            <div className="my-4 lg:my-5 relative group">
              <img
                src={apartmentImage}
                alt="Modern Apartment Building"
                className="w-full aspect-[16/10] max-h-44 object-cover rounded-xl shadow-md border border-white/10 group-hover:scale-[1.01] transition-transform duration-300"
              />
            </div>

            {/* Bottom Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-white/15">
              <div className="flex-1">
                <div className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">2,400+</div>
                <div className="text-[9px] text-blue-200 font-bold uppercase tracking-wider mt-0.5">Units Managed</div>
              </div>
              <div className="h-8 w-[1px] bg-white/20 mx-3"></div>
              <div className="flex-1 pl-2">
                <div className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">99.2%</div>
                <div className="text-[9px] text-blue-200 font-bold uppercase tracking-wider mt-0.5">Efficiency Rate</div>
              </div>
            </div>
          </div>

          {/* Right Side: Form Panel */}
          <div className="w-full md:w-[55%] p-2 sm:p-4 lg:p-6 flex flex-col justify-center">
            <div className="max-w-[390px] w-full mx-auto">
              {/* Header */}
              <div className="mb-5 flex justify-between items-start">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">Welcome back</h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Please enter your credentials to access the dashboard
                  </p>
                </div>
                {/* Discreet Access Icon */}
                <Link
                  to="/credentials"
                  title="Access Credentials"
                  className="p-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer shrink-0"
                >
                  <KeyRound className="w-4 h-4" />
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2 animate-shake">
                  <span className="mt-0.5">•</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                
                {/* Email / Username Field */}
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 tracking-wider uppercase mb-1 block">
                    Email / Username
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="login_email"
                      type="email"
                      required
                      placeholder="Enter your email or username"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 tracking-wider uppercase mb-1 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="login_password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Login As (Role Select) */}
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 tracking-wider uppercase mb-1 block">
                    Login As
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select
                      id="login_role"
                      required
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg transition-all duration-200 appearance-none font-medium text-xs sm:text-sm cursor-pointer"
                      value={role}
                      onChange={(e) => { setRole(e.target.value); setSubRole(''); }}
                    >
                      <option value="tenant">Tenant</option>
                      <option value="homeowner">Homeowner</option>
                      <option value="staff">Staff</option>
                      <option value="maintenance">Maintenance Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Staff Sub Role (conditional) */}
                {role === 'staff' && (
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-500 tracking-wider uppercase mb-1 block">
                      Staff Sub Role
                    </label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-3 w-4 h-4 text-blue-400" />
                      <select
                        id="login_sub_role"
                        required
                        className="w-full pl-9 pr-9 py-2 bg-blue-50 border border-blue-200 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg transition-all duration-200 appearance-none font-medium text-xs sm:text-sm cursor-pointer"
                        value={subRole}
                        onChange={(e) => setSubRole(e.target.value)}
                      >
                        <option value="">-- Select your sub role --</option>
                        <option value="junior_staff">Junior Staff</option>
                        <option value="senior_staff">Senior Staff</option>
                        <option value="staff_admin">Staff Admin</option>
                        <option value="junior_manager">Junior Manager</option>
                        <option value="senior_manager">Senior Manager</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-blue-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-0.5 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 bg-slate-50 cursor-pointer"
                    />
                    <span className="text-[11px]">Remember Me</span>
                  </label>
                  <Link to="/login" className="text-[11px] text-blue-700 hover:text-blue-800 transition-colors">
                    Forgot Password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  id="login_submit"
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 py-2 px-4 rounded-lg bg-[#133fbd] hover:bg-[#0f3299] active:scale-[0.985] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-600/10 transition-all duration-150 disabled:opacity-50 cursor-pointer text-xs sm:text-sm"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Login</span>
                      <LogIn className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="flex items-center justify-between my-3.5">
                <div className="h-[1px] bg-slate-200 flex-1"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase mx-3 tracking-wider">OR</span>
                <div className="h-[1px] bg-slate-200 flex-1"></div>
              </div>

              {/* Register Button */}
              <div>
                <Link
                  to="/register"
                  className="w-full py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold border border-slate-200/60 transition-all duration-150 text-center block text-xs sm:text-sm shadow-sm"
                >
                  Register Account
                </Link>
              </div>

              {/* Agreement Note */}
              <p className="text-[10px] text-slate-400/90 text-center mt-4 leading-relaxed">
                By logging in, you agree to our{' '}
                <Link to="/login" className="font-semibold text-slate-500 hover:underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/login" className="font-semibold text-slate-500 hover:underline">
                  Community Guidelines
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-[980px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200/50 pt-3 pb-1">
        <span className="text-[9.5px] text-slate-400/80 font-medium tracking-wide uppercase text-center sm:text-left">
          © 2026 Apartment Management System – Final Year Project
        </span>
        <div className="flex items-center gap-4 text-[9.5px] text-slate-400/80 font-bold tracking-wide uppercase">
          <Link to="/login" className="hover:text-slate-600 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/login" className="hover:text-slate-600 transition-colors">
            Terms of Service
          </Link>
          <Link to="/login" className="hover:text-slate-600 transition-colors">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}
