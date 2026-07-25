import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Building, FileText, Compass, Bell, Check, X, Plus, Trash2, 
  ShieldAlert, LayoutDashboard, Search, Settings, LogOut, Loader2, 
  Megaphone, Calendar, ClipboardList, Shield, ShieldAlert as AlertIcon, CreditCard, ChevronDown
} from 'lucide-react';

export default function AdminDashboard() {
  const { api, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // User Management State
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersMetrics, setUsersMetrics] = useState({ total: 0, active: 0, pending: 0, suspended: 0 });
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    role: 'homeowner',
    status: 'approved',
    full_name: '',
    phone_number: '',
    building_name: '',
    unit_number: '',
    vehicle_number: ''
  });

  // Resident Management State
  const [residentsTotal, setResidentsTotal] = useState(0);
  const [residentsPage, setResidentsPage] = useState(1);
  const [residentsMetrics, setResidentsMetrics] = useState({ total: 0, active: 0, vacated: 0, new_residents: 0 });
  const [residentSearch, setResidentSearch] = useState('');
  const [residentStatusFilter, setResidentStatusFilter] = useState('All');
  const [residentBlockFilter, setResidentBlockFilter] = useState('All');
  const [selectedResident, setSelectedResident] = useState(null);
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [showEditResidentModal, setShowEditResidentModal] = useState(false);
  const [newResidentForm, setNewResidentForm] = useState({
    email: '', password: '', role: 'homeowner', status: 'approved',
    full_name: '', phone_number: '', building_name: '', unit_number: '', vehicle_number: ''
  });
  const [editResidentForm, setEditResidentForm] = useState({
    id: '', email: '', role: 'homeowner', status: 'approved',
    full_name: '', phone_number: '', building_name: '', unit_number: '', vehicle_number: ''
  });

  // Stats Data
  const [dashboardStats, setDashboardStats] = useState(null);

  // Tab Data States
  const [pendingHomeowners, setPendingHomeowners] = useState([]);
  const [pendingTenants, setPendingTenants] = useState([]);
  const [residents, setResidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [bills, setBills] = useState([]);
  const [notices, setNotices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [facilityReservations, setFacilityReservations] = useState([]);

  // Form Input States
  const [newUnit, setNewUnit] = useState({ block_name: '', floor_number: '', unit_number: '' });
  const [allocation, setAllocation] = useState({ unitId: '', owner_id: '', tenant_id: '', parking_slot_id: '' });
  const [newBill, setNewBill] = useState({ unit_id: '', amount: '', description: '', due_date: '' });
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Dashboard Statistics and tab data
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const statsRes = await api.get('/auth/admin-dashboard-stats');
        setDashboardStats(statsRes.data);
      } else if (activeTab === 'approvals') {
        const approvalsRes = await api.get('/auth/pending-approvals');
        setPendingHomeowners(approvalsRes.data.homeowners || []);
        setPendingTenants(approvalsRes.data.tenants || []);

        const usersRes = await api.get('/auth/users', {
          params: {
            role: roleFilter === 'All' ? '' : roleFilter,
            status: statusFilter === 'All' ? '' : statusFilter,
            search: searchQuery,
            page: usersPage,
            limit: 10
          }
        });
        setUsers(usersRes.data.users || []);
        setUsersTotal(usersRes.data.total || 0);
        setUsersMetrics(usersRes.data.metrics || { total: 0, active: 0, pending: 0, suspended: 0 });
      } else if (activeTab === 'residents') {
        const res = await api.get('/auth/residents', {
          params: {
            status: residentStatusFilter === 'All' ? '' : residentStatusFilter,
            block: residentBlockFilter === 'All' ? '' : residentBlockFilter,
            search: residentSearch,
            page: residentsPage,
            limit: 10
          }
        });
        setResidents(res.data.residents || []);
        setResidentsTotal(res.data.total || 0);
        setResidentsMetrics(res.data.metrics || { total: 0, active: 0, vacated: 0, new_residents: 0 });
      } else if (activeTab === 'units') {
        const unitsRes = await api.get('/units');
        setUnits(unitsRes.data);
        const parkingRes = await api.get('/parking');
        setParkingSlots(parkingRes.data);
      } else if (activeTab === 'complaints') {
        const compRes = await api.get('/complaints');
        setComplaints(compRes.data);
      } else if (activeTab === 'facility') {
        const parkingRes = await api.get('/parking');
        setParkingSlots(parkingRes.data);
        const resRes = await api.get('/facilities/reservations');
        setFacilityReservations(resRes.data);
      } else if (activeTab === 'notices') {
        const noticesRes = await api.get('/notices');
        setNotices(noticesRes.data);
      } else if (activeTab === 'bills') {
        const billsRes = await api.get('/bills');
        setBills(billsRes.data);
        const unitsRes = await api.get('/units');
        setUnits(unitsRes.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setErrorMsg('Error loading details. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, roleFilter, statusFilter, searchQuery, usersPage, residentStatusFilter, residentBlockFilter, residentSearch, residentsPage]);

  // Handle Approvals
  const handleApproval = async (userId, action) => {
    try {
      const res = await api.post('/auth/approve', { userId, action });
      setSuccessMsg(res.data.message);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Approval action failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await api.put(`/auth/users/${userId}/status`, { status: newStatus });
      setSuccessMsg(`User status updated to ${newStatus}!`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update user status');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user account?")) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      setSuccessMsg("User account deleted successfully.");
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to delete user');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleAdminCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', newUserForm);
      setSuccessMsg("New user account created successfully!");
      setShowAddUserModal(false);
      setNewUserForm({
        email: '',
        password: '',
        role: 'homeowner',
        status: 'approved',
        full_name: '',
        phone_number: '',
        building_name: '',
        unit_number: '',
        vehicle_number: ''
      });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to create user');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Create Resident directly
  const handleCreateResident = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', newResidentForm);
      setSuccessMsg("Resident created successfully!");
      setShowAddResidentModal(false);
      setNewResidentForm({
        email: '', password: '', role: 'homeowner', status: 'approved',
        full_name: '', phone_number: '', building_name: '', unit_number: '', vehicle_number: ''
      });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to add resident');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Update Resident profile status or details
  const handleUpdateResidentProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/auth/users/${editResidentForm.id}/status`, {
        status: editResidentForm.status
      });
      setSuccessMsg("Resident profile updated successfully!");
      setShowEditResidentModal(false);
      setSelectedResident(null);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update resident profile');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Create Unit
  const handleCreateUnit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/units', newUnit);
      setSuccessMsg('Unit created successfully!');
      setNewUnit({ block_name: '', floor_number: '', unit_number: '' });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to create unit');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Save Unit Allocations
  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!allocation.unitId) return;
    try {
      await api.put(`/units/${allocation.unitId}`, {
        owner_id: allocation.owner_id || null,
        tenant_id: allocation.tenant_id || null,
        parking_slot_id: allocation.parking_slot_id || null
      });
      setSuccessMsg('Unit resource allocations saved!');
      setAllocation({ unitId: '', owner_id: '', tenant_id: '', parking_slot_id: '' });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Allocation update failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Issue Bill
  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bills', newBill);
      setSuccessMsg('Invoice generated successfully!');
      setNewBill({ unit_id: '', amount: '', description: '', due_date: '' });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Invoice generation failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Parking reservation approvals
  const handleParkingApprove = async (slotId, action) => {
    try {
      await api.put(`/parking/approve-guest/${slotId}`, { status: action === 'approve' ? 'approved' : 'rejected' });
      setSuccessMsg(`Guest parking reservation ${action}d successfully!`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update parking request');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Facility reservation approvals
  const handleFacilityApprove = async (resId, action) => {
    try {
      await api.put(`/facilities/reservations/${resId}/approve`, { status: action === 'approve' ? 'approved' : 'rejected' });
      setSuccessMsg(`Facility reservation request ${action}d!`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update reservation');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Create Notice
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notices', newNotice);
      setSuccessMsg('Notice board broadcast updated!');
      setNewNotice({ title: '', content: '' });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Notice publishing failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Update Complaint Status
  const handleUpdateComplaintStatus = async (compId, status) => {
    try {
      await api.put(`/complaints/${compId}/status`, { status });
      setSuccessMsg(`Complaint status updated to ${status}!`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Status update failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Assign staff to complaint
  const handleAssignStaff = async (compId, staffEmail) => {
    if (!staffEmail) return;
    try {
      // Find staff user ID by hardcoded seeds for simplicity or look up from staff list
      let staffId = 2; // Default to Staff ID
      if (staffEmail.includes('maintenance')) staffId = 3;
      else if (staffEmail.includes('admin')) staffId = 1;

      await api.put(`/complaints/${compId}/assign`, { assigned_staff_id: staffId });
      setSuccessMsg(`Assigned complaint to ${staffEmail}!`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Staff assignment failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Simulated Alert Action
  const triggerEmergencyAlert = () => {
    alert("System Alert: High-priority emergency notifications sent to all active resident accounts.");
    setSuccessMsg('Emergency alerts broadcast successfully.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Render visual doughnut status segments for complaints
  const renderComplaintDoughnut = () => {
    const stats = dashboardStats?.complaintStatus || { emergency: 3, pending: 8, inProgress: 10, completed: 7 };
    const total = stats.emergency + stats.pending + stats.inProgress + stats.completed;
    
    if (total === 0) {
      return (
        <div className="w-28 h-28 rounded-full border-4 border-slate-100 flex items-center justify-center text-slate-400 text-xs">
          No complaints
        </div>
      );
    }

    const size = 100;
    const radius = 38;
    const circ = 2 * Math.PI * radius; // ~238.7
    
    const dashEmergency = (stats.emergency / total) * circ;
    const dashPending = (stats.pending / total) * circ;
    const dashInProgress = (stats.inProgress / total) * circ;
    const dashCompleted = (stats.completed / total) * circ;

    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
          {/* Completed - Green */}
          <circle
            cx={size/2}
            cy={size/2}
            r={radius}
            fill="transparent"
            stroke="#10b981"
            strokeWidth="8"
            strokeDasharray={`${dashCompleted} ${circ - dashCompleted}`}
            strokeDashoffset={0}
          />
          {/* In Progress - Blue */}
          <circle
            cx={size/2}
            cy={size/2}
            r={radius}
            fill="transparent"
            stroke="#3b82f6"
            strokeWidth="8"
            strokeDasharray={`${dashInProgress} ${circ - dashInProgress}`}
            strokeDashoffset={-dashCompleted}
          />
          {/* Pending - Orange */}
          <circle
            cx={size/2}
            cy={size/2}
            r={radius}
            fill="transparent"
            stroke="#f59e0b"
            strokeWidth="8"
            strokeDasharray={`${dashPending} ${circ - dashPending}`}
            strokeDashoffset={-(dashCompleted + dashInProgress)}
          />
          {/* Emergency - Red */}
          <circle
            cx={size/2}
            cy={size/2}
            r={radius}
            fill="transparent"
            stroke="#ef4444"
            strokeWidth="8"
            strokeDasharray={`${dashEmergency} ${circ - dashEmergency}`}
            strokeDashoffset={-(dashCompleted + dashInProgress + dashPending)}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-800">{total}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
        </div>
      </div>
    );
  };

  // Render visual booking status bar heights
  const renderBookingBars = () => {
    const stats = dashboardStats?.bookingStatus || { approved: 12, pending: 9, rejected: 2 };
    const maxVal = Math.max(1, stats.approved, stats.pending, stats.rejected);

    const approvedPct = (stats.approved / maxVal) * 100;
    const pendingPct = (stats.pending / maxVal) * 100;
    const rejectedPct = (stats.rejected / maxVal) * 100;

    return (
      <div className="flex items-end justify-around h-28 w-full pt-2">
        <div className="flex flex-col items-center gap-1 w-10">
          <span className="text-[10px] font-bold text-slate-600">{stats.approved}</span>
          <div 
            style={{ height: `${approvedPct * 0.55}px` }} 
            className="w-5 bg-emerald-500 rounded-t-sm min-h-[4px] transition-all duration-300"
          ></div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Apprvd</span>
        </div>
        <div className="flex flex-col items-center gap-1 w-10">
          <span className="text-[10px] font-bold text-slate-600">{stats.pending}</span>
          <div 
            style={{ height: `${pendingPct * 0.55}px` }} 
            className="w-5 bg-amber-500 rounded-t-sm min-h-[4px] transition-all duration-300"
          ></div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pend</span>
        </div>
        <div className="flex flex-col items-center gap-1 w-10">
          <span className="text-[10px] font-bold text-slate-600">{stats.rejected}</span>
          <div 
            style={{ height: `${rejectedPct * 0.55}px` }} 
            className="w-5 bg-red-500 rounded-t-sm min-h-[4px] transition-all duration-300"
          ></div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rej</span>
        </div>
      </div>
    );
  };

  // Helper values for display
  const adminDisplayName = user?.email 
    ? user.email.split('@')[0].split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Alexander Pierce';
  const adminRoleLabel = user?.role === 'admin' ? 'Super Admin' : 'Staff Admin';
  const metrics = dashboardStats?.metrics || {
    totalUnits: 0,
    occupiedUnits: 0,
    totalResidents: 0,
    pendingUserApprovals: 0,
    activeComplaints: 0,
    emergencyComplaints: 0,
    pendingFacilityBookings: 0,
    overduePayments: 0
  };
  const usageStats = dashboardStats?.facilityUsage || { swimmingPool: 85, gymnasium: 62, clubhouse: 40 };

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
              <h1 className="font-extrabold text-base text-slate-800 leading-tight">AptManager</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin Console</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'approvals', label: 'User & Access', icon: ShieldAlert },
              { id: 'residents', label: 'Resident Management', icon: Users },
              { id: 'units', label: 'Unit & Inventory', icon: Building },
              { id: 'complaints', label: 'Complaints', icon: ClipboardList },
              { id: 'facility', label: 'Facility & Parking', icon: Compass },
              { id: 'notices', label: 'Notices', icon: Megaphone },
              { id: 'bills', label: 'Payments & Invoice', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full py-2 px-3 rounded-lg flex items-center gap-3 text-xs font-bold transition-all duration-150 text-left ${
                    isActive 
                      ? 'bg-[#133fbd] text-white shadow-md shadow-blue-900/10' 
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Card Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 uppercase">
              {adminDisplayName.charAt(0)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 tracking-tight">{adminDisplayName}</h4>
              <p className="text-[10px] text-slate-400 font-semibold">{adminRoleLabel}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
          {activeTab === 'approvals' ? (
            <h2 className="font-extrabold text-base text-slate-800 tracking-tight">User & Access Management</h2>
          ) : activeTab === 'residents' ? (
            <h2 className="font-extrabold text-base text-slate-800 tracking-tight">Resident Management</h2>
          ) : (
            /* Search bar */
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search operational records..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none text-slate-800 focus:border-blue-600 focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {activeTab === 'approvals' && (
              <button 
                onClick={() => setShowAddUserModal(true)}
                className="py-1.5 px-3 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add New User</span>
              </button>
            )}

            {activeTab === 'residents' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    alert("Simulated Action: Resident list data exported to CSV format successfully.");
                  }}
                  className="py-1.5 px-3.5 bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer transition shadow-sm active:scale-95"
                >
                  Export
                </button>
                <button 
                  onClick={() => setShowAddResidentModal(true)}
                  className="py-1.5 px-3 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Resident</span>
                </button>
              </div>
            )}

            {/* Notification bell */}
            <button className="relative p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Divider line */}
            <div className="h-8 w-[1px] bg-slate-200"></div>

            {/* Profile Avatar Mode */}
            <div className="flex items-center gap-2.5 text-right">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Admin Panel</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Operational Mode</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm shadow-blue-600/10">
                A
              </div>
            </div>
          </div>
        </header>

        {/* 3. Main Workspace Area */}
        <main className="p-6 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* Status Banners */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-red-55/10 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span>•</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* 3.1 activeTab = DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Dashboard Intro */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Operational Dashboard</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Real-time oversight of apartment maintenance and administrative tasks.</p>
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-white border border-slate-200 px-2.5 py-1 rounded">
                  Last updated: Just now
                </div>
              </div>

              {/* QUICK ADMIN ACTIONS */}
              <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
                <h3 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-4">Quick Admin Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <button onClick={() => setActiveTab('approvals')} className="p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 hover:border-blue-200 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition">
                    <Users className="w-5 h-5 text-blue-600 mb-2" />
                    <span className="text-xs font-bold text-blue-700">Approve New Users</span>
                  </button>
                  <button onClick={() => setActiveTab('bills')} className="p-4 bg-purple-50/50 hover:bg-purple-50 border border-purple-100 hover:border-purple-200 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition">
                    <FileText className="w-5 h-5 text-purple-600 mb-2" />
                    <span className="text-xs font-bold text-purple-700">Generate Invoices</span>
                  </button>
                  <button onClick={triggerEmergencyAlert} className="p-4 bg-red-50/50 hover:bg-red-50 border border-red-100 hover:border-red-200 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition">
                    <Bell className="w-5 h-5 text-red-600 mb-2" />
                    <span className="text-xs font-bold text-red-700">Emergency Alerts</span>
                  </button>
                  <button onClick={() => setActiveTab('facility')} className="p-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition">
                    <Calendar className="w-5 h-5 text-emerald-600 mb-2" />
                    <span className="text-xs font-bold text-emerald-700">Approve Bookings</span>
                  </button>
                  <button onClick={() => setActiveTab('notices')} className="p-4 bg-amber-50/50 hover:bg-amber-50 border border-amber-100 hover:border-amber-200 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition">
                    <Megaphone className="w-5 h-5 text-amber-600 mb-2" />
                    <span className="text-xs font-bold text-amber-700">Post New Notice</span>
                  </button>
                </div>
              </div>

              {/* STATS COUNT GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Units */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">Total Units</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.totalUnits}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-slate-500" />
                  </div>
                </div>

                {/* Occupied Units */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">Occupied Units</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.occupiedUnits}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>

                {/* Total Residents */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">Total Residents</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.totalResidents}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                </div>

                {/* Pending User Approvals */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">Pending User Approvals</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.pendingUserApprovals}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-amber-500" />
                  </div>
                </div>

                {/* Active Complaints */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">Active Complaints</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.activeComplaints}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5 text-slate-500" />
                  </div>
                </div>

                {/* Emergency Complaints */}
                <div className="bg-[#ef4444] border border-red-500 p-5 rounded-2xl flex items-center justify-between shadow-sm text-white">
                  <div>
                    <span className="text-[9px] font-extrabold text-red-100 tracking-wider uppercase">Emergency Complaints</span>
                    <h3 className="text-2xl font-black mt-1">{metrics.emergencyComplaints}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <AlertIcon className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Pending Facility Bookings */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">Pending Facility Bookings</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.pendingFacilityBookings}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-purple-500" />
                  </div>
                </div>

                {/* Overdue Payments */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase">Overdue Payments</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{metrics.overduePayments}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-rose-500" />
                  </div>
                </div>
              </div>

              {/* THREE COLUMN DETAILS AND CHARTS AREA */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: Complaint & Facility Status Charts */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Complaint Status */}
                    <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
                      <h3 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-5">Complaint Status</h3>
                      <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                        {renderComplaintDoughnut()}
                        {/* Legend */}
                        <div className="space-y-2 text-xs font-semibold text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
                            <span>Emergency ({dashboardStats?.complaintStatus?.emergency || 0})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                            <span>Pending ({dashboardStats?.complaintStatus?.pending || 0})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                            <span>In Progress ({dashboardStats?.complaintStatus?.inProgress || 0})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>Completed ({dashboardStats?.complaintStatus?.completed || 0})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Facility Booking Status */}
                    <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-3">Facility Booking Status</h3>
                      </div>
                      {renderBookingBars()}
                    </div>
                  </div>

                  {/* Facility Usage Overview */}
                  <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Facility Usage Overview</h3>
                      <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">This Week</span>
                    </div>
                    <div className="space-y-4">
                      {/* Swimming pool */}
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                          <span className="uppercase tracking-wider">Swimming Pool</span>
                          <span>{usageStats.swimmingPool}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div style={{ width: `${usageStats.swimmingPool}%` }} className="h-full bg-blue-600 rounded-full transition-all duration-500"></div>
                        </div>
                      </div>
                      
                      {/* Gymnasium */}
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                          <span className="uppercase tracking-wider">Gymnasium</span>
                          <span>{usageStats.gymnasium}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div style={{ width: `${usageStats.gymnasium}%` }} className="h-full bg-blue-800 rounded-full transition-all duration-500"></div>
                        </div>
                      </div>

                      {/* Clubhouse */}
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                          <span className="uppercase tracking-wider">Clubhouse</span>
                          <span>{usageStats.clubhouse}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div style={{ width: `${usageStats.clubhouse}%` }} className="h-full bg-indigo-900 rounded-full transition-all duration-500"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Recent System Activities */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-5">Recent System Activities</h3>
                    <div className="space-y-4">
                      {(!dashboardStats?.activities || dashboardStats.activities.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">No recent system records.</p>
                      ) : (
                        dashboardStats.activities.map((act) => (
                          <div key={act.id} className="flex gap-3 relative">
                            {/* Icon column */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${
                                act.badgeType === 'urgent' ? 'bg-red-50 border-red-100 text-red-500' :
                                act.badgeType === 'info' ? 'bg-blue-50 border-blue-100 text-blue-500' :
                                act.badgeType === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                                'bg-slate-100 border-slate-200 text-slate-500'
                              }`}>
                                {act.id.startsWith('complaint') ? <ClipboardList className="w-4 h-4" /> :
                                 act.id.startsWith('reg') ? <Users className="w-4 h-4" /> :
                                 act.id.startsWith('bill') ? <CreditCard className="w-4 h-4" /> :
                                 <Megaphone className="w-4 h-4" />}
                              </div>
                            </div>
                            
                            {/* Info column */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-slate-800 leading-none">{act.title}</h4>
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded leading-none ${
                                  act.badgeType === 'urgent' ? 'bg-red-100 text-red-700' :
                                  act.badgeType === 'info' ? 'bg-blue-100 text-blue-700' :
                                  act.badgeType === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-slate-200 text-slate-700'
                                }`}>
                                  {act.badge}
                                </span>
                              </div>
                              <p className="text-[11px] font-medium text-slate-500 mt-1 leading-normal truncate">{act.message}</p>
                              <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">
                                {new Date(act.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('approvals')} className="w-full mt-6 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition text-center">
                    View Full Activity Log
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* 3.2 activeTab = APPROVALS (User & Access) */}
          {activeTab === 'approvals' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Left Column (Metrics, filters, table, pagination) */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Users</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{usersMetrics.total.toLocaleString()}</h3>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Active Users</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{usersMetrics.active.toLocaleString()}</h3>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm border-l-4 border-l-amber-500 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{usersMetrics.pending}</h3>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5 text-amber-500" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Suspended Accounts</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{usersMetrics.suspended}</h3>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                      <X className="w-5 h-5 text-rose-500" />
                    </div>
                  </div>
                </div>

                {/* Filters card */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email or unit..."
                      className="w-full bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs transition-all"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setUsersPage(1); }}
                    />
                  </div>

                  <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
                    <div className="relative w-full sm:w-36">
                      <select
                        className="w-full pl-3 pr-10 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setUsersPage(1); }}
                      >
                        <option value="All">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="homeowner">Homeowner</option>
                        <option value="tenant">Tenant</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative w-full sm:w-36">
                      <select
                        className="w-full pl-3 pr-10 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setUsersPage(1); }}
                      >
                        <option value="All">All Status</option>
                        <option value="approved">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setRoleFilter('All');
                        setStatusFilter('All');
                        setUsersPage(1);
                      }}
                      className="text-xs font-extrabold text-blue-700 hover:text-blue-500 hover:underline cursor-pointer transition select-none ml-2"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* Users Inventory Table */}
                <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-3.5 pl-6 w-12"><input type="checkbox" className="rounded border-slate-300" /></th>
                          <th className="py-3.5 font-semibold">User Name</th>
                          <th className="py-3.5 font-semibold">Role</th>
                          <th className="py-3.5 font-semibold">Unit</th>
                          <th className="py-3.5 font-semibold">Email</th>
                          <th className="py-3.5 font-semibold">Status</th>
                          <th className="py-3.5 text-right pr-6 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-8 text-center text-slate-400 italic">No registered users matched the active filters.</td>
                          </tr>
                        ) : (
                          users.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/50">
                              <td className="py-3 pl-6"><input type="checkbox" className="rounded border-slate-300" /></td>
                              <td className="py-3 font-bold text-slate-800 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] flex items-center justify-center uppercase shrink-0">
                                  {u.full_name ? u.full_name.charAt(0) : u.email.charAt(0)}
                                </div>
                                <span>{u.full_name || 'N/A'}</span>
                              </td>
                              <td className="py-3 capitalize font-semibold">{u.role}</td>
                              <td className="py-3 font-bold text-slate-700">
                                {u.building_name && u.unit_number ? `${u.building_name}-${u.unit_number}` : u.unit_number || '—'}
                              </td>
                              <td className="py-3 font-medium">{u.email}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  u.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  u.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {u.status === 'approved' ? 'ACTIVE' : u.status}
                                </span>
                              </td>
                              <td className="py-3 text-right pr-6 space-x-2">
                                {u.status !== 'approved' && (
                                  <button
                                    onClick={() => handleUpdateStatus(u.id, 'approved')}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/50 text-[10px] font-bold rounded cursor-pointer transition"
                                    title="Activate/Approve Account"
                                  >
                                    Activate
                                  </button>
                                )}
                                {u.status === 'approved' && (
                                  <button
                                    onClick={() => handleUpdateStatus(u.id, 'suspended')}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200/50 text-[10px] font-bold rounded cursor-pointer transition"
                                    title="Suspend Account"
                                  >
                                    Suspend
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 text-[10px] font-bold rounded cursor-pointer transition"
                                  title="Delete User"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination footer */}
                  {usersTotal > 10 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Showing {((usersPage - 1) * 10) + 1}-{Math.min(usersPage * 10, usersTotal)} of {usersTotal} users</span>
                      <div className="flex gap-1">
                        <button
                          disabled={usersPage === 1}
                          onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                          className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          disabled={usersPage * 10 >= usersTotal}
                          onClick={() => setUsersPage(p => p + 1)}
                          className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Sidebar Column (Pending Registrations Approvals Feed) */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Pending registrations feed */}
                <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Pending Registration</h3>
                    <span className="text-[10px] font-black bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingHomeowners.length + pendingTenants.length}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {pendingHomeowners.map((owner) => (
                      <div key={owner.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-black text-xs flex items-center justify-center uppercase shrink-0">
                            {owner.full_name ? owner.full_name.charAt(0) : 'H'}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 leading-tight">{owner.full_name || 'N/A'}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                              {owner.building_name ? `${owner.building_name}-${owner.unit_number}` : 'Homeowner'}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproval(owner.id, 'approve')}
                            className="flex-1 py-1.5 bg-[#133fbd] hover:bg-[#0f3299] text-white text-[10px] font-bold rounded-lg cursor-pointer transition text-center shadow-sm"
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => handleApproval(owner.id, 'reject')}
                            className="flex-1 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg cursor-pointer transition text-center"
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    ))}

                    {pendingTenants.map((tenant) => (
                      <div key={tenant.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center uppercase shrink-0">
                            {tenant.full_name ? tenant.full_name.charAt(0) : 'T'}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 leading-tight">{tenant.full_name || 'N/A'}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                              {tenant.building_name ? `${tenant.building_name}-${tenant.unit_number}` : 'Tenant'}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproval(tenant.id, 'approve')}
                            className="flex-1 py-1.5 bg-[#133fbd] hover:bg-[#0f3299] text-white text-[10px] font-bold rounded-lg cursor-pointer transition text-center shadow-sm"
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => handleApproval(tenant.id, 'reject')}
                            className="flex-1 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg cursor-pointer transition text-center"
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    ))}

                    {pendingHomeowners.length === 0 && pendingTenants.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic text-center py-4">No pending user registrations.</p>
                    )}
                  </div>

                  <button 
                    onClick={() => { setStatusFilter('pending'); setUsersPage(1); }}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg cursor-pointer transition text-center border border-slate-200/60 tracking-wider uppercase"
                  >
                    VIEW ALL REQUESTS
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* 3.3 activeTab = RESIDENTS */}
          {activeTab === 'residents' && (
            <div className={`grid grid-cols-1 ${selectedResident ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-6 items-start`}>
              
              {/* Main Table Area */}
              <div className={`${selectedResident ? 'lg:col-span-3' : 'lg:col-span-1'} space-y-6`}>
                
                {/* Metrics Cards Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Residents</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{residentsMetrics.total.toLocaleString()}</h3>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Active Residents</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{residentsMetrics.active.toLocaleString()}</h3>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm border-l-4 border-l-rose-500 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Vacated (30 Days)</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{residentsMetrics.vacated}</h3>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                      <X className="w-5 h-5 text-rose-500" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">New This Month</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{residentsMetrics.new_residents}</h3>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                </div>

                {/* Filter Controls Card */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email or phone..."
                      className="w-full bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs transition-all"
                      value={residentSearch}
                      onChange={(e) => { setResidentSearch(e.target.value); setResidentsPage(1); }}
                    />
                  </div>

                  <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
                    <div className="relative w-full sm:w-36">
                      <select
                        className="w-full pl-3 pr-10 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                        value={residentStatusFilter}
                        onChange={(e) => { setResidentStatusFilter(e.target.value); setResidentsPage(1); }}
                      >
                        <option value="All">Status: All</option>
                        <option value="approved">Active</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Vacated</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative w-full sm:w-36">
                      <select
                        className="w-full pl-3 pr-10 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                        value={residentBlockFilter}
                        onChange={(e) => { setResidentBlockFilter(e.target.value); setResidentsPage(1); }}
                      >
                        <option value="All">Unit: All</option>
                        <option value="Block A">Block A</option>
                        <option value="Block B">Block B</option>
                        <option value="Block C">Block C</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <button 
                      onClick={() => {
                        setResidentSearch('');
                        setResidentStatusFilter('All');
                        setResidentBlockFilter('All');
                        setResidentsPage(1);
                      }}
                      className="text-xs font-extrabold text-blue-700 hover:text-blue-500 hover:underline cursor-pointer transition select-none ml-2"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Table Grid */}
                <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 min-w-[750px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-3.5 pl-6 w-12"><input type="checkbox" className="rounded border-slate-300" /></th>
                          <th className="py-3.5 font-semibold">Resident Name</th>
                          <th className="py-3.5 font-semibold">Unit</th>
                          <th className="py-3.5 font-semibold">Block</th>
                          <th className="py-3.5 font-semibold">Contact</th>
                          <th className="py-3.5 font-semibold">Move In Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {residents.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-8 text-center text-slate-400 italic">No approved residents matched the filters.</td>
                          </tr>
                        ) : (
                          residents.map((r) => {
                            const isSelected = selectedResident?.id === r.id;
                            return (
                              <tr 
                                key={r.id} 
                                onClick={() => setSelectedResident(r)}
                                className={`cursor-pointer transition ${isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50/50'}`}
                              >
                                <td className="py-3.5 pl-6"><input type="checkbox" className="rounded border-slate-300" checked={isSelected} readOnly /></td>
                                <td className="py-3.5 font-bold text-slate-800 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-200 to-amber-500 text-slate-900 font-extrabold text-xs flex items-center justify-center uppercase shrink-0 shadow-xs">
                                    {r.full_name ? r.full_name.charAt(0) : r.email.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="block leading-tight text-slate-800 font-bold">{r.full_name || 'N/A'}</span>
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{r.role}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 font-extrabold text-slate-700">{r.unit_number || 'A-204'}</td>
                                <td className="py-3.5 font-medium">{r.building_name || 'Block A'}</td>
                                <td className="py-3.5">
                                  <span className="block font-medium text-slate-700">{r.email}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{r.phone_number || '+1 234 567 890'}</span>
                                </td>
                                <td className="py-3.5 text-slate-500 font-medium">
                                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination footer */}
                  {residentsTotal > 10 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Showing {((residentsPage - 1) * 10) + 1}-{Math.min(residentsPage * 10, residentsTotal)} of {residentsTotal} residents</span>
                      <div className="flex gap-1">
                        <button
                          disabled={residentsPage === 1}
                          onClick={() => setResidentsPage(p => Math.max(1, p - 1))}
                          className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          disabled={residentsPage * 10 >= residentsTotal}
                          onClick={() => setResidentsPage(p => p + 1)}
                          className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Sidebar Drawer: Resident Profile Details */}
              {selectedResident && (
                <div className="lg:col-span-1 bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 space-y-6 relative animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-800 text-sm">Resident Profile</h3>
                    <button 
                      onClick={() => setSelectedResident(null)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Profile Header Card */}
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-300 via-amber-400 to-amber-600 text-slate-900 font-black text-2xl flex items-center justify-center shadow-md uppercase">
                      {selectedResident.full_name ? selectedResident.full_name.charAt(0) : selectedResident.email.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">{selectedResident.full_name || 'Resident Profile'}</h4>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase mt-1 ${
                        selectedResident.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {selectedResident.status === 'approved' ? 'ACTIVE RESIDENT' : selectedResident.status}
                      </span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Contact Information</span>
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs font-semibold">
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <span className="w-4 h-4 text-slate-400">✉</span>
                        <span className="truncate">{selectedResident.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <span className="w-4 h-4 text-slate-400">📞</span>
                        <span>{selectedResident.phone_number || '+1 234 567 890'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Unit Details */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Unit Details</span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Unit No.</span>
                        <span className="font-extrabold text-slate-800">{selectedResident.unit_number || 'A-204'}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Block</span>
                        <span className="font-extrabold text-slate-800">{selectedResident.building_name || 'Block A'}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Type</span>
                        <span className="font-extrabold text-slate-800">2 Bedroom</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Move-in Date</span>
                        <span className="font-extrabold text-slate-800">
                          {new Date(selectedResident.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Payment Status</span>
                    {Number(selectedResident.outstanding_amount || 0) === 0 ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between">
                        <span>All dues cleared</span>
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 border border-rose-200/60 rounded-xl text-rose-800 text-xs font-bold flex items-center justify-between">
                        <span>Outstanding: ${Number(selectedResident.outstanding_amount).toFixed(2)}</span>
                        <X className="w-4 h-4 text-rose-600" />
                      </div>
                    )}
                  </div>

                  {/* Action triggers */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditResidentForm({
                          id: selectedResident.id,
                          email: selectedResident.email,
                          role: selectedResident.role,
                          status: selectedResident.status,
                          full_name: selectedResident.full_name || '',
                          phone_number: selectedResident.phone_number || '',
                          building_name: selectedResident.building_name || '',
                          unit_number: selectedResident.unit_number || '',
                          vehicle_number: selectedResident.vehicle_number || ''
                        });
                        setShowEditResidentModal(true);
                      }}
                      className="flex-1 py-2.5 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedResident.id)}
                      className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-red-600 rounded-lg cursor-pointer transition"
                      title="Remove Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* 3.4 activeTab = UNITS (Unit & Inventory) */}
          {activeTab === 'units' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form Column */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Create Unit */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Create New Unit</h3>
                  <form onSubmit={handleCreateUnit} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1.5">Building Block</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Block A"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                        value={newUnit.block_name}
                        onChange={(e) => setNewUnit({ ...newUnit, block_name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Floor</label>
                        <input
                          type="number"
                          required
                          placeholder="1"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                          value={newUnit.floor_number}
                          onChange={(e) => setNewUnit({ ...newUnit, floor_number: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Unit #</label>
                        <input
                          type="text"
                          required
                          placeholder="101"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                          value={newUnit.unit_number}
                          onChange={(e) => setNewUnit({ ...newUnit, unit_number: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Unit</span>
                    </button>
                  </form>
                </div>

                {/* Resource Allocations */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Allocate Resources</h3>
                  <form onSubmit={handleAllocate} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1.5">Select Unit</label>
                      <div className="relative">
                        <select
                          required
                          className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                          value={allocation.unitId}
                          onChange={(e) => setAllocation({ ...allocation, unitId: e.target.value })}
                        >
                          <option value="">-- Choose Unit --</option>
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.block_name} - Floor {u.floor_number} - Unit {u.unit_number}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1.5">Owner User ID</label>
                      <input
                        type="number"
                        placeholder="User ID (optional)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                        value={allocation.owner_id}
                        onChange={(e) => setAllocation({ ...allocation, owner_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1.5">Tenant User ID</label>
                      <input
                        type="number"
                        placeholder="User ID (optional)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                        value={allocation.tenant_id}
                        onChange={(e) => setAllocation({ ...allocation, tenant_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1.5">Parking Slot</label>
                      <div className="relative">
                        <select
                          className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                          value={allocation.parking_slot_id}
                          onChange={(e) => setAllocation({ ...allocation, parking_slot_id: e.target.value })}
                        >
                          <option value="">-- No Parking --</option>
                          {parkingSlots
                            .filter((p) => p.type === 'permanent')
                            .map((slot) => (
                              <option key={slot.id} value={slot.id}>
                                {slot.slot_number}
                              </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                    >
                      Save Allocations
                    </button>
                  </form>
                </div>
              </div>

              {/* Table Column */}
              <div className="lg:col-span-2 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 font-sans">Apartment Unit Registry</h3>
                {units.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No units registered.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Unit</th>
                          <th className="pb-3">Owner</th>
                          <th className="pb-3">Tenant</th>
                          <th className="pb-3">Parking</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {units.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 font-bold text-slate-800">
                              {u.block_name} - Floor {u.floor_number} - Unit {u.unit_number} (ID: {u.id})
                            </td>
                            <td className="py-3.5 text-slate-600">
                              {u.owner_email ? (
                                <span className="text-blue-700 font-semibold">{u.owner_email} <span className="text-slate-400 text-[10px]">(ID: {u.owner_id})</span></span>
                              ) : (
                                <span className="text-slate-400 italic">Unallocated</span>
                              )}
                            </td>
                            <td className="py-3.5 text-slate-600">
                              {u.tenant_email ? (
                                <span className="text-purple-700 font-semibold">{u.tenant_email} <span className="text-slate-400 text-[10px]">(ID: {u.tenant_id})</span></span>
                              ) : (
                                <span className="text-slate-400 italic">Vacant</span>
                              )}
                            </td>
                            <td className="py-3.5 text-blue-700 font-bold text-xs">
                              {u.parking_slot_number || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3.5 activeTab = COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="space-y-6">
              <div className="mb-4">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Active Maintenance Complaints</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Review, prioritize, and assign maintenance tickets to operational staff.</p>
              </div>

              <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                {complaints.length === 0 ? (
                  <p className="text-slate-400 text-xs italic text-center py-6">No complaints logged in system.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 min-w-[850px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Ticket ID</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Description</th>
                          <th className="pb-3">Priority</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Resident</th>
                          <th className="pb-3">Assigned Staff</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {complaints.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 font-bold text-slate-800">#Ticket-{c.id}</td>
                            <td className="py-3.5 font-bold text-slate-700">{c.category}</td>
                            <td className="py-3.5 text-slate-500 font-sans max-w-[200px] truncate" title={c.description}>
                              {c.description}
                            </td>
                            <td className="py-3.5 font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                                c.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-100' :
                                c.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {c.priority}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                c.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                                c.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-slate-500">{c.resident_email}</td>
                            <td className="py-3.5 text-slate-800">
                              {c.assigned_staff_email ? (
                                <span className="font-semibold text-slate-700">{c.assigned_staff_email}</span>
                              ) : (
                                <span className="text-slate-400 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3.5 text-right flex items-center justify-end gap-2">
                              {/* Assign Staff select */}
                              <select
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold outline-none cursor-pointer"
                                onChange={(e) => handleAssignStaff(c.id, e.target.value)}
                                defaultValue=""
                              >
                                <option value="" disabled>Assign To...</option>
                                <option value="staff@apartment.com">staff@apartment.com</option>
                                <option value="maintenance@apartment.com">maintenance@apartment.com</option>
                              </select>

                              {/* Toggle Status Buttons */}
                              {c.status !== 'resolved' && (
                                <button
                                  onClick={() => handleUpdateComplaintStatus(c.id, c.status === 'pending' ? 'in_progress' : 'resolved')}
                                  className="p-1 rounded bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                                  title={c.status === 'pending' ? "Mark In Progress" : "Resolve"}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3.6 activeTab = FACILITY (Facility & Parking) */}
          {activeTab === 'facility' && (
            <div className="space-y-6">
              
              <div className="mb-4">
                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Facility Bookings & Parking slots</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Review guest parking reservations, facility bookings, and manage permanent spots.</p>
              </div>

              {/* Facility Bookings Approvals */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Pending Common Area Facility Bookings</h3>
                {facilityReservations.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No bookings found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Facility Area</th>
                          <th className="pb-3">Resident Account</th>
                          <th className="pb-3">Scheduled Date</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {facilityReservations.map((res) => (
                          <tr key={res.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 font-bold text-slate-800">{res.facility_name}</td>
                            <td className="py-3.5 font-medium">{res.resident_email}</td>
                            <td className="py-3.5 text-slate-400 font-semibold">
                              {new Date(res.date).toLocaleDateString()}
                            </td>
                            <td className="py-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                res.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                res.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                'bg-red-50 text-red-700'
                              }`}>
                                {res.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-right flex items-center justify-end gap-1.5">
                              {res.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleFacilityApprove(res.id, 'approve')}
                                    className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/50 transition cursor-pointer"
                                    title="Approve Booking"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleFacilityApprove(res.id, 'reject')}
                                    className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 transition cursor-pointer"
                                    title="Reject Booking"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Guest Parking Reservations */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Guest Parking Reservations</h3>
                {parkingSlots.filter((p) => p.type === 'guest' && p.guest_date).length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No guest parking requests found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Slot #</th>
                          <th className="pb-3">Requesting Unit</th>
                          <th className="pb-3">Booking Date</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parkingSlots
                          .filter((p) => p.type === 'guest' && p.guest_date)
                          .map((slot) => (
                            <tr key={slot.id} className="hover:bg-slate-50/50">
                              <td className="py-3.5 font-bold text-blue-700">{slot.slot_number}</td>
                              <td className="py-3.5 font-medium">
                                {slot.block_name} - Unit {slot.unit_number}
                              </td>
                              <td className="py-3.5 text-slate-400">
                                {new Date(slot.guest_date).toLocaleDateString()}
                              </td>
                              <td className="py-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  slot.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                                  slot.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                  'bg-red-50 text-red-700'
                                }`}>
                                  {slot.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-right flex justify-end gap-1.5">
                                {slot.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleParkingApprove(slot.id, 'approve')}
                                      className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/50 cursor-pointer transition"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleParkingApprove(slot.id, 'reject')}
                                      className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 cursor-pointer transition"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Permanent Inventory */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Physical Parking Slots Inventory</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {parkingSlots
                    .filter((p) => !p.guest_date)
                    .map((slot) => (
                      <div key={slot.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-sm">
                        <div>
                          <span className="text-[9px] font-bold text-[#133fbd] tracking-wider uppercase">{slot.type}</span>
                          <h3 className="text-base font-black text-slate-800 mt-1">{slot.slot_number}</h3>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          {slot.unit_number ? (
                            <span className="text-xs text-emerald-600 font-bold">Unit {slot.block_name} - {slot.unit_number}</span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unallocated</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 3.7 activeTab = NOTICES */}
          {activeTab === 'notices' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form notice */}
              <div className="lg:col-span-1 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm h-fit">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Publish Announcement</h3>
                <form onSubmit={handleCreateNotice} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Notice Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Scheduled Maintenance"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                      value={newNotice.title}
                      onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Content Details</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe the notice content..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium font-sans"
                      value={newNotice.content}
                      onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                  >
                    Publish Notice
                  </button>
                </form>
              </div>

              {/* Lists notice */}
              <div className="lg:col-span-2 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Notice Board Broadcasts</h3>
                {notices.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No notices published yet.</p>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {notices.map((n) => (
                      <div key={n.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition duration-150 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-extrabold text-slate-800 text-xs">{n.title}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium font-sans">{n.content}</p>
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between">
                          <span>By: {n.author_email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3.8 activeTab = BILLS (Payments & Invoice) */}
          {activeTab === 'bills' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Invoice creation form */}
              <div className="lg:col-span-1 bg-white border border-[#eaeaea] p-6 rounded-2xl shadow-sm h-fit">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Issue New Invoice</h3>
                <form onSubmit={handleCreateBill} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Select Unit</label>
                    <div className="relative">
                      <select
                        required
                        className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                        value={newBill.unit_id}
                        onChange={(e) => setNewBill({ ...newBill, unit_id: e.target.value })}
                      >
                        <option value="">-- Choose Unit --</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.block_name} - Floor {u.floor_number} - Unit {u.unit_number}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="120.00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                      value={newBill.amount}
                      onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="Maintenance Fees / Utility"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                      value={newBill.description}
                      onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Due Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg transition-all text-xs font-medium"
                      value={newBill.due_date}
                      onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                  >
                    Generate Bill
                  </button>
                </form>
              </div>

              {/* Invoicing list */}
              <div className="lg:col-span-2 bg-white border border-[#eaeaea] p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Invoicing History</h3>
                {bills.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No invoices issued yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3">Unit</th>
                          <th className="pb-3">Description</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Due Date</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bills.map((bill) => (
                          <tr key={bill.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 font-bold text-slate-800">
                              {bill.block_name} - F{bill.floor_number} - Unit {bill.unit_number}
                            </td>
                            <td className="py-3.5 font-medium">{bill.description}</td>
                            <td className="py-3.5 text-slate-800 font-extrabold">${bill.amount}</td>
                            <td className="py-3.5 text-slate-400 font-semibold">
                              {new Date(bill.due_date).toLocaleDateString()}
                            </td>
                            <td className="py-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                bill.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {bill.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Add New User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Add New System User</h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleAdminCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newUserForm.full_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newUserForm.phone_number}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">User Role</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    >
                      <option value="homeowner">Homeowner</option>
                      <option value="tenant">Tenant</option>
                      <option value="maintenance">Maintenance Staff</option>
                      <option value="staff">Staff Admin</option>
                      <option value="admin">Super Admin</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Initial Status</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={newUserForm.status}
                      onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value })}
                    >
                      <option value="approved">Active</option>
                      <option value="pending">Pending Approval</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Building Block</label>
                  <input
                    type="text"
                    placeholder="e.g. Block A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newUserForm.building_name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, building_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Unit Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newUserForm.unit_number}
                    onChange={(e) => setNewUserForm({ ...newUserForm, unit_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Vehicle tag</label>
                  <input
                    type="text"
                    placeholder="e.g. KV-8921"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newUserForm.vehicle_number}
                    onChange={(e) => setNewUserForm({ ...newUserForm, vehicle_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add New Resident Modal */}
      {showAddResidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Add New Resident</h3>
              <button 
                onClick={() => setShowAddResidentModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateResident} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="resident@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newResidentForm.email}
                    onChange={(e) => setNewResidentForm({ ...newResidentForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newResidentForm.password}
                    onChange={(e) => setNewResidentForm({ ...newResidentForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="James Wilson"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newResidentForm.full_name}
                    onChange={(e) => setNewResidentForm({ ...newResidentForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 234 567 890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newResidentForm.phone_number}
                    onChange={(e) => setNewResidentForm({ ...newResidentForm, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Occupant Type</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={newResidentForm.role}
                      onChange={(e) => setNewResidentForm({ ...newResidentForm, role: e.target.value })}
                    >
                      <option value="homeowner">Homeowner</option>
                      <option value="tenant">Tenant</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Status</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={newResidentForm.status}
                      onChange={(e) => setNewResidentForm({ ...newResidentForm, status: e.target.value })}
                    >
                      <option value="approved">Active</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Vacated</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Building Block</label>
                  <input
                    type="text"
                    placeholder="Block A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newResidentForm.building_name}
                    onChange={(e) => setNewResidentForm({ ...newResidentForm, building_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Unit Number</label>
                  <input
                    type="text"
                    placeholder="A-204"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newResidentForm.unit_number}
                    onChange={(e) => setNewResidentForm({ ...newResidentForm, unit_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddResidentModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Create Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resident Profile Modal */}
      {showEditResidentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Edit Resident Profile</h3>
              <button 
                onClick={() => setShowEditResidentModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleUpdateResidentProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium"
                  value={editResidentForm.full_name}
                  onChange={(e) => setEditResidentForm({ ...editResidentForm, full_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Email (Read Only)</label>
                  <input
                    type="email"
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg text-xs font-medium cursor-not-allowed"
                    value={editResidentForm.email}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium"
                    value={editResidentForm.phone_number}
                    onChange={(e) => setEditResidentForm({ ...editResidentForm, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Occupant Status</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={editResidentForm.status}
                      onChange={(e) => setEditResidentForm({ ...editResidentForm, status: e.target.value })}
                    >
                      <option value="approved">Active Resident</option>
                      <option value="pending">Pending Approval</option>
                      <option value="rejected">Vacated / Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Unit Allocation</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium"
                    value={`${editResidentForm.building_name} - ${editResidentForm.unit_number}`}
                    onChange={(e) => {
                      const parts = e.target.value.split('-');
                      setEditResidentForm({
                        ...editResidentForm,
                        building_name: parts[0]?.trim() || editResidentForm.building_name,
                        unit_number: parts[1]?.trim() || editResidentForm.unit_number
                      });
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditResidentModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
