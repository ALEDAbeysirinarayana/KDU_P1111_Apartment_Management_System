import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Building, FileText, Compass, Bell, Check, X, Plus, Trash2, 
  ShieldAlert, LayoutDashboard, Search, Settings, LogOut, Loader2, 
  Megaphone, Calendar, ClipboardList, Shield, ShieldAlert as AlertIcon, CreditCard, ChevronDown,
  Clock, CheckCircle
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

  // Unit Inventory Management State
  const [unitBlockFilter, setUnitBlockFilter] = useState('All Blocks');
  const [unitFloorFilter, setUnitFloorFilter] = useState('All Floors');
  const [unitStatusFilter, setUnitStatusFilter] = useState('Status');
  const [unitTypeFilter, setUnitTypeFilter] = useState('Unit Type');
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [unitMetrics, setUnitMetrics] = useState({
    totalUnits: 500, occupiedUnits: 465, vacantUnits: 28, maintenanceUnits: 7,
    totalParking: 550, availableParking: 82, assignedParking: 468, storageUnits: 120
  });

  // Complaints & Maintenance State
  const [complaintsTotal, setComplaintsTotal] = useState(0);
  const [complaintsPage, setComplaintsPage] = useState(1);
  const [complaintsMetrics, setComplaintsMetrics] = useState({ total: 0, pending: 0, in_progress: 0, emergency: 0 });
  const [complaintsDistribution, setComplaintsDistribution] = useState({ totalActive: 0, pendingPercent: 25, progressPercent: 35, emergencyPercent: 15, resolvedPercent: 25 });
  const [staffWorkload, setStaffWorkload] = useState([]);
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('All');
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState('All');
  const [complaintPriorityFilter, setComplaintPriorityFilter] = useState('All');
  const [complaintBlockFilter, setComplaintBlockFilter] = useState('All');
  const [complaintSearchQuery, setComplaintSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Stats Data
  const [dashboardStats, setDashboardStats] = useState(null);

  // Tab Data States
  const [pendingHomeowners, setPendingHomeowners] = useState([]);
  const [pendingTenants, setPendingTenants] = useState([]);
  const [residents, setResidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [bills, setBills] = useState([]);
  const [billsTotal, setBillsTotal] = useState(0);
  const [billsPage, setBillsPage] = useState(1);
  const [billMetrics, setBillMetrics] = useState({ totalInvoices: 1250, paymentsCollected: 45200, pendingAmount: 8400, pendingCount: 42, overdueAmount: 2150, overdueCount: 12 });
  const [billMonthlyData, setBillMonthlyData] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [billStatusFilter, setBillStatusFilter] = useState('All');
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [recordPaymentForm, setRecordPaymentForm] = useState({ billId: '', payment_method: 'Bank Transfer', notes: '' });
  const [notices, setNotices] = useState([]);
  const [noticeMetrics, setNoticeMetrics] = useState({ totalNotices: 1248, activeNotices: 42, scheduledNotices: 12, archivedNotices: 1194 });
  const [noticeDistribution, setNoticeDistribution] = useState({ utility: 45, events: 30, security: 15, other: 10 });
  const [noticeActivities, setNoticeActivities] = useState([]);
  const [noticeSearchQuery, setNoticeSearchQuery] = useState('');
  const [noticeStatusFilter, setNoticeStatusFilter] = useState('All');
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState('All');
  const [noticePriorityFilter, setNoticePriorityFilter] = useState('All');
  const [showAddNoticeModal, setShowAddNoticeModal] = useState(false);
  const [newNoticeForm, setNewNoticeForm] = useState({ title: '', content: '', category: 'Utility', expiry_date: '', priority: 'low', audience: 'All Residents', status: 'published' });
  const [showEditNoticeModal, setShowEditNoticeModal] = useState(false);
  const [editNoticeForm, setEditNoticeForm] = useState({ id: '', title: '', content: '', category: 'Utility', expiry_date: '', priority: 'low', audience: 'All Residents', status: 'published' });
  const [complaints, setComplaints] = useState([]);
  const [facilityReservations, setFacilityReservations] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('');
  const [facilityMetrics, setFacilityMetrics] = useState({ totalFacilities: 12, activeBookings: 45, pendingRequests: 8, totalParkingSlots: 120 });
  const [showBookingRequestsModal, setShowBookingRequestsModal] = useState(false);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [newFacilityForm, setNewFacilityForm] = useState({ facility_id: '', name: '', description: '', capacity: 10, status: 'available' });
  const [showEditFacilityModal, setShowEditFacilityModal] = useState(false);
  const [editFacilityForm, setEditFacilityForm] = useState({ id: '', facility_id: '', name: '', description: '', capacity: 10, status: 'available' });

  // Community Events State
  const [events, setEvents] = useState([]);
  const [eventMetrics, setEventMetrics] = useState({ totalEvents: 0, upcomingEvents: 0, activeRegistrations: 0, completedEvents: 0 });
  const [eventOverview, setEventOverview] = useState([]);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventForm, setNewEventForm] = useState({ name: '', type: 'Meeting', date: '', time: '', location: '', status: 'Upcoming' });
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [editEventForm, setEditEventForm] = useState({ id: '', name: '', type: 'Meeting', date: '', time: '', location: '', status: 'Upcoming' });

  // Form Input States
  const [newUnit, setNewUnit] = useState({ block_name: '', floor_number: '', unit_number: '', type: '2BHK', status: 'vacant' });
  const [allocation, setAllocation] = useState({ unitId: '', owner_id: '', tenant_id: '', parking_slot_id: '' });
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
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
        const unitsRes = await api.get('/units', {
          params: {
            block: unitBlockFilter === 'All Blocks' ? '' : unitBlockFilter,
            floor: unitFloorFilter === 'All Floors' ? '' : unitFloorFilter,
            status: unitStatusFilter === 'Status' ? '' : unitStatusFilter,
            type: unitTypeFilter === 'Unit Type' ? '' : unitTypeFilter,
            search: unitSearchQuery
          }
        });
        setUnits(unitsRes.data.units || []);
        setUnitMetrics(unitsRes.data.metrics || {
          totalUnits: 500, occupiedUnits: 465, vacantUnits: 28, maintenanceUnits: 7,
          totalParking: 550, availableParking: 82, assignedParking: 468, storageUnits: 120
        });
        const parkingRes = await api.get('/parking');
        setParkingSlots(parkingRes.data || []);
      } else if (activeTab === 'complaints') {
        const compRes = await api.get('/complaints', {
          params: {
            status: complaintStatusFilter === 'All' ? '' : complaintStatusFilter,
            category: complaintCategoryFilter === 'All' ? '' : complaintCategoryFilter,
            priority: complaintPriorityFilter === 'All' ? '' : complaintPriorityFilter,
            block: complaintBlockFilter === 'All' ? '' : complaintBlockFilter,
            search: complaintSearchQuery,
            page: complaintsPage,
            limit: 10
          }
        });
        setComplaints(compRes.data.complaints || []);
        setComplaintsTotal(compRes.data.total || 0);
        setComplaintsMetrics(compRes.data.metrics || { total: 0, pending: 0, in_progress: 0, emergency: 0 });
        setComplaintsDistribution(compRes.data.distribution || { totalActive: 0, pendingPercent: 25, progressPercent: 35, emergencyPercent: 15, resolvedPercent: 25 });
        setStaffWorkload(compRes.data.staffWorkload || []);
      } else if (activeTab === 'facility') {
        const parkingRes = await api.get('/parking');
        setParkingSlots(parkingRes.data || []);
        const resRes = await api.get('/facilities/reservations');
        setFacilityReservations(resRes.data.reservations || []);
        setFacilityMetrics(resRes.data.metrics || { totalFacilities: 12, activeBookings: 45, pendingRequests: 8, totalParkingSlots: 120 });
        const facRes = await api.get('/facilities');
        setFacilities(facRes.data || []);
      } else if (activeTab === 'events') {
        const eventsRes = await api.get('/events', { params: { search: eventSearchQuery } });
        setEvents(eventsRes.data.events || []);
        setEventMetrics(eventsRes.data.metrics || { totalEvents: 0, upcomingEvents: 0, activeRegistrations: 0, completedEvents: 0 });
        setEventOverview(eventsRes.data.participationOverview || []);

        const regsRes = await api.get('/events/registrations', { params: { search: eventSearchQuery } });
        setEventRegistrations(regsRes.data || []);
      } else if (activeTab === 'notices') {
        const noticesRes = await api.get('/notices', {
          params: {
            search: noticeSearchQuery,
            status: noticeStatusFilter === 'All' ? '' : noticeStatusFilter,
            category: noticeCategoryFilter === 'All' ? '' : noticeCategoryFilter,
            priority: noticePriorityFilter === 'All' ? '' : noticePriorityFilter
          }
        });
        setNotices(noticesRes.data.notices || []);
        setNoticeMetrics(noticesRes.data.metrics || { totalNotices: 1248, activeNotices: 42, scheduledNotices: 12, archivedNotices: 1194 });
        setNoticeDistribution(noticesRes.data.distribution || { utility: 45, events: 30, security: 15, other: 10 });
        setNoticeActivities(noticesRes.data.activities || []);
      } else if (activeTab === 'bills') {
        const billsRes = await api.get('/bills', {
          params: {
            search: billSearchQuery,
            status: billStatusFilter === 'All' ? '' : billStatusFilter.toLowerCase(),
            page: billsPage,
            limit: 10
          }
        });
        setBills(billsRes.data.bills || []);
        setBillsTotal(billsRes.data.total || 0);
        setBillMetrics(billsRes.data.metrics || billMetrics);
        setBillMonthlyData(billsRes.data.monthlyCollection || []);
        setOverdueList(billsRes.data.overdueList || []);
        setTransactions(billsRes.data.transactions || []);
        const unitsRes = await api.get('/units');
        setUnits(unitsRes.data.units || unitsRes.data || []);
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
  }, [
    activeTab, roleFilter, statusFilter, searchQuery, usersPage, 
    residentStatusFilter, residentBlockFilter, residentSearch, residentsPage,
    unitBlockFilter, unitFloorFilter, unitStatusFilter, unitTypeFilter, unitSearchQuery,
    complaintStatusFilter, complaintCategoryFilter, complaintPriorityFilter, complaintBlockFilter, complaintSearchQuery, complaintsPage,
    eventSearchQuery,
    noticeSearchQuery, noticeStatusFilter, noticeCategoryFilter, noticePriorityFilter,
    billSearchQuery, billStatusFilter, billsPage
  ]);

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
      setShowAddUnitModal(false);
      setNewUnit({ block_name: '', floor_number: '', unit_number: '', type: '2BHK', status: 'vacant' });
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
      setShowAllocateModal(false);
      setAllocation({ unitId: '', owner_id: '', tenant_id: '', parking_slot_id: '' });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Allocation update failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Issue Bill (Generate Invoice)
  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      const form = showGenerateInvoiceModal
        ? newBill
        : newBill;
      await api.post('/bills', form);
      setSuccessMsg('Invoice generated successfully!');
      setNewBill({ unit_id: '', amount: '', description: '', due_date: '', payment_method: 'Bank Transfer' });
      setShowGenerateInvoiceModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Invoice generation failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Mark bill paid/unpaid
  const handleUpdateBillStatus = async (billId, status, paymentMethod = 'Bank Transfer') => {
    try {
      await api.put(`/bills/${billId}/status`, { status, payment_method: paymentMethod });
      setSuccessMsg(`Invoice marked as ${status}.`);
      fetchData();
      setShowRecordPaymentModal(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Status update failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Delete a bill
  const handleDeleteBill = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This cannot be undone.')) return;
    try {
      await api.delete(`/bills/${billId}`);
      setSuccessMsg('Invoice deleted.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Delete failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Record a payment form submit
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    await handleUpdateBillStatus(recordPaymentForm.billId, 'paid', recordPaymentForm.payment_method);
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
      await api.post('/notices', newNoticeForm);
      setSuccessMsg('Notice board broadcast updated successfully!');
      setShowAddNoticeModal(false);
      setNewNoticeForm({ title: '', content: '', category: 'Utility', expiry_date: '', priority: 'low', audience: 'All Residents', status: 'published' });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Notice publishing failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Update Notice
  const handleUpdateNotice = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/notices/${editNoticeForm.id}`, editNoticeForm);
      setSuccessMsg('Notice updated successfully!');
      setShowEditNoticeModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update notice');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/notices/${noticeId}`);
      setSuccessMsg('Notice deleted successfully.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to delete notice');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Update Complaint Status
  const handleUpdateComplaintStatus = async (compId, status) => {
    try {
      await api.put(`/complaints/${compId}/status`, { status });
      setSuccessMsg(`Complaint status updated to ${status}!`);
      fetchData();
      if (selectedComplaint && selectedComplaint.id === compId) {
        setSelectedComplaint(prev => prev ? { ...prev, status } : null);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Status update failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Assign staff to complaint
  const handleAssignStaff = async (compId, staffId) => {
    if (!staffId) return;
    try {
      await api.put(`/complaints/${compId}/assign`, { assigned_staff_id: parseInt(staffId) });
      setSuccessMsg(`Staff assigned to complaint successfully.`);
      fetchData();
      if (selectedComplaint && selectedComplaint.id === compId) {
        setSelectedComplaint(prev => prev ? { ...prev, assigned_staff_id: parseInt(staffId) } : null);
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Staff assignment failed');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Update status & staff assignment concurrently from modal view
  const handleUpdateComplaintDetails = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      await api.put(`/complaints/${selectedComplaint.id}/status`, { status: selectedComplaint.status });
      if (selectedComplaint.assigned_staff_id) {
        await api.put(`/complaints/${selectedComplaint.id}/assign`, { assigned_staff_id: parseInt(selectedComplaint.assigned_staff_id) });
      }
      setSuccessMsg("Complaint ticket details updated successfully.");
      setSelectedComplaint(null);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update complaint details');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Create Facility
  const handleCreateFacility = async (e) => {
    e.preventDefault();
    try {
      await api.post('/facilities', newFacilityForm);
      setSuccessMsg('Facility created successfully.');
      setShowAddFacilityModal(false);
      setNewFacilityForm({ facility_id: '', name: '', description: '', capacity: 10, status: 'available' });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to create facility');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Update Facility
  const handleUpdateFacility = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/facilities/${editFacilityForm.id}`, editFacilityForm);
      setSuccessMsg('Facility details updated successfully.');
      setShowEditFacilityModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update facility');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Delete Facility
  const handleDeleteFacility = async (facilityId) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) return;
    try {
      await api.delete(`/facilities/${facilityId}`);
      setSuccessMsg('Facility deleted successfully.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to delete facility');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Create Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', newEventForm);
      setSuccessMsg('Event created successfully.');
      setShowAddEventModal(false);
      setNewEventForm({ name: '', type: 'Meeting', date: '', time: '', location: '', status: 'Upcoming' });
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to create event');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Update Event
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/events/${editEventForm.id}`, editEventForm);
      setSuccessMsg('Event details updated successfully.');
      setShowEditEventModal(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update event');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${eventId}`);
      setSuccessMsg('Event deleted successfully.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to delete event');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Update Attendance
  const handleUpdateAttendance = async (regId, attendance) => {
    try {
      await api.put(`/events/registrations/${regId}/attendance`, { attendance });
      setSuccessMsg('Attendance status updated successfully.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update attendance');
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
              { id: 'events', label: 'Events', icon: Calendar },
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
          ) : activeTab === 'units' ? (
            <h2 className="font-extrabold text-base text-slate-800 tracking-tight">Unit & Inventory Management</h2>
          ) : activeTab === 'events' ? (
            <div className="flex items-center gap-4 flex-1">
              <h2 className="font-extrabold text-base text-slate-800 tracking-tight shrink-0">Community Events</h2>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search events or registrations..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none text-slate-800 focus:border-blue-600 focus:bg-white transition-colors"
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                />
              </div>
            </div>
          ) : activeTab === 'facility' ? (
            <div className="flex items-center gap-4 flex-1">
              <h2 className="font-extrabold text-base text-slate-800 tracking-tight shrink-0">Facility & Parking Management</h2>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search facilities or slots..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none text-slate-800 focus:border-blue-600 focus:bg-white transition-colors"
                  value={facilitySearchQuery}
                  onChange={(e) => setFacilitySearchQuery(e.target.value)}
                />
              </div>
            </div>
          ) : activeTab === 'complaints' ? (
            <div className="flex items-center gap-4 flex-1">
              <h2 className="font-extrabold text-base text-slate-800 tracking-tight shrink-0">Complaints & Maintenance</h2>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none text-slate-800 focus:border-blue-600 focus:bg-white transition-colors"
                  value={complaintSearchQuery}
                  onChange={(e) => setComplaintSearchQuery(e.target.value)}
                />
              </div>
            </div>
          ) : activeTab === 'notices' ? (
            <div className="flex items-center gap-4 flex-1">
              <h2 className="font-extrabold text-base text-slate-800 tracking-tight shrink-0">Notices & Announcements</h2>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search notices, ID or keywords..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none text-slate-800 focus:border-blue-600 focus:bg-white transition-colors"
                  value={noticeSearchQuery}
                  onChange={(e) => setNoticeSearchQuery(e.target.value)}
                />
              </div>
            </div>
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
          )
          }

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
                  className="py-1.5 px-3.5 bg-white border border-slate-255 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer transition shadow-sm active:scale-95"
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

            {activeTab === 'units' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    alert("Simulated Action: Unit inventory data exported to CSV format successfully.");
                  }}
                  className="py-1.5 px-3.5 bg-white border border-slate-255 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer transition shadow-sm active:scale-95"
                >
                  Export
                </button>
                <button 
                  onClick={() => setShowAddUnitModal(true)}
                  className="py-1.5 px-3 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Unit</span>
                </button>
              </div>
            )}

            {activeTab === 'facility' && (
              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                <button 
                  onClick={() => setShowBookingRequestsModal(true)}
                  className="py-1.5 px-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer transition shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Booking Requests</span>
                </button>
                <button 
                  onClick={() => setShowAddFacilityModal(true)}
                  className="py-1.5 px-3 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Facility</span>
                </button>
              </div>
            )}

            {activeTab === 'complaints' && (
              <button 
                onClick={() => {
                  setComplaintStatusFilter('emergency');
                  setComplaintPriorityFilter('emergency');
                }}
                className="py-1.5 px-3 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-sm"
              >
                <span>✳</span>
                <span>View Emergency Complaints</span>
              </button>
            )}

            {activeTab === 'events' && (
              <button 
                onClick={() => setShowAddEventModal(true)}
                className="py-1.5 px-3 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-sm animate-in fade-in duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Event</span>
              </button>
            )}

            {activeTab === 'notices' && (
              <button 
                onClick={() => setShowAddNoticeModal(true)}
                className="py-1.5 px-3 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-sm animate-in fade-in duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Notice</span>
              </button>
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
            <div className="space-y-6">
              
              {/* Row 1 Metrics: Apartment units */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Units</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{unitMetrics.totalUnits.toLocaleString()}</h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Occupied Units</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{unitMetrics.occupiedUnits.toLocaleString()}</h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Vacant Units</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{unitMetrics.vacantUnits.toLocaleString()}</h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Under Maintenance</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{unitMetrics.maintenanceUnits.toLocaleString()}</h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                    <X className="w-5 h-5 text-rose-500" />
                  </div>
                </div>
              </div>

              {/* Row 2 Metrics: Parking spaces & storage */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Parking</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{unitMetrics.totalParking} <span className="text-xs text-slate-400 font-bold">Lots</span></h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 font-extrabold text-slate-500 text-sm">
                    P
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Available Parking</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{unitMetrics.availableParking}</h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Assigned Parking</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{unitMetrics.assignedParking}</h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Storage Units</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{unitMetrics.storageUnits} <span className="text-xs text-slate-400 font-bold">Units</span></h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Filter controls */}
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Unit #, Resident..."
                    className="w-full bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs transition-all"
                    value={unitSearchQuery}
                    onChange={(e) => setUnitSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
                  <div className="relative w-full sm:w-36">
                    <select
                      className="w-full pl-3 pr-10 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                      value={unitBlockFilter}
                      onChange={(e) => setUnitBlockFilter(e.target.value)}
                    >
                      <option value="All Blocks">All Blocks</option>
                      <option value="Block A">Block A</option>
                      <option value="Block B">Block B</option>
                      <option value="Block C">Block C</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative w-full sm:w-32">
                    <select
                      className="w-full pl-3 pr-10 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                      value={unitFloorFilter}
                      onChange={(e) => setUnitFloorFilter(e.target.value)}
                    >
                      <option value="All Floors">All Floors</option>
                      <option value="1">1st Floor</option>
                      <option value="2">2nd Floor</option>
                      <option value="3">3rd Floor</option>
                      <option value="4">4th Floor</option>
                      <option value="5">5th Floor</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative w-full sm:w-32">
                    <select
                      className="w-full pl-3 pr-10 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                      value={unitStatusFilter}
                      onChange={(e) => setUnitStatusFilter(e.target.value)}
                    >
                      <option value="Status">Status</option>
                      <option value="occupied">Occupied</option>
                      <option value="vacant">Vacant</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative w-full sm:w-32">
                    <select
                      className="w-full pl-3 pr-10 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                      value={unitTypeFilter}
                      onChange={(e) => setUnitTypeFilter(e.target.value)}
                    >
                      <option value="Unit Type">Unit Type</option>
                      <option value="Studio">Studio</option>
                      <option value="1BHK">1BHK</option>
                      <option value="2BHK">2BHK</option>
                      <option value="3BHK">3BHK</option>
                      <option value="Penthouse">Penthouse</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  </div>

                  <button 
                    onClick={() => {
                      setUnitSearchQuery('');
                      setUnitBlockFilter('All Blocks');
                      setUnitFloorFilter('All Floors');
                      setUnitStatusFilter('Status');
                      setUnitTypeFilter('Unit Type');
                    }}
                    className="text-xs font-extrabold text-blue-700 hover:text-blue-500 hover:underline cursor-pointer transition select-none ml-2"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Unit inventory list */}
              <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 min-w-[750px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3.5 pl-6 font-semibold">Unit #</th>
                        <th className="py-3.5 font-semibold">Block</th>
                        <th className="py-3.5 font-semibold">Floor</th>
                        <th className="py-3.5 font-semibold">Type</th>
                        <th className="py-3.5 font-semibold">Occupancy Status</th>
                        <th className="py-3.5 font-semibold">Resident</th>
                        <th className="py-3.5 font-semibold">Parking</th>
                        <th className="py-3.5 text-right pr-6 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {units.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-slate-400 italic">No registered units match active filters.</td>
                        </tr>
                      ) : (
                        units.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 pl-6 font-bold text-slate-800">
                              {u.block_name ? `${u.block_name.charAt(u.block_name.length - 1)}-${u.unit_number}` : u.unit_number}
                            </td>
                            <td className="py-3.5 font-medium">{u.block_name || 'Block A'}</td>
                            <td className="py-3.5 font-medium">
                              {u.floor_number === 1 ? '1st Floor' : u.floor_number === 2 ? '2nd Floor' : u.floor_number === 3 ? '3rd Floor' : `${u.floor_number}th Floor`}
                            </td>
                            <td className="py-3.5 font-semibold">{u.type || '2BHK'}</td>
                            <td className="py-3.5">
                              <span className={`px-2.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                u.status === 'occupied' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                u.status === 'vacant' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="py-3.5 font-bold text-slate-700">
                              {u.tenant_name || u.owner_name || (
                                <span className="text-slate-400 font-semibold italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3.5 text-blue-700 font-bold text-xs">
                              {u.parking_slot_number ? `Lot #${u.parking_slot_number}` : '—'}
                            </td>
                            <td className="py-3.5 text-right pr-6">
                              <button
                                onClick={() => {
                                  setAllocation({
                                    unitId: u.id,
                                    owner_id: u.owner_id || '',
                                    tenant_id: u.tenant_id || '',
                                    parking_slot_id: u.parking_slot_id || ''
                                  });
                                  setShowAllocateModal(true);
                                }}
                                className="px-2.5 py-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-bold rounded cursor-pointer transition"
                              >
                                Allocate Resources
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom occupancy donut chart & activity feeds */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Donut occupancy representation */}
                <div className="lg:col-span-1 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-between">
                  <h3 className="w-full text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-4 text-left">Unit Occupancy Distribution</h3>
                  
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* SVG circular donut segment */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="2.5"></circle>
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="15.915" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="2.5" 
                        strokeDasharray={`${Math.round((unitMetrics.occupiedUnits / (unitMetrics.totalUnits || 1)) * 100)} ${100 - Math.round((unitMetrics.occupiedUnits / (unitMetrics.totalUnits || 1)) * 100)}`}
                      ></circle>
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-black text-slate-800 block">
                        {Math.round((unitMetrics.occupiedUnits / (unitMetrics.totalUnits || 1)) * 100)}%
                      </span>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">Occupancy</span>
                    </div>
                  </div>

                  <div className="w-full space-y-2 mt-6 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Occupied</span>
                      </div>
                      <span className="text-slate-800 font-extrabold">{unitMetrics.occupiedUnits} Units</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>Vacant</span>
                      </div>
                      <span className="text-slate-800 font-extrabold">{unitMetrics.vacantUnits} Units</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span>Maintenance</span>
                      </div>
                      <span className="text-slate-800 font-extrabold">{unitMetrics.maintenanceUnits} Units</span>
                    </div>
                  </div>
                </div>

                {/* Recent Unit activity log feeds */}
                <div className="lg:col-span-2 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-4">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Unit Activity</h3>
                      <button className="text-[10px] font-extrabold text-blue-700 hover:text-blue-500 tracking-wider">View All</button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
                          <Check className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">New Tenant Check-in</h4>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Michael Jordan moved into Unit A-101</p>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-400 shrink-0">10 mins ago</span>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0 text-rose-600">
                          <X className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">Maintenance Started</h4>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Plumbing repairs initiated for Unit C-405</p>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-400 shrink-0">1 hour ago</span>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                          <Building className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">Parking Lot Assigned</h4>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Lot #P88 assigned to Unit C-405</p>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-400 shrink-0">4 hours ago</span>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 text-amber-600">
                          <ShieldAlert className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">Tenant Move-out Notice</h4>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Resident of Unit D-302 submitted 30-day notice</p>
                        </div>
                        <span className="text-[9px] font-semibold text-slate-400 shrink-0">Yesterday</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 3.5 activeTab = COMPLAINTS */}
          {activeTab === 'complaints' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Metrics cards row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Complaints</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{complaintsMetrics.total.toLocaleString()}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">+12%</span>
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Pending</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{complaintsMetrics.pending}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full">Active</span>
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5 text-amber-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">In Progress</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{complaintsMetrics.in_progress}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Processing</span>
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Compass className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between relative overflow-hidden">
                  {/* Red corner dot indicating Urgent */}
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Emergency</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{complaintsMetrics.emergency}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">Urgent</span>
                    <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
                      <X className="w-5 h-5 text-rose-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters row */}
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="text-xs font-bold text-slate-400">Filters:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <select
                        className="pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                        value={complaintStatusFilter}
                        onChange={(e) => setComplaintStatusFilter(e.target.value)}
                      >
                        <option value="All">Status: All</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="emergency">Emergency</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        className="pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                        value={complaintCategoryFilter}
                        onChange={(e) => setComplaintCategoryFilter(e.target.value)}
                      >
                        <option value="All">Category: All</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="HVAC">HVAC</option>
                        <option value="General">General</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        className="pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                        value={complaintPriorityFilter}
                        onChange={(e) => setComplaintPriorityFilter(e.target.value)}
                      >
                        <option value="All">Priority: All</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="emergency">Emergency</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        className="pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200/80 outline-none text-slate-700 rounded-lg text-xs font-bold appearance-none cursor-pointer hover:bg-slate-100/50"
                        value={complaintBlockFilter}
                        onChange={(e) => setComplaintBlockFilter(e.target.value)}
                      >
                        <option value="All">Block: All</option>
                        <option value="Block A">Block A</option>
                        <option value="Block B">Block B</option>
                        <option value="Block C">Block C</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setComplaintStatusFilter('All');
                    setComplaintCategoryFilter('All');
                    setComplaintPriorityFilter('All');
                    setComplaintBlockFilter('All');
                    setComplaintSearchQuery('');
                  }}
                  className="text-xs font-extrabold text-blue-700 hover:text-blue-500 tracking-wider cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>

              {/* Two Column Layout: Table vs Donut Distribution & Workload */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left registry table */}
                <div className="lg:col-span-2 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3 pl-2">ID</th>
                          <th className="pb-3">Unit</th>
                          <th className="pb-3">Resident</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Priority</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Staff</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-right pr-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {complaints.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="py-8 text-center text-slate-400 italic">No tickets found matching current filters.</td>
                          </tr>
                        ) : (
                          complaints.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/50">
                              <td className="py-3.5 pl-2 font-bold text-blue-700">#{1000 + c.id}</td>
                              <td className="py-3.5 font-bold text-slate-800">
                                {c.resident_building ? `${c.resident_building.replace(/[^a-zA-Z]/g, '')}-${c.resident_unit}` : 'A-402'}
                              </td>
                              <td className="py-3.5 font-bold text-slate-700">
                                {c.resident_name || c.resident_email?.split('@')[0] || 'John Doe'}
                              </td>
                              <td className="py-3.5">
                                <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-150 text-[10px] font-bold text-slate-600 uppercase">
                                  {c.category}
                                </span>
                              </td>
                              <td className="py-3.5 font-extrabold">
                                <span className={
                                  c.priority === 'emergency' ? 'text-rose-600' :
                                  c.priority === 'high' ? 'text-amber-600' :
                                  c.priority === 'medium' ? 'text-blue-600' :
                                  'text-slate-400'
                                }>
                                  {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
                                </span>
                              </td>
                              <td className="py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  c.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  c.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                  c.status === 'emergency' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                  'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="py-3.5 font-semibold text-slate-800">
                                {c.assigned_staff_name || 'Mike Ross'}
                              </td>
                              <td className="py-3.5 font-semibold text-slate-400">
                                {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Oct 24'}
                              </td>
                              <td className="py-3.5 text-right pr-2">
                                <button
                                  onClick={() => setSelectedComplaint(c)}
                                  className="text-blue-700 hover:text-blue-500 font-extrabold text-xs cursor-pointer transition"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination row */}
                  {complaintsTotal > 10 && (
                    <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                      <span>Showing {Math.min(complaints.length, 10)} of {complaintsTotal} results</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={complaintsPage === 1}
                          onClick={() => setComplaintsPage(complaintsPage - 1)}
                          className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded disabled:opacity-40 disabled:hover:bg-white text-[10px] cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="w-6 h-6 rounded bg-[#133fbd] text-white flex items-center justify-center text-[10px] font-bold">
                          {complaintsPage}
                        </span>
                        <button
                          disabled={complaintsPage * 10 >= complaintsTotal}
                          onClick={() => setComplaintsPage(complaintsPage + 1)}
                          className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 rounded disabled:opacity-40 disabled:hover:bg-white text-[10px] cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side donut distribution & workload */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Distribution Card */}
                  <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm flex flex-col items-center">
                    <h3 className="w-full text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-4 text-left">Complaint Distribution</h3>
                    
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="2.5"></circle>
                        {/* Dynamic segments based on counts */}
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="15.915" 
                          fill="none" 
                          stroke="#f59e0b" 
                          strokeWidth="2.5" 
                          strokeDasharray={`${complaintsDistribution.pendingPercent} ${100 - complaintsDistribution.pendingPercent}`}
                          strokeDashoffset="0"
                        ></circle>
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="15.915" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="2.5" 
                          strokeDasharray={`${complaintsDistribution.progressPercent} ${100 - complaintsDistribution.progressPercent}`}
                          strokeDashoffset={`-${complaintsDistribution.pendingPercent}`}
                        ></circle>
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="15.915" 
                          fill="none" 
                          stroke="#ef4444" 
                          strokeWidth="2.5" 
                          strokeDasharray={`${complaintsDistribution.emergencyPercent} ${100 - complaintsDistribution.emergencyPercent}`}
                          strokeDashoffset={`-${complaintsDistribution.pendingPercent + complaintsDistribution.progressPercent}`}
                        ></circle>
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="15.915" 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2.5" 
                          strokeDasharray={`${complaintsDistribution.resolvedPercent} ${100 - complaintsDistribution.resolvedPercent}`}
                          strokeDashoffset={`-${complaintsDistribution.pendingPercent + complaintsDistribution.progressPercent + complaintsDistribution.emergencyPercent}`}
                        ></circle>
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-xl font-black text-slate-800 block">
                          {complaintsDistribution.totalActive}
                        </span>
                        <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider">Active</span>
                      </div>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-2 mt-6 border-t border-slate-100 pt-4 text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>Pending ({complaintsDistribution.pendingPercent}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>Progress ({complaintsDistribution.progressPercent}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>Emergency ({complaintsDistribution.emergencyPercent}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Resolved ({complaintsDistribution.resolvedPercent}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Staff Workloads */}
                  <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-4">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Staff Workload</h3>
                      <button 
                        onClick={() => alert("Staff overview detailed chart printed successfully.")}
                        className="text-[10px] font-extrabold text-blue-700 hover:text-blue-500 tracking-wider"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {staffWorkload.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No operational staff registered.</p>
                      ) : (
                        staffWorkload.slice(0, 3).map((staff, idx) => (
                          <div key={staff.id} className="flex justify-between items-center text-xs font-bold">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white uppercase text-[10px] ${
                                idx === 0 ? 'bg-emerald-600' : idx === 1 ? 'bg-teal-700' : 'bg-blue-600'
                              }`}>
                                {(staff.staff_name || staff.staff_email || 'S').charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-slate-800 tracking-tight leading-none mb-0.5">{staff.staff_name || staff.staff_email || 'Staff'}</h4>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  {staff.role === 'maintenance' ? 'Maintenance Worker' : 'Operations Specialist'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-800 font-extrabold block text-sm leading-none">
                                {String(staff.active_tickets).padStart(2, '0')}
                              </span>
                              <span className={`text-[8px] font-extrabold uppercase tracking-wider ${
                                staff.active_tickets > 5 ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                {staff.active_tickets > 5 ? 'Heavy Load' : 'Active'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* 3.6 activeTab = FACILITY (Facility & Parking) */}
          {activeTab === 'facility' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Metrics cards row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Facilities</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{facilityMetrics.totalFacilities}</h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Active Bookings</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{facilityMetrics.activeBookings}</h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Requests</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">
                      {String(facilityMetrics.pendingRequests).padStart(2, '0')}
                    </h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/50 p-4 rounded-xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Parking Slots</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{facilityMetrics.totalParkingSlots}</h3>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 font-extrabold text-indigo-700 text-sm">
                    P
                  </div>
                </div>
              </div>

              {/* Middle Section: Recent Bookings vs Usage */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recent Booking Requests */}
                <div className="lg:col-span-2 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Booking Requests</h3>
                    <button 
                      onClick={() => setShowBookingRequestsModal(true)}
                      className="text-[10px] font-extrabold text-blue-700 hover:text-blue-500 tracking-wider"
                    >
                      View All
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3 pl-2">ID</th>
                          <th className="pb-3">Facility</th>
                          <th className="pb-3">Unit</th>
                          <th className="pb-3">Resident</th>
                          <th className="pb-3">Date/Time</th>
                          <th className="pb-3 text-right pr-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {facilityReservations.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-6 text-center text-slate-400 italic">No bookings registered.</td>
                          </tr>
                        ) : (
                          facilityReservations.slice(0, 4).map((res) => (
                            <tr key={res.id} className="hover:bg-slate-50/50">
                              <td className="py-3 font-bold text-slate-800 pl-2">#BK-{9000 + res.id}</td>
                              <td className="py-3 font-bold text-slate-700">{res.facility_name}</td>
                              <td className="py-3 font-bold text-slate-800">
                                {res.resident_building ? `${res.resident_building.replace(/[^a-zA-Z]/g, '')}-${res.resident_unit}` : 'B-402'}
                              </td>
                              <td className="py-3 font-semibold">{res.resident_name || 'Sarah Connor'}</td>
                              <td className="py-3 font-semibold text-slate-400">
                                {new Date(res.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • 14:00
                              </td>
                              <td className="py-3 text-right pr-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                  res.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  res.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {res.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Weekly Facility Usage */}
                <div className="lg:col-span-1 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5">Weekly Facility Usage</h3>
                  
                  <div className="space-y-4 text-xs font-bold text-slate-600">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span>Rooftop Lounge</span>
                        <span className="text-slate-800">85%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#133fbd] h-full rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span>Community Hall</span>
                        <span className="text-slate-800">42%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#133fbd] h-full rounded-full" style={{ width: '42%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span>Gym & Fitness</span>
                        <span className="text-slate-800">68%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#133fbd] h-full rounded-full" style={{ width: '68%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span>Garden Area</span>
                        <span className="text-slate-800">30%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#133fbd] h-full rounded-full" style={{ width: '30%' }}></div>
                      </div>
                    </div>

                    <p className="text-[9px] font-bold text-slate-400 pt-2 border-t border-slate-100">
                      Updated 5 minutes ago based on reservation data.
                    </p>
                  </div>
                </div>

              </div>

              {/* Apartment Facilities Section */}
              <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Apartment Facilities</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Facility ID</th>
                        <th className="pb-3">Facility Name</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3">Capacity</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {facilities.filter(fac => 
                        fac.facility_id.toLowerCase().includes(facilitySearchQuery.toLowerCase()) ||
                        fac.name.toLowerCase().includes(facilitySearchQuery.toLowerCase()) ||
                        (fac.description && fac.description.toLowerCase().includes(facilitySearchQuery.toLowerCase()))
                      ).length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-6 text-center text-slate-400 italic">No matching facilities found.</td>
                        </tr>
                      ) : (
                        facilities.filter(fac => 
                          fac.facility_id.toLowerCase().includes(facilitySearchQuery.toLowerCase()) ||
                          fac.name.toLowerCase().includes(facilitySearchQuery.toLowerCase()) ||
                          (fac.description && fac.description.toLowerCase().includes(facilitySearchQuery.toLowerCase()))
                        ).map((fac) => (
                          <tr key={fac.id} className="hover:bg-slate-50/50">
                            <td className="py-3 font-bold text-slate-800 pl-2">{fac.facility_id}</td>
                            <td className="py-3 font-bold text-slate-800">{fac.name}</td>
                            <td className="py-3 font-semibold text-slate-400">{fac.description}</td>
                            <td className="py-3 font-bold text-slate-700">{fac.capacity} Persons</td>
                            <td className="py-3">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                <span className={`w-2 h-2 rounded-full ${
                                  fac.status === 'available' ? 'bg-emerald-500' :
                                  fac.status === 'maintenance' ? 'bg-rose-500' :
                                  'bg-slate-400'
                                }`}></span>
                                <span className="capitalize">{fac.status.replace('_', ' ')}</span>
                              </div>
                            </td>
                            <td className="py-3 text-right pr-2 flex items-center justify-end gap-2.5">
                              <button
                                onClick={() => {
                                  setEditFacilityForm(fac);
                                  setShowEditFacilityModal(true);
                                }}
                                className="text-slate-400 hover:text-blue-700 cursor-pointer"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => handleDeleteFacility(fac.id)}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Parking Slot Allocation Section */}
              <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Parking Slot Allocation</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Slot ID</th>
                        <th className="pb-3">Unit Number</th>
                        <th className="pb-3">Resident Name</th>
                        <th className="pb-3">Vehicle Number</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parkingSlots.filter(slot => 
                        slot.slot_number.toLowerCase().includes(facilitySearchQuery.toLowerCase()) ||
                        (slot.resident_name && slot.resident_name.toLowerCase().includes(facilitySearchQuery.toLowerCase())) ||
                        (slot.vehicle_number && slot.vehicle_number.toLowerCase().includes(facilitySearchQuery.toLowerCase())) ||
                        (slot.block_name && slot.block_name.toLowerCase().includes(facilitySearchQuery.toLowerCase())) ||
                        (slot.unit_number && slot.unit_number.toString().includes(facilitySearchQuery.toLowerCase()))
                      ).length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-6 text-center text-slate-400 italic">No matching parking slots found.</td>
                        </tr>
                      ) : (
                        parkingSlots.filter(slot => 
                          slot.slot_number.toLowerCase().includes(facilitySearchQuery.toLowerCase()) ||
                          (slot.resident_name && slot.resident_name.toLowerCase().includes(facilitySearchQuery.toLowerCase())) ||
                          (slot.vehicle_number && slot.vehicle_number.toLowerCase().includes(facilitySearchQuery.toLowerCase())) ||
                          (slot.block_name && slot.block_name.toLowerCase().includes(facilitySearchQuery.toLowerCase())) ||
                          (slot.unit_number && slot.unit_number.toString().includes(facilitySearchQuery.toLowerCase()))
                        ).map((slot) => {
                          const isAssigned = !!slot.unit_id;
                          let displayStatus = 'AVAILABLE';
                          let badgeStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                          
                          if (isAssigned) {
                            displayStatus = 'ASSIGNED';
                            badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-100';
                          } else if (slot.status === 'pending') {
                            displayStatus = 'RESERVED';
                            badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-100';
                          } else if (slot.status === 'rejected') {
                            displayStatus = 'BLOCKED';
                            badgeStyle = 'bg-rose-50 text-rose-700 border border-rose-100';
                          }

                          return (
                            <tr key={slot.id} className="hover:bg-slate-50/50">
                              <td className="py-3.5 font-bold text-slate-800 pl-2">
                                {slot.slot_number.startsWith('P-') ? slot.slot_number : `P-${slot.slot_number}`}
                              </td>
                              <td className="py-3.5 font-semibold">
                                {slot.block_name ? `${slot.block_name.replace(/[^a-zA-Z]/g, '')}-${slot.unit_number}` : '—'}
                              </td>
                              <td className="py-3.5 font-bold text-slate-700">
                                {slot.resident_name || '—'}
                              </td>
                              <td className="py-3.5 font-semibold text-slate-500">
                                {slot.vehicle_number || '—'}
                              </td>
                              <td className="py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${badgeStyle}`}>
                                  {displayStatus}
                                </span>
                              </td>
                              <td className="py-3.5 text-right pr-2 text-slate-400 font-extrabold text-sm select-none hover:text-slate-600 cursor-pointer">
                                <button 
                                  onClick={() => {
                                    setAllocation({
                                      unitId: slot.unit_id || '',
                                      owner_id: '',
                                      tenant_id: '',
                                      parking_slot_id: slot.id
                                    });
                                    setShowAllocateModal(true);
                                  }}
                                  className="text-xs text-blue-700 hover:underline font-bold"
                                >
                                  Allocate Slot
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 3.6b activeTab = EVENTS */}
          {activeTab === 'events' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Event metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Events */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block">Total Events</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{eventMetrics.totalEvents}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50/50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block">Upcoming Events</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{eventMetrics.upcomingEvents}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-50/50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                </div>

                {/* Active Registrations */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block">Active Registrations</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{eventMetrics.activeRegistrations}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50/50 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                {/* Completed Events */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block">Completed Events</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{eventMetrics.completedEvents}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-50/50 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Upcoming Community Events Table */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Upcoming Community Events</h3>
                  <button 
                    onClick={() => setEventSearchQuery('')}
                    className="text-xs font-bold text-blue-700 hover:underline"
                  >
                    View All
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pl-2">Event ID</th>
                        <th className="pb-3">Event Name</th>
                        <th className="pb-3">Event Type</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Time</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3">Regs</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-4 text-center text-slate-400 italic">No events found matching criteria.</td>
                        </tr>
                      ) : (
                        events.map((e) => {
                          let badgeColor = 'bg-slate-50 text-slate-700 border-slate-100';
                          if (e.status === 'Registration Open') badgeColor = 'bg-emerald-55/10 text-emerald-700 border-emerald-200/40';
                          else if (e.status === 'Upcoming') badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                          else if (e.status === 'Completed') badgeColor = 'bg-purple-50 text-purple-700 border-purple-100';
                          else if (e.status === 'Cancelled') badgeColor = 'bg-red-50 text-red-700 border-red-100';

                          return (
                            <tr key={e.id} className="hover:bg-slate-50/50">
                              <td className="py-3 pl-2 font-bold text-slate-800">#{e.event_id}</td>
                              <td className="py-3 font-bold text-slate-700">{e.name}</td>
                              <td className="py-3 text-slate-500">{e.type}</td>
                              <td className="py-3 font-semibold text-slate-500">
                                {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="py-3 text-slate-500">{e.time}</td>
                              <td className="py-3 text-slate-500">{e.location}</td>
                              <td className="py-3 font-bold text-slate-700">{e.regs || 0}</td>
                              <td className="py-3">
                                <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${badgeColor}`}>
                                  {e.status}
                                </span>
                              </td>
                              <td className="py-3 text-right pr-2">
                                <div className="flex items-center justify-end gap-2.5">
                                  <button 
                                    onClick={() => {
                                      setEditEventForm({
                                        id: e.id,
                                        name: e.name,
                                        type: e.type,
                                        date: e.date.substring(0, 10),
                                        time: e.time,
                                        location: e.location,
                                        status: e.status
                                      });
                                      setShowEditEventModal(true);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-700 transition font-bold"
                                    title="Edit Event"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteEvent(e.id)}
                                    className="p-1 hover:bg-red-55/10 rounded text-slate-500 hover:text-red-600 transition font-bold"
                                    title="Delete Event"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resident Event Registrations Table */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Resident Event Registrations</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => alert("Simulated Action: PDF report generated for resident event registrations.")}
                      className="py-1 px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-bold rounded cursor-pointer transition shadow-sm active:scale-95"
                    >
                      Export PDF
                    </button>
                    <button 
                      onClick={() => setEventSearchQuery('')}
                      className="text-xs font-bold text-blue-700 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pl-2">Reg ID</th>
                        <th className="pb-3">Event Name</th>
                        <th className="pb-3">Resident Name</th>
                        <th className="pb-3">Unit</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Attendance</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {eventRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-slate-400 italic">No registrations found.</td>
                        </tr>
                      ) : (
                        eventRegistrations.map((r) => {
                          let attendanceBadge = 'bg-blue-50 text-blue-700';
                          if (r.attendance === 'attended') attendanceBadge = 'bg-emerald-55/10 text-emerald-700 border border-emerald-200/40';
                          else if (r.attendance === 'no_show') attendanceBadge = 'bg-rose-50 text-rose-700 border border-rose-100';

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/50">
                              <td className="py-3 pl-2 font-bold text-slate-800">#{r.reg_id}</td>
                              <td className="py-3 font-bold text-slate-700">{r.event_name}</td>
                              <td className="py-3 font-bold text-slate-700">{r.resident_name}</td>
                              <td className="py-3 text-slate-500 font-semibold">
                                {r.resident_building ? `${r.resident_building.replace(/[^a-zA-Z]/g, '')}-${r.resident_unit}` : '—'}
                              </td>
                              <td className="py-3 text-slate-500">
                                {new Date(r.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${attendanceBadge}`}>
                                  {r.attendance}
                                </span>
                              </td>
                              <td className="py-3 text-right pr-2">
                                {r.attendance === 'registered' ? (
                                  <button 
                                    onClick={() => handleUpdateAttendance(r.id, 'attended')}
                                    className="text-xs font-bold text-blue-700 hover:underline"
                                  >
                                    Check-In
                                  </button>
                                ) : (
                                  <div className="flex justify-end items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-bold">Checked</span>
                                    <button 
                                      onClick={() => handleUpdateAttendance(r.id, 'registered')}
                                      className="text-[10px] font-bold text-slate-400 hover:text-red-500 hover:underline ml-2"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event Calendar and Participation Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Event Calendar */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-slate-800">Event Calendar</h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-blue-700">
                      <span>&lt;</span>
                      <span className="uppercase tracking-wider">October 2026</span>
                      <span>&gt;</span>
                    </div>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-y-3 text-center text-xs font-bold text-slate-600">
                    {/* Days Header */}
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                      <span key={d} className="text-[9px] text-slate-400 uppercase tracking-wider mb-2">{d}</span>
                    ))}
                    
                    {/* Month start pad (Thursday start) */}
                    {[...Array(4)].map((_, i) => (
                      <span key={`pad-${i}`} className="text-slate-200 font-normal">-</span>
                    ))}
                    
                    {/* Day numbers */}
                    {[...Array(31)].map((_, i) => {
                      const dayNum = i + 1;
                      const hasEvent = [14, 29, 31].includes(dayNum);
                      let dayStyle = 'py-1 text-slate-700';
                      
                      if (dayNum === 25) { // current day active style
                        dayStyle = 'py-1 bg-blue-50 text-blue-700 rounded-lg relative';
                      } else if (hasEvent) {
                        dayStyle = 'py-1 bg-blue-600 text-white rounded-lg relative shadow-sm';
                      }

                      return (
                        <div key={`day-${dayNum}`} className="flex justify-center items-center">
                          <span className={`w-8 h-8 flex items-center justify-center font-bold transition ${dayStyle}`}>
                            {dayNum}
                            {hasEvent && (
                              <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full"></span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Event Participation Overview */}
                <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800 mb-6">Event Participation Overview</h3>
                  <div className="space-y-5">
                    {eventOverview.length === 0 ? (
                      <div className="space-y-4">
                        {[
                          { name: 'AGM (Annual General Meeting)', residents: 156, pct: 90 },
                          { name: 'Community Fire Drill', residents: 124, pct: 70 },
                          { name: 'New Year Celebration', residents: 142, pct: 80 },
                          { name: 'Neighborhood Cleanup', residents: 65, pct: 40 }
                        ].map((item, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                              <span>{item.name}</span>
                              <span className="text-slate-500">{item.residents} Residents</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div style={{ width: `${item.pct}%` }} className="h-full bg-blue-600/80 rounded-full"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      eventOverview.map((item, idx) => {
                        const pct = Math.min(100, Math.round((item.residents / 180) * 100));
                        return (
                          <div key={idx}>
                            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2 font-sans">
                              <span>{item.name}</span>
                              <span className="text-slate-500 font-sans">{item.residents} Residents</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div style={{ width: `${pct}%` }} className="h-full bg-blue-600/85 rounded-full"></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Legend indicator */}
                  <div className="flex gap-4 justify-center items-center mt-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                      <span>Pending</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 3.7 activeTab = NOTICES */}
          {activeTab === 'notices' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Metrics cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Notices */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block">Total Notices</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{noticeMetrics.totalNotices}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">+12%</span>
                    <div className="w-10 h-10 rounded-lg bg-slate-50/50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Active Notices */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block">Active</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{noticeMetrics.activeNotices}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Active Now</span>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50/50 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                </div>

                {/* Scheduled Notices */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block">Scheduled</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{noticeMetrics.scheduledNotices}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">Upcoming</span>
                    <div className="w-10 h-10 rounded-lg bg-blue-50/50 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Archived Notices */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block">Archived</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{noticeMetrics.archivedNotices}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] font-extrabold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Legacy</span>
                    <div className="w-10 h-10 rounded-lg bg-slate-100/50 flex items-center justify-center shrink-0">
                      <Plus className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Notices Table */}
              <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-sm font-bold text-slate-800">Active Notices</h3>
                  <div className="flex items-center gap-2">
                    {/* Priority Filter */}
                    <div className="relative">
                      <select 
                        className="pl-3 pr-8 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                        value={noticePriorityFilter}
                        onChange={(e) => setNoticePriorityFilter(e.target.value)}
                      >
                        <option value="All">Priority: All</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                      <select 
                        className="pl-3 pr-8 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                        value={noticeCategoryFilter}
                        onChange={(e) => setNoticeCategoryFilter(e.target.value)}
                      >
                        <option value="All">Category: All</option>
                        <option value="Utility">Utility</option>
                        <option value="Event">Event</option>
                        <option value="Amenity">Amenity</option>
                        <option value="Security">Security</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                      <select 
                        className="pl-3 pr-8 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                        value={noticeStatusFilter}
                        onChange={(e) => setNoticeStatusFilter(e.target.value)}
                      >
                        <option value="All">Status: All</option>
                        <option value="Published">Published</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Expired">Expired</option>
                        <option value="Archived">Archived</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>

                    <button 
                      onClick={() => alert("Simulated Action: Notices data exported to CSV format successfully.")}
                      className="py-1 px-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1 active:scale-95 shadow-xs animate-in duration-200"
                    >
                      <span>📥</span>
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                {/* Table block */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pl-2">Notice ID</th>
                        <th className="pb-3">Title</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Published</th>
                        <th className="pb-3">Expiry</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3">Audience</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {notices.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-4 text-center text-slate-400 italic">No notices found matching criteria.</td>
                        </tr>
                      ) : (
                        notices.map((n) => {
                          let badgeStyle = 'bg-slate-50 text-slate-700 border-slate-100';
                          if (n.status === 'published') badgeStyle = 'bg-emerald-55/10 text-emerald-700 border-emerald-200/40';
                          else if (n.status === 'scheduled') badgeStyle = 'bg-blue-50 text-blue-700 border-blue-100';
                          else if (n.status === 'expired') badgeStyle = 'bg-amber-50 text-amber-700 border-amber-100';
                          else if (n.status === 'archived') badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200';

                          let dotColor = 'bg-slate-400';
                          if (n.priority === 'urgent') dotColor = 'bg-red-500';
                          else if (n.priority === 'high') dotColor = 'bg-amber-500';
                          else if (n.priority === 'medium') dotColor = 'bg-blue-500';
                          
                          return (
                            <tr key={n.id} className="hover:bg-slate-50/50">
                              <td className="py-3.5 pl-2 font-bold text-slate-800">#{n.notice_id || `NOT-${n.id}`}</td>
                              <td className="py-3.5 font-bold text-slate-700 max-w-[200px] truncate" title={n.title}>
                                {n.title}
                              </td>
                              <td className="py-3.5">
                                <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-[9px] font-extrabold uppercase rounded-sm text-slate-500">
                                  {n.category}
                                </span>
                              </td>
                              <td className="py-3.5 text-slate-500 font-semibold">
                                {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="py-3.5 text-slate-500 font-semibold">
                                {n.expiry_date ? new Date(n.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </td>
                              <td className="py-3.5">
                                <span className="flex items-center gap-1.5 capitalize font-semibold text-slate-600">
                                  <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                                  {n.priority}
                                </span>
                              </td>
                              <td className="py-3.5 text-slate-500 font-semibold">{n.audience}</td>
                              <td className="py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${badgeStyle}`}>
                                  {n.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-right pr-2">
                                <div className="flex items-center justify-end gap-2.5">
                                  <button 
                                    onClick={() => alert(`Announcement Details:\n\nID: ${n.notice_id || n.id}\nTitle: ${n.title}\nCategory: ${n.category}\nContent: ${n.content}\nAudience: ${n.audience}\nPriority: ${n.priority}`)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-700 transition"
                                    title="View Details"
                                  >
                                    👁️
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setEditNoticeForm({
                                        id: n.id,
                                        title: n.title,
                                        content: n.content,
                                        category: n.category,
                                        expiry_date: n.expiry_date ? n.expiry_date.substring(0, 10) : '',
                                        priority: n.priority,
                                        audience: n.audience,
                                        status: n.status
                                      });
                                      setShowEditNoticeModal(true);
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-700 transition"
                                    title="Edit Notice"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteNotice(n.id)}
                                    className="p-1 hover:bg-red-55/10 rounded text-slate-500 hover:text-red-600 transition animate-in duration-200"
                                    title="Delete Notice"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination placeholder matching screenshot */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs font-bold text-slate-400 mt-2">
                  <span>Showing 1 to {notices.length} of {noticeMetrics.activeNotices} active notices</span>
                  <div className="flex gap-1.5">
                    <button className="px-2.5 py-1 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded text-slate-600">Previous</button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded shadow-sm">1</button>
                    <button className="px-3 py-1 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded text-slate-600">2</button>
                    <button className="px-3 py-1 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded text-slate-600">3</button>
                    <button className="px-2.5 py-1 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded text-slate-600">Next</button>
                  </div>
                </div>
              </div>

              {/* Bottom two column breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Distribution chart card */}
                <div className="lg:col-span-2 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-5">Notice Distribution</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                    {/* Circle Chart */}
                    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                      <div className="w-28 h-28 rounded-full border-[10px] border-amber-500 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-base font-black text-slate-800">100%</span>
                          <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider block leading-none">by Category</span>
                        </div>
                      </div>
                    </div>
                    {/* Legend stats breakdown matching screenshot percentages */}
                    <div className="space-y-2.5 text-xs font-semibold text-slate-500 w-full">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                          <span>Utility & Maintenance</span>
                        </div>
                        <span className="font-extrabold text-slate-800">{noticeDistribution.utility}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <span>Events & Social</span>
                        </div>
                        <span className="font-extrabold text-slate-800">{noticeDistribution.events}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <span>Security Updates</span>
                        </div>
                        <span className="font-extrabold text-slate-800">{noticeDistribution.security}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                          <span>Other</span>
                        </div>
                        <span className="font-extrabold text-slate-800">{noticeDistribution.other}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activities Activity Log Card */}
                <div className="lg:col-span-3 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Notice Activity</h3>
                      <button 
                        onClick={() => alert("Recent activity details showing full administrative logs.")}
                        className="text-xs font-bold text-blue-700 hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {noticeActivities.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No activity recorded.</p>
                      ) : (
                        noticeActivities.map((act) => {
                          return (
                            <div key={act.id} className="flex gap-3 relative pb-1 border-b border-slate-50 last:border-0 last:pb-0">
                              <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 bg-slate-50 border-slate-100`}>
                                <span className="text-xs font-sans">📢</span>
                              </div>
                              <div className="flex-1 font-sans">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-xs font-bold text-slate-800 leading-none">{act.title}</h4>
                                  <span className="text-[9px] text-slate-400 font-bold">{act.time}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-tight">{act.message}</p>
                                <div className="flex gap-1.5 mt-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-55/10 border border-emerald-200/40 text-[8px] font-extrabold uppercase text-emerald-700">{act.badge}</span>
                                  {act.badge2 && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-[8px] font-extrabold uppercase text-blue-700">{act.badge2}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 3.8 activeTab = BILLS (Payments & Billing) */}
          {activeTab === 'bills' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Page Header with Actions */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">Payments & Billing</h2>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage invoices and track resident payments.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRecordPaymentModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Record Payment
                  </button>
                  <button
                    onClick={() => setShowGenerateInvoiceModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-[10px] font-bold rounded-lg cursor-pointer transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Generate Invoice
                  </button>
                </div>
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Total Invoices</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">{billMetrics.totalInvoices.toLocaleString()}</h3>
                      <p className="text-[9px] text-emerald-600 font-bold mt-1">+12% from last month</p>
                    </div>
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Payments Collected</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">${(billMetrics.paymentsCollected || 0).toLocaleString()}</h3>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">Current month</p>
                    </div>
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Payments</span>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">${(billMetrics.pendingAmount || 0).toLocaleString()}</h3>
                      <p className="text-[9px] text-amber-600 font-bold mt-1">{billMetrics.pendingCount} invoices pending</p>
                    </div>
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Overdue Payments</span>
                      <h3 className="text-2xl font-black text-red-600 mt-1">${(billMetrics.overdueAmount || 0).toLocaleString()}</h3>
                      <p className="text-[9px] text-red-500 font-bold mt-1">{billMetrics.overdueCount} invoices critical</p>
                    </div>
                    <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Management Table */}
              <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Invoice Management</h3>
                  <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search invoices, units, or residents..."
                        className="pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium text-slate-700 w-52 focus:outline-none focus:border-blue-400"
                        value={billSearchQuery}
                        onChange={(e) => { setBillSearchQuery(e.target.value); setBillsPage(1); }}
                      />
                    </div>
                    {/* Status Filter */}
                    <div className="relative">
                      <select
                        className="pl-2.5 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 appearance-none cursor-pointer focus:outline-none focus:border-blue-400"
                        value={billStatusFilter}
                        onChange={(e) => { setBillStatusFilter(e.target.value); setBillsPage(1); }}
                      >
                        <option>All</option>
                        <option>Paid</option>
                        <option>Unpaid</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                    {/* Export */}
                    <button
                      onClick={() => {
                        const rows = [['Invoice ID','Unit','Resident','Amount','Invoice Date','Due Date','Status']];
                        bills.forEach(b => rows.push([b.invoice_id, `${b.block_name}-${b.unit_number}`, b.resident_name, b.amount, b.created_at?.slice(0,10), b.due_date, b.status]));
                        const csv = rows.map(r => r.join(',')).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'invoices.csv'; a.click();
                      }}
                      className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer transition"
                      title="Export CSV"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="px-5 py-3">Invoice ID</th>
                        <th className="px-5 py-3">Unit</th>
                        <th className="px-5 py-3">Resident Name</th>
                        <th className="px-5 py-3">Amount</th>
                        <th className="px-5 py-3">Invoice Date</th>
                        <th className="px-5 py-3">Due Date</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {bills.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-xs italic">
                            No invoices found. Generate one using the button above.
                          </td>
                        </tr>
                      ) : (
                        bills.map((bill) => {
                          const isOverdue = bill.status === 'unpaid' && new Date(bill.due_date) < new Date();
                          return (
                            <tr key={bill.id} className="hover:bg-slate-50/60 transition">
                              <td className="px-5 py-3.5">
                                <span className="text-blue-700 font-extrabold cursor-pointer hover:underline text-[10px]">
                                  #{bill.invoice_id || `INV-${String(bill.id).padStart(4,'0')}`}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-bold text-slate-700 text-[10px]">
                                {bill.block_name}-{bill.unit_number}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-slate-600 text-[10px]">
                                {bill.resident_name || 'N/A'}
                              </td>
                              <td className="px-5 py-3.5 font-extrabold text-slate-800 text-[10px]">
                                ${parseFloat(bill.amount).toFixed(2)}
                              </td>
                              <td className="px-5 py-3.5 text-slate-400 font-semibold text-[10px]">
                                {bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </td>
                              <td className="px-5 py-3.5 text-slate-400 font-semibold text-[10px]">
                                {new Date(bill.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                  bill.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : isOverdue
                                    ? 'bg-red-50 text-red-600 border-red-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  {bill.status === 'paid' ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => alert(`Invoice: #${bill.invoice_id || bill.id}\nUnit: ${bill.block_name}-${bill.unit_number}\nResident: ${bill.resident_name || 'N/A'}\nAmount: $${bill.amount}\nDescription: ${bill.description}\nDue: ${new Date(bill.due_date).toLocaleDateString()}\nStatus: ${bill.status.toUpperCase()}`)}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition"
                                    title="View"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  </button>
                                  {bill.status === 'unpaid' ? (
                                    <button
                                      onClick={() => { setRecordPaymentForm({ billId: bill.id, payment_method: 'Bank Transfer', notes: '' }); setShowRecordPaymentModal(true); }}
                                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 cursor-pointer transition"
                                      title="Mark Paid"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateBillStatus(bill.id, 'unpaid')}
                                      className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 cursor-pointer transition"
                                      title="Mark Unpaid"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteBill(bill.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer transition"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center px-5 py-3.5 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400 font-bold">
                    Showing {((billsPage - 1) * 10) + 1}–{Math.min(billsPage * 10, billsTotal)} of {billsTotal.toLocaleString()} invoices
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBillsPage(p => Math.max(1, p - 1))}
                      disabled={billsPage === 1}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                    >Previous</button>
                    <button
                      onClick={() => setBillsPage(p => p + 1)}
                      disabled={billsPage * 10 >= billsTotal}
                      className="px-3 py-1.5 bg-[#133fbd] text-white rounded-lg text-[10px] font-bold hover:bg-[#0f3299] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                    >Next</button>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Monthly Chart + Overdue Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Monthly Payment Collection Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Monthly Payment Collection</h3>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">Revenue trends for the past 6 months</p>
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                      {new Date().getFullYear()}
                    </span>
                  </div>

                  {/* Simple bar chart */}
                  {billMonthlyData.length === 0 ? (
                    <div className="h-28 flex items-center justify-center">
                      <p className="text-xs text-slate-300 italic">No payment collection data yet.</p>
                    </div>
                  ) : (
                    <div className="flex items-end gap-3 h-28">
                      {billMonthlyData.map((item, i) => {
                        const maxVal = Math.max(...billMonthlyData.map(d => parseFloat(d.collected || 0)), 1);
                        const heightPct = (parseFloat(item.collected || 0) / maxVal) * 100;
                        const isLast = i === billMonthlyData.length - 1;
                        return (
                          <div key={i} className="flex flex-col items-center gap-1 flex-1">
                            <span className="text-[8px] text-slate-400 font-bold">${Math.round(item.collected/1000)}k</span>
                            <div
                              className={`w-full rounded-t-md transition-all ${isLast ? 'bg-blue-600' : 'bg-slate-200'}`}
                              style={{ height: `${Math.max(heightPct, 4)}%` }}
                              title={`${item.month}: $${parseFloat(item.collected).toLocaleString()}`}
                            />
                            <span className={`text-[8px] font-extrabold uppercase ${isLast ? 'text-blue-600' : 'text-slate-400'}`}>{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Overdue Payments Panel */}
                <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Overdue Payments</h3>
                    <button
                      onClick={() => { setBillStatusFilter('Unpaid'); setBillsPage(1); }}
                      className="text-[9px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>
                  {overdueList.length === 0 ? (
                    <p className="text-xs text-slate-300 italic text-center py-6">No overdue invoices 🎉</p>
                  ) : (
                    <div className="space-y-3">
                      {overdueList.slice(0, 4).map((o) => {
                        const initials = (o.resident_name || 'R').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
                        const colors = ['bg-amber-100 text-amber-700', 'bg-blue-100 text-blue-700', 'bg-red-100 text-red-700', 'bg-purple-100 text-purple-700'];
                        const colorClass = colors[o.id % colors.length];
                        return (
                          <div key={o.id} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[9px] font-extrabold shrink-0 ${colorClass}`}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-700 truncate">
                                {o.block_name}-{o.unit_number} ({o.resident_name})
                              </p>
                              <p className="text-[8px] text-red-500 font-bold">{o.days_overdue} days overdue</p>
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-800">${parseFloat(o.amount).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const emails = overdueList.map(o => o.resident_name).join(', ');
                      alert(`Send Bulk Reminders\n\nWould notify ${overdueList.length} residents:\n${emails || 'None'}`);
                    }}
                    className="mt-4 w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition"
                  >
                    Send Bulk Reminders
                  </button>
                </div>
              </div>

              {/* Recent Payment Transactions */}
              <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Payment Transactions</h3>
                  <button className="flex items-center gap-1 text-[9px] font-bold text-blue-700 hover:underline cursor-pointer">
                    <Clock className="w-3 h-3" /> Full History
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="px-5 py-3">Transaction ID</th>
                        <th className="px-5 py-3">Invoice ID</th>
                        <th className="px-5 py-3">Resident</th>
                        <th className="px-5 py-3">Unit</th>
                        <th className="px-5 py-3">Amount</th>
                        <th className="px-5 py-3">Method</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-8 text-center text-slate-300 text-xs italic">
                            No transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                            <td className="px-5 py-3.5 text-[10px]">
                              <span className="text-slate-500 font-extrabold">#{tx.transaction_id}</span>
                            </td>
                            <td className="px-5 py-3.5 text-[10px]">
                              <span className="text-blue-700 font-extrabold">#{tx.invoice_id}</span>
                            </td>
                            <td className="px-5 py-3.5 font-medium text-slate-700 text-[10px]">{tx.resident_name}</td>
                            <td className="px-5 py-3.5 font-medium text-slate-600 text-[10px]">{tx.block_name}-{tx.unit_number}</td>
                            <td className="px-5 py-3.5 font-extrabold text-slate-800 text-[10px]">${parseFloat(tx.amount).toFixed(2)}</td>
                            <td className="px-5 py-3.5 text-[10px]">
                              <div className="flex items-center gap-1 text-slate-500 font-semibold">
                                <CreditCard className="w-3 h-3" /> {tx.method}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-slate-400 font-semibold text-[10px]">
                              {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                              <span className="text-slate-300">{new Date(tx.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                tx.status === 'successful'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : tx.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-red-50 text-red-600 border-red-100'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
      {/* Add New Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Add New Apartment Unit</h3>
              <button 
                onClick={() => setShowAddUnitModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Building Block</label>
                <input
                  type="text"
                  required
                  placeholder="Block A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={newUnit.block_name}
                  onChange={(e) => setNewUnit({ ...newUnit, block_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Floor Number</label>
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
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Unit Number</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Unit Type</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={newUnit.type}
                      onChange={(e) => setNewUnit({ ...newUnit, type: e.target.value })}
                    >
                      <option value="Studio">Studio</option>
                      <option value="1BHK">1BHK</option>
                      <option value="2BHK">2BHK</option>
                      <option value="3BHK">3BHK</option>
                      <option value="Penthouse">Penthouse</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Occupancy Status</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={newUnit.status}
                      onChange={(e) => setNewUnit({ ...newUnit, status: e.target.value })}
                    >
                      <option value="vacant">Vacant</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Resources Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Allocate Unit Resources</h3>
              <button 
                onClick={() => setShowAllocateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Owner User ID (optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 4"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={allocation.owner_id}
                  onChange={(e) => setAllocation({ ...allocation, owner_id: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Tenant User ID (optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={allocation.tenant_id}
                  onChange={(e) => setAllocation({ ...allocation, tenant_id: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Parking Slot Allocation</label>
                <div className="relative">
                  <select
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                    value={allocation.parking_slot_id}
                    onChange={(e) => setAllocation({ ...allocation, parking_slot_id: e.target.value })}
                  >
                    <option value="">-- No Parking Slot --</option>
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

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Save Allocations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Detailed Complaint Viewer Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                Complaint #Ticket-{1000 + selectedComplaint.id}
              </h3>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleUpdateComplaintDetails} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Unit</span>
                  <span className="font-extrabold text-slate-800">
                    {selectedComplaint.resident_building ? `${selectedComplaint.resident_building.replace(/[^a-zA-Z]/g, '')}-${selectedComplaint.resident_unit}` : 'A-402'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Category</span>
                  <span className="font-extrabold text-slate-800">{selectedComplaint.category}</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">Resident</span>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-700">
                  <span className="font-extrabold text-slate-800 block">
                    {selectedComplaint.resident_name || 'James Wilson'}
                  </span>
                  <span className="text-slate-400 text-[10px] block mt-0.5">
                    {selectedComplaint.resident_email || 'resident@example.com'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">Complaint Description</span>
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-600 font-medium italic min-h-[80px] max-h-[140px] overflow-y-auto">
                  "{selectedComplaint.description}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Update Status</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={selectedComplaint.status}
                      onChange={(e) => setSelectedComplaint({ ...selectedComplaint, status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="emergency">Emergency</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Assign Operations Staff</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={selectedComplaint.assigned_staff_id || ''}
                      onChange={(e) => setSelectedComplaint({ ...selectedComplaint, assigned_staff_id: e.target.value })}
                    >
                      <option value="">-- Select Staff --</option>
                      {staffWorkload.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.staff_name} ({staff.active_tickets} active)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Update Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Requests Modal */}
      {showBookingRequestsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Facility Booking Requests</h3>
              <button 
                onClick={() => setShowBookingRequestsModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">ID</th>
                    <th className="pb-3">Facility</th>
                    <th className="pb-3">Resident</th>
                    <th className="pb-3">Scheduled Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facilityReservations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-slate-400 italic">No reservation requests registered.</td>
                    </tr>
                  ) : (
                    facilityReservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/50">
                        <td className="py-3 pl-2 font-bold text-slate-800">#BK-{9000 + res.id}</td>
                        <td className="py-3 font-bold text-slate-700">{res.facility_name}</td>
                        <td className="py-3 font-semibold">{res.resident_name || res.resident_email}</td>
                        <td className="py-3 font-semibold text-slate-400">
                          {new Date(res.date).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            res.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                            res.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-2 flex items-center justify-end gap-1.5">
                          {res.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleFacilityApprove(res.id, 'approve')}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded cursor-pointer transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleFacilityApprove(res.id, 'reject')}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded cursor-pointer transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setShowBookingRequestsModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Facility Modal */}
      {showAddFacilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Add Shared Facility</h3>
              <button 
                onClick={() => setShowAddFacilityModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateFacility} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Facility ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FAC-004"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={newFacilityForm.facility_id}
                  onChange={(e) => setNewFacilityForm({ ...newFacilityForm, facility_id: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tennis Court"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={newFacilityForm.name}
                  onChange={(e) => setNewFacilityForm({ ...newFacilityForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Fully equipped courts with night lighting"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={newFacilityForm.description}
                  onChange={(e) => setNewFacilityForm({ ...newFacilityForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Capacity (Persons)</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newFacilityForm.capacity}
                    onChange={(e) => setNewFacilityForm({ ...newFacilityForm, capacity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Operational Status</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={newFacilityForm.status}
                      onChange={(e) => setNewFacilityForm({ ...newFacilityForm, status: e.target.value })}
                    >
                      <option value="available">Available</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="fully_booked">Fully Booked</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFacilityModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Add Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Facility Modal */}
      {showEditFacilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Modify Facility</h3>
              <button 
                onClick={() => setShowEditFacilityModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFacility} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Facility ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FAC-004"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={editFacilityForm.facility_id}
                  onChange={(e) => setEditFacilityForm({ ...editFacilityForm, facility_id: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tennis Court"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={editFacilityForm.name}
                  onChange={(e) => setEditFacilityForm({ ...editFacilityForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Fully equipped courts with night lighting"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={editFacilityForm.description}
                  onChange={(e) => setEditFacilityForm({ ...editFacilityForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Capacity (Persons)</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={editFacilityForm.capacity}
                    onChange={(e) => setEditFacilityForm({ ...editFacilityForm, capacity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Operational Status</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={editFacilityForm.status}
                      onChange={(e) => setEditFacilityForm({ ...editFacilityForm, status: e.target.value })}
                    >
                      <option value="available">Available</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="fully_booked">Fully Booked</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditFacilityModal(false)}
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

      {/* Add New Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Create Community Event</h3>
              <button 
                onClick={() => setShowAddEventModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 font-sans">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual General Meeting"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={newEventForm.name}
                  onChange={(e) => setNewEventForm({ ...newEventForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Event Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Meeting, Festival"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newEventForm.type}
                    onChange={(e) => setNewEventForm({ ...newEventForm, type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clubhouse"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newEventForm.location}
                    onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newEventForm.date}
                    onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6:00 PM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newEventForm.time}
                    onChange={(e) => setNewEventForm({ ...newEventForm, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Registration Status</label>
                <div className="relative">
                  <select
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                    value={newEventForm.status}
                    onChange={(e) => setNewEventForm({ ...newEventForm, status: e.target.value })}
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Registration Open">Registration Open</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Modify Event</h3>
              <button 
                onClick={() => setShowEditEventModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4 font-sans">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual General Meeting"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={editEventForm.name}
                  onChange={(e) => setEditEventForm({ ...editEventForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Event Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Meeting, Festival"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={editEventForm.type}
                    onChange={(e) => setEditEventForm({ ...editEventForm, type: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clubhouse"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={editEventForm.location}
                    onChange={(e) => setEditEventForm({ ...editEventForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={editEventForm.date}
                    onChange={(e) => setEditEventForm({ ...editEventForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6:00 PM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={editEventForm.time}
                    onChange={(e) => setEditEventForm({ ...editEventForm, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Registration Status</label>
                <div className="relative">
                  <select
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                    value={editEventForm.status}
                    onChange={(e) => setEditEventForm({ ...editEventForm, status: e.target.value })}
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Registration Open">Registration Open</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditEventModal(false)}
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

      {/* Add New Notice Modal */}
      {showAddNoticeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Create Notice Broadcast</h3>
              <button 
                onClick={() => setShowAddNoticeModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4 font-sans text-xs">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Water Shutdown"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={newNoticeForm.title}
                  onChange={(e) => setNewNoticeForm({ ...newNoticeForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Category</label>
                <div className="relative">
                  <select
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                    value={newNoticeForm.category}
                    onChange={(e) => setNewNoticeForm({ ...newNoticeForm, category: e.target.value })}
                  >
                    <option value="Utility">Utility & Maintenance</option>
                    <option value="Event">Events & Social</option>
                    <option value="Security">Security Updates</option>
                    <option value="Amenity">Amenity</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Audience</label>
                  <input
                    type="text"
                    placeholder="e.g. Tower A, B or All Residents"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={newNoticeForm.audience}
                    onChange={(e) => setNewNoticeForm({ ...newNoticeForm, audience: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium"
                    value={newNoticeForm.expiry_date}
                    onChange={(e) => setNewNoticeForm({ ...newNoticeForm, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Priority</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={newNoticeForm.priority}
                      onChange={(e) => setNewNoticeForm({ ...newNoticeForm, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Publish Status</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={newNoticeForm.status}
                      onChange={(e) => setNewNoticeForm({ ...newNoticeForm, status: e.target.value })}
                    >
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="expired">Expired</option>
                      <option value="archived">Archived</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Description details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Announce details of notice board..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium font-sans"
                  value={newNoticeForm.content}
                  onChange={(e) => setNewNoticeForm({ ...newNoticeForm, content: e.target.value })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddNoticeModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  Publish Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notice Modal */}
      {showEditNoticeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Modify Notice Details</h3>
              <button 
                onClick={() => setShowEditNoticeModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleUpdateNotice} className="space-y-4 font-sans text-xs">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Water Shutdown"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                  value={editNoticeForm.title}
                  onChange={(e) => setEditNoticeForm({ ...editNoticeForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Category</label>
                <div className="relative">
                  <select
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                    value={editNoticeForm.category}
                    onChange={(e) => setEditNoticeForm({ ...editNoticeForm, category: e.target.value })}
                  >
                    <option value="Utility">Utility & Maintenance</option>
                    <option value="Event">Events & Social</option>
                    <option value="Security">Security Updates</option>
                    <option value="Amenity">Amenity</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Audience</label>
                  <input
                    type="text"
                    placeholder="e.g. Tower A, B or All Residents"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium"
                    value={editNoticeForm.audience}
                    onChange={(e) => setEditNoticeForm({ ...editNoticeForm, audience: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Expiry Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium"
                    value={editNoticeForm.expiry_date}
                    onChange={(e) => setEditNoticeForm({ ...editNoticeForm, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Priority</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={editNoticeForm.priority}
                      onChange={(e) => setEditNoticeForm({ ...editNoticeForm, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Publish Status</label>
                  <div className="relative">
                    <select
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={editNoticeForm.status}
                      onChange={(e) => setEditNoticeForm({ ...editNoticeForm, status: e.target.value })}
                    >
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="expired">Expired</option>
                      <option value="archived">Archived</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Description details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Announce details of notice board..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg transition-all text-xs font-medium font-sans"
                  value={editNoticeForm.content}
                  onChange={(e) => setEditNoticeForm({ ...editNoticeForm, content: e.target.value })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditNoticeModal(false)}
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

      {/* Generate Invoice Modal */}
      {showGenerateInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Generate Invoice</h3>
              <button onClick={() => setShowGenerateInvoiceModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4 font-sans text-xs">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Select Unit</label>
                <div className="relative">
                  <select
                    required
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                    value={newBill.unit_id}
                    onChange={(e) => setNewBill({ ...newBill, unit_id: e.target.value })}
                  >
                    <option value="">-- Select Unit --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.block_name} – Floor {u.floor_number} – Unit {u.unit_number}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Amount ($)</label>
                  <input
                    type="number" step="0.01" required placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg text-xs font-medium"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Due Date</label>
                  <input
                    type="date" required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium"
                    value={newBill.due_date}
                    onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Description</label>
                <input
                  type="text" required placeholder="e.g. Monthly Maintenance Fee"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg text-xs font-medium"
                  value={newBill.description}
                  onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Payment Method</label>
                <div className="relative">
                  <select
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                    value={newBill.payment_method}
                    onChange={(e) => setNewBill({ ...newBill, payment_method: e.target.value })}
                  >
                    <option>Bank Transfer</option>
                    <option>Online Payment</option>
                    <option>Card</option>
                    <option>Cash</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowGenerateInvoiceModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg cursor-pointer transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Record Payment</h3>
              <button onClick={() => setShowRecordPaymentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 font-sans text-xs">
              {!recordPaymentForm.billId && (
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Select Invoice</label>
                  <div className="relative">
                    <select
                      required
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                      value={recordPaymentForm.billId}
                      onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, billId: e.target.value })}
                    >
                      <option value="">-- Select Invoice --</option>
                      {bills.filter(b => b.status === 'unpaid').map((b) => (
                        <option key={b.id} value={b.id}>
                          #{b.invoice_id || b.id} – {b.block_name}-{b.unit_number} – ${b.amount}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {recordPaymentForm.billId && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[10px] text-blue-800 font-bold">
                  Invoice #{bills.find(b => b.id == recordPaymentForm.billId)?.invoice_id || recordPaymentForm.billId} selected
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Payment Method</label>
                <div className="relative">
                  <select
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 rounded-lg text-xs font-medium appearance-none cursor-pointer"
                    value={recordPaymentForm.payment_method}
                    onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, payment_method: e.target.value })}
                  >
                    <option>Bank Transfer</option>
                    <option>Online Payment</option>
                    <option>Card</option>
                    <option>Cash</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Notes (optional)</label>
                <input
                  type="text" placeholder="Reference number or remarks..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none text-slate-800 placeholder-slate-400/90 rounded-lg text-xs font-medium"
                  value={recordPaymentForm.notes}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, notes: e.target.value })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowRecordPaymentModal(false); setRecordPaymentForm({ billId: '', payment_method: 'Bank Transfer', notes: '' }); }} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg cursor-pointer transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#133fbd] hover:bg-[#0f3299] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
