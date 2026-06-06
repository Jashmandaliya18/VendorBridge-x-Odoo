import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPO, updatePOStatus } from '../api/purchaseOrders.js';
import { createInvoice } from '../api/invoices.js';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { toast } from 'react-toastify';

const PODetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || '';
  
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', cc: '', body: '' });
  const [isEmailSending, setIsEmailSending] = useState(false);

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: () => getPO(id).then(r => {
      const p = r.data;
      setEmailForm({
        to: p.vendor?.email || '',
        cc: '',
        body: `<p>Hello Team,</p><p>Please find attached Purchase Order <strong>${p.poNumber}</strong> from VendorBridge.</p>`
      });
      return p;
    })
  });

  const markPaidMutation = useMutation({
    mutationFn: () => updatePOStatus(id, { status: 'paid' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast.success('Purchase Order marked as Paid');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: () => createInvoice({ purchaseOrderId: id, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice generated successfully from this PO!');
      navigate(`/invoices/${data.data._id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error generating invoice');
    }
  });

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/api/purchase-orders/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${po.poNumber}.pdf`;
      link.click();
      toast.success('PDF download started');
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsEmailSending(true);
    try {
      await api.post(`/api/purchase-orders/${id}/email`, emailForm);
      toast.success('PO emailed successfully to vendor');
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

  if (!po) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-lg font-bold text-slate-800">PO Not Found</h3>
        <p className="text-sm text-slate-500 mt-2">The Purchase Order you requested does not exist.</p>
        <Link to="/purchase-orders" className="btn-teal inline-block mt-4">Back to POs</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center space-x-2.5 text-sm font-medium text-slate-500">
          <Link to="/purchase-orders" className="hover:text-teal-600 transition-colors">Purchase Orders</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate">{po.poNumber}</span>
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

          {['admin', 'officer'].includes(role) && (
            <button onClick={() => setIsEmailModalOpen(true)} className="btn-outline flex items-center space-x-1.5 py-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span>Email</span>
            </button>
          )}

          {['admin', 'officer'].includes(role) && po.status === 'pending_payment' && (
            <button onClick={() => markPaidMutation.mutate()} className="btn-teal py-2">
              Mark as Paid
            </button>
          )}

          {role === 'vendor' && (
            <button 
              disabled={generateInvoiceMutation.isPending}
              onClick={() => generateInvoiceMutation.mutate()} 
              className="btn-teal py-2"
            >
              Generate Invoice
            </button>
          )}
        </div>
      </div>

      {/* Purchase Order Invoice Layout (The Printable Area) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-10 shadow-card space-y-8 print-area">
        {/* Invoice Top Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-8">
          <div className="space-y-2.5">
            <div className="inline-flex w-10 h-10 bg-navy-900 text-white rounded-xl items-center justify-center font-black text-xl">
              V
            </div>
            <h2 className="text-xl font-bold text-navy-900 leading-none">VendorBridge Corp</h2>
            <p className="text-xs text-slate-500 max-w-xs leading-normal">
              123 Procurement Way, Tech City, India<br />GSTIN: 29ABCDE1234F1ZH
            </p>
          </div>
          
          <div className="text-right space-y-2">
            <h1 className="text-2xl font-black text-navy-900 uppercase tracking-wide">Purchase Order</h1>
            <p className="text-sm font-semibold text-slate-700">{po.poNumber}</p>
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Issue</span>
              <span className="text-xs font-semibold text-slate-700">{new Date(po.poDate || po.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="pt-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
              <div className="inline-flex mt-0.5"><Badge status={po.status} /></div>
            </div>
          </div>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Bill To */}
          <div className="space-y-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/40">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Bill To Address</span>
            <h4 className="text-sm font-bold text-navy-900">{po.billTo?.name || 'VendorBridge Corp'}</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs">{po.billTo?.address || '123 Procurement Way, Tech City, India'}</p>
            <span className="text-xs font-semibold text-slate-700 block">GSTIN: {po.billTo?.gstin || '29ABCDE1234F1ZH'}</span>
          </div>

          {/* Supplier Vendor Details */}
          <div className="space-y-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/40">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Supplier Details</span>
            <h4 className="text-sm font-bold text-navy-900">{po.vendor?.name || po.vendorName}</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs">{po.vendor?.address || 'Supplier address unavailable'}</p>
            <span className="text-xs font-semibold text-slate-700 block">GSTIN: {po.vendor?.gstNumber || '-'}</span>
          </div>
        </div>

        {/* Line Items Details Table */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden pt-1 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3.5">Item Specifications</th>
                <th className="px-6 py-3.5">Quantity</th>
                <th className="px-6 py-3.5">Unit</th>
                <th className="px-6 py-3.5">Unit Price (₹)</th>
                <th className="px-6 py-3.5">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {po.lineItems && po.lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/20">
                  <td className="px-6 py-3.5 font-bold text-slate-800">{item.itemName}</td>
                  <td className="px-6 py-3.5">{item.quantity}</td>
                  <td className="px-6 py-3.5 text-slate-500">{item.unit}</td>
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
            <span className="font-semibold text-slate-700">₹{po.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between w-64 text-slate-500">
            <span>CGST (9.0%):</span>
            <span className="font-semibold text-slate-700">₹{po.cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between w-64 text-slate-500">
            <span>SGST (9.0%):</span>
            <span className="font-semibold text-slate-700">₹{po.sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between w-64 text-sm font-black border-t border-slate-100 pt-2.5 text-navy-900">
            <span>Grand Total:</span>
            <span className="text-teal-600">₹{po.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Email Modal Dialog */}
      <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title="Email Purchase Order" size="md">
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
              {isEmailSending ? 'Sending PO...' : 'Send Email'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PODetailPage;
