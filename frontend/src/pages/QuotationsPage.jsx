import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getQuotations, selectQuotation, rejectQuotation } from '../api/quotations.js';
import DataTable from '../components/DataTable.jsx';
import Badge from '../components/Badge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';

const QuotationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || '';
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const [confirmSelectOpen, setConfirmSelectOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [quoteToChange, setQuoteToChange] = useState(null);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations', selectedStatus],
    queryFn: () => getQuotations({ status: selectedStatus }).then(r => r.data)
  });

  const selectMutation = useMutation({
    mutationFn: (id) => selectQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation selected! Approval workflow has been initiated.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error selecting quotation');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => rejectQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation rejected');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error rejecting quotation');
    }
  });

  const handleSelectConfirm = () => {
    if (quoteToChange) {
      selectMutation.mutate(quoteToChange._id);
    }
  };

  const handleRejectConfirm = () => {
    if (quoteToChange) {
      rejectMutation.mutate(quoteToChange._id);
    }
  };

  const columns = [
    {
      header: 'RFQ Name',
      accessor: (row) => row.rfq?.title || 'RFQ Reference',
      render: (row) => (
        <Link to={`/rfqs/${row.rfq?._id || row.rfq}`} className="text-teal-600 font-semibold hover:text-teal-700">
          {row.rfq?.title || 'View RFQ'}
        </Link>
      )
    },
    {
      header: 'Vendor Name',
      accessor: (row) => row.vendor?.name || 'Vendor Partner',
      render: (row) => (
        <Link to={`/vendors/${row.vendor?._id || row.vendor}`} className="text-slate-700 font-semibold hover:text-teal-600 transition-colors">
          {row.vendor?.name || 'View Vendor'}
        </Link>
      )
    },
    {
      header: 'Grand Total',
      accessor: (row) => `₹${row.grandTotal.toLocaleString()}`,
    },
    {
      header: 'Delivery Days',
      accessor: (row) => row.deliveryDays ? `${row.deliveryDays} days` : '-',
    },
    {
      header: 'Submitted At',
      accessor: (row) => row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '-',
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
          <Link to={`/quotations/${row._id}`} className="text-slate-500 hover:text-slate-700 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          {['admin', 'officer'].includes(role) && row.status === 'submitted' && (
            <>
              <button 
                onClick={() => { setQuoteToChange(row); setConfirmSelectOpen(true); }}
                className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                title="Select Quotation"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button 
                onClick={() => { setQuoteToChange(row); setConfirmRejectOpen(true); }}
                className="text-red-600 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                title="Reject Quotation"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      <div>
        <h1 className="page-header text-3xl">{role === 'vendor' ? 'My Quotations' : 'Quotations'}</h1>
        <p className="page-subtitle">Track bids submitted by vendor partners, evaluate costs, and trigger manager review.</p>
      </div>

      {/* Filters */}
      <div className="flex border-b border-slate-200 w-fit">
        <button 
          onClick={() => setSelectedStatus('')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            selectedStatus === '' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All Quotes
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
          onClick={() => setSelectedStatus('submitted')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            selectedStatus === 'submitted' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Submitted
        </button>
        <button 
          onClick={() => setSelectedStatus('selected')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            selectedStatus === 'selected' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Selected
        </button>
        <button 
          onClick={() => setSelectedStatus('rejected')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            selectedStatus === 'rejected' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={quotations}
        isLoading={isLoading}
        emptyMessage="No quotations found matching current filters."
        onRowClick={(row) => navigate(`/quotations/${row._id}`)}
      />

      {/* Select Confirmation */}
      <ConfirmDialog
        isOpen={confirmSelectOpen}
        onClose={() => setConfirmSelectOpen(false)}
        onConfirm={handleSelectConfirm}
        title="Select Quotation"
        message={`Are you sure you want to select this quotation? This will automatically initiate a 2-level manager approval chain.`}
        type="teal"
        confirmLabel="Select & Send for Approval"
      />

      {/* Reject Confirmation */}
      <ConfirmDialog
        isOpen={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        onConfirm={handleRejectConfirm}
        title="Reject Quotation"
        message={`Are you sure you want to reject this quotation? The vendor will be notified.`}
        type="danger"
        confirmLabel="Reject Bid"
      />
    </div>
  );
};

export default QuotationsPage;
