import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRFQ } from '../api/rfqs.js';
import { createQuotation } from '../api/quotations.js';
import Skeleton from '../components/Skeleton.jsx';
import api from '../api/client.js';
import { toast } from 'react-toastify';

const SubmitQuotationPage = () => {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form State
  const [gstPercent, setGstPercent] = useState(18);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [lineItems, setLineItems] = useState([]);

  // Fetch RFQ Details
  const { data: rfq, isLoading } = useQuery({
    queryKey: ['rfq', rfqId],
    queryFn: () => getRFQ(rfqId).then(r => {
      const rfqData = r.data;
      // Pre-fill line items
      const prefilledItems = rfqData.lineItems.map((item, idx) => ({
        rfqLineItemIndex: idx,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: 0,
        deliveryDays: 7,
        total: 0
      }));
      setLineItems(prefilledItems);
      return rfqData;
    })
  });

  const submitMutation = useMutation({
    mutationFn: async ({ status }) => {
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
        status // 'draft' or 'submitted'
      };

      const { data } = await createQuotation(quotationData);
      
      if (status === 'submitted') {
        await api.patch(`/api/quotations/${data._id}/submit`);
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success(variables.status === 'submitted' ? 'Quotation submitted successfully!' : 'Quotation draft saved.');
      navigate('/quotations');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error submitting quotation');
    }
  });

  // Fetch the logged-in vendor's Vendor ID
  const [userVendorId, setUserVendorId] = useState('');
  useQuery({
    queryKey: ['myVendorRecord'],
    queryFn: () => api.get('/api/users/profile').then(async (res) => {
      // Find a vendor associated with this user's email
      const email = res.data.email || res.data.user?.email;
      if (email) {
        const vendorsRes = await api.get(`/api/vendors?search=${email}`);
        if (vendorsRes.data && vendorsRes.data.length > 0) {
          setUserVendorId(vendorsRes.data[0]._id);
        }
      }
      return res.data;
    })
  });

  const handlePriceChange = (idx, value) => {
    const price = parseFloat(value) || 0;
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return {
        ...item,
        unitPrice: price,
        total: price * item.quantity
      };
    }));
  };

  const handleDaysChange = (idx, value) => {
    const days = parseInt(value) || 0;
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return { ...item, deliveryDays: days };
    }));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = subtotal * (gstPercent / 100);
  const grandTotal = subtotal + gstAmount;

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

      {/* RFQ Info Banner */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">RFQ Reference Details</span>
        <h2 className="text-lg font-bold text-navy-900 mt-1">{rfq.title}</h2>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
          <span>Category: <span className="font-semibold text-slate-800">{rfq.category || 'General'}</span></span>
          <span>•</span>
          <span>Bidding Deadline: <span className="font-semibold text-slate-800">{new Date(rfq.deadline).toLocaleDateString()}</span></span>
        </div>
      </div>

      {/* Quotation Input Form */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card space-y-6">
        <h3 className="text-base font-semibold text-navy-900 border-b border-slate-50 pb-3">Line Item Pricing</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Unit Price (₹) *</th>
                <th className="px-6 py-4">Delivery (Days)</th>
                <th className="px-6 py-4">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30">
                  <td className="px-6 py-4 font-bold text-slate-800">{item.itemName}</td>
                  <td className="px-6 py-4">{item.quantity}</td>
                  <td className="px-6 py-4 text-slate-500">{item.unit}</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.unitPrice || ''}
                      onChange={(e) => handlePriceChange(idx, e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      min="1"
                      value={item.deliveryDays}
                      onChange={(e) => handleDaysChange(idx, e.target.value)}
                      required
                      className="w-16 rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    ₹{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
            <label className="label-text">Delivery Timeline (Total Days)</label>
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

        {/* Calculations Block */}
        <div className="flex flex-col items-end space-y-2 pt-6 border-t border-slate-100 text-sm">
          <div className="flex justify-between w-64 text-slate-500">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-700">₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between w-64 text-slate-500">
            <span>GST ({gstPercent}%):</span>
            <span className="font-semibold text-slate-700">₹{gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between w-64 text-base font-black border-t border-slate-50 pt-2 text-navy-900">
            <span>Grand Total:</span>
            <span className="text-teal-600">₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
            disabled={submitMutation.isPending || !userVendorId}
            onClick={() => submitMutation.mutate({ status: 'draft' })} 
            className="btn-outline bg-slate-50 text-slate-700 border-slate-200"
          >
            Save Draft
          </button>
          <button 
            type="button" 
            disabled={submitMutation.isPending || !userVendorId}
            onClick={() => submitMutation.mutate({ status: 'submitted' })} 
            className="btn-teal"
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit Quotation'}
          </button>
        </div>
        
        {!userVendorId && (
          <p className="text-center text-xs text-rose-500 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100">
            Warning: No vendor profile linked to your user profile. Please request the administrator to create a Vendor record with your email address.
          </p>
        )}
      </div>
    </div>
  );
};

export default SubmitQuotationPage;
