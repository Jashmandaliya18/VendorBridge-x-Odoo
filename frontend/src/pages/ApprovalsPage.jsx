import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getApprovals } from '../api/approvals.js';
import DataTable from '../components/DataTable.jsx';
import Badge from '../components/Badge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ApprovalsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || '';
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['approvals', selectedStatus],
    queryFn: () => getApprovals({ status: selectedStatus }).then(r => r.data)
  });

  const columns = [
    {
      header: 'RFQ Name',
      accessor: (row) => row.rfq?.title || 'RFQ Reference',
      render: (row) => (
        <Link to={`/approvals/${row._id}`} className="text-teal-600 font-semibold hover:text-teal-700">
          {row.rfq?.title || 'View Request'}
        </Link>
      )
    },
    {
      header: 'Vendor Name',
      accessor: (row) => row.quotation?.vendor?.name || 'Vendor Partner',
    },
    {
      header: 'Amount',
      accessor: (row) => `₹${row.quotation?.grandTotal?.toLocaleString() || 0}`,
    },
    {
      header: 'Workflow Level',
      accessor: (row) => {
        const currentLevel = row.levels?.find(l => l.status === 'pending');
        return currentLevel ? `Level ${currentLevel.level}` : 'Completed';
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} />
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="page-header text-3xl">Approvals</h1>
        <p className="page-subtitle">Review selected quotations and execute role-based L1/L2 approval actions.</p>
      </div>

      {/* Filters */}
      <div className="flex border-b border-slate-200 w-fit">
        <button 
          onClick={() => setSelectedStatus('')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            selectedStatus === '' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All Requests
        </button>
        <button 
          onClick={() => setSelectedStatus('pending')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            selectedStatus === 'pending' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending
        </button>
        <button 
          onClick={() => setSelectedStatus('approved')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            selectedStatus === 'approved' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Approved
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
        data={approvals}
        isLoading={isLoading}
        emptyMessage="No approvals found matching current filters."
        onRowClick={(row) => navigate(`/approvals/${row._id}`)}
      />
    </div>
  );
};

export default ApprovalsPage;
