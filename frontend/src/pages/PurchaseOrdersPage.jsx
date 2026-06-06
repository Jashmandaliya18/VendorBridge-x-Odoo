import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getPurchaseOrders } from '../api/purchaseOrders.js';
import DataTable from '../components/DataTable.jsx';
import Badge from '../components/Badge.jsx';

const PurchaseOrdersPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['purchaseOrders', statusFilter],
    queryFn: () => getPurchaseOrders({ status: statusFilter }).then(r => r.data)
  });

  const columns = [
    {
      header: 'PO Number',
      accessor: 'poNumber',
      render: (row) => (
        <Link to={`/purchase-orders/${row._id}`} className="text-teal-600 font-semibold hover:text-teal-700">
          {row.poNumber}
        </Link>
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
      header: 'PO Date',
      accessor: (row) => new Date(row.poDate || row.createdAt).toLocaleDateString(),
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
        <h1 className="page-header text-3xl">Purchase Orders (POs)</h1>
        <p className="page-subtitle">Oversee generated purchase orders, payment status, and dispatch schedules.</p>
      </div>

      {/* Toolbar Status Filters */}
      <div className="flex border-b border-slate-200 w-fit">
        <button 
          onClick={() => setStatusFilter('')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            statusFilter === '' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          All Orders
        </button>
        <button 
          onClick={() => setStatusFilter('pending_payment')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            statusFilter === 'pending_payment' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Pending Payment
        </button>
        <button 
          onClick={() => setStatusFilter('paid')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 ${
            statusFilter === 'paid' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Paid
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        emptyMessage="No purchase orders found matching current filters."
        onRowClick={(row) => navigate(`/purchase-orders/${row._id}`)}
      />
    </div>
  );
};

export default PurchaseOrdersPage;
