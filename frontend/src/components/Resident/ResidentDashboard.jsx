import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ClipboardList, Compass, FileText, Plus, Users, 
  Bell, Settings, Check, X, Search, Calendar, User, Clock, CreditCard, 
  Lock, Megaphone, ShieldAlert, ChevronDown, ChevronRight, Wrench, Edit3, Building, LogOut,
  Phone, AlertTriangle, Filter, Upload, CheckCircle, Circle, Loader2
} from 'lucide-react';

export default function ResidentDashboard() {
  const { api, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Stats / Overview Data
  const [residentStats, setResidentStats] = useState(null);

  // Tab Data States
  const [myUnit, setMyUnit] = useState(null);
  const [bills, setBills] = useState([]);
  const [paymentMetrics, setPaymentMetrics] = useState({ totalInvoices: 0, totalPaid: 0, pendingAmount: 0, pendingCount: 0, overdueAmount: 0, overdueCount: 0, outstandingAmount: 0, nextDueDate: null, nextDueBillId: null, nextDueAmount: 0 });
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [billStatusFilter, setBillStatusFilter] = useState('All');
  const [payingBillId, setPayingBillId] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBillToPay, setSelectedBillToPay] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]); // available guest slots dropdown
  const [myParking, setMyParking] = useState([]); // user's active parking slots
  const [pendingTenants, setPendingTenants] = useState([]); // homeowner only

  // Complaint stats and filters
  const [complaintStats, setComplaintStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0, this_month: 0 });
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('All');
  const [complaintPriorityFilter, setComplaintPriorityFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);

  // Input states
  const [complaintForm, setComplaintForm] = useState({ category: 'Plumbing', subject_title: '', description: '', priority: 'medium', is_emergency: false });
  // Facility page state
  const [facilityList, setFacilityList] = useState([]);
  const [facilityStats, setFacilityStats] = useState({ totalBookings: 0, pendingBookings: 0, approvedBookings: 0, pendingVisitorParking: 0, approvedVisitorParking: 0 });
  const [parkingAllSlots, setParkingAllSlots] = useState([]);
  const [visitorRequests, setVisitorRequests] = useState([]);
  const [bookingForm, setBookingForm] = useState({ facility_name: '', date: '', purpose: '', participants: '', notes: '', time_slot: '', agreed: false });
  const [visitorParkingForm, setVisitorParkingForm] = useState({ slot_number: '', guest_date: '', visitor_name: '', visitor_vehicle: '', arrival_time: '', reason: '', agreed: false });
  const [parkingForm, setParkingForm] = useState({ slot_number: '', guest_date: '' });

  // Profile Edit Form States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone_number: '', vehicle_number: '' });

  // New Request popup shortcut
  const [showNewRequestMenu, setShowNewRequestMenu] = useState(false);

  // Community Events state
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch user unit details
      try {
        const unitRes = await api.get('/units/my-unit');
        setMyUnit(unitRes.data);
      } catch (err) {
        setMyUnit(null);
      }

      if (activeTab === 'dashboard') {
        const statsRes = await api.get('/auth/resident-dashboard-stats');
        setResidentStats(statsRes.data);
        
        try {
          const eventsRes = await api.get('/events');
          // Only show upcoming/open events
          const upcomingEvents = (eventsRes.data.events || []).filter(e => e.status !== 'Completed');
          setEvents(upcomingEvents);

          const myRegsRes = await api.get('/events/my-registrations');
          setRegisteredEvents(myRegsRes.data || []);
        } catch (e) {
          console.error("Failed to load events:", e);
        }
      } else if (activeTab === 'payments') {
        const billsRes = await api.get('/bills');
        const data = billsRes.data;
        setBills(Array.isArray(data) ? data : (data.bills || []));
        setPaymentMetrics(data.metrics || { totalInvoices: 0, totalPaid: 0, pendingAmount: 0, pendingCount: 0, overdueAmount: 0, overdueCount: 0, outstandingAmount: 0, nextDueDate: null, nextDueBillId: null, nextDueAmount: 0 });
        setPaymentTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      } else if (activeTab === 'complaints') {
        const [compRes, statsRes] = await Promise.all([
          api.get('/complaints'),
          api.get('/complaints/my-stats')
        ]);
        setComplaints(Array.isArray(compRes.data) ? compRes.data : (compRes.data.complaints || []));
        setComplaintStats(statsRes.data || { total: 0, pending: 0, in_progress: 0, resolved: 0, this_month: 0 });
        // Auto-select the most recent complaint for the status tracker
        const list = Array.isArray(compRes.data) ? compRes.data : (compRes.data.complaints || []);
        if (list.length > 0 && !selectedComplaint) setSelectedComplaint(list[0]);
      } else if (activeTab === 'facility') {
        const [resRes, statsRes, facRes, allParkRes] = await Promise.all([
          api.get('/facilities/reservations'),
          api.get('/facilities/stats'),
          api.get('/facilities'),
          api.get('/parking')
        ]);
        setReservations(Array.isArray(resRes.data) ? resRes.data : (resRes.data.reservations || []));
        setFacilityStats(statsRes.data || { totalBookings: 0, pendingBookings: 0, approvedBookings: 0, pendingVisitorParking: 0, approvedVisitorParking: 0 });
        setFacilityList(Array.isArray(facRes.data) ? facRes.data : []);
        setParkingAllSlots(Array.isArray(allParkRes.data) ? allParkRes.data : []);
        try {
          const visRes = await api.get('/parking/my-visitor-requests');
          setVisitorRequests(Array.isArray(visRes.data) ? visRes.data : []);
        } catch(e) { setVisitorRequests([]); }
        try {
          const myParkRes = await api.get('/parking/my-slots');
          setMyParking(Array.isArray(myParkRes.data) ? myParkRes.data : []);
        } catch(e) { setMyParking([]); }
      } else if (activeTab === 'notices') {
        const noticesRes = await api.get('/notices');
        setNotices(noticesRes.data.notices || []);
      } else if (activeTab === 'parking') {
        try {
          const parkRes = await api.get('/parking/my-slots');
          setMyParking(parkRes.data);
        } catch (e) {}

        const allParkRes = await api.get('/parking');
        // Filter unique guest slot templates
        const guestTemplates = [...new Set(allParkRes.data.filter(p => p.type === 'guest').map(p => p.slot_number))];
        setParkingSlots(guestTemplates);
      } else if (activeTab === 'tenants' && user.role === 'homeowner') {
        const approvalsRes = await api.get('/auth/pending-approvals');
        setPendingTenants(approvalsRes.data.tenants || []);
      }
    } catch (error) {
      console.error('Failed to load resident details:', error);
      setErrorMsg('Error loading information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);


  // Submit Complaint
  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    try {
      await api.post('/complaints', complaintForm);
      setSuccessMsg('Maintenance ticket filed successfully.');
      setComplaintForm({ category: 'Plumbing', subject_title: '', description: '', priority: 'medium', is_emergency: false });
      setShowComplaintForm(false);
      // Refresh complaint list and stats
      const [compRes, statsRes] = await Promise.all([
        api.get('/complaints'),
        api.get('/complaints/my-stats')
      ]);
      const list = Array.isArray(compRes.data) ? compRes.data : (compRes.data.complaints || []);
      setComplaints(list);
      setComplaintStats(statsRes.data || { total: 0, pending: 0, in_progress: 0, resolved: 0, this_month: 0 });
      if (list.length > 0) setSelectedComplaint(list[0]);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Ticket submission failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };


  // Request Facility Booking
  const handleReserve = async (e) => {
    e.preventDefault();
    if (!bookingForm.agreed) {
      setErrorMsg('Please agree to the facility usage guidelines before submitting.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    try {
      await api.post('/facilities/reserve', bookingForm);
      setSuccessMsg('Facility reservation request submitted. Pending review.');
      setBookingForm({ facility_name: '', date: '', purpose: '', participants: '', notes: '', time_slot: '', agreed: false });
      // Refresh in-place
      const [resRes, statsRes] = await Promise.all([
        api.get('/facilities/reservations'),
        api.get('/facilities/stats'),
      ]);
      setReservations(Array.isArray(resRes.data) ? resRes.data : (resRes.data.reservations || []));
      setFacilityStats(statsRes.data || {});
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Reservation failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Request Visitor Parking
  const handleVisitorParking = async (e) => {
    e.preventDefault();
    if (!visitorParkingForm.agreed) {
      setErrorMsg('Please accept the visitor parking terms before submitting.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    try {
      await api.post('/parking/request-guest', {
        slot_number: visitorParkingForm.slot_number,
        guest_date: visitorParkingForm.guest_date,
        visitor_name: visitorParkingForm.visitor_name,
        visitor_vehicle: visitorParkingForm.visitor_vehicle,
        arrival_time: visitorParkingForm.arrival_time,
        reason: visitorParkingForm.reason,
      });
      setSuccessMsg('Visitor parking request submitted. Pending approval.');
      setVisitorParkingForm({ slot_number: '', guest_date: '', visitor_name: '', visitor_vehicle: '', arrival_time: '', reason: '', agreed: false });
      // Refresh visitor requests and stats
      const [visRes, statsRes, allParkRes] = await Promise.all([
        api.get('/parking/my-visitor-requests'),
        api.get('/facilities/stats'),
        api.get('/parking'),
      ]);
      setVisitorRequests(Array.isArray(visRes.data) ? visRes.data : []);
      setFacilityStats(statsRes.data || {});
      setParkingAllSlots(Array.isArray(allParkRes.data) ? allParkRes.data : []);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Visitor parking request failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };


  // Pay a bill (resident)
  const handlePayBill = async (billId, method = 'Online Payment') => {
    setPayingBillId(billId);
    try {
      await api.put(`/bills/${billId}/pay`, { payment_method: method });
      setSuccessMsg('Payment successful! Your invoice has been marked as paid.');
      setShowPayModal(false);
      setSelectedBillToPay(null);
      // Refresh in-place
      const billsRes = await api.get('/bills');
      const data = billsRes.data;
      setBills(Array.isArray(data) ? data : (data.bills || []));
      setPaymentMetrics(data.metrics || {});
      setPaymentTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Payment failed. Please try again.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setPayingBillId(null);
    }
  };

  // Request Guest Parking
  const handleRequestParking = async (e) => {
    e.preventDefault();
    try {
      await api.post('/parking/request-guest', parkingForm);
      setSuccessMsg('Guest parking space requested. Pending approval.');
      setParkingForm({ slot_number: '', guest_date: '' });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Guest slot request failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Homeowner tenant approvals (Double Approval Step 1)
  const handleTenantApproval = async (tenantId, action) => {
    try {
      const res = await api.post('/auth/approve', { userId: tenantId, action });
      setSuccessMsg(res.data.message);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Approval action failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Edit Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', profileForm);
      setSuccessMsg('User profile updated successfully.');
      setShowEditProfileModal(false);
      
      // Update global user model if possible or trigger stats update
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Profile update failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Open Edit Profile modal with active values
  const openEditProfile = () => {
    setProfileForm({
      full_name: user?.full_name || '',
      phone_number: user?.phone_number || '',
      vehicle_number: user?.vehicle_number || ''
    });
    setShowEditProfileModal(true);
  };

  // Toggle event registration
  const toggleRegisterEvent = async (eventId) => {
    try {
      if (registeredEvents.includes(eventId)) {
        await api.post(`/events/${eventId}/unregister`);
        setRegisteredEvents(registeredEvents.filter(id => id !== eventId));
        setSuccessMsg("Successfully unregistered from event.");
      } else {
        await api.post(`/events/${eventId}/register`);
        setRegisteredEvents([...registeredEvents, eventId]);
        setSuccessMsg("Successfully registered for event!");
      }
      // Reload stats and events to get fresh registration counts
      const statsRes = await api.get('/auth/resident-dashboard-stats');
      setResidentStats(statsRes.data);
      const eventsRes = await api.get('/events');
      const upcomingEvents = (eventsRes.data.events || []).filter(e => e.status !== 'Completed');
      setEvents(upcomingEvents);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Action failed.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Metrics, fallback calculations
  const metrics = residentStats?.metrics || {
    pendingComplaints: 0,
    urgentComplaints: 0,
    upcomingBookings: 0,
    pendingPayments: 0,
    activeNotices: 0,
    nextBooking: null,
    nextPaymentDue: null
  };

  const displayName = profileForm.full_name || user?.full_name || user?.email?.split('@')[0] || 'Resident';
  const displayRoleLabel = user?.role === 'homeowner' ? 'Homeowner' : 'Tenant';

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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resident Console</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'complaints', label: 'Complaints', icon: ClipboardList },
              { id: 'facility', label: 'Facilities', icon: Compass },
              { id: 'payments', label: 'Payments', icon: FileText },
              { id: 'parking', label: 'Guest Parking', icon: Compass },
              { id: 'notices', label: 'Notice Board', icon: Megaphone },
              ...(user?.role === 'homeowner' ? [{ id: 'tenants', label: 'Tenant Approvals', icon: Users }] : [])
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

        {/* New Request shortcut and Profile Card Footer */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50">
          
          {/* New Request Button */}
          <div className="relative">
            <button 
              onClick={() => setShowNewRequestMenu(!showNewRequestMenu)}
              className="w-full py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Request</span>
            </button>
            
            {showNewRequestMenu && (
              <div className="absolute bottom-11 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <button 
                  onClick={() => { setActiveTab('complaints'); setShowNewRequestMenu(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Wrench className="w-3.5 h-3.5 text-slate-400" />
                  File a Complaint
                </button>
                <button 
                  onClick={() => { setActiveTab('facility'); setShowNewRequestMenu(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Book Common Facility
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 uppercase">
                {displayName.charAt(0)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 tracking-tight leading-tight">{displayName}</h4>
                <p className="text-[10px] text-slate-400 font-semibold">{displayRoleLabel}</p>
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
              placeholder="Search for notices, payments, or help..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none text-slate-800 focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Settings className="w-4.5 h-4.5" />
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* 3. Main Content Grid */}
        <main className="p-6 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {errorMsg && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left & Middle Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Title */}
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Resident Dashboard</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1">View apartment updates, manage requests, and track payments in one place.</p>
                </div>

                {/* Shortcuts */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab('complaints')}
                    className="py-2.5 px-4 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm active:scale-95"
                  >
                    <Wrench className="w-4 h-4 text-blue-200" />
                    <span>Submit Complaint</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('facility')}
                    className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                  >
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Book Facility</span>
                  </button>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Complaints */}
                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Complaints</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{String(metrics.pendingComplaints).padStart(2, '0')}</h3>
                    <p className="text-[9px] text-red-500 font-bold mt-1 flex items-center gap-0.5">
                      <span>!</span>
                      <span>{metrics.urgentComplaints} Urgent</span>
                    </p>
                  </div>
                  
                  {/* Bookings */}
                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Upcoming Bookings</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{String(metrics.upcomingBookings).padStart(2, '0')}</h3>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 truncate">
                      {metrics.nextBooking ? `${metrics.nextBooking.facility_name}` : 'None scheduled'}
                    </p>
                  </div>

                  {/* Payments */}
                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm border-l-4 border-l-red-500">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Payments</span>
                    <h3 className="text-2xl font-black text-red-600 mt-1">LKR {metrics.pendingPayments}</h3>
                    <p className="text-[9px] text-red-500 font-bold mt-1">
                      {metrics.nextPaymentDue ? `Due by ${new Date(metrics.nextPaymentDue).toLocaleDateString()}` : 'No bills outstanding'}
                    </p>
                  </div>

                  {/* Notices */}
                  <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Active Notices</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{String(metrics.activeNotices).padStart(2, '0')}</h3>
                    <p className="text-[9px] text-slate-400 font-bold mt-1">Announcements board</p>
                  </div>
                </div>

                {/* Latest Notices */}
                <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Latest Notices</h3>
                    <button onClick={() => setActiveTab('notices')} className="text-[10px] font-bold text-blue-700 hover:underline">See all notices</button>
                  </div>
                  <div className="space-y-3">
                    {(!residentStats?.latestNotices || residentStats.latestNotices.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No notices posted.</p>
                    ) : (
                      residentStats.latestNotices.map((n) => {
                        let badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                        let categoryName = 'COMMUNITY';
                        if (n.title.toLowerCase().includes('water') || n.title.toLowerCase().includes('maintenance') || n.title.toLowerCase().includes('electricity')) {
                          badgeColor = 'bg-red-50 text-red-700 border-red-100';
                          categoryName = 'MAINTENANCE';
                        } else if (n.title.toLowerCase().includes('policy') || n.title.toLowerCase().includes('visitor') || n.title.toLowerCase().includes('security')) {
                          badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                          categoryName = 'SECURITY';
                        }
                        return (
                          <div key={n.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="space-y-1">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${badgeColor}`}>
                                {categoryName}
                              </span>
                              <h4 className="text-xs font-bold text-slate-800 pt-1">{n.title}</h4>
                              <p className="text-[10px] text-slate-400 font-medium font-sans leading-normal line-clamp-1">{n.content}</p>
                            </div>
                            <button 
                              onClick={() => alert(`Announcement Details:\n\nTitle: ${n.title}\nDate: ${new Date(n.created_at).toLocaleDateString()}\nAuthor: ${n.author_email}\n\nContent:\n${n.content}`)}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-[10px] font-bold rounded-lg cursor-pointer transition shadow-sm"
                            >
                              View Notice
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* My Complaints */}
                <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">My Complaints</h3>
                  {(!residentStats?.myComplaints || residentStats.myComplaints.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No complaints logged.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead>
                          <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                            <th className="pb-2">Complaint ID</th>
                            <th className="pb-2">Category</th>
                            <th className="pb-2">Priority</th>
                            <th className="pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {residentStats.myComplaints.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 font-bold text-blue-700">#CMP-{c.id}</td>
                              <td className="py-2.5 font-medium">{c.category}</td>
                              <td className="py-2.5">
                                <span className={`font-bold text-[10px] flex items-center gap-1 ${
                                  c.priority === 'high' ? 'text-blue-600' :
                                  c.priority === 'medium' ? 'text-red-500' :
                                  'text-slate-500'
                                }`}>
                                  <span>•</span> {c.priority === 'high' ? 'High' : c.priority === 'medium' ? 'Emergency' : 'Normal'}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  c.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                                  c.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                                  'bg-red-55/10 text-red-500'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Invoices & Payments */}
                <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Invoices & Payments</h3>
                      <p className="text-[10px] text-slate-400 font-semibold font-sans mt-0.5">Maintenance and utility dues</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Outstanding</span>
                      <h4 className="text-base font-black text-red-600 mt-0.5">LKR {Number(metrics.pendingPayments || 0).toFixed(2)}</h4>
                    </div>
                  </div>
                  
                  {(!residentStats?.myBills || residentStats.myBills.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No billing history available.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead>
                          <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                            <th className="pb-2">Invoice ID</th>
                            <th className="pb-2">Month</th>
                            <th className="pb-2">Amount</th>
                            <th className="pb-2">Due Date</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {residentStats.myBills.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50/50">
                              <td className="py-3 font-bold text-slate-800">#INV-{b.id}</td>
                              <td className="py-3 font-medium">
                                {new Date(b.due_date).toLocaleString('default', { month: 'long', year: 'numeric' })}
                              </td>
                              <td className="py-3 font-black text-slate-800">LKR {b.amount}</td>
                              <td className={`py-3 font-bold ${b.status === 'unpaid' ? 'text-red-500' : 'text-slate-400'}`}>
                                {new Date(b.due_date).toLocaleDateString()}
                              </td>
                              <td className="py-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  b.status === 'paid' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                                }`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                {b.status === 'unpaid' ? (
                                  <button 
                                    onClick={() => handlePayBill(b.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition shadow-sm"
                                  >
                                    Pay Now
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold">Paid</span>
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

              {/* Right Profile & Activity Pane */}
              <div className="space-y-6">
                
                {/* Profile Card */}
                <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-sm text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-3xl uppercase shadow-inner">
                      {displayName.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 tracking-tight">{displayName}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {myUnit ? `${myUnit.block_name} - Unit ${myUnit.unit_number}` : 'No Assigned Unit'} • {displayRoleLabel}
                    </p>
                  </div>
                  
                  <div className="pt-2 text-left space-y-2 border-t border-slate-100 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{user?.phone_number || 'No contact added'}</span>
                    </div>
                    {user?.vehicle_number && (
                      <div className="flex items-center gap-2.5">
                        <Compass className="w-4 h-4 text-slate-400" />
                        <span>Vehicle: {user.vehicle_number}</span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={openEditProfile}
                    className="w-full mt-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition text-center flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                {/* Recent Activities */}
                <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Activities</h3>
                  <div className="space-y-3">
                    {(!residentStats?.activities || residentStats.activities.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No activity logs recorded.</p>
                    ) : (
                      residentStats.activities.map((act) => (
                        <div key={act.id} className="flex gap-3 relative">
                          <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${
                            act.type === 'complaint' ? 'bg-red-50 border-red-100 text-red-500' :
                            act.type === 'booking' ? 'bg-blue-50 border-blue-100 text-blue-500' :
                            'bg-emerald-50 border-emerald-100 text-emerald-500'
                          }`}>
                            {act.type === 'complaint' ? <Wrench className="w-3.5 h-3.5" /> :
                             act.type === 'booking' ? <Calendar className="w-3.5 h-3.5" /> :
                             <CreditCard className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 leading-none">{act.title}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-tight">{act.message}</p>
                            <span className="text-[8px] text-slate-400 font-bold block mt-0.5">
                              {new Date(act.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white border border-slate-200/50 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Upcoming Events</h3>
                  <div className="space-y-3">
                    {events.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No upcoming community events scheduled.</p>
                    ) : (
                      events.map((e) => {
                        const isRegistered = registeredEvents.includes(e.id);
                        return (
                          <div key={e.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{e.name}</h4>
                                <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                                  {e.location} • {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {e.time}
                                </span>
                              </div>
                              {isRegistered && (
                                <span className="text-[8px] font-extrabold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase">Registered</span>
                              )}
                            </div>
                            <button 
                              onClick={() => toggleRegisterEvent(e.id)}
                              className={`w-full py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition text-center ${
                                isRegistered
                                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white'
                              }`}
                            >
                              {isRegistered ? 'Unregister' : 'Register Now'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 3.2 activeTab = COMPLAINTS */}
          {activeTab === 'complaints' && (() => {
            // Derived filtered list
            const filteredComplaints = complaints.filter(c => {
              const matchSearch = complaintSearch === '' ||
                (c.subject_title || '').toLowerCase().includes(complaintSearch.toLowerCase()) ||
                c.category.toLowerCase().includes(complaintSearch.toLowerCase()) ||
                String(c.id).includes(complaintSearch);
              const matchStatus = complaintStatusFilter === 'All' || c.status === complaintStatusFilter;
              const matchPriority = complaintPriorityFilter === 'All' || c.priority === complaintPriorityFilter;
              return matchSearch && matchStatus && matchPriority;
            });

            const priorityBadge = (p) => {
              const map = {
                emergency: 'bg-red-100 text-red-700 border border-red-200',
                high: 'bg-orange-100 text-orange-700 border border-orange-200',
                medium: 'bg-blue-100 text-blue-700 border border-blue-200',
                low: 'bg-slate-100 text-slate-600 border border-slate-200',
              };
              return map[p] || map.medium;
            };
            const statusBadge = (s) => {
              const map = {
                resolved: 'bg-emerald-50 text-emerald-700',
                in_progress: 'bg-blue-50 text-blue-700',
                emergency: 'bg-red-50 text-red-700',
                pending: 'bg-amber-50 text-amber-700',
              };
              return map[s] || map.pending;
            };

            // Status timeline logic
            const tracker = selectedComplaint;
            const steps = [
              { key: 'submitted', label: 'Submitted', desc: tracker ? new Date(tracker.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '' },
              { key: 'reviewed', label: 'Reviewed', desc: tracker?.assigned_staff_name ? `Reviewed by ${tracker.assigned_staff_name}` : 'Pending review' },
              { key: 'in_progress', label: 'In Progress', desc: tracker?.assigned_staff_name ? `Assigned to ${tracker.assigned_staff_name}` : 'Pending assignment' },
              { key: 'resolved', label: 'Resolved', desc: tracker?.status === 'resolved' ? 'Issue resolved' : 'Pending completion' },
            ];
            const currentStepIdx = tracker ? (
              tracker.status === 'resolved' ? 3 :
              tracker.status === 'in_progress' ? 2 :
              tracker.assigned_staff_id ? 1 : 0
            ) : 0;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT + MIDDLE: Main Content Col */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Header */}
                  <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">Complaints &amp; Maintenance</h2>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-relaxed max-w-sm">
                          Submit maintenance issues and track complaint resolution progress. Our concierge team is dedicated to ensuring your living space remains pristine.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => alert('Emergency Guidelines:\n\n1. For life-threatening emergencies call 911\n2. For building emergencies call Daily Security: +1(555)000-9111\n3. For maintenance call: +1(555)000-9222\n4. Building Manager: +1(555)000-9333')}
                          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg cursor-pointer transition flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          View Emergency Guidelines
                        </button>
                        <button
                          onClick={() => setShowComplaintForm(true)}
                          className="px-3 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-[10px] font-bold rounded-lg cursor-pointer transition shadow-sm flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          New Complaint
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Complaints', value: complaintStats.total, sub: `+${complaintStats.this_month} this month`, subColor: 'text-blue-500' },
                      { label: 'Pending', value: complaintStats.pending, sub: 'Awaiting action', subColor: 'text-amber-500' },
                      { label: 'In Progress', value: complaintStats.in_progress, sub: 'Being resolved', subColor: 'text-blue-500' },
                      { label: 'Resolved', value: complaintStats.resolved, sub: 'Completed', subColor: 'text-emerald-500' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{s.label}</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{String(s.value).padStart(2, '0')}</h3>
                        <p className={`text-[9px] font-bold mt-1 ${s.subColor}`}>{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Filter Toolbar */}
                  <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Filter className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by complaint ID, category, or status..."
                        className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                        value={complaintSearch}
                        onChange={e => setComplaintSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <select
                          className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold outline-none focus:border-blue-500 appearance-none cursor-pointer"
                          value={complaintStatusFilter}
                          onChange={e => setComplaintStatusFilter(e.target.value)}
                        >
                          <option value="All">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="emergency">Emergency</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <select
                          className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold outline-none focus:border-blue-500 appearance-none cursor-pointer"
                          value={complaintPriorityFilter}
                          onChange={e => setComplaintPriorityFilter(e.target.value)}
                        >
                          <option value="All">Priority</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="emergency">Emergency</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Ticket Table */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                    {filteredComplaints.length === 0 ? (
                      <div className="p-10 text-center">
                        <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 text-xs font-semibold">No tickets match your filters.</p>
                        <p className="text-slate-300 text-[10px] mt-1">Try adjusting your search or filters above.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                              <th className="px-4 py-3">ID</th>
                              <th className="px-4 py-3">Category</th>
                              <th className="px-4 py-3">Priority</th>
                              <th className="px-4 py-3">Submitted</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredComplaints.map((c) => (
                              <tr
                                key={c.id}
                                onClick={() => setSelectedComplaint(c)}
                                className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                                  selectedComplaint?.id === c.id ? 'bg-blue-50/60 border-l-2 border-l-blue-500' : ''
                                }`}
                              >
                                <td className="px-4 py-3">
                                  <span className="font-bold text-blue-700 text-[10px]">SCRF-{String(c.id).padStart(4, '0')}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-bold text-slate-800 text-[11px]">{c.category}</p>
                                    {c.subject_title && <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{c.subject_title}</p>}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${priorityBadge(c.priority)}`}>
                                    {c.priority === 'emergency' ? '🚨 Emergency' : c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 font-medium">
                                  {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBadge(c.status)}`}>
                                    {c.status === 'in_progress' ? 'In Progress' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Submit a New Complaint Form */}
                  {showComplaintForm && (
                    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6" id="complaint-form">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="text-sm font-black text-slate-800">Submit a New Complaint</h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Provide as much detail as possible to help us resolve the issue quickly.</p>
                        </div>
                        <button
                          onClick={() => setShowComplaintForm(false)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSubmitComplaint} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Category</label>
                            <div className="relative">
                              <select
                                required
                                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                                value={complaintForm.category}
                                onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                              >
                                <option value="">Select a category</option>
                                <option value="Plumbing">Plumbing</option>
                                <option value="Electrical">Electrical</option>
                                <option value="HVAC">HVAC</option>
                                <option value="Elevator">Elevator</option>
                                <option value="Common Area Security">Common Area Security</option>
                                <option value="Pest Control">Pest Control</option>
                                <option value="Other Operations">Other Operations</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Priority Level</label>
                            <div className="relative">
                              <select
                                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                                value={complaintForm.priority}
                                disabled={complaintForm.is_emergency}
                                onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                              >
                                <option value="low">Low — Non-urgent</option>
                                <option value="medium">Medium — Moderate</option>
                                <option value="high">High — Urgent</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Subject Title</label>
                          <input
                            type="text"
                            placeholder="E.g. Leaking pipe in master bathroom"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-300 rounded-lg text-xs font-medium transition-all"
                            value={complaintForm.subject_title}
                            onChange={(e) => setComplaintForm({ ...complaintForm, subject_title: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Description</label>
                          <textarea
                            required
                            rows={4}
                            placeholder="Detailed description of the problem..."
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-300 rounded-lg transition-all text-xs font-medium font-sans resize-none"
                            value={complaintForm.description}
                            onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                          />
                        </div>

                        {/* File Upload Zone */}
                        <div
                          className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                          onClick={() => document.getElementById('complaint-file-input').click()}
                        >
                          <input id="complaint-file-input" type="file" accept="image/*,.pdf" className="hidden" />
                          <Upload className="w-7 h-7 text-slate-300 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
                          <p className="text-xs font-semibold text-slate-400 group-hover:text-blue-500 transition-colors">Click to upload or drag and drop</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">PNG, JPG or PDF up to 5MB</p>
                        </div>

                        {/* Emergency Checkbox */}
                        <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          complaintForm.is_emergency
                            ? 'bg-red-50 border-red-200'
                            : 'bg-slate-50 border-slate-200 hover:border-red-200 hover:bg-red-50/30'
                        }`}>
                          <input
                            type="checkbox"
                            className="mt-0.5 accent-red-600 cursor-pointer"
                            checked={complaintForm.is_emergency}
                            onChange={(e) => setComplaintForm({ ...complaintForm, is_emergency: e.target.checked })}
                          />
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${
                            complaintForm.is_emergency ? 'text-red-700' : 'text-slate-500'
                          }`}>
                            🚨 This is an emergency request requiring immediate dispatch
                          </span>
                        </label>

                        <div className="flex gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setComplaintForm({ category: 'Plumbing', subject_title: '', description: '', priority: 'medium', is_emergency: false });
                            }}
                            className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg cursor-pointer transition"
                          >
                            Clear Form
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                          >
                            Submit Request
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {!showComplaintForm && (
                    <button
                      onClick={() => setShowComplaintForm(true)}
                      className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 text-slate-400 hover:text-blue-600 text-xs font-bold rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Submit a New Complaint
                    </button>
                  )}

                </div>

                {/* RIGHT PANEL */}
                <div className="space-y-4">

                  {/* Current Ticket Status Tracker */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">Current Ticket Status</h3>
                    {tracker ? (
                      <div className="space-y-0">
                        {steps.map((step, i) => {
                          const isDone = i <= currentStepIdx;
                          const isActive = i === currentStepIdx;
                          return (
                            <div key={step.key} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isDone
                                    ? isActive
                                      ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-200'
                                      : 'bg-emerald-500 border-emerald-500'
                                    : 'bg-white border-slate-200'
                                }`}>
                                  {isDone && !isActive ? (
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  ) : isActive ? (
                                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                                  ) : (
                                    <Circle className="w-3 h-3 text-slate-200" />
                                  )}
                                </div>
                                {i < steps.length - 1 && (
                                  <div className={`w-0.5 h-8 mt-0.5 ${
                                    i < currentStepIdx ? 'bg-emerald-400' : 'bg-slate-100'
                                  }`} />
                                )}
                              </div>
                              <div className="pb-6">
                                <p className={`text-xs font-bold ${
                                  isActive ? 'text-blue-700' : isDone ? 'text-slate-700' : 'text-slate-300'
                                }`}>{step.label}</p>
                                <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{step.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No ticket selected. Click a row to track.</p>
                    )}
                    {tracker && (
                      <div className="mt-2 pt-3 border-t border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Selected Ticket</p>
                        <p className="text-xs font-bold text-blue-700 mt-0.5">SCRF-{String(tracker.id).padStart(4, '0')} — {tracker.category}</p>
                        {tracker.subject_title && <p className="text-[10px] text-slate-500 mt-0.5">{tracker.subject_title}</p>}
                      </div>
                    )}
                  </div>

                  {/* Emergency Contacts */}
                  <div className="rounded-2xl overflow-hidden shadow-sm" style={{background: 'linear-gradient(135deg, #1e3a5f 0%, #133fbd 100%)'}}>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <Phone className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Emergency Contacts</h3>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Daily Security', number: '+1(555)000-9111', icon: '🛡️' },
                          { label: 'Maintenance Desk', number: '+1(555)000-9222', icon: '🔧' },
                          { label: 'Building Manager', number: '+1(555)000-9333', icon: '🏢' },
                        ].map((contact, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{contact.icon}</span>
                              <div>
                                <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider">{contact.label}</p>
                                <p className="text-xs font-black text-white">{contact.number}</p>
                              </div>
                            </div>
                            <a
                              href={`tel:${contact.number.replace(/[^0-9+]/g, '')}`}
                              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                            >
                              <Phone className="w-3 h-3 text-white" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Banner */}
                  <div className="rounded-2xl overflow-hidden shadow-sm" style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'}}>
                    <div className="p-5">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                          <Wrench className="w-7 h-7 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-center text-[10px] font-semibold text-white/70 leading-relaxed">
                        Our 24/7 maintenance team is always on standby for your comfort!
                      </p>
                      <button
                        onClick={() => setShowComplaintForm(true)}
                        className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition"
                      >
                        Report an Issue
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* 3.3 activeTab = FACILITY */}
          {activeTab === 'facility' && (() => {
            // Derived: 7-day availability calendar (current week)
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
            const weekDays = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(weekStart);
              d.setDate(weekStart.getDate() + i);
              return d;
            });
            const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            const getSlotStatus = (facilityName, date) => {
              const dateStr = date.toISOString().split('T')[0];
              const match = reservations.find(r =>
                r.facility_name === facilityName &&
                new Date(r.date).toISOString().split('T')[0] === dateStr
              );
              if (!match) return 'available';
              if (match.status === 'approved') return 'booked';
              if (match.status === 'pending') return 'pending';
              return 'available';
            };

            // Facility gradient colors
            const facGradients = [
              'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              'linear-gradient(135deg, #0d1b2a 0%, #1b4332 100%)',
              'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)',
              'linear-gradient(135deg, #1e3a5f 0%, #133fbd 100%)',
            ];
            const facEmojis = ['🏊', '🌿', '💼', '🏟️', '🎾', '🎱', '🍽️'];

            // Permanent parking slot
            const permanentSlot = myParking.find(s => s.type === 'permanent');

            // Guest slot options from all parking slots
            const guestSlotOptions = [...new Set(parkingAllSlots.filter(p => p.type === 'guest').map(p => p.slot_number))];
            const guestSlotAvailability = (slot) => {
              const todayStr = new Date().toISOString().split('T')[0];
              return !parkingAllSlots.some(p =>
                p.slot_number === slot &&
                p.guest_date &&
                new Date(p.guest_date).toISOString().split('T')[0] === todayStr &&
                ['approved', 'pending'].includes(p.status)
              );
            };

            const statusBadge = (s) => {
              const map = { approved: 'bg-emerald-50 text-emerald-700', pending: 'bg-amber-50 text-amber-700', rejected: 'bg-red-50 text-red-700' };
              return map[s] || map.pending;
            };

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT + CENTER: Main Content */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Stats Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        label: 'Total Facility Bookings',
                        value: facilityStats.totalBookings || 0,
                        sub: `UPCOMING FACILITY: ${facilityStats.approvedBookings || 0}`,
                        subColor: 'text-blue-500',
                        icon: '🏛️',
                        highlight: facilityStats.pendingBookings > 0
                      },
                      {
                        label: 'Pending Visitor Parking',
                        value: facilityStats.pendingVisitorParking || 0,
                        sub: 'Awaiting approval',
                        subColor: 'text-amber-500',
                        icon: '🅿️',
                        highlight: false
                      },
                      {
                        label: 'Approved Visitor Parking',
                        value: facilityStats.approvedVisitorParking || 0,
                        sub: `Approved slots`,
                        subColor: 'text-emerald-500',
                        icon: '✅',
                        highlight: false
                      },
                    ].map((s, i) => (
                      <div key={i} className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm">
                        <div className="flex items-start justify-between">
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-tight">{s.label}</p>
                          <span className="text-lg">{s.icon}</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{String(s.value).padStart(2, '0')}</h3>
                        <p className={`text-[9px] font-bold mt-1 ${s.subColor}`}>{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Available Facilities */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-800">Available Facilities</h3>
                      <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">View All</span>
                    </div>
                    {facilityList.length === 0 ? (
                      <div className="px-5 pb-5">
                        <p className="text-slate-400 text-xs italic">No facilities configured yet.</p>
                      </div>
                    ) : (
                      <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {facilityList.slice(0, 3).map((fac, i) => (
                          <div key={fac.id} className="rounded-xl overflow-hidden border border-slate-100 shadow-sm group">
                            <div
                              className="h-24 flex flex-col items-center justify-center relative"
                              style={{ background: facGradients[i % facGradients.length] }}
                            >
                              <span className="text-3xl mb-1">{facEmojis[i % facEmojis.length]}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                fac.status === 'available' ? 'bg-emerald-500/80 text-white' :
                                fac.status === 'maintenance' ? 'bg-amber-500/80 text-white' :
                                'bg-red-500/80 text-white'
                              }`}>
                                {fac.status === 'available' ? '● Available' : fac.status === 'maintenance' ? '⚠ Maintenance' : '✕ Fully Booked'}
                              </span>
                            </div>
                            <div className="p-3 bg-white">
                              <p className="text-[11px] font-black text-slate-800 leading-tight">{fac.name}</p>
                              <p className="text-[9px] text-slate-400 font-medium mt-0.5">Capacity: {fac.capacity} Persons</p>
                              <button
                                onClick={() => {
                                  setBookingForm(f => ({ ...f, facility_name: fac.name }));
                                  document.getElementById('facility-booking-form')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                disabled={fac.status !== 'available'}
                                className={`mt-2 w-full py-1.5 text-[9px] font-bold rounded-lg transition cursor-pointer ${
                                  fac.status === 'available'
                                    ? 'bg-[#133fbd] hover:bg-[#0f3299] text-white'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Request Booking
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Booking Availability Calendar */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-800">Booking Availability</h3>
                      <div className="flex items-center gap-3 text-[9px] font-bold">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> Available</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span> Booked</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Pending</span>
                      </div>
                    </div>
                    {facilityList.length === 0 ? (
                      <p className="text-slate-400 text-xs italic">No facilities to display.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                              <th className="pb-2 text-left pr-3 w-24">Facility</th>
                              {dayLabels.map((d, i) => (
                                <th key={i} className="pb-2 text-center w-12">
                                  <span>{d}</span>
                                  <br />
                                  <span className={`text-[8px] font-medium ${weekDays[i].toDateString() === today.toDateString() ? 'text-blue-600 font-black' : 'text-slate-300'}`}>
                                    {weekDays[i].getDate()}
                                  </span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {facilityList.slice(0, 4).map((fac) => (
                              <tr key={fac.id}>
                                <td className="py-2 pr-3 font-semibold text-slate-700 text-[10px] truncate max-w-[90px]">{fac.name.split(' ')[0]}</td>
                                {weekDays.map((day, di) => {
                                  const slotStatus = getSlotStatus(fac.name, day);
                                  return (
                                    <td key={di} className="py-2 text-center">
                                      <span className={`inline-block w-7 h-5 rounded text-[7px] font-bold leading-5 ${
                                        slotStatus === 'booked' ? 'bg-red-100 text-red-600' :
                                        slotStatus === 'pending' ? 'bg-amber-100 text-amber-600' :
                                        'bg-emerald-100 text-emerald-600'
                                      }`}>
                                        {slotStatus === 'booked' ? '✕' : slotStatus === 'pending' ? '◑' : '✓'}
                                      </span>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Facility Booking Request Form */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6" id="facility-booking-form">
                    <div className="mb-5">
                      <h3 className="text-sm font-black text-slate-800">Facility Booking Request Form</h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Complete all required fields to submit your booking request for review.</p>
                    </div>
                    <form onSubmit={handleReserve} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Facility</label>
                          <div className="relative">
                            <select
                              required
                              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                              value={bookingForm.facility_name}
                              onChange={(e) => setBookingForm({ ...bookingForm, facility_name: e.target.value })}
                            >
                              <option value="">Select Facility</option>
                              {facilityList.filter(f => f.status === 'available').map(f => (
                                <option key={f.id} value={f.name}>{f.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Date</label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 rounded-lg text-xs font-medium"
                            value={bookingForm.date}
                            onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">No. of Participants</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="e.g. 10"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 placeholder-slate-300 rounded-lg text-xs font-medium"
                            value={bookingForm.participants}
                            onChange={(e) => setBookingForm({ ...bookingForm, participants: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Time Slot</label>
                          <div className="relative">
                            <select
                              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                              value={bookingForm.time_slot}
                              onChange={(e) => setBookingForm({ ...bookingForm, time_slot: e.target.value })}
                            >
                              <option value="">Select Time Slot</option>
                              <option value="06:00 - 09:00">06:00 – 09:00 AM</option>
                              <option value="09:00 - 12:00">09:00 AM – 12:00 PM</option>
                              <option value="12:00 - 15:00">12:00 – 03:00 PM</option>
                              <option value="15:00 - 18:00">03:00 – 06:00 PM</option>
                              <option value="18:00 - 21:00">06:00 – 09:00 PM</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Purpose of Booking</label>
                        <input
                          type="text"
                          placeholder="e.g. Family Dinner, Team Meeting, Birthday Party..."
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 placeholder-slate-300 rounded-lg text-xs font-medium"
                          value={bookingForm.purpose}
                          onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Additional Notes</label>
                        <textarea
                          rows={3}
                          placeholder="Special requirements or additional information for the management team..."
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 placeholder-slate-300 rounded-lg text-xs font-medium font-sans resize-none"
                          value={bookingForm.notes}
                          onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                        />
                      </div>
                      <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        bookingForm.agreed ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 hover:border-blue-200'
                      }`}>
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-blue-600 cursor-pointer"
                          checked={bookingForm.agreed}
                          onChange={(e) => setBookingForm({ ...bookingForm, agreed: e.target.checked })}
                        />
                        <span className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                          I have read and agree to the <span className="text-blue-600 font-bold">Facility Usage Guidelines</span> and understand that I will be held responsible for any damages caused to the facility during the booking period.
                        </span>
                      </label>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                      >
                        Submit Booking Request
                      </button>
                    </form>
                  </div>

                  {/* My Facility Booking Requests */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-3">
                      <h3 className="text-sm font-black text-slate-800">My Facility Booking Requests</h3>
                    </div>
                    {reservations.length === 0 ? (
                      <div className="px-5 pb-5">
                        <p className="text-slate-400 text-xs italic">No bookings placed yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                              <th className="px-5 py-3">Facility</th>
                              <th className="px-5 py-3">Date &amp; Time</th>
                              <th className="px-5 py-3">Purpose</th>
                              <th className="px-5 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {reservations.map((res) => (
                              <tr key={res.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3 font-bold text-slate-800">{res.facility_name}</td>
                                <td className="px-5 py-3 text-slate-500 font-medium">
                                  {new Date(res.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  {res.time_slot && <span className="block text-[10px] text-slate-400">{res.time_slot}</span>}
                                </td>
                                <td className="px-5 py-3 text-slate-400 font-medium truncate max-w-[120px]">
                                  {res.purpose || '—'}
                                </td>
                                <td className="px-5 py-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBadge(res.status)}`}>
                                    {res.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* ── VISITOR PARKING SECTION ─────────────────────── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* My Assigned Parking Slot */}
                    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
                      <div className="p-5">
                        <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-3">My Assigned Parking Slot</p>
                        {permanentSlot ? (
                          <>
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Slot Number</p>
                            <h2 className="text-5xl font-black text-white mt-1 mb-3 tracking-widest">
                              {permanentSlot.slot_number}
                            </h2>
                            <div className="space-y-1.5 text-[10px] text-white/60 font-medium">
                              {user?.vehicle_number && <p>🚗 {user.vehicle_number}</p>}
                              <p>📍 {permanentSlot.unit_id ? `Unit ${permanentSlot.unit_id}` : 'Assigned'}</p>
                              <p className="text-emerald-400 font-bold">● Active</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <h2 className="text-4xl font-black text-white/30 mt-1 mb-3">N/A</h2>
                            <p className="text-[10px] text-white/40 font-medium">No permanent slot assigned to your unit yet.</p>
                          </>
                        )}
                        {user?.vehicle_number === null || user?.vehicle_number === '' ? (
                          <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition">
                            Update Vehicle Number
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Visitor Parking Availability */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black text-slate-800">Visitor Parking Availability</h3>
                        <div className="flex items-center gap-2 text-[9px] font-bold">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block"></span> Free</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block"></span> Taken</span>
                        </div>
                      </div>
                      {guestSlotOptions.length === 0 ? (
                        <p className="text-slate-400 text-xs italic">No guest parking slots configured.</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {guestSlotOptions.map((slot, i) => {
                            const isAvail = guestSlotAvailability(slot);
                            return (
                              <div
                                key={i}
                                className={`rounded-lg p-2 text-center cursor-pointer transition ${
                                  isAvail
                                    ? 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-red-50 border border-red-200'
                                }`}
                                onClick={() => isAvail && setVisitorParkingForm(f => ({ ...f, slot_number: slot }))}
                              >
                                <p className="text-[8px] font-bold text-slate-500">SLOT</p>
                                <p className={`text-xs font-black ${isAvail ? 'text-emerald-700' : 'text-red-600'}`}>{slot}</p>
                              </div>
                            );
                          })}
                          {/* Show placeholder slots if none seeded yet */}
                          {guestSlotOptions.length === 0 && ['A1','A2','A3','A4','B1','B2','B3','B4'].map((s,i) => (
                            <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                              <p className="text-[8px] font-bold text-slate-400">SLOT</p>
                              <p className="text-xs font-black text-slate-300">{s}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visitor Parking Request Form */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6">
                    <div className="mb-5">
                      <h3 className="text-sm font-black text-slate-800">Visitor Parking Request Form</h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Submit a visitor parking request for your guests.</p>
                    </div>
                    <form onSubmit={handleVisitorParking} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Visitor Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Full name of your visitor"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 placeholder-slate-300 rounded-lg text-xs font-medium"
                            value={visitorParkingForm.visitor_name}
                            onChange={(e) => setVisitorParkingForm({ ...visitorParkingForm, visitor_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Vehicle Number</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ABC-1234"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 placeholder-slate-300 rounded-lg text-xs font-medium uppercase"
                            value={visitorParkingForm.visitor_vehicle}
                            onChange={(e) => setVisitorParkingForm({ ...visitorParkingForm, visitor_vehicle: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Date of Visit</label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 rounded-lg text-xs font-medium"
                            value={visitorParkingForm.guest_date}
                            onChange={(e) => setVisitorParkingForm({ ...visitorParkingForm, guest_date: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Arrival Time</label>
                          <input
                            type="time"
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 rounded-lg text-xs font-medium"
                            value={visitorParkingForm.arrival_time}
                            onChange={(e) => setVisitorParkingForm({ ...visitorParkingForm, arrival_time: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Parking Slot</label>
                        <div className="relative">
                          <select
                            required
                            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                            value={visitorParkingForm.slot_number}
                            onChange={(e) => setVisitorParkingForm({ ...visitorParkingForm, slot_number: e.target.value })}
                          >
                            <option value="">Select a guest slot</option>
                            {guestSlotOptions.map((s, i) => (
                              <option key={i} value={s}>{s} {guestSlotAvailability(s) ? '(Available)' : '(Taken today)'}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Reason for Visit</label>
                        <input
                          type="text"
                          placeholder="e.g. Personal visit, Delivery, Contractor"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white outline-none text-slate-800 placeholder-slate-300 rounded-lg text-xs font-medium"
                          value={visitorParkingForm.reason}
                          onChange={(e) => setVisitorParkingForm({ ...visitorParkingForm, reason: e.target.value })}
                        />
                      </div>
                      <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        visitorParkingForm.agreed ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 hover:border-blue-200'
                      }`}>
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-blue-600 cursor-pointer"
                          checked={visitorParkingForm.agreed}
                          onChange={(e) => setVisitorParkingForm({ ...visitorParkingForm, agreed: e.target.checked })}
                        />
                        <span className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                          I confirm the visitor details and accept responsibility for their conduct within the premises. I understand visitor parking is subject to availability.
                        </span>
                      </label>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                      >
                        Submit Parking Request
                      </button>
                    </form>
                  </div>

                  {/* My Visitor Parking Requests */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-3">
                      <h3 className="text-sm font-black text-slate-800">My Visitor Parking Requests</h3>
                    </div>
                    {visitorRequests.length === 0 ? (
                      <div className="px-5 pb-5">
                        <p className="text-slate-400 text-xs italic">No visitor parking requests yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                              <th className="px-5 py-3">#</th>
                              <th className="px-5 py-3">Visitor</th>
                              <th className="px-5 py-3">Date</th>
                              <th className="px-5 py-3">Status</th>
                              <th className="px-5 py-3">Slot #</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {visitorRequests.map((req, i) => (
                              <tr key={req.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3 font-bold text-slate-400 text-[10px]">{String(i + 1).padStart(2, '0')}</td>
                                <td className="px-5 py-3">
                                  <p className="font-bold text-slate-800 text-[11px]">{req.visitor_name || '—'}</p>
                                  {req.visitor_vehicle && <p className="text-[10px] text-slate-400">{req.visitor_vehicle}</p>}
                                </td>
                                <td className="px-5 py-3 text-slate-500 font-medium">
                                  {req.guest_date ? new Date(req.guest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                  {req.arrival_time && <span className="block text-[10px] text-slate-400">{req.arrival_time}</span>}
                                </td>
                                <td className="px-5 py-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBadge(req.status)}`}>
                                    {req.status}
                                  </span>
                                </td>
                                <td className="px-5 py-3 font-black text-blue-700">{req.slot_number}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>

                {/* RIGHT SIDEBAR */}
                <div className="space-y-4">

                  {/* Facility Guidelines */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Facility Guidelines</h3>
                    </div>
                    <ul className="space-y-2">
                      {[
                        'Bookings must be made at least 48 hours in advance',
                        'Maximum booking duration is 4 hours per session',
                        'Residents must supervise all guests during usage',
                        'Clean up the facility after use — leave no trace',
                        'Damages will be charged to the resident\'s account',
                      ].map((rule, i) => (
                        <li key={i} className="flex items-start gap-2 text-[10px] text-slate-500 font-medium leading-relaxed">
                          <span className="text-blue-400 font-black mt-0.5 shrink-0">→</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                    <button className="mt-4 w-full py-2 border border-blue-200 text-blue-600 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-blue-50 transition flex items-center justify-center gap-1.5">
                      <FileText className="w-3 h-3" /> Rules PDF
                    </button>
                  </div>

                  {/* Parking Policies */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                        <span className="text-sm">🅿️</span>
                      </div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Parking Policies</h3>
                    </div>
                    <ul className="space-y-2">
                      {[
                        'Visitor parking is limited to a maximum of 4 hours',
                        'Residents must submit a request 24 hrs before arrival',
                        'Unauthorized vehicles will be clamped without notice',
                      ].map((rule, i) => (
                        <li key={i} className="flex items-start gap-2 text-[10px] text-slate-500 font-medium leading-relaxed">
                          <span className="text-slate-400 font-black mt-0.5 shrink-0">→</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                    <button className="mt-4 w-full py-2 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-slate-50 transition flex items-center justify-center gap-1.5">
                      <FileText className="w-3 h-3" /> Parking Policy PDF
                    </button>
                  </div>

                  {/* Recent Notifications */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4">Recent Notifications</h3>
                    {reservations.length === 0 && visitorRequests.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No recent activity.</p>
                    ) : (
                      <div className="space-y-3">
                        {[...reservations, ...visitorRequests]
                          .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
                          .slice(0, 3)
                          .map((item, i) => (
                            <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                item.status === 'approved' ? 'bg-emerald-100' :
                                item.status === 'pending' ? 'bg-amber-100' : 'bg-red-100'
                              }`}>
                                <span className="text-xs">
                                  {item.status === 'approved' ? '✓' : item.status === 'pending' ? '⏳' : '✕'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-800 truncate">
                                  {item.facility_name ? `Booking: ${item.facility_name}` : `Visitor Parking: ${item.slot_number}`}
                                </p>
                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                  {item.date
                                    ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : item.guest_date
                                    ? new Date(item.guest_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : '—'}
                                </p>
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${statusBadge(item.status)}`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })()}


          {/* 3.4 activeTab = PAYMENTS */}
          {activeTab === 'payments' && (() => {
            const fmt = (n) => `LKR ${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const today = new Date();

            const filteredBills = bills.filter(b => {
              if (billStatusFilter === 'All') return true;
              if (billStatusFilter === 'Paid') return b.status === 'paid';
              if (billStatusFilter === 'Pending') return b.status === 'unpaid' && new Date(b.due_date) >= today;
              if (billStatusFilter === 'Overdue') return b.status === 'unpaid' && new Date(b.due_date) < today;
              return true;
            });

            const paidProgress = paymentMetrics.totalInvoices > 0
              ? Math.round(((paymentMetrics.totalInvoices - paymentMetrics.pendingCount) / paymentMetrics.totalInvoices) * 100)
              : 0;

            const isOverdue = (bill) => bill.status === 'unpaid' && new Date(bill.due_date) < today;
            const daysOverdue = (bill) => Math.floor((today - new Date(bill.due_date)) / 86400000);
            const daysUntilDue = (dateStr) => Math.ceil((new Date(dateStr) - today) / 86400000);

            return (
              <>
                {/* Pay Modal */}
                {showPayModal && selectedBillToPay && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black text-slate-800">Confirm Payment</h3>
                        <button onClick={() => { setShowPayModal(false); setSelectedBillToPay(null); }} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition">
                          <X className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Invoice</span>
                          <span className="font-bold text-slate-800">{selectedBillToPay.invoice_id || `#INV-${selectedBillToPay.id}`}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Description</span>
                          <span className="font-semibold text-slate-700 text-right max-w-[180px] truncate">{selectedBillToPay.description}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500 font-medium">Due Date</span>
                          <span className={`font-semibold ${isOverdue(selectedBillToPay) ? 'text-red-600' : 'text-slate-700'}`}>
                            {new Date(selectedBillToPay.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {isOverdue(selectedBillToPay) && <span className="ml-1 text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{daysOverdue(selectedBillToPay)}d overdue</span>}
                          </span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between">
                          <span className="text-xs font-bold text-slate-800">Total Amount</span>
                          <span className="text-lg font-black text-[#133fbd]">{fmt(selectedBillToPay.amount)}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mb-4">Payment will be processed as <span className="font-bold text-slate-600">Online Payment</span>. This action cannot be undone.</p>
                      <div className="flex gap-3">
                        <button onClick={() => { setShowPayModal(false); setSelectedBillToPay(null); }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-50 transition">Cancel</button>
                        <button
                          onClick={() => handlePayBill(selectedBillToPay.id)}
                          disabled={payingBillId === selectedBillToPay.id}
                          className="flex-1 py-2.5 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {payingBillId === selectedBillToPay.id ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</> : <><CreditCard className="w-3.5 h-3.5" /> Pay Now</>}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* LEFT COLUMN (2/3) */}
                  <div className="lg:col-span-2 space-y-5">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-black text-slate-800">Payments &amp; Invoices</h2>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">View your invoices, make payments, and download receipts.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg cursor-pointer hover:bg-slate-50 transition">
                          <Upload className="w-3 h-3" /> Download Report
                        </button>
                        <button
                          onClick={() => {
                            const nextBill = bills.find(b => b.status === 'unpaid');
                            if (nextBill) { setSelectedBillToPay(nextBill); setShowPayModal(true); }
                          }}
                          disabled={!bills.some(b => b.status === 'unpaid')}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-[10px] font-bold rounded-lg cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CreditCard className="w-3 h-3" /> Make a Payment
                        </button>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          label: 'Total Invoices',
                          value: paymentMetrics.totalInvoices || 0,
                          sub: 'Last 12 months',
                          subColor: 'text-slate-400',
                          valueClass: 'text-slate-800',
                          border: ''
                        },
                        {
                          label: 'Pending',
                          value: fmt(paymentMetrics.pendingAmount),
                          sub: `${paymentMetrics.pendingCount || 0} invoice${(paymentMetrics.pendingCount || 0) !== 1 ? 's' : ''} awaiting action`,
                          subColor: 'text-slate-500',
                          valueClass: 'text-slate-800',
                          border: ''
                        },
                        {
                          label: 'Overdue',
                          value: fmt(paymentMetrics.overdueAmount),
                          sub: `${paymentMetrics.overdueCount || 0} overdue invoice${(paymentMetrics.overdueCount || 0) !== 1 ? 's' : ''}`,
                          subColor: 'text-red-500',
                          valueClass: 'text-red-600',
                          border: 'border-b-2 border-red-400'
                        },
                        {
                          label: 'Total Paid',
                          value: fmt(paymentMetrics.totalPaid),
                          sub: 'Lifetime payments',
                          subColor: 'text-emerald-500',
                          valueClass: 'text-slate-800',
                          border: ''
                        },
                      ].map((s, i) => (
                        <div key={i} className={`bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm ${s.border}`}>
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{s.label}</p>
                          <p className={`text-xl font-black mt-1.5 ${s.valueClass}`}>{s.value}</p>
                          <p className={`text-[9px] font-bold mt-1 ${s.subColor}`}>{s.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Outstanding Amount Card */}
                    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #133fbd 0%, #1e3a5f 100%)' }}>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Outstanding Amount</p>
                            <h2 className="text-3xl font-black text-white mt-1">{fmt(paymentMetrics.outstandingAmount)}</h2>
                          </div>
                          {paymentMetrics.nextDueDate && (
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Next Due Date</p>
                              <p className="text-sm font-black text-white mt-1">
                                {new Date(paymentMetrics.nextDueDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                              </p>
                              {daysUntilDue(paymentMetrics.nextDueDate) <= 7 && daysUntilDue(paymentMetrics.nextDueDate) >= 0 && (
                                <span className="text-[9px] font-bold text-amber-300">
                                  Due in {daysUntilDue(paymentMetrics.nextDueDate)} day{daysUntilDue(paymentMetrics.nextDueDate) !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[9px] font-bold text-white/60">Paid Progress</p>
                            <p className="text-[9px] font-bold text-white/60">{paidProgress}% Collected</p>
                          </div>
                          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white rounded-full transition-all duration-700"
                              style={{ width: `${paidProgress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          {paymentMetrics.nextDueDate && (
                            <span className="text-[9px] font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full">
                              Latest: {new Date(paymentMetrics.nextDueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              const nextBill = bills.find(b => b.status === 'unpaid');
                              if (nextBill) { setSelectedBillToPay(nextBill); setShowPayModal(true); }
                            }}
                            disabled={!bills.some(b => b.status === 'unpaid')}
                            className="px-5 py-2 bg-white text-[#133fbd] text-xs font-black rounded-xl cursor-pointer hover:bg-slate-100 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                          >
                            Pay Now
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Recent Invoices */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800">Recent Invoices</h3>
                        <div className="flex items-center gap-1.5">
                          {['All', 'Pending', 'Overdue', 'Paid'].map(f => (
                            <button
                              key={f}
                              onClick={() => setBillStatusFilter(f)}
                              className={`px-2.5 py-1 text-[9px] font-bold rounded-lg cursor-pointer transition ${
                                billStatusFilter === f
                                  ? 'bg-[#133fbd] text-white'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                      {filteredBills.length === 0 ? (
                        <div className="px-5 pb-5">
                          <p className="text-slate-400 text-xs italic">No invoices found.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-600">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                <th className="px-5 py-3">Invoice ID</th>
                                <th className="px-5 py-3">Description</th>
                                <th className="px-5 py-3">Due Date</th>
                                <th className="px-5 py-3">Amount</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {filteredBills.map((bill) => {
                                const overdue = isOverdue(bill);
                                return (
                                  <tr key={bill.id} className="hover:bg-slate-50/50">
                                    <td className="px-5 py-3.5 font-black text-slate-700 text-[11px]">
                                      {bill.invoice_id || `#INV-${String(bill.id).padStart(4, '0')}`}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 font-medium truncate max-w-[140px]">{bill.description}</td>
                                    <td className="px-5 py-3.5">
                                      <span className={`font-semibold ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
                                        {new Date(bill.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      {overdue && (
                                        <span className="block text-[9px] font-bold text-red-500">{daysOverdue(bill)}d overdue</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5 font-black text-slate-800">{fmt(bill.amount)}</td>
                                    <td className="px-5 py-3.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                        bill.status === 'paid'
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : overdue
                                          ? 'bg-red-50 text-red-700'
                                          : 'bg-amber-50 text-amber-700'
                                      }`}>
                                        {bill.status === 'paid' ? 'PAID' : overdue ? 'OVD' : 'PND'}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                      {bill.status === 'unpaid' ? (
                                        <button
                                          onClick={() => { setSelectedBillToPay(bill); setShowPayModal(true); }}
                                          disabled={payingBillId === bill.id}
                                          className="px-3 py-1.5 bg-[#133fbd] hover:bg-[#0f3299] text-white text-[9px] font-bold rounded-lg cursor-pointer transition disabled:opacity-50 flex items-center gap-1 ml-auto"
                                        >
                                          {payingBillId === bill.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                                          Pay
                                        </button>
                                      ) : (
                                        <span className="text-[9px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                                          <CheckCircle className="w-3 h-3" /> Paid
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-5 pt-5 pb-3">
                        <h3 className="text-sm font-black text-slate-800">Transaction History</h3>
                      </div>
                      {paymentTransactions.length === 0 ? (
                        <div className="px-5 pb-5">
                          <p className="text-slate-400 text-xs italic">No transactions recorded yet.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-600">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                                <th className="px-5 py-3">Reference</th>
                                <th className="px-5 py-3">Invoice</th>
                                <th className="px-5 py-3">Amount</th>
                                <th className="px-5 py-3">Date</th>
                                <th className="px-5 py-3">Method</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {paymentTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50">
                                  <td className="px-5 py-3.5 font-black text-slate-700 text-[10px]">#{tx.transaction_id}</td>
                                  <td className="px-5 py-3.5 text-slate-500 font-semibold text-[10px]">{tx.invoice_id}</td>
                                  <td className="px-5 py-3.5 font-black text-slate-800">{fmt(tx.amount)}</td>
                                  <td className="px-5 py-3.5 text-slate-400 font-medium">
                                    {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-lg">
                                      {tx.method || 'Online'}
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

                  {/* RIGHT SIDEBAR */}
                  <div className="space-y-4">

                    {/* Action Required */}
                    {(paymentMetrics.pendingCount > 0 || paymentMetrics.overdueCount > 0) && (
                      <div className="bg-white border border-orange-200 rounded-2xl shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                          </div>
                          <h3 className="text-xs font-black text-slate-800">Action Required</h3>
                        </div>
                        <div className="space-y-3">
                          {paymentMetrics.nextDueDate && paymentMetrics.pendingCount > 0 && (() => {
                            const d = daysUntilDue(paymentMetrics.nextDueDate);
                            return d >= 0 && d <= 14 ? (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider mb-1">Upcoming Due Date</p>
                                <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                                  Invoice for {fmt(paymentMetrics.nextDueAmount)} is due in {d} day{d !== 1 ? 's' : ''}.
                                </p>
                              </div>
                            ) : null;
                          })()}
                          {paymentMetrics.overdueCount > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                              <p className="text-[9px] font-black text-red-700 uppercase tracking-wider mb-1">Overdue Payment</p>
                              <p className="text-[10px] text-red-800 font-semibold leading-relaxed">
                                {paymentMetrics.overdueCount} invoice{paymentMetrics.overdueCount !== 1 ? 's are' : ' is'} overdue totalling {fmt(paymentMetrics.overdueAmount)}.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Methods */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-slate-800">Payment Methods</h3>
                        <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">Manage</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-[#133fbd] flex items-center justify-center shrink-0">
                            <CreditCard className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-800">Online Payment</p>
                            <p className="text-[9px] text-slate-400 font-medium">Instant processing</p>
                          </div>
                          <span className="text-[8px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">Default</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                            <Building className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-slate-800">Bank Transfer</p>
                            <p className="text-[9px] text-slate-400 font-medium">Setup Direct Debit</p>
                          </div>
                        </div>
                        <button className="w-full py-2 border border-dashed border-slate-300 text-slate-500 text-[10px] font-bold rounded-xl cursor-pointer hover:bg-slate-50 transition flex items-center justify-center gap-1.5">
                          <Plus className="w-3 h-3" /> Add New Method
                        </button>
                      </div>
                    </div>

                    {/* Paperless Billing Promo */}
                    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
                      <div className="p-5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center mb-3">
                          <FileText className="w-4 h-4 text-blue-300" />
                        </div>
                        <h3 className="text-sm font-black text-white mb-1">Paperless Billing</h3>
                        <p className="text-[10px] text-white/60 font-medium leading-relaxed mb-4">
                          Switch to digital receipts and save on maintenance fees.
                        </p>
                        <button className="text-[10px] font-black text-blue-400 hover:text-blue-300 cursor-pointer transition flex items-center gap-1">
                          Enable Now <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5">
                      <h3 className="text-xs font-black text-slate-800 mb-4">Payment Summary</h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Total Invoices', value: paymentMetrics.totalInvoices || 0, color: 'text-slate-800' },
                          { label: 'Paid', value: (paymentMetrics.totalInvoices || 0) - (paymentMetrics.pendingCount || 0), color: 'text-emerald-600' },
                          { label: 'Pending', value: paymentMetrics.pendingCount || 0, color: 'text-amber-600' },
                          { label: 'Overdue', value: paymentMetrics.overdueCount || 0, color: 'text-red-600' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-medium">{item.label}</span>
                            <span className={`text-[11px] font-black ${item.color}`}>{item.value}</span>
                          </div>
                        ))}
                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-medium">Amount Paid</span>
                          <span className="text-xs font-black text-slate-800">{fmt(paymentMetrics.totalPaid)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </>
            );
          })()}

          {/* 3.5 activeTab = PARKING (Guest parking requests) */}
          {activeTab === 'parking' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="lg:col-span-1 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm h-fit">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Request Guest Parking Slot</h3>
                <form onSubmit={handleRequestParking} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Choose Guest Slot</label>
                    <div className="relative">
                      <select
                        required
                        className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                        value={parkingForm.slot_number}
                        onChange={(e) => setParkingForm({ ...parkingForm, slot_number: e.target.value })}
                      >
                        <option value="">-- Choose Slot --</option>
                        {parkingSlots.map((num) => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1.5">Reservation Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium transition-all"
                      value={parkingForm.guest_date}
                      onChange={(e) => setParkingForm({ ...parkingForm, guest_date: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                  >
                    Request Guest Slot
                  </button>
                </form>
              </div>

              {/* Parking active logs */}
              <div className="lg:col-span-2 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">My Active Parking Slots</h3>
                  {myParking.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No slots allocated.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {myParking.map((p) => (
                        <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-800">{p.slot_number}</h4>
                            <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                              {p.type} Slot {p.guest_date ? `(for ${new Date(p.guest_date).toLocaleDateString()})` : ''}
                            </p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            p.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                            p.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3.6b activeTab = NOTICES (Community Announcements) */}
          {activeTab === 'notices' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Community Notices & Announcements</h3>
                <p className="text-xs text-slate-400 font-semibold mb-5">Stay updated with important announcements from building management.</p>

                {notices.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No notices published yet.</p>
                ) : (
                  <div className="space-y-4">
                    {notices.map((n) => {
                      let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-100';
                      let categoryLabel = n.category || 'COMMUNITY';
                      if (n.priority === 'urgent') badgeStyle = 'bg-red-50 text-red-700 border-red-100';
                      else if (n.priority === 'high') badgeStyle = 'bg-amber-50 text-amber-700 border-amber-100';
                      else if (n.category === 'Security') { badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-100'; }

                      return (
                        <div key={n.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition duration-150 shadow-sm">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold border uppercase ${badgeStyle}`}>
                                  {categoryLabel}
                                </span>
                                {n.priority === 'urgent' && (
                                  <span className="px-2 py-0.5 rounded text-[8px] font-extrabold border bg-red-100 text-red-700 border-red-200 uppercase">🔴 Urgent</span>
                                )}
                                {n.audience && n.audience !== 'All Residents' && (
                                  <span className="px-2 py-0.5 rounded text-[8px] font-extrabold border bg-slate-100 text-slate-500 border-slate-200 uppercase">{n.audience}</span>
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                              <p className="text-[10px] text-slate-400 font-medium font-sans leading-normal">{n.content}</p>
                              <div className="flex items-center gap-3 pt-1">
                                <span className="text-[9px] font-bold text-slate-400">
                                  Published: {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {n.expiry_date && (
                                  <span className="text-[9px] font-bold text-amber-600">
                                    Expires: {new Date(n.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => alert(`Notice Details:\n\nTitle: ${n.title}\nCategory: ${n.category}\nPriority: ${n.priority}\nAudience: ${n.audience}\n\nContent:\n${n.content}\n\nPublished: ${new Date(n.created_at).toLocaleDateString()}`)}
                              className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg cursor-pointer transition shadow-sm"
                            >
                              Read More
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3.6c activeTab = TENANTS (Homeowner clearance step 1) */}
          {activeTab === 'tenants' && user?.role === 'homeowner' && (
            <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Pending Tenant Applications</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">Review tenant signups requesting association under your homeowner email. Approval triggers step 2 clearance by the administrator.</p>
              </div>

              {pendingTenants.length === 0 ? (
                <p className="text-slate-400 text-xs italic text-center py-6">No tenant requests awaiting homeowner clearance.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Tenant Name</th>
                        <th className="pb-3">Tenant Email</th>
                        <th className="pb-3">Relationship</th>
                        <th className="pb-3">NIC / Passport</th>
                        <th className="pb-3">Phone</th>
                        <th className="pb-3">Date Applied</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingTenants.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-bold text-slate-800">{t.full_name || 'N/A'}</td>
                          <td className="py-3">{t.email}</td>
                          <td className="py-3 capitalize font-semibold">{t.relationship_to_owner || 'N/A'}</td>
                          <td className="py-3">{t.nic_or_passport || 'N/A'}</td>
                          <td className="py-3">{t.phone_number || 'N/A'}</td>
                          <td className="py-3 text-slate-400">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleTenantApproval(t.id, 'approve')}
                              className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/50 cursor-pointer transition"
                              title="Approve Tenant"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleTenantApproval(t.id, 'reject')}
                              className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 cursor-pointer transition"
                              title="Reject Tenant"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* 4. Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Update Personal Profile</h3>
              <button 
                onClick={() => setShowEditProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={profileForm.phone_number}
                  onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Vehicle Number (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter vehicle tag"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={profileForm.vehicle_number}
                  onChange={(e) => setProfileForm({ ...profileForm, vehicle_number: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
