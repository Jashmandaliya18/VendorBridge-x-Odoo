import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendor, updateVendor, updateVendorStatus, deleteVendor } from '../api/vendors.js';
import { getQuotations } from '../api/quotations.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';

const VendorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');

  
  const [form, setForm] = useState({
    name: '',
    category: '',
    gstNumber: '',
    contactNumber: '',
    email: '',
    address: '',
    rating: 0
  });

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => getVendor(id).then(r => {
      const v = r.data;
      setForm({
        name: v.name,
        category: v.category || '',
        gstNumber: v.gstNumber || '',
        contactNumber: v.contactNumber || '',
        email: v.email || '',
        address: v.address || '',
        rating: v.rating || 0
      });
      return v;
    })
  });

  const { data: quotations = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['vendorQuotations', id],
    queryFn: () => getQuotations({ vendorId: id }).then(r => r.data)
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor updated successfully');
      setIsEditOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error updating vendor');
    }
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateVendorStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor status updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor deleted successfully');
      navigate('/vendors');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error deleting vendor');
    }
  });

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handleStatusChange = () => {
    statusMutation.mutate(targetStatus);
  };

  const columns = [
    {
      header: 'RFQ Ref',
      accessor: (row) => row.rfq?.title || 'RFQ Reference',
      render: (row) => (
        <Link to={`/rfqs/${row.rfq?._id || row.rfq}`} className="text-teal-600 font-semibold hover:text-teal-700">
          {row.rfq?.title || 'View RFQ'}
        </Link>
      )
    },
    {
      header: 'Grand Total',
      accessor: (row) => `₹${row.grandTotal.toLocaleString()}`,
    },
    {
      header: 'Submitted At',
      accessor: (row) => row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '-',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} />
    }
  ];

  if (vendorLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton type="card" />
        <Skeleton type="table" rows={4} />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-lg font-bold text-slate-800">Vendor Not Found</h3>
        <p className="text-sm text-slate-500 mt-2">The partner you requested does not exist or has been removed.</p>
        <Link to="/vendors" className="btn-teal inline-block mt-4">Back to Vendors</Link>
      </div>
    );
  }

  const wonQuotes = quotations.filter(q => q.status === 'selected').length;
  const winRate = quotations.length > 0 ? Math.round((wonQuotes / quotations.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2.5 text-sm font-medium text-slate-500">
          <Link to="/vendors" className="hover:text-teal-600 transition-colors">Vendors</Link>
          <span>/</span>
          <span className="text-slate-800 truncate font-semibold">{vendor.name}</span>
        </div>
        
        <div className="flex items-center space-x-3.5 self-start sm:self-center">
          {['admin', 'officer'].includes(user?.role) && (
            <button 
              onClick={() => setIsEditOpen(true)} 
              className="btn-outline flex items-center space-x-2 py-2"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Profile</span>
            </button>
          )}
          {isAdmin && (
            <>
              {vendor.status === 'pending' ? (
                <>
                  <button 
                    onClick={() => { setTargetStatus('active'); setConfirmStatusOpen(true); }}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm active:scale-[0.98] bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Approve Partner</span>
                  </button>
                  <button 
                    onClick={() => { setTargetStatus('blocked'); setConfirmStatusOpen(true); }}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm active:scale-[0.98] bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/10"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Reject Partner</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setTargetStatus(vendor.status === 'blocked' ? 'active' : 'blocked');
                    setConfirmStatusOpen(true);
                  }} 
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm active:scale-[0.98] ${
                    vendor.status === 'blocked'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10'
                  }`}
                >
                  {vendor.status === 'blocked' ? (
                    <>
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Activate Partner</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Block Partner</span>
                    </>
                  )}
                </button>
              )}
              <button 
                onClick={() => setConfirmDeleteOpen(true)} 
                className="btn-danger flex items-center space-x-2 py-2"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Vendor Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: General Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-8 shadow-card flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 font-extrabold text-2xl border border-teal-100/50 shadow-sm uppercase">
                {vendor.name.slice(0, 2)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-navy-900 leading-tight">{vendor.name}</h2>
                <div className="flex items-center space-x-2.5 mt-2">
                  <Badge status={vendor.status} />
                  <span className="text-xs font-semibold text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium">{vendor.category || 'No Category'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-slate-50 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">GSTIN</span>
                <span className="font-semibold text-slate-700">{vendor.gstNumber || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Contact Email</span>
                <a href={`mailto:${vendor.email}`} className="font-semibold text-teal-600 hover:text-teal-700 transition-colors block">{vendor.email}</a>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Phone Number</span>
                <span className="font-semibold text-slate-700">{vendor.contactNumber || '-'}</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Partner Since</span>
                <span className="font-semibold text-slate-700">{new Date(vendor.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Headquarters Address</span>
              <p className="text-slate-600 leading-relaxed text-sm">{vendor.address || 'No address provided'}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Performance Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-card flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-navy-900 border-b border-slate-50 pb-3">Performance metrics</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Average Rating</span>
              <div className="flex items-center text-amber-500">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-bold text-slate-700 ml-1.5">{vendor.rating || 0}/5</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">RFQ Response Count</span>
              <span className="text-sm font-bold text-slate-700">{quotations.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Won Quotations</span>
              <span className="text-sm font-bold text-emerald-600">{wonQuotes}</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
              <span className="text-sm font-semibold text-slate-700">Win Rate</span>
              <span className="text-lg font-black text-teal-600">{winRate}%</span>
            </div>
          </div>
          
          <div className="pt-6">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-teal-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${winRate}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quotation History list */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-navy-900">Quotation History</h3>
        
        <DataTable
          columns={columns}
          data={quotations}
          isLoading={quotesLoading}
          emptyMessage="This vendor has not submitted any quotations yet."
          onRowClick={(row) => navigate(`/quotations/${row._id}`)}
        />
      </div>

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
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Vendor"
        message={`Are you sure you want to delete ${vendor.name}? This action will remove their company records permanently.`}
        type="danger"
        confirmLabel="Delete Partner"
      />

      {/* Status Confirmation */}
      <ConfirmDialog
        isOpen={confirmStatusOpen}
        onClose={() => setConfirmStatusOpen(false)}
        onConfirm={handleStatusChange}
        title={targetStatus === 'active' ? (vendor.status === 'pending' ? "Approve Vendor" : "Activate Vendor") : (vendor.status === 'pending' ? "Reject Vendor" : "Block Vendor")}
        message={`Are you sure you want to ${targetStatus === 'active' ? (vendor.status === 'pending' ? 'approve' : 'activate') : (vendor.status === 'pending' ? 'reject' : 'block')} ${vendor.name}?`}
        type={targetStatus === 'active' ? 'teal' : 'danger'}
        confirmLabel={targetStatus === 'active' ? (vendor.status === 'pending' ? "Approve Partner" : "Activate Partner") : (vendor.status === 'pending' ? "Reject Partner" : "Block Partner")}
      />
    </div>
  );
};

export default VendorDetailPage;
