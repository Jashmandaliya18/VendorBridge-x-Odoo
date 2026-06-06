import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoice, markInvoicePaid } from '../api/invoices.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { toast } from 'react-toastify';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || '';
  
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', cc: '', body: '' });
  const [isEmailSending, setIsEmailSending] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id).then(r => {
      const inv = r.data;
      setEmailForm({
        to: inv.purchaseOrder?.createdBy?.email || inv.vendor?.email || '',
        cc: '',
        body: `<p>Hello,</p><p>Please find attached Invoice <strong>${inv.invoiceNumber}</strong> from VendorBridge.</p>`
      });
      return inv;
    })
  });

  const markPaidMutation = useMutation({
    mutationFn: () => markInvoicePaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice marked as Paid successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error marking invoice paid');
    }
  });

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      toast.success('PDF download started');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download PDF');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsEmailSending(true);
    try {
      await api.post(`/api/invoices/${id}/email`, emailForm);
      toast.success('Invoice emailed successfully');
      setIsEmailModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setIsEmailSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton type="card" />
        <Skeleton type="table" rows={4} />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-lg font-bold text-slate-800">Invoice Not Found</h3>
        <p className="text-sm text-slate-500 mt-2">The invoice you requested does not exist.</p>
        <Link to="/invoices" className="btn-teal inline-block mt-4">Back to Invoices</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center space-x-2.5 text-sm font-medium text-slate-500">
          <Link to="/invoices" className="hover:text-teal-600 transition-colors">Invoices</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate">{invoice.invoiceNumber}</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <button onClick={handleDownloadPDF} className="btn-outline flex items-center space-x-1.5 py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span>PDF</span>
          </button>
          
          <button onClick={() => window.print()} className="btn-outline flex items-center space-x-1.5 py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Print</span>
          </button>

          <button onClick={() => setIsEmailModalOpen(true)} className="btn-outline flex items-center space-x-1.5 py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span>Email</span>
          </button>

          {['admin', 'officer'].includes(role) && invoice.status !== 'paid' && (
            <button onClick={() => markPaidMutation.mutate()} className="btn-teal py-2">
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      {/* Invoice Layout (The Printable Area) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-10 shadow-card space-y-8 print-area">
        {/* Invoice Top Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-8">
          <div className="space-y-2.5">
            <div className="inline-flex w-10 h-10 bg-teal-500 text-white rounded-xl items-center justify-center font-black text-xl">
              V
            </div>
            <h2 className="text-xl font-bold text-navy-900 leading-none">VendorBridge Corp</h2>
            <p className="text-xs text-slate-500 max-w-xs leading-normal">
              123 Procurement Way, Tech City, India<br />GSTIN: 29ABCDE1234F1ZH
            </p>
          </div>
          
          <div className="text-right space-y-2">
            <h1 className="text-2xl font-black text-navy-900 uppercase tracking-wide">Invoice Claim</h1>
            <p className="text-sm font-semibold text-slate-700">{invoice.invoiceNumber}</p>
            <div className="grid grid-cols-2 gap-x-4 pt-2 text-left sm:text-right">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Issue</span>
                <span className="text-xs font-semibold text-slate-700">{new Date(invoice.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Due Date</span>
                <span className="text-xs font-semibold text-slate-700">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</span>
              </div>
            </div>
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Invoice Status</span>
              <div className="inline-flex mt-0.5"><Badge status={invoice.status} /></div>
            </div>
          </div>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Bill To */}
          <div className="space-y-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/40">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Billed To Address</span>
            <h4 className="text-sm font-bold text-navy-900">VendorBridge Corp</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs">123 Procurement Way, Tech City, India</p>
            <span className="text-xs font-semibold text-slate-700 block">GSTIN: 29ABCDE1234F1ZH</span>
          </div>

          {/* Supplier Vendor Details */}
          <div className="space-y-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/40">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Billed From Partner</span>
            <h4 className="text-sm font-bold text-navy-900">{invoice.vendor?.name || invoice.vendorName}</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs">{invoice.vendor?.address || 'Supplier address unavailable'}</p>
            <span className="text-xs font-semibold text-slate-700 block">GSTIN: {invoice.vendor?.gstNumber || '-'}</span>
          </div>
        </div>

        {/* Line Items Details Table */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden pt-1 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3.5">Item Specifications</th>
                <th className="px-6 py-3.5">Quantity</th>
                <th className="px-6 py-3.5">Unit Price (₹)</th>
                <th className="px-6 py-3.5">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {invoice.lineItems && invoice.lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/20">
                  <td className="px-6 py-3.5 font-bold text-slate-800">{item.itemName}</td>
                  <td className="px-6 py-3.5">{item.quantity}</td>
                  <td className="px-6 py-3.5">₹{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-800">₹{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col items-end space-y-2 pt-4 border-t border-slate-50 text-xs">
          <div className="flex justify-between w-64 text-slate-500">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-700">₹{invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between w-64 text-slate-500">
            <span>GST Tax:</span>
            <span className="font-semibold text-slate-700">₹{invoice.gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between w-64 text-sm font-black border-t border-slate-100 pt-2.5 text-navy-900">
            <span>Grand Total:</span>
            <span className="text-teal-600">₹{invoice.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Email Modal Dialog */}
      <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title="Email Invoice" size="md">
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label className="label-text">To (Recipient Email) *</label>
            <input 
              type="email" 
              required
              value={emailForm.to}
              onChange={(e) => setEmailForm(p => ({ ...p, to: e.target.value }))}
              placeholder="recipient@example.com"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-text">CC Email</label>
            <input 
              type="email"
              value={emailForm.cc}
              onChange={(e) => setEmailForm(p => ({ ...p, cc: e.target.value }))}
              placeholder="cc@example.com"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-text">Email Message Body</label>
            <textarea 
              rows={4}
              value={emailForm.body}
              onChange={(e) => setEmailForm(p => ({ ...p, body: e.target.value }))}
              placeholder="Enter message details..."
              className="input-field resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsEmailModalOpen(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={isEmailSending} className="btn-teal">
              {isEmailSending ? 'Sending Invoice...' : 'Send Email'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvoiceDetailPage;
