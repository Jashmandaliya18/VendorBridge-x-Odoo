import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRFQ } from '../api/rfqs.js';
import { getQuotations, selectQuotation } from '../api/quotations.js';
import Badge from '../components/Badge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { toast } from 'react-toastify';

const QuotationComparisonPage = () => {
  const { id: rfqId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmSelectOpen, setConfirmSelectOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // Fetch RFQ Details
  const { data: rfq, isLoading: rfqLoading } = useQuery({
    queryKey: ['rfq', rfqId],
    queryFn: () => getRFQ(rfqId).then(r => r.data)
  });

  // Fetch Quotations for this RFQ
  const { data: quotations = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['rfqQuotations', rfqId],
    queryFn: () => getQuotations({ rfqId }).then(r => r.data)
  });

  const selectMutation = useMutation({
    mutationFn: (id) => selectQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqQuotations', rfqId] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation selected successfully! Approval workflow initiated.');
      navigate('/quotations');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error selecting quotation');
    }
  });

  const handleSelectConfirm = () => {
    if (selectedQuote) {
      selectMutation.mutate(selectedQuote._id);
    }
  };

  if (rfqLoading || quotesLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton type="card" />
        <Skeleton type="table" rows={4} />
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-lg font-bold text-slate-800">No Quotations Found</h3>
        <p className="text-sm text-slate-500 mt-2">There are no bids submitted for this RFQ yet to compare.</p>
        <Link to={`/rfqs/${rfqId}`} className="btn-teal inline-block mt-4">Back to RFQ Detail</Link>
      </div>
    );
  }

  // Find lowest price
  const lowestPrice = Math.min(...quotations.map(q => q.grandTotal));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2.5 text-sm font-medium text-slate-500">
        <Link to="/rfqs" className="hover:text-teal-600 transition-colors">RFQs</Link>
        <span>/</span>
        <Link to={`/rfqs/${rfqId}`} className="hover:text-teal-600 transition-colors">{rfq?.title}</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Compare Bids</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="page-header text-3xl">Bid Evaluation Comparison</h1>
        <p className="page-subtitle">Evaluate side-by-side vendor quotation prices, timelines, and payment terms.</p>
      </div>

      {/* Side by Side Comparison Grid */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4.5 min-w-[200px]">Criteria / Parameter</th>
                {quotations.map((q) => (
                  <th key={q._id} className="px-6 py-4.5 border-l border-slate-100 min-w-[220px]">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400">Bidder Profile</span>
                      <p className="text-sm font-bold text-slate-800 truncate">{q.vendor?.name}</p>
                      <div className="flex items-center text-amber-500 pt-0.5">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-[10px] font-bold text-slate-500 ml-1">{q.vendor?.rating || 0}/5 Rating</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
              {/* Grand Total Row */}
              <tr className="hover:bg-slate-50/20">
                <td className="px-6 py-4.5 text-slate-500 font-semibold">Grand Total (Incl. Tax)</td>
                {quotations.map((q) => {
                  const isLowest = q.grandTotal === lowestPrice;
                  return (
                    <td 
                      key={q._id} 
                      className={`px-6 py-4.5 border-l border-slate-100 font-bold ${
                        isLowest ? 'bg-emerald-50/40 text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>₹{q.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        {isLowest && (
                          <span className="text-[9px] uppercase tracking-wider font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                            Lowest Cost
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Subtotal Row */}
              <tr className="hover:bg-slate-50/20">
                <td className="px-6 py-4.5 text-slate-500">Subtotal</td>
                {quotations.map((q) => (
                  <td key={q._id} className="px-6 py-4.5 border-l border-slate-100 text-slate-600">
                    ₹{q.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>

              {/* GST Percent */}
              <tr className="hover:bg-slate-50/20">
                <td className="px-6 py-4.5 text-slate-500">Tax GST %</td>
                {quotations.map((q) => (
                  <td key={q._id} className="px-6 py-4.5 border-l border-slate-100 text-slate-600">
                    {q.gstPercent}% (₹{q.gstAmount.toLocaleString()})
                  </td>
                ))}
              </tr>

              {/* Delivery timeline */}
              <tr className="hover:bg-slate-50/20">
                <td className="px-6 py-4.5 text-slate-500">Delivery Days</td>
                {quotations.map((q) => (
                  <td key={q._id} className="px-6 py-4.5 border-l border-slate-100 text-slate-600">
                    {q.deliveryDays} Days
                  </td>
                ))}
              </tr>

              {/* Payment Terms */}
              <tr className="hover:bg-slate-50/20">
                <td className="px-6 py-4.5 text-slate-500">Payment Terms</td>
                {quotations.map((q) => (
                  <td key={q._id} className="px-6 py-4.5 border-l border-slate-100 text-slate-600">
                    {q.paymentTerms || '-'}
                  </td>
                ))}
              </tr>

              {/* Bid status */}
              <tr className="hover:bg-slate-50/20">
                <td className="px-6 py-4.5 text-slate-500">Bid Status</td>
                {quotations.map((q) => (
                  <td key={q._id} className="px-6 py-4.5 border-l border-slate-100">
                    <Badge status={q.status} />
                  </td>
                ))}
              </tr>

              {/* Select Actions Row */}
              <tr className="bg-slate-50/10">
                <td className="px-6 py-5.5 text-slate-400 text-xs">Evaluate Decision</td>
                {quotations.map((q) => (
                  <td key={q._id} className="px-6 py-5.5 border-l border-slate-100">
                    {q.status === 'submitted' ? (
                      <button 
                        onClick={() => { setSelectedQuote(q); setConfirmSelectOpen(true); }}
                        className="w-full btn-teal py-1.5 px-3.5 text-xs text-center"
                      >
                        Select & Initiate Approval
                      </button>
                    ) : q.status === 'selected' ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 block text-center">
                        Selected & Initiated
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg block text-center">
                        Non-actionable ({q.status})
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Compare Line Items details */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-navy-900">Line Item Detail Comparison</h3>
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-card p-6">
          <p className="text-xs text-slate-400 mb-4">Detailed pricing configurations per requested item:</p>
          <div className="space-y-6">
            {rfq?.lineItems.map((item, idx) => (
              <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                <h4 className="text-sm font-bold text-slate-800 mb-3">{item.itemName} <span className="font-normal text-slate-500">(Qty: {item.quantity} {item.unit})</span></h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {quotations.map((q) => {
                    const line = q.lineItems.find(li => li.rfqLineItemIndex === idx || li.itemName === item.itemName);
                    return (
                      <div key={q._id} className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{q.vendor?.name}</span>
                        <div className="flex justify-between text-xs pt-1">
                          <span className="text-slate-500">Unit Price:</span>
                          <span className="font-semibold text-slate-800">₹{line?.unitPrice || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-slate-50 pt-1">
                          <span className="text-slate-500">Item Total:</span>
                          <span className="font-bold text-teal-600">₹{line?.total || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selection Confirmation */}
      <ConfirmDialog
        isOpen={confirmSelectOpen}
        onClose={() => setConfirmSelectOpen(false)}
        onConfirm={handleSelectConfirm}
        title="Select Bid Vendor"
        message={`Are you sure you want to select the quotation from ${selectedQuote?.vendor?.name} for ₹${selectedQuote?.grandTotal.toLocaleString()}? This will launch the manager approval chain.`}
        type="teal"
        confirmLabel="Confirm Selection"
      />
    </div>
  );
};

export default QuotationComparisonPage;
