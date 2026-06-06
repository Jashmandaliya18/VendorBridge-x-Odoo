import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRFQ } from '../api/rfqs.js';
import { createQuotation } from '../api/quotations.js';
import { useAuth } from '../context/AuthContext.jsx';
import Skeleton from '../components/Skeleton.jsx';
import api from '../api/client.js';
import { toast } from 'react-toastify';

const SubmitQuotationPage = () => {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form State
  const [gstPercent, setGstPercent] = useState(18);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [lineItems, setLineItems] = useState([]);
  const [loadedRfqId, setLoadedRfqId] = useState(null);

  // Fetch RFQ Details
  const { data: rfq, isLoading: rfqLoading } = useQuery({
    queryKey: ['rfq', rfqId],
    queryFn: () => getRFQ(rfqId).then(r => r.data),
  });

  // Pre-fill line items when RFQ details are loaded
  useEffect(() => {
    if (rfq && rfq._id === rfqId && loadedRfqId !== rfqId) {
      setLineItems(
        rfq.lineItems.map((item, idx) => ({
          rfqLineItemIndex: idx,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: 0,
          deliveryDays: 7,
          total: 0,
        }))
      );
      setLoadedRfqId(rfqId);
    }
  }, [rfq, rfqId, loadedRfqId]);

  // Fetch this vendor user's linked Vendor record via the new /my-profile endpoint
  const { data: vendorProfile, isLoading: vendorLoading, error: vendorError } = useQuery({
    queryKey: ['myVendorProfile'],
    queryFn: () => api.get('/api/vendors/my-profile').then(r => r.data),
    enabled: user?.role === 'vendor',
    retry: false, // Don't retry if the vendor record doesn't exist yet
  });

  const userVendorId = vendorProfile?._id || '';

  const submitMutation = useMutation({
    mutationFn: async ({ status }) => {
      if (!userVendorId) {
        throw new Error('No vendor profile is linked to your account. Please contact an administrator.');
      }

      // Validate all line items have a price
      const emptyPrices = lineItems.filter(item => !item.unitPrice || item.unitPrice <= 0);
      if (emptyPrices.length > 0 && status === 'submitted') {
        throw new Error('Please enter a unit price for all line items before submitting.');
      }

      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
      const gstAmount = subtotal * (gstPercent / 100);
      const grandTotal = subtotal + gstAmount;

      const quotationData = {
        rfq: rfqId,
        vendor: userVendorId,
        lineItems,
        gstPercent,
        subtotal,
        gstAmount,
        grandTotal,
        notes,
        paymentTerms,
        deliveryDays,
      };

      const { data } = await createQuotation(quotationData);

      if (status === 'submitted') {
        await api.patch(`/api/quotations/${data._id}/submit`);
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success(
        variables.status === 'submitted'
          ? 'Quotation submitted successfully!'
          : 'Quotation draft saved.'
      );
      navigate('/quotations');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Error submitting quotation');
    },
  });

  const handlePriceChange = (idx, value) => {
    const price = parseFloat(value) || 0;
    setLineItems(prev =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        return { ...item, unitPrice: price, total: price * item.quantity };
      })
    );
  };

  const handleDaysChange = (idx, value) => {
    const days = parseInt(value) || 1;
    setLineItems(prev =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        return { ...item, deliveryDays: days };
      })
    );
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = subtotal * (gstPercent / 100);
  const grandTotal = subtotal + gstAmount;

  const isLoading = rfqLoading || vendorLoading;

  if (isLoading) {
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
        <p className="text-sm text-slate-500 mt-2">Cannot submit a quotation for a non-existent RFQ.</p>
        <Link to="/rfqs" className="btn-teal inline-block mt-4">Back to RFQs</Link>
      </div>
    );
  }

  // Block submission if vendor profile is not linked
  const hasVendorProfile = !!userVendorId;
  const vendorNotLinked = !hasVendorProfile && !vendorLoading;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2.5 text-sm font-medium text-slate-500">
        <Link to="/rfqs" className="hover:text-teal-600 transition-colors">RFQs</Link>
        <span>/</span>
        <Link to={`/rfqs/${rfqId}`} className="hover:text-teal-600 transition-colors">{rfq.title}</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Submit Quotation</span>
      </div>

      {/* Vendor Not Linked Banner */}
      {vendorNotLinked && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-rose-800">No Vendor Profile Linked</p>
            <p className="text-xs text-rose-600 mt-1">
              Your user account <strong>{user?.email}</strong> is not linked to any vendor record.
              Please ask an administrator to create a Vendor with this email address before you can submit quotations.
            </p>
          </div>
        </div>
      )}

      {/* Vendor Profile Linked — show info */}
      {hasVendorProfile && (
        <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-2xl px-5 py-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-800">Submitting as: <span className="font-bold">{vendorProfile.name}</span></p>
            <p className="text-xs text-teal-600">{vendorProfile.category || 'Vendor Partner'} · {vendorProfile.email}</p>
          </div>
        </div>
      )}

      {/* RFQ Info Banner */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">RFQ Reference Details</span>
        <h2 className="text-lg font-bold text-navy-900 mt-1">{rfq.title}</h2>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
          <span>Category: <span className="font-semibold text-slate-800">{rfq.category || 'General'}</span></span>
          <span>•</span>
          <span>Bidding Deadline: <span className="font-semibold text-slate-800">{new Date(rfq.deadline).toLocaleDateString()}</span></span>
          <span>•</span>
          <span>{rfq.lineItems?.length || 0} Line Items</span>
        </div>
        {rfq.description && (
          <p className="text-xs text-slate-500 mt-3 leading-relaxed border-t border-slate-50 pt-3">{rfq.description}</p>
        )}
      </div>

      {/* Quotation Input Form */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card space-y-6">
        <h3 className="text-base font-semibold text-navy-900 border-b border-slate-50 pb-3">
          Line Item Pricing
          <span className="text-xs text-slate-400 font-normal ml-2">Enter your unit price for each item</span>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Item Name</th>
                <th className="px-5 py-3.5 text-center">Qty</th>
                <th className="px-5 py-3.5">Unit</th>
                <th className="px-5 py-3.5">Unit Price (₹) *</th>
                <th className="px-5 py-3.5">Delivery (Days)</th>
                <th className="px-5 py-3.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-800">{item.itemName}</td>
                  <td className="px-5 py-4 text-center text-slate-500">{item.quantity}</td>
                  <td className="px-5 py-4 text-slate-500">{item.unit}</td>
                  <td className="px-5 py-4">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.unitPrice || ''}
                      onChange={(e) => handlePriceChange(idx, e.target.value)}
                      placeholder="0.00"
                      className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-right font-semibold"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <input
                      type="number"
                      min="1"
                      value={item.deliveryDays}
                      onChange={(e) => handleDaysChange(idx, e.target.value)}
                      className="w-16 rounded-lg border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-center"
                    />
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-800 text-right">
                    ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extra Quotation Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 border-t border-slate-100">
          <div>
            <label className="label-text">GST Tax Percent (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={gstPercent}
              onChange={(e) => setGstPercent(parseInt(e.target.value) || 0)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-text">Payment Terms</label>
            <input
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g. Net 30, Due on Receipt"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-text">Overall Delivery Timeline (Days)</label>
            <input
              type="number"
              min="1"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(parseInt(e.target.value) || 1)}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="label-text">Additional Terms / Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Enter any exclusions, specifications, or warranties..."
            className="input-field resize-none"
          />
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end space-y-2 pt-6 border-t border-slate-100 text-sm">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST @ {gstPercent}%</span>
              <span className="font-semibold text-slate-700">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-base font-black border-t border-slate-100 pt-2.5 text-navy-900">
              <span>Grand Total</span>
              <span className="text-teal-600">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/rfqs')}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitMutation.isPending || !hasVendorProfile}
            onClick={() => submitMutation.mutate({ status: 'draft' })}
            className="btn-outline bg-slate-50 text-slate-700 border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={submitMutation.isPending || !hasVendorProfile}
            onClick={() => submitMutation.mutate({ status: 'submitted' })}
            className="btn-teal disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitMutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : 'Submit Quotation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitQuotationPage;
