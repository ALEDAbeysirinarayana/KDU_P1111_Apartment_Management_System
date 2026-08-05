import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building, ArrowLeft, Loader2, Key, Info, CheckCircle2, ChevronDown, Check } from 'lucide-react';

export default function Register() {
  const { register, api } = useAuth();
  const navigate = useNavigate();

  // Form State Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('homeowner'); // 'homeowner' or 'tenant'
  const [fullName, setFullName] = useState('');
  const [nicOrPassport, setNicOrPassport] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [relationshipToOwner, setRelationshipToOwner] = useState('');

  // Building & Unit Dropdown States
  const [availableBlocks, setAvailableBlocks] = useState(['Block A', 'Block B', 'Block C', 'Block D']);
  const [allUnits, setAllUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Fetch available buildings and units from backend
  useEffect(() => {
    const fetchAvailableUnits = async () => {
      setLoadingUnits(true);
      try {
        const res = await api.get('/auth/available-units');
        if (res.data) {
          if (res.data.blocks && res.data.blocks.length > 0) {
            setAvailableBlocks(res.data.blocks);
          }
          if (res.data.units && Array.isArray(res.data.units)) {
            setAllUnits(res.data.units);
          }
        }
      } catch (err) {
        console.error('Failed to fetch available units:', err);
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchAvailableUnits();
  }, []);

  const filteredUnits = buildingName
    ? allUnits.filter(u => u.block_name === buildingName)
    : [];

  // UI State
  const [confirmCorrect, setConfirmCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password Strength Evaluator
  const getPasswordStrength = (pass) => {
    if (!pass) return '';
    if (pass.length < 6) return 'too short';
    let score = 0;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (pass.length >= 8 && score >= 3) return 'strong';
    if (pass.length >= 6 && score >= 2) return 'medium';
    return 'weak';
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!confirmCorrect) {
      setErrorMsg('Please confirm that the submitted information is correct.');
      return;
    }

    setSubmitting(true);

    const payload = {
      email,
      password,
      role,
      fullName,
      nicOrPassport,
      phoneNumber,
      buildingName,
      unitNumber,
      vehicleNumber: vehicleNumber || undefined,
      ownerEmail: role === 'tenant' ? ownerEmail : undefined,
      relationshipToOwner: role === 'tenant' ? relationshipToOwner : undefined
    };

    const result = await register(payload);
    setSubmitting(false);

    if (result.success) {
      setSuccessMsg(result.message || 'Registration request submitted successfully!');
      // Clear form states
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setNicOrPassport('');
      setPhoneNumber('');
      setBuildingName('');
      setUnitNumber('');
      setVehicleNumber('');
      setOwnerEmail('');
      setRelationshipToOwner('');
      setConfirmCorrect(false);
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7fd] text-slate-900 flex flex-col justify-between p-4 md:p-8 font-sans select-none">
      
      {/* Top back navigation */}
      <div className="w-full max-w-[680px] mx-auto mt-2 mb-4">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>
      </div>

      {/* Main card */}
      <div className="flex-1 flex items-center justify-center w-full my-2">
        <div className="max-w-[680px] w-full bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-200/50 overflow-hidden flex flex-col">
          
          {/* Header Banner */}
          <div className="bg-[#133fbd] p-8 text-center text-white relative overflow-hidden">
            {/* Soft background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Create your Account</h1>
            <p className="text-sm text-blue-100/80 mt-2 font-medium max-w-md mx-auto leading-relaxed">
              Submit your details to request access to the Apartment Management System.
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 md:p-8">
            {successMsg ? (
              <div className="text-center py-10 px-4 animate-scaleIn">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-5" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Request Submitted!</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                  {role === 'tenant' 
                    ? 'Your registration request has been submitted. It must be approved by your Homeowner first, and then cleared by Property Management.' 
                    : 'Your registration request has been submitted and is currently pending review by Property Management.'}
                </p>
                <Link
                  to="/login"
                  className="inline-block py-2.5 px-6 rounded-lg bg-[#133fbd] hover:bg-[#0f3299] text-white font-semibold text-sm transition-all duration-150 shadow-md shadow-blue-900/10"
                >
                  Return to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Section 1: REGISTER AS */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-3 block">
                    Register As
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Homeowner Card */}
                    <div
                      onClick={() => setRole('homeowner')}
                      className={`border p-4 rounded-xl cursor-pointer flex items-start gap-3 relative transition-all duration-200 ${
                        role === 'homeowner'
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Building className="w-5 h-5 text-[#133fbd]" />
                      </div>
                      <div className="pr-6">
                        <h4 className="text-sm font-bold text-slate-800">Homeowner</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Your request will be reviewed by management.
                        </p>
                      </div>
                      <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        role === 'homeowner' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                      }`}>
                        {role === 'homeowner' && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                      </div>
                    </div>

                    {/* Tenant Card */}
                    <div
                      onClick={() => setRole('tenant')}
                      className={`border p-4 rounded-xl cursor-pointer flex items-start gap-3 relative transition-all duration-200 ${
                        role === 'tenant'
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Key className="w-5 h-5 text-[#133fbd]" />
                      </div>
                      <div className="pr-6">
                        <h4 className="text-sm font-bold text-slate-800">Tenant</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Your request must be approved by the homeowner and management.
                        </p>
                      </div>
                      <div className={`absolute top-4 right-4 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        role === 'tenant' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                      }`}>
                        {role === 'tenant' && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: IDENTITY DETAILS */}
                <div>
                  <div className="text-center mb-4 flex items-center gap-3">
                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Identity Details</span>
                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500 mb-1.5 block">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Julian Anderson"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all duration-200 font-medium text-sm"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    {/* NIC / Passport */}
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500 mb-1.5 block">NIC / Passport Number</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter ID number"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all duration-200 font-medium text-sm"
                        value={nicOrPassport}
                        onChange={(e) => setNicOrPassport(e.target.value)}
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500 mb-1.5 block">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="julian@example.com"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all duration-200 font-medium text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500 mb-1.5 block">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all duration-200 font-medium text-sm"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: PROPERTY ASSIGNMENT */}
                <div>
                  <div className="text-center mb-4 flex items-center gap-3">
                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Property Assignment</span>
                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Building Name */}
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500 mb-1.5 block">Apartment / Building Name</label>
                      <div className="relative">
                        <select
                          required
                          className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg transition-all duration-200 appearance-none font-medium text-sm cursor-pointer"
                          value={buildingName}
                          onChange={(e) => {
                            setBuildingName(e.target.value);
                            setUnitNumber('');
                          }}
                        >
                          <option value="" disabled>Select Building</option>
                          {availableBlocks.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Unit Number (Available Dropdown) */}
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500 mb-1.5 block">
                        Unit Number {buildingName ? `(Available in ${buildingName})` : ''}
                      </label>
                      <div className="relative">
                        {filteredUnits.length > 0 ? (
                          <>
                            <select
                              required
                              disabled={!buildingName}
                              className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg transition-all duration-200 appearance-none font-medium text-sm cursor-pointer disabled:opacity-50"
                              value={unitNumber}
                              onChange={(e) => setUnitNumber(e.target.value)}
                            >
                              <option value="" disabled>Select Unit</option>
                              {filteredUnits.map((u) => (
                                <option key={u.id || u.unit_number} value={u.unit_number}>
                                  Unit {u.unit_number} {u.type ? `(${u.type})` : ''} {u.status ? `• ${u.status}` : ''}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                          </>
                        ) : (
                          <input
                            type="text"
                            required
                            placeholder={!buildingName ? 'Select Building First' : loadingUnits ? 'Loading Units...' : 'e.g. A-12'}
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all duration-200 font-medium text-sm disabled:opacity-50"
                            value={unitNumber}
                            onChange={(e) => setUnitNumber(e.target.value)}
                          />
                        )}
                      </div>
                    </div>

                    {/* Vehicle Number - Spans full width */}
                    <div className="sm:col-span-2">
                      <label className="text-[10.5px] font-bold text-slate-500 mb-1.5 block">Vehicle Number (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. ABC-1234"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all duration-200 font-medium text-sm"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: TENANT SPECIFIC INFORMATION (Conditional) */}
                {role === 'tenant' && (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 md:p-5 space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
                      <Info className="w-3.5 h-3.5" />
                      <span>Tenant Specific Information</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Homeowner Email */}
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-500 mb-1.5 block">Homeowner Email</label>
                        <input
                          type="email"
                          required={role === 'tenant'}
                          placeholder="owner@example.com"
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all duration-200 font-medium text-sm"
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                        />
                      </div>

                      {/* Relationship */}
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-500 mb-1.5 block">Relationship to Homeowner</label>
                        <div className="relative">
                          <select
                            required={role === 'tenant'}
                            className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg transition-all duration-200 appearance-none font-medium text-sm cursor-pointer"
                            value={relationshipToOwner}
                            onChange={(e) => setRelationshipToOwner(e.target.value)}
                          >
                            <option value="" disabled>Select Relationship</option>
                            <option value="Family">Family</option>
                            <option value="Tenant/Sub-tenant">Tenant/Sub-tenant</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
                          </select>
                          <ChevronDown className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 5: SECURITY */}
                <div>
                  <div className="text-center mb-4 flex items-center gap-3">
                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Security</span>
                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Password */}
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500 mb-1.5 block">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all duration-200 font-medium text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      {password && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Strength:{' '}
                          <span className={`font-bold uppercase tracking-wider ${
                            passwordStrength === 'strong' ? 'text-emerald-500' :
                            passwordStrength === 'medium' ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {passwordStrength}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-500 mb-1.5 block">Confirm Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all duration-200 font-medium text-sm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmCorrect}
                      onChange={(e) => setConfirmCorrect(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 bg-slate-50 mt-0.5 cursor-pointer"
                    />
                    <span>I confirm that the above information is correct.</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  id="reg_submit"
                  type="submit"
                  disabled={submitting || !confirmCorrect}
                  className="w-full py-3 px-4 rounded-lg bg-[#133fbd] hover:bg-[#0f3299] active:scale-[0.985] text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-600/10 transition-all duration-150 disabled:opacity-50 cursor-pointer text-sm"
                >
                  {submitting ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <span>Submit Registration Request</span>
                  )}
                </button>
              </form>
            )}

            {/* Login Navigation Link */}
            <div className="text-center mt-6">
              <Link to="/login" className="text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors">
                Already have an account? Login
              </Link>
            </div>

            {/* Notice Alert Box */}
            <div className="mt-7 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start gap-2.5 text-left text-[11px] text-slate-500 font-medium leading-relaxed">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                This request does not require sensitive private documents. Your data will be used only for account verification.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-[680px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/50 pt-4 pb-2 mt-6">
        <span className="text-[10px] text-slate-400/80 font-medium tracking-wide uppercase text-center sm:text-left">
          © 2026 Apartment Management System. All rights reserved.
        </span>
        <div className="flex items-center gap-4 text-[10px] text-slate-400/80 font-bold tracking-wide uppercase">
          <Link to="/login" className="hover:text-slate-600 transition-colors">
            Terms of Service
          </Link>
          <Link to="/login" className="hover:text-slate-600 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/login" className="hover:text-slate-600 transition-colors">
            Accessibility
          </Link>
          <Link to="/login" className="hover:text-slate-600 transition-colors">
            Contact Support
          </Link>
        </div>
      </footer>
    </div>
  );
}
