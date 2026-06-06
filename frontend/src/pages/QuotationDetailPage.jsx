import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuotation, selectQuotation, rejectQuotation } from '../api/quotations.js';
import Badge from '../components/Badge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';

const QuotationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || '';
  
  const [confirmSelectOpen, setConfirmSelectOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => getQuotation(id).then(r => r.data)
  });

  const selectMutation = useMutation({
    mutationFn: () => selectQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation selected successfully! Approval initiated.');
      navigate('/quotations');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error selecting quotation');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation rejected');
      navigate('/quotations');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error rejecting quotation');
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton type="card" />
        <Skeleton type="table" rows={4} />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-lg font-bold text-slate-800">Quotation Not Found</h3>
        <p className="text-sm text-slate-500 mt-2">The quotation you requested does not exist or has been removed.</p>
        <Link to="/quotations" className="btn-teal inline-block mt-4">Back to Quotations</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2.5 text-sm font-medium text-slate-500">
          <Link to="/quotations" className="hover:text-teal-600 transition-colors">Quotations</Link>
          <span>/</span>
          <span className="text-slate-800 truncate font-semibold">Quote #{quotation._id.slice(-6).toUpperCase()}</span>
        </div>
        
        {['admin', 'officer'].includes(role) && quotation.status === 'submitted' && (
          <div className="flex items-center space-x-3.5 self-start sm:self-center">
            <button onClick={() => setConfirmSelectOpen(true)} className="btn-teal py-2">
              Select Quotation
            </button>
            <button onClick={() => setConfirmRejectOpen(true)} className="btn-outline border-red-500 text-red-600 hover:bg-red-50 py-2">
              Reject Quotation
            </button>
          </div>
        )}
      </div>

      {/* Main quotation Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: General Info */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-8 shadow-card flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quotation Bid Summary</span>
                <h2 className="text-lg font-bold text-navy-900 mt-1">Submitted for: {quotation.rfq?.title || 'RFQ Opportunity'}</h2>
              </div>
              <Badge status={quotation.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-slate-50 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Vendor Name</span>
                <Link to={`/vendors/${quotation.vendor?._id || quotation.vendor}`} className="font-semibold text-teal-600 hover:text-teal-700 transition-colors block">
                  {quotation.vendor?.name || 'View Vendor'}
                </Link>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Submitted By</span>
                <span className="font-semibold text-slate-700">
                  {quotation.submittedBy?.firstName} {quotation.submittedBy?.lastName} ({quotation.submittedBy?.email})
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Delivery Timeline</span>
                <span className="font-semibold text-slate-700">{quotation.deliveryDays} Days</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Payment Terms</span>
                <span className="font-semibold text-slate-700">{quotation.paymentTerms || '-'}</span>
              </div>
            </div>

            {quotation.notes && (
              <div className="space-y-1 pt-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Terms & Notes</span>
                <p className="text-slate-600 leading-relaxed text-sm">{quotation.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Totals Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-card flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-base font-semibold text-navy-900 border-b border-slate-50 pb-3">Financial summary</h3>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Subtotal</span>
              <span className="font-semibold text-slate-700">₹{quotation.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">GST ({quotation.gstPercent}%)</span>
              <span className="font-semibold text-slate-700">₹{quotation.gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-50 pt-4 text-base font-black text-navy-900">
              <span>Grand Total</span>
              <span className="text-teal-600">₹{quotation.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-navy-900">Quotation Line Items</h3>
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Unit Price (₹)</th>
                <th className="px-6 py-4">Delivery Timeline</th>
                <th className="px-6 py-4">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
              {quotation.lineItems && quotation.lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40">
                  <td className="px-6 py-4 font-bold text-slate-800">{item.itemName}</td>
                  <td className="px-6 py-4">{item.quantity}</td>
                  <td className="px-6 py-4 text-slate-500">{item.unit}</td>
                  <td className="px-6 py-4">₹{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-slate-500 font-normal">{item.deliveryDays ? `${item.deliveryDays} days` : 'Immediate'}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">₹{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmSelectOpen}
        onClose={() => setConfirmSelectOpen(false)}
        onConfirm={() => selectMutation.mutate()}
        title="Select Quotation"
        message={`Are you sure you want to select this quotation? This will automatically initiate a 2-level manager approval chain.`}
        type="teal"
        confirmLabel="Select & Send for Approval"
      />

      <ConfirmDialog
        isOpen={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        onConfirm={() => rejectMutation.mutate()}
        title="Reject Quotation"
        message={`Are you sure you want to reject this quotation? The vendor will be notified.`}
        type="danger"
        confirmLabel="Reject Bid"
      />
    </div>
  );
};

export default QuotationDetailPage;
