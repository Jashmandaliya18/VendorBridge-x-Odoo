import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getVendors, getVendorStats, createVendor, updateVendor, updateVendorStatus, deleteVendor } from '../api/vendors.js';
import DataTable from '../components/DataTable.jsx';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import StatsCard from '../components/StatsCard.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';

const VendorsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canCreateVendor = ['admin', 'officer'].includes(user?.role);
  const [searchParams] = useSearchParams();
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [selectedStatus, setSelectedStatus] = useState(() => searchParams.get('status') || '');
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  
  // Dialog states
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [vendorToChange, setVendorToChange] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  
  // Form states
  const [form, setForm] = useState({
    name: '',
    category: '',
    gstNumber: '',
    contactNumber: '',
    email: '',
    address: '',
    rating: 0
  });

  const { data: stats = { all: 0, active: 0, pending: 0, blocked: 0 } } = useQuery({
    queryKey: ['vendorStats'],
    queryFn: () => getVendorStats().then(r => r.data)
  });

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors', debouncedSearch, selectedStatus],
    queryFn: () => getVendors({ search: debouncedSearch, status: selectedStatus }).then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (data) => createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendorStats'] });
      toast.success('Vendor created successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error creating vendor');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendorStats'] });
      toast.success('Vendor updated successfully');
      setIsEditOpen(false);
      setEditingVendor(null);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error updating vendor');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendorStats'] });
      toast.success('Vendor deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error deleting vendor');
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateVendorStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendorStats'] });
      toast.success('Vendor status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  });

  const resetForm = () => {
    setForm({
      name: '',
      category: '',
      gstNumber: '',
      contactNumber: '',
      email: '',
      address: '',
      rating: 0
    });
  };

  const handleOpenEdit = (vendor) => {
    setEditingVendor(vendor);
    setForm({
      name: vendor.name,
      category: vendor.category || '',
      gstNumber: vendor.gstNumber || '',
      contactNumber: vendor.contactNumber || '',
      email: vendor.email || '',
      address: vendor.address || '',
      rating: vendor.rating || 0
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: editingVendor._id, data: form });
  };

  const handleDeleteConfirm = () => {
    if (vendorToChange) {
      deleteMutation.mutate(vendorToChange._id);
    }
  };

  const handleStatusConfirm = () => {
    if (vendorToChange) {
      statusMutation.mutate({ id: vendorToChange._id, status: targetStatus });
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <Link to={`/vendors/${row._id}`} className="text-teal-600 font-semibold hover:text-teal-700">
          {row.name}
        </Link>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
    },
    {
      header: 'GST Number',
      accessor: 'gstNumber',
    },
    {
      header: 'Contact Email',
      accessor: 'email',
    },
    {
      header: 'Rating',
      accessor: 'rating',
      render: (row) => (
        <div className="flex items-center text-amber-500">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs font-bold text-slate-600 ml-1">{row.rating || 0}/5</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2.5">
          <Link to={`/vendors/${row._id}`} className="text-slate-500 hover:text-slate-700 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors" title="View Details">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          {['admin', 'officer'].includes(user?.role) && (
            <button 
              onClick={() => handleOpenEdit(row)} 
              className="text-slate-500 hover:text-slate-700 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              title="Edit Vendor"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {isAdmin && (
            <>
              {row.status === 'pending' ? (
                <>
                  <button 
                    onClick={() => { setVendorToChange(row); setTargetStatus('active'); setConfirmStatusOpen(true); }}
                    className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="Approve Vendor"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => { setVendorToChange(row); setTargetStatus('blocked'); setConfirmStatusOpen(true); }}
                    className="text-rose-600 hover:text-rose-700 p-1 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                    title="Reject Vendor"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setVendorToChange(row); setTargetStatus(row.status === 'blocked' ? 'active' : 'blocked'); setConfirmStatusOpen(true); }}
                  className={`p-1 rounded-lg transition-colors ${
                    row.status === 'blocked'
                      ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100'
                  }`}
                  title={row.status === 'blocked' ? 'Unblock Vendor' : 'Block Vendor'}
                >
                  {row.status === 'blocked' ? (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </button>
              )}
              <button 
                onClick={() => { setVendorToChange(row); setConfirmDeleteOpen(true); }}
                className="text-red-600 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete Vendor"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header text-3xl">Vendors</h1>
          <p className="page-subtitle">Manage procurement vendors, category ratings, and compliance status.</p>
        </div>
        {canCreateVendor && (
          <button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="btn-teal self-start sm:self-center flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Vendor</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatsCard title="All Vendors" value={stats.all || 0} description="Registered companies" />
        <StatsCard title="Active" value={stats.active || 0} description="Verified & active partners" />
        <StatsCard title="Pending" value={stats.pending || 0} description="Awaiting authentication" />
        <StatsCard title="Blocked" value={stats.blocked || 0} description="Restricted partnerships" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all duration-200"
          />
        </div>

        {/* Filters */}
        <div className="flex border-b border-slate-200 w-fit">
          <button 
            onClick={() => setSelectedStatus('')}
            className={`px-4.5 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
              selectedStatus === '' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setSelectedStatus('active')}
            className={`px-4.5 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
              selectedStatus === 'active' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Active
          </button>
          <button 
            onClick={() => setSelectedStatus('pending')}
            className={`px-4.5 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
              selectedStatus === 'pending' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Pending
          </button>
          <button 
            onClick={() => setSelectedStatus('blocked')}
            className={`px-4.5 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
              selectedStatus === 'blocked' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Blocked
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={vendors}
        isLoading={isLoading}
        emptyMessage="No vendors found matching current filters."
        onRowClick={(row) => navigate(`/vendors/${row._id}`)}
      />

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Vendor" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="label-text">Vendor Name</label>
            <input name="name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required className="input-field" placeholder="e.g. Acme Corporation" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Category</label>
              <input name="category" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="input-field" placeholder="e.g. IT Hardware" />
            </div>
            <div>
              <label className="label-text">GST Number</label>
              <input name="gstNumber" value={form.gstNumber} onChange={(e) => setForm(f => ({ ...f, gstNumber: e.target.value }))} className="input-field" placeholder="e.g. 29ABCDE1234F1ZH" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Contact Number</label>
              <input name="contactNumber" value={form.contactNumber} onChange={(e) => setForm(f => ({ ...f, contactNumber: e.target.value }))} className="input-field" placeholder="e.g. +91 9876543210" />
            </div>
            <div>
              <label className="label-text">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required className="input-field" placeholder="vendor@example.com" />
            </div>
          </div>
          <div>
            <label className="label-text">Office Address</label>
            <textarea name="address" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} rows={2} className="input-field resize-none" placeholder="Enter complete office address..." />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-teal">Create Partner</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Vendor" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="label-text">Vendor Name</label>
            <input name="name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Category</label>
              <input name="category" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="label-text">GST Number</label>
              <input name="gstNumber" value={form.gstNumber} onChange={(e) => setForm(f => ({ ...f, gstNumber: e.target.value }))} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Contact Number</label>
              <input name="contactNumber" value={form.contactNumber} onChange={(e) => setForm(f => ({ ...f, contactNumber: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="label-text">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Address</label>
              <textarea name="address" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} rows={2} className="input-field resize-none" />
            </div>
            <div>
              <label className="label-text">Rating (0-5)</label>
              <input name="rating" type="number" min="0" max="5" step="0.5" value={form.rating} onChange={(e) => setForm(f => ({ ...f, rating: parseFloat(e.target.value) || 0 }))} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-teal">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Vendor"
        message={`Are you sure you want to delete ${vendorToChange?.name}? This action will remove their company records permanently.`}
        type="danger"
        confirmLabel="Delete Partner"
      />

      {/* Status Confirmation */}
      <ConfirmDialog
        isOpen={confirmStatusOpen}
        onClose={() => setConfirmStatusOpen(false)}
        onConfirm={handleStatusConfirm}
        title={targetStatus === 'active' ? (vendorToChange?.status === 'pending' ? "Approve Vendor" : "Activate Vendor") : (vendorToChange?.status === 'pending' ? "Reject Vendor" : "Block Vendor")}
        message={`Are you sure you want to ${targetStatus === 'active' ? (vendorToChange?.status === 'pending' ? 'approve' : 'activate') : (vendorToChange?.status === 'pending' ? 'reject' : 'block')} ${vendorToChange?.name}?`}
        type={targetStatus === 'active' ? 'teal' : 'danger'}
        confirmLabel={targetStatus === 'active' ? (vendorToChange?.status === 'pending' ? "Approve Partner" : "Activate Partner") : (vendorToChange?.status === 'pending' ? "Reject Partner" : "Block Partner")}
      />
    </div>
  );
};

export default VendorsPage;
