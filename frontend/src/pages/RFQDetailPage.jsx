import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRFQ, publishRFQ, closeRFQ, deleteRFQ } from '../api/rfqs.js';
import { getQuotations } from '../api/quotations.js';
import Badge from '../components/Badge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';

const RFQDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || '';
  
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const { data: rfq, isLoading: rfqLoading } = useQuery({
    queryKey: ['rfq', id],
    queryFn: () => getRFQ(id).then(r => r.data)
  });

  const { data: quotations = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['rfqQuotations', id],
    queryFn: () => getQuotations({ rfqId: id }).then(r => r.data)
  });

  const publishMutation = useMutation({
    mutationFn: () => publishRFQ(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq', id] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast.success('RFQ published successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error publishing RFQ');
    }
  });

  const closeMutation = useMutation({
    mutationFn: () => closeRFQ(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfq', id] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast.success('RFQ closed for bids');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error closing RFQ');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRFQ(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast.success('RFQ deleted successfully');
      navigate('/rfqs');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error deleting RFQ');
    }
  });

  if (rfqLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton type="card" />
        <Skeleton type="table" rows={4} />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-lg font-bold text-slate-800">RFQ Not Found</h3>
        <p className="text-sm text-slate-500 mt-2">The RFQ you requested does not exist or has been removed.</p>
        <Link to="/rfqs" className="btn-teal inline-block mt-4">Back to RFQs</Link>
      </div>
    );
  }

  const hasSubmittedQuote = quotations.some(q => q.submittedBy?._id === user?._id || q.submittedBy === user?._id);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2.5 text-sm font-medium text-slate-500">
          <Link to="/rfqs" className="hover:text-teal-600 transition-colors">RFQs</Link>
          <span>/</span>
          <span className="text-slate-800 truncate font-semibold">{rfq.title}</span>
        </div>
        
        <div className="flex items-center space-x-3 self-start sm:self-center">
          {/* Officers/Admins Actions */}
          {['admin', 'officer'].includes(role) && (
            <>
              {rfq.status === 'draft' && (
                <button onClick={() => setConfirmPublishOpen(true)} className="btn-teal py-2">
                  Publish RFQ
                </button>
              )}
              {rfq.status === 'published' && (
                <button onClick={() => setConfirmCloseOpen(true)} className="btn-outline border-amber-500 text-amber-600 hover:bg-amber-50 py-2">
                  Close Bidding
                </button>
              )}
              {rfq.status === 'draft' && (
                <button onClick={() => setConfirmDeleteOpen(true)} className="btn-danger py-2">
                  Delete Draft
                </button>
              )}
              {rfq.status !== 'draft' && quotations.length > 0 && (
                <Link to={`/rfqs/${rfq._id}/compare`} className="btn-teal bg-navy-900 hover:bg-navy-800 py-2">
                  Compare Quotations ({quotations.length})
                </Link>
              )}
            </>
          )}

          {/* Vendor Actions */}
          {role === 'vendor' && rfq.status === 'published' && (
            hasSubmittedQuote ? (
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center space-x-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Quotation Submitted</span>
              </span>
            ) : (
              <Link to={`/quotations/submit/${rfq._id}`} className="btn-teal py-2">
                Submit Quotation
              </Link>
            )
          )}
        </div>
      </div>

      {/* RFQ Meta Info Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-card space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Request Details</span>
            <h2 className="text-xl font-bold text-navy-900">{rfq.title}</h2>
            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-2">
              <Badge status={rfq.status} />
              <span>•</span>
              <span className="font-semibold">{rfq.category || 'General Category'}</span>
              <span>•</span>
              <span>Deadline: <span className="font-semibold text-slate-800">{new Date(rfq.deadline).toLocaleDateString()}</span></span>
            </div>
          </div>
          
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Quotation Submissions</span>
            <span className="text-3xl font-black text-teal-600 block mt-1">{quotations.length}</span>
          </div>
        </div>

        {rfq.description && (
          <div className="pt-4 border-t border-slate-50 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Scope of Work</span>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{rfq.description}</p>
          </div>
        )}

        {/* Attachments */}
        {rfq.attachments && rfq.attachments.length > 0 && (
          <div className="pt-4 border-t border-slate-50 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">RFQ Attachments</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {rfq.attachments.map((file, idx) => {
                const name = file.fileName || `Attachment-${idx + 1}`;
                const url = file.fileUrl || file;
                return (
                  <a 
                    key={idx} 
                    href={url.startsWith('http') ? url : `http://localhost:5000${url}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-teal-100 hover:bg-teal-50/20 text-slate-700 hover:text-teal-700 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <svg className="w-4.5 h-4.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-semibold truncate">{name}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-navy-900">Requested Line Items</h3>
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Specifications</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
              {rfq.lineItems && rfq.lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40">
                  <td className="px-6 py-4 text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{item.itemName}</td>
                  <td className="px-6 py-4 text-slate-500 font-normal">{item.description || '-'}</td>
                  <td className="px-6 py-4">{item.quantity}</td>
                  <td className="px-6 py-4 text-slate-500">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete RFQ"
        message={`Are you sure you want to delete "${rfq.title}"? This cannot be undone.`}
        type="danger"
      />
      <ConfirmDialog
        isOpen={confirmPublishOpen}
        onClose={() => setConfirmPublishOpen(false)}
        onConfirm={() => publishMutation.mutate()}
        title="Publish RFQ"
        message={`Are you sure you want to publish "${rfq.title}" to assigned vendor partners?`}
        type="teal"
      />
      <ConfirmDialog
        isOpen={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        onConfirm={() => closeMutation.mutate()}
        title="Close Bidding"
        message={`Are you sure you want to close bidding for "${rfq.title}"? No further quotations can be submitted.`}
        type="primary"
      />
    </div>
  );
};

export default RFQDetailPage;
