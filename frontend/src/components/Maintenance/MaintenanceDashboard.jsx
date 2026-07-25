import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Wrench, CheckCircle, Clock, AlertTriangle, Play, LogOut, 
  Search, Bell, Settings, Building, ClipboardList, LayoutDashboard,
  Check, X, Plus, Eye, ChevronDown, CheckSquare, Sparkles, RefreshCw
} from 'lucide-react';

export default function MaintenanceDashboard() {
  const { api, user, logout } = useAuth();
  const [subTab, setSubTab] = useState('dashboard'); // 'dashboard' or 'tasks'
  const [complaints, setComplaints] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Input States
  const [updateForm, setUpdateForm] = useState({ id: '', status: 'in_progress', notes: '' });

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      setComplaints(Array.isArray(res.data) ? res.data : (res.data.complaints || []));
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      setErrorMsg('Failed to load work order complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      const res = await api.put(`/complaints/${complaintId}/status`, { status: newStatus });
      setSuccessMsg(res.data.message);
      fetchComplaints();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update ticket status');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleQuickUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateForm.id) {
      setErrorMsg('Please select or enter a valid Task ID.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    try {
      await api.put(`/complaints/${updateForm.id}/status`, { status: updateForm.status });
      setSuccessMsg(`Task #${updateForm.id} status updated to ${updateForm.status.replace('_', ' ')}!`);
      setUpdateForm({ id: '', status: 'in_progress', notes: '' });
      fetchComplaints();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Update failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Helper values dynamically calculated from real database complaints
  // Filter for this staff or show all active system complaints
  const myAssignedComplaints = complaints.filter(c => c.assigned_staff_id === user?.id || !c.assigned_staff_id);
  const emergencyComplaintsList = complaints.filter(c => c.priority === 'high' && c.status !== 'resolved');

  // Metrics
  const totalAssignedCount = complaints.filter(c => c.status !== 'resolved').length;
  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const emergencyCount = complaints.filter(c => c.priority === 'high' && c.status !== 'resolved').length;

  const employeeName = user?.email 
    ? user.email.split('@')[0].split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Alex Rivera';
  const employeeRole = user?.email?.includes('lead') || user?.email?.includes('senior') ? 'Senior Maintenance Lead' : 'Senior HVAC Specialist';

  // Filter list by search query
  const filteredComplaints = complaints.filter(c => 
    (c.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.resident_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(c.id).includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#f4f7fd] text-slate-800 flex font-sans select-none antialiased">
      
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between h-screen sticky top-0">
        <div>
          {/* Logo Branding */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#133fbd] flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-800 leading-tight">AMS Curator</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Console</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button className="w-full py-2 px-3 rounded-lg flex items-center gap-3 text-xs font-bold bg-[#133fbd] text-white shadow-md shadow-blue-900/10 text-left">
              <ClipboardList className="w-4.5 h-4.5 text-white" />
              <span>Work Orders</span>
            </button>
          </nav>
        </div>

        {/* Profile Card Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 uppercase">
              {employeeName.charAt(0)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-tight">{employeeName}</h4>
              <p className="text-[10px] text-slate-400 font-semibold">{employeeRole}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* 2. Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks or units..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none text-slate-800 focus:border-blue-600 focus:bg-white transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2.5 text-right">
              <div>
                <span className="text-xs font-bold text-slate-800 block">{employeeName}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Senior Tech</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                {employeeName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* 3. Sub-Header Horizontal Tab Navigation */}
        <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-4">
          <button 
            onClick={() => setSubTab('dashboard')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
            }`}
          >
            DASHBOARD
          </button>
          <button 
            onClick={() => setSubTab('tasks')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'tasks'
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
            }`}
          >
            MY TASKS
          </button>
        </div>

        {/* 4. Workspace Area */}
        <main className="p-6 flex-1 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          
          {errorMsg && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span>•</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* 4.1 SUB TAB = DASHBOARD */}
          {subTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Intro Title & Controls */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Maintenance Staff Dashboard</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">View assigned maintenance tasks and update repair progress.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={fetchComplaints}
                    className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Tasks</span>
                  </button>
                  <button 
                    onClick={() => {
                      const emergencyElement = document.getElementById('emergency-section');
                      if (emergencyElement) {
                        emergencyElement.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        alert("No emergency tickets currently assigned.");
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>View Emergency Tasks</span>
                  </button>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm border-l-4 border-l-red-500">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Assigned</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{String(totalAssignedCount).padStart(2, '0')}</h3>
                  <p className="text-[9px] text-red-500 font-bold mt-1">
                    {emergencyCount} High Priority
                  </p>
                </div>
                
                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Pending</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{String(pendingCount).padStart(2, '0')}</h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">Requires verification</p>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm border-l-4 border-l-blue-600">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">In Progress</span>
                  <h3 className="text-2xl font-black text-blue-600 mt-1">{String(inProgressCount).padStart(2, '0')}</h3>
                  <p className="text-[9px] text-blue-500 font-bold mt-1">Currently on-site</p>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Completed</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{String(resolvedCount).padStart(2, '0')}</h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">Total resolved tickets</p>
                </div>
              </div>

              {/* Main Grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Columns (Assigned tickets + Emergency warnings) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* My Assigned Complaints Table */}
                  <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">My Assigned Complaints</h3>
                    </div>
                    {myAssignedComplaints.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No tickets currently assigned.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead>
                            <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                              <th className="pb-2">ID</th>
                              <th className="pb-2">Category</th>
                              <th className="pb-2">Priority</th>
                              <th className="pb-2">Status</th>
                              <th className="pb-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {myAssignedComplaints.slice(0, 5).map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50/50">
                                <td className="py-2.5 font-bold text-blue-700">#CMP-{c.id}</td>
                                <td className="py-2.5 font-bold text-slate-700">{c.category}</td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${
                                    c.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                                    c.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-blue-50 text-blue-700 border-blue-100'
                                  }`}>
                                    {c.priority}
                                  </span>
                                </td>
                                <td className="py-2.5">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                    c.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                                    c.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                                    'bg-amber-50 text-amber-700'
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right">
                                  <button 
                                    onClick={() => {
                                      setUpdateForm({ id: String(c.id), status: c.status === 'pending' ? 'in_progress' : 'resolved', notes: '' });
                                      const formElement = document.getElementById('update-form-section');
                                      if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="text-[10px] font-bold text-[#133fbd] hover:underline"
                                  >
                                    Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Emergency Warning list */}
                  <div id="emergency-section" className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Active Emergency Complaints</span>
                    </h3>
                    {emergencyComplaintsList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No emergency active tickets.</p>
                    ) : (
                      <div className="space-y-3">
                        {emergencyComplaintsList.map((c) => (
                          <div key={c.id} className="p-4 bg-red-50/30 border border-red-100 rounded-xl flex justify-between items-center shadow-sm">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-800">{c.category} Ticket #{c.id}</h4>
                              <p className="text-[10px] text-slate-500 font-semibold font-sans">{c.description}</p>
                            </div>
                            <button
                              onClick={() => handleStatusUpdate(c.id, 'in_progress')}
                              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition shadow-sm"
                            >
                              Respond Now
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Columns (Update status + profile + timeline) */}
                <div className="space-y-6">
                  
                  {/* Quick Update status */}
                  <div id="update-form-section" className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Quick Status Update</h3>
                    <form onSubmit={handleQuickUpdateSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Task ID</label>
                        <div className="relative">
                          <select
                            required
                            className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                            value={updateForm.id}
                            onChange={(e) => setUpdateForm({ ...updateForm, id: e.target.value })}
                          >
                            <option value="">-- Select Active Task --</option>
                            {complaints.filter(c => c.status !== 'resolved').map((c) => (
                              <option key={c.id} value={c.id}>#CMP-{c.id} ({c.category})</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">New Status</label>
                        <div className="relative">
                          <select
                            required
                            className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                            value={updateForm.status}
                            onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                          >
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved (Completed)</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Progress Notes</label>
                        <textarea
                          rows={3}
                          placeholder="Describe current actions..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium font-sans"
                          value={updateForm.notes}
                          onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                      >
                        Submit Update
                      </button>
                    </form>
                  </div>

                  {/* Employee Special card */}
                  <div className="bg-[#133fbd] border border-blue-700 p-6 rounded-2xl shadow-md text-white space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-white text-lg">
                        {employeeName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm tracking-tight">{employeeName}</h4>
                        <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block mt-0.5">{employeeRole}</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-4 text-xs font-bold text-blue-100">
                      <div>
                        <span className="text-[9px] text-blue-300 uppercase block leading-none">Shift</span>
                        <span className="mt-1 block">08:00 - 17:00</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-blue-300 uppercase block leading-none">Efficiency</span>
                        <span className="mt-1 block">94% Rank</span>
                      </div>
                    </div>
                  </div>

                  {/* Today schedule */}
                  <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Today's Schedule</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oct 24</span>
                    </div>
                    <div className="space-y-4 relative pl-4 border-l border-slate-100">
                      {/* Event 1 */}
                      <div className="relative">
                        <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white"></span>
                        <span className="text-[9px] text-slate-400 font-bold">09:00 AM</span>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">Unit Inspection</h4>
                        <p className="text-[10px] text-slate-400 font-semibold font-sans mt-0.5">Leakage assessment</p>
                      </div>

                      {/* Event 2 */}
                      <div className="relative">
                        <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white"></span>
                        <span className="text-[9px] text-slate-400 font-bold">11:30 AM</span>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">Team Briefing</h4>
                        <p className="text-[10px] text-slate-400 font-semibold font-sans mt-0.5">Lobby maintenance office</p>
                      </div>

                      {/* Event 3 */}
                      <div className="relative">
                        <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-slate-300 rounded-full border-2 border-white"></span>
                        <span className="text-[9px] text-slate-400 font-bold">02:00 PM</span>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">HVAC Filter Change</h4>
                        <p className="text-[10px] text-slate-400 font-semibold font-sans mt-0.5">Tower 2 - Public areas</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* 4.2 SUB TAB = TASKS */}
          {subTab === 'tasks' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Assigned Maintenance Tasks</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Verify task logs, details, and submit progress update reports.</p>
                </div>
                <button 
                  onClick={() => setSubTab('dashboard')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard Overview</span>
                </button>
              </div>

              {/* Grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Columns (Table list + Quick update select) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Table */}
                  <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-800">Assigned Tasks Registry</h3>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">{totalAssignedCount} Active Tasks</span>
                    </div>
                    {filteredComplaints.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No tasks registered.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 min-w-[600px]">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                              <th className="pb-3">Task ID</th>
                              <th className="pb-3">Resident Account</th>
                              <th className="pb-3">Category</th>
                              <th className="pb-3">Priority</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3">Date Submitted</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredComplaints.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50/50">
                                <td className="py-3 font-bold text-blue-700">#CMP-{c.id}</td>
                                <td className="py-3 font-medium">{c.resident_email}</td>
                                <td className="py-3 font-bold text-slate-700">{c.category}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${
                                    c.priority === 'high' ? 'bg-red-55/10 text-red-500 border-red-200' :
                                    c.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    'bg-blue-55/10 text-blue-600 border-blue-200'
                                  }`}>
                                    {c.priority}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                    c.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                                    c.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                                    'bg-amber-50 text-amber-700'
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-400 font-semibold">
                                  {new Date(c.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Quick Update */}
                  <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">Quick Update Task Status</h3>
                    <form onSubmit={handleQuickUpdateSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 block mb-1.5">Select Task</label>
                          <div className="relative">
                            <select
                              required
                              className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                              value={updateForm.id}
                              onChange={(e) => setUpdateForm({ ...updateForm, id: e.target.value })}
                            >
                              <option value="">-- Choose Task --</option>
                              {complaints.filter(c => c.status !== 'resolved').map((c) => (
                                <option key={c.id} value={c.id}>#CMP-{c.id} ({c.category})</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-500 block mb-1.5">Update Status</label>
                          <div className="relative">
                            <select
                              required
                              className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                              value={updateForm.status}
                              onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                            >
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved (Completed)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Maintenance Notes</label>
                        <textarea
                          rows={3}
                          placeholder="Describe progress or any issues encountered..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium font-sans"
                          value={updateForm.notes}
                          onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                        />
                      </div>

                      <button
                        type="submit"
                        className="py-2 px-5 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm inline-block"
                      >
                        Update Task
                      </button>
                    </form>
                  </div>

                </div>

                {/* Right Columns (Work summary, pie progress wheel, emergencies) */}
                <div className="space-y-6">
                  
                  {/* Summary */}
                  <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Staff Work Summary</h3>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                        {employeeName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{employeeName}</h4>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-0.5 inline-block uppercase">AVAILABLE</span>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2 text-xs font-semibold text-slate-500">
                      <div className="flex justify-between">
                        <span>Tasks Today</span>
                        <span className="text-slate-800 font-bold">06</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completion Rate</span>
                        <span className="text-blue-600 font-bold">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Resolve Time</span>
                        <span className="text-slate-800 font-bold">3.2 hrs</span>
                      </div>
                    </div>
                  </div>

                  {/* Task Completion Progress wheel */}
                  <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider w-full text-left">Task Completion</h3>
                    
                    {/* SVG progress wheel */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg width="100" height="100" viewBox="0 0 100 100" className="rotate-[-90deg]">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#f1f5f9"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#133fbd"
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * 85) / 100}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-lg font-black text-slate-800">85%</span>
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Goal</span>
                      </div>
                    </div>

                    <div className="pt-2 w-full grid grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                      <div>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#133fbd] inline-block mr-1.5 shrink-0"></span>
                        <span>Completed (72)</span>
                      </div>
                      <div>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block mr-1.5 shrink-0"></span>
                        <span>Remaining (12)</span>
                      </div>
                    </div>
                  </div>

                  {/* Urgent list */}
                  <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center text-red-600">
                      <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Urgent Emergencies</span>
                      </h3>
                      <span className="text-[8px] font-extrabold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{emergencyCount} NEW</span>
                    </div>

                    <div className="space-y-3">
                      {emergencyComplaintsList.slice(0, 2).map((c) => (
                        <div key={c.id} className="p-3 bg-red-50/20 border border-red-100/50 rounded-xl space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">#CMP-{c.id}</span>
                            <span className="text-[8px] text-slate-400 font-bold">5m ago</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">{c.category}</h4>
                          <p className="text-[10px] text-slate-500 font-semibold font-sans leading-normal">{c.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
