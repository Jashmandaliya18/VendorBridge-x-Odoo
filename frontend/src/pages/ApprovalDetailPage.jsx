import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApproval, approveRequest, rejectRequest } from '../api/approvals.js';
import { createPO } from '../api/purchaseOrders.js';
import Badge from '../components/Badge.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';

const ApprovalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [remarks, setRemarks] = useState('');
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  const { data: approval, isLoading } = useQuery({
    queryKey: ['approval', id],
    queryFn: () => getApproval(id).then(r => r.data)
  });

  const approveMutation = useMutation({
    mutationFn: (remarksData) => approveRequest(id, remarksData),
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ['approval', id] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast.success('Request approved successfully!');
      
      const approvalData = response.data;
      // If workflow fully approved, automatically generate PO
      if (approvalData && approvalData.status === 'approved') {
        try {
          await createPO({ quotationId: approvalData.quotation?._id || approvalData.quotation });
          toast.success('Purchase Order generated automatically!');
        } catch (err) {
          // Silent catch in production
        }
      }
      navigate('/approvals');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error approving request');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (remarksData) => rejectRequest(id, remarksData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval', id] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast.success('Request rejected.');
      navigate('/approvals');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error rejecting request');
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

  if (!approval) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-card">
        <h3 className="text-lg font-bold text-slate-800">Approval Workflow Not Found</h3>
        <p className="text-sm text-slate-500 mt-2">The approval request you searched for does not exist.</p>
        <Link to="/approvals" className="btn-teal inline-block mt-4">Back to Approvals</Link>
      </div>
    );
  }

  // Check if current user is the pending approver in the levels
  const currentPendingLevel = approval.levels?.find(l => l.status === 'pending');
  const isCurrentApprover = currentPendingLevel && String(currentPendingLevel.approver?._id || currentPendingLevel.approver) === String(user?._id);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2.5 text-sm font-medium text-slate-500">
        <Link to="/approvals" className="hover:text-teal-600 transition-colors">Approvals</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate">Request detail</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Stepper & Decisions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stepper Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card space-y-6">
            <h3 className="text-base font-semibold text-navy-900 border-b border-slate-50 pb-3">Approval Chain Stepper</h3>
            
            <div className="space-y-6 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {approval.levels?.map((level, idx) => {
                const isApproved = level.status === 'approved';
                const isRejected = level.status === 'rejected';
                const isPending = level.status === 'pending';
                
                return (
                  <div key={idx} className="relative space-y-1">
                    {/* Circle Indicator */}
                    <span className={`absolute -left-[23.5px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                      isApproved 
                        ? 'border-emerald-500 bg-emerald-500' 
                        : isRejected 
                        ? 'border-red-500 bg-red-500' 
                        : isPending 
                        ? 'border-amber-400 bg-white animate-pulse' 
                        : 'border-slate-200'
                    }`} />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">
                        Level {level.level} — {level.approver?.firstName} {level.approver?.lastName}
                      </span>
                      <Badge status={level.status} size="sm" />
                    </div>
                    {level.remarks && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-normal italic">
                        "{level.remarks}"
                      </p>
                    )}
                    {level.actionedAt && (
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        Reviewed on {new Date(level.actionedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Decision Box */}
          {isCurrentApprover ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card space-y-4">
              <h3 className="text-base font-semibold text-navy-900">Your Approval Decision</h3>
              <p className="text-xs text-slate-400">Please provide remarks/notes for this bid evaluation:</p>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter approval or rejection remarks here..."
                rows={3}
                className="input-field resize-none"
              />
              <div className="flex justify-end space-x-3.5 pt-2">
                <button 
                  onClick={() => setConfirmRejectOpen(true)}
                  className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  Reject Request
                </button>
                <button 
                  onClick={() => setConfirmApproveOpen(true)}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm hover:shadow transition-colors"
                >
                  Approve Request
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4.5 rounded-2xl bg-slate-50 text-slate-500 text-xs font-semibold text-center border border-slate-100">
              {approval.status === 'pending'
                ? `Pending Level ${currentPendingLevel?.level} Review by ${currentPendingLevel?.approver?.firstName || 'Manager'}`
                : `Approval workflow has completed with status: ${approval.status.toUpperCase()}`}
            </div>
          )}
        </div>

        {/* Right Side: Quotation Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-card space-y-5">
            <h3 className="text-base font-semibold text-navy-900 border-b border-slate-50 pb-3">Quotation Bid</h3>
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Vendor Name</span>
              <p className="text-sm font-bold text-slate-800">{approval.quotation?.vendor?.name || 'Vendor Partner'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">RFQ Description</span>
              <p className="text-sm text-slate-600 truncate">{approval.rfq?.title}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Bid Delivery Days</span>
              <p className="text-sm font-bold text-slate-800">{approval.quotation?.deliveryDays || 0} Days</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Terms</span>
              <p className="text-sm font-semibold text-slate-600">{approval.quotation?.paymentTerms || 'Net 30'}</p>
            </div>

            <div className="flex justify-between items-center border-t border-slate-50 pt-4 font-black text-navy-900">
              <span>Grand Total</span>
              <span className="text-teal-600">₹{approval.quotation?.grandTotal?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmApproveOpen}
        onClose={() => setConfirmApproveOpen(false)}
        onConfirm={() => approveMutation.mutate(remarks)}
        title="Approve Request"
        message="Are you sure you want to approve this quotation request? This will push it to the next workflow level or finalize the PO."
        type="teal"
      />

      <ConfirmDialog
        isOpen={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        onConfirm={() => rejectMutation.mutate(remarks)}
        title="Reject Request"
        message="Are you sure you want to reject this quotation request? This will terminate the approval chain."
        type="danger"
      />
    </div>
  );
};

export default ApprovalDetailPage;
