import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getRFQs, publishRFQ, deleteRFQ } from '../api/rfqs.js';
import DataTable from '../components/DataTable.jsx';
import Badge from '../components/Badge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';

const RFQsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || '';
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [rfqToChange, setRfqToChange] = useState(null);

  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ['rfqs', selectedStatus],
    queryFn: () => getRFQs({ status: selectedStatus }).then(r => r.data)
  });

  const publishMutation = useMutation({
    mutationFn: (id) => publishRFQ(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast.success('RFQ published to assigned vendors');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error publishing RFQ');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRFQ(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast.success('RFQ deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error deleting RFQ');
    }
  });

  const handlePublishConfirm = () => {
    if (rfqToChange) {
      publishMutation.mutate(rfqToChange._id);
    }
  };

  const handleDeleteConfirm = () => {
    if (rfqToChange) {
      deleteMutation.mutate(rfqToChange._id);
    }
  };

  const columns = [
    {
      header: 'RFQ Title',
      accessor: 'title',
      render: (row) => (
        <Link to={`/rfqs/${row._id}`} className="text-teal-600 font-semibold hover:text-teal-700">
          {row.title}
        </Link>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
    },
    {
      header: 'Line Items',
      accessor: (row) => row.lineItems?.length || 0,
    },
    {
      header: 'Assigned Vendors',
      accessor: (row) => row.vendorIds?.length || 0,
    },
    {
      header: 'Deadline',
      accessor: (row) => new Date(row.deadline).toLocaleDateString(),
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
          <Link to={`/rfqs/${row._id}`} className="text-slate-500 hover:text-slate-700 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          {['admin', 'officer'].includes(role) && row.status === 'draft' && (
            <>
              <button 
                onClick={() => { setRfqToChange(row); setConfirmPublishOpen(true); }}
                className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                title="Publish RFQ"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.316 4.318M12.98 15.06l4.317-4.318M11.986 2.944a11.954 11.954 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </button>
              <button 
                onClick={() => { setRfqToChange(row); setConfirmDeleteOpen(true); }}
                className="text-red-600 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete RFQ"
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header text-3xl">Requests for Quotations (RFQs)</h1>
          <p className="page-subtitle">Publish bid opportunities, configure requirements, and receive vendor submissions.</p>
        </div>
        {['admin', 'officer'].includes(role) && (
          <Link to="/rfqs/new" className="btn-teal self-start sm:self-center flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create RFQ</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex border-b border-slate-200 w-fit">
        <button 
          onClick={() => setSelectedStatus('')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            selectedStatus === '' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All RFQs
        </button>
        <button 
          onClick={() => setSelectedStatus('draft')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            selectedStatus === 'draft' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Drafts
        </button>
        <button 
          onClick={() => setSelectedStatus('published')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            selectedStatus === 'published' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Published
        </button>
        <button 
          onClick={() => setSelectedStatus('closed')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            selectedStatus === 'closed' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Closed
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={rfqs}
        isLoading={isLoading}
        emptyMessage="No RFQs found matching current filters."
        onRowClick={(row) => navigate(`/rfqs/${row._id}`)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete RFQ Draft"
        message={`Are you sure you want to delete "${rfqToChange?.title}"? This draft will be removed permanently.`}
        type="danger"
        confirmLabel="Delete Draft"
      />

      {/* Publish Confirmation */}
      <ConfirmDialog
        isOpen={confirmPublishOpen}
        onClose={() => setConfirmPublishOpen(false)}
        onConfirm={handlePublishConfirm}
        title="Publish RFQ"
        message={`Are you sure you want to publish "${rfqToChange?.title}"? This will send notification alerts to all assigned vendors immediately.`}
        type="teal"
        confirmLabel="Publish Now"
      />
    </div>
  );
};

export default RFQsPage;
