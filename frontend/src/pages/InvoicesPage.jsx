import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getInvoices } from '../api/invoices.js';
import DataTable from '../components/DataTable.jsx';
import Badge from '../components/Badge.jsx';

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: () => getInvoices({ status: statusFilter }).then(r => r.data)
  });

  const columns = [
    {
      header: 'Invoice Number',
      accessor: 'invoiceNumber',
      render: (row) => (
        <Link to={`/invoices/${row._id}`} className="text-teal-600 font-semibold hover:text-teal-700">
          {row.invoiceNumber}
        </Link>
      )
    },
    {
      header: 'PO Reference',
      accessor: (row) => row.purchaseOrder?.poNumber || '-',
      render: (row) => (
        <span className="font-semibold text-slate-700">
          {row.purchaseOrder?.poNumber || '-'}
        </span>
      )
    },
    {
      header: 'Vendor Partner',
      accessor: (row) => row.vendor?.name || row.vendorName || '-',
    },
    {
      header: 'Grand Total',
      accessor: (row) => `₹${row.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      header: 'Due Date',
      accessor: (row) => row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} />
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-header text-3xl">Invoices</h1>
        <p className="page-subtitle">Track billing submissions, vendor claims, and payment records.</p>
      </div>

      {/* Toolbar Status Filters */}
      <div className="flex border-b border-slate-200 w-fit">
        <button 
          onClick={() => setStatusFilter('')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            statusFilter === '' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All Invoices
        </button>
        <button 
          onClick={() => setStatusFilter('pending')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            statusFilter === 'pending' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending
        </button>
        <button 
          onClick={() => setStatusFilter('paid')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            statusFilter === 'paid' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Paid
        </button>
        <button 
          onClick={() => setStatusFilter('overdue')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            statusFilter === 'overdue' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Overdue
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        emptyMessage="No invoices found matching current filters."
        onRowClick={(row) => navigate(`/invoices/${row._id}`)}
      />
    </div>
  );
};

export default InvoicesPage;
