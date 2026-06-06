import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createRFQ, addRFQVendors } from '../api/rfqs.js';
import { getVendors } from '../api/vendors.js';
import { toast } from 'react-toastify';
import api from '../api/client.js';

const CreateRFQPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [attachments, setAttachments] = useState([]);
  
  // RFQ Form State
  const [form, setForm] = useState({
    title: '',
    category: '',
    deadline: '',
    description: '',
  });

  // Line items state
  const [lineItems, setLineItems] = useState([
    { itemName: '', description: '', quantity: 1, unit: 'units' }
  ]);

  // Selected vendors state
  const [selectedVendors, setSelectedVendors] = useState([]);

  // Fetch active vendors
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', 'active'],
    queryFn: () => getVendors({ status: 'active' }).then(r => r.data)
  });

  const rfqMutation = useMutation({
    mutationFn: async ({ rfqData, isPublish }) => {
      // 1. Create RFQ
      const { data: newRfq } = await createRFQ({
        ...rfqData,
        lineItems,
        status: 'draft' // initially save as draft
      });

      // 2. Add assigned vendors
      if (selectedVendors.length > 0) {
        await addRFQVendors(newRfq._id, { vendorIds: selectedVendors });
      }

      // 3. Upload attachments if any
      if (attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          await api.post(`/api/rfqs/${newRfq._id}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      // 4. Publish if publish button clicked
      if (isPublish) {
        await api.patch(`/api/rfqs/${newRfq._id}/publish`);
      }

      return newRfq;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast.success(variables.isPublish ? 'RFQ published successfully' : 'RFQ draft saved successfully');
      navigate('/rfqs');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error creating RFQ');
    }
  });

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLineItemChange = (idx, field, value) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return { ...item, [field]: value };
    }));
  };

  const addLineItem = () => {
    setLineItems(prev => [...prev, { itemName: '', description: '', quantity: 1, unit: 'units' }]);
  };

  const removeLineItem = (idx) => {
    if (lineItems.length === 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleVendorToggle = (vendorId) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId) 
        : [...prev, vendorId]
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = (isPublish) => {
    // Basic validation
    if (!form.title || !form.deadline) {
      toast.error('Title and Deadline are required fields');
      setStep(1);
      return;
    }
    const emptyItems = lineItems.filter(item => !item.itemName || !item.quantity || !item.unit);
    if (emptyItems.length > 0) {
      toast.error('Please complete all line item fields');
      setStep(2);
      return;
    }
    if (isPublish && selectedVendors.length === 0) {
      toast.error('Please assign at least one vendor to publish');
      setStep(3);
      return;
    }

    rfqMutation.mutate({ rfqData: form, isPublish });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2.5 text-sm font-medium text-slate-500">
        <Link to="/rfqs" className="hover:text-teal-600 transition-colors">RFQs</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">New RFQ</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="page-header text-3xl">Create RFQ</h1>
        <p className="page-subtitle">Configure bids, line items, and distribute to vendor partners.</p>
      </div>

      {/* Stepper Progress */}
      <div className="relative flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-100 -translate-y-1/2 z-0 hidden sm:block" />
        <div 
          className="absolute top-1/2 left-8 h-0.5 bg-teal-500 -translate-y-1/2 z-0 hidden sm:block transition-all duration-300"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
        
        {/* Step 1 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
            step >= 1 ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            1
          </div>
          <span className="text-xs font-semibold mt-2 text-slate-600">RFQ Details</span>
        </div>

        {/* Step 2 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
            step >= 2 ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            2
          </div>
          <span className="text-xs font-semibold mt-2 text-slate-600">Line Items</span>
        </div>

        {/* Step 3 */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300 ${
            step >= 3 ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            3
          </div>
          <span className="text-xs font-semibold mt-2 text-slate-600">Vendors & Files</span>
        </div>
      </div>

      {/* Step Contents */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card">
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-base font-semibold text-navy-900 border-b border-slate-50 pb-3">Step 1 — RFQ Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label-text">RFQ Title *</label>
                <input name="title" value={form.title} onChange={handleTextChange} placeholder="e.g. Annual IT Office Supplies Purchase" required className="input-field" />
              </div>
              <div>
                <label className="label-text">Bid Deadline *</label>
                <input name="deadline" type="date" value={form.deadline} onChange={handleTextChange} required className="input-field" />
              </div>
            </div>
            <div>
              <label className="label-text">Product / Service Category</label>
              <input name="category" value={form.category} onChange={handleTextChange} placeholder="e.g. Office Supplies, Electronics" className="input-field" />
            </div>
            <div>
              <label className="label-text">Detailed Scope / Description</label>
              <textarea name="description" value={form.description} onChange={handleTextChange} rows={4} placeholder="Describe the specifications, details, delivery conditions..." className="input-field resize-none" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="text-base font-semibold text-navy-900">Step 2 — Configure Line Items</h3>
              <button type="button" onClick={addLineItem} className="btn-teal py-1.5 px-3.5 text-xs flex items-center space-x-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                <span>Add Item</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {lineItems.map((item, idx) => (
                <div key={idx} className="p-4 border border-slate-100 rounded-xl bg-slate-50/40 relative space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Item #{idx + 1}</span>
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => removeLineItem(idx)} className="text-red-500 hover:text-red-600 text-xs font-semibold">
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-slate-600">Item Name *</label>
                      <input value={item.itemName} onChange={(e) => handleLineItemChange(idx, 'itemName', e.target.value)} required placeholder="e.g. Dell Latitude Laptop" className="input-field py-2 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Quantity *</label>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => handleLineItemChange(idx, 'quantity', parseInt(e.target.value) || 1)} required className="input-field py-2 mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600">Unit *</label>
                      <input value={item.unit} onChange={(e) => handleLineItemChange(idx, 'unit', e.target.value)} required placeholder="e.g. pcs, sets, kg" className="input-field py-2 mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Specifications / Special Requirements</label>
                    <input value={item.description} onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)} placeholder="e.g. Intel i7 16GB RAM, 512GB SSD" className="input-field py-2 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-semibold text-navy-900 border-b border-slate-50 pb-3">Step 3 — Assign Vendors & Upload Attachments</h3>
            
            {/* Vendor Checklist */}
            <div className="space-y-3">
              <label className="label-text">Select Active Vendors to Invite</label>
              {vendors.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  No active vendors found. Please create and verify vendors before publishing.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl">
                  {vendors.map(v => {
                    const isChecked = selectedVendors.includes(v._id);
                    return (
                      <div 
                        key={v._id} 
                        onClick={() => handleVendorToggle(v._id)}
                        className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                          isChecked 
                            ? 'border-teal-100 bg-teal-50/20 text-teal-700' 
                            : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {}} // toggling handled by parent div
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500/30"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{v.name}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{v.category || 'Vendor Partner'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* File upload */}
            <div className="space-y-3">
              <label className="label-text">Attach RFQ Documents (PDF, Excel, Images)</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-6 transition-colors duration-200 flex flex-col items-center justify-center cursor-pointer relative bg-slate-50/30">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <span className="text-xs font-bold text-slate-700">Click to upload files</span>
                <span className="text-[10px] text-slate-400 mt-1">Accepts multiple attachments up to 10MB</span>
              </div>

              {/* Uploaded attachments list */}
              {attachments.length > 0 && (
                <div className="space-y-2 pt-1">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl bg-slate-50/40 text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-semibold text-slate-700 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button type="button" onClick={() => removeAttachment(idx)} className="text-red-500 hover:text-red-600 font-bold">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
          <button 
            type="button" 
            onClick={() => setStep(prev => prev - 1)} 
            disabled={step === 1}
            className="btn-outline disabled:opacity-30 disabled:pointer-events-none"
          >
            Back
          </button>
          
          <div className="flex items-center space-x-3">
            {step < 3 ? (
              <button 
                type="button" 
                onClick={() => setStep(prev => prev + 1)} 
                className="btn-teal"
              >
                Continue
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  disabled={rfqMutation.isPending}
                  onClick={() => handleSave(false)} 
                  className="btn-outline"
                >
                  Save as Draft
                </button>
                <button 
                  type="button" 
                  disabled={rfqMutation.isPending}
                  onClick={() => handleSave(true)} 
                  className="btn-teal"
                >
                  {rfqMutation.isPending ? 'Saving...' : 'Save & Publish'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRFQPage;
