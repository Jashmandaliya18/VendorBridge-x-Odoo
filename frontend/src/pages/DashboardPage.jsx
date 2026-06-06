import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/dashboard.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatsCard from '../components/StatsCard.jsx';
import DataTable from '../components/DataTable.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Badge from '../components/Badge.jsx';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then((res) => {
        setData(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Unable to load dashboard data');
        setIsLoading(false);
      });
  }, []);

  const getActionIcon = (label) => {
    switch (label) {
      case 'Create RFQ':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'Manage Vendors':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'Review Quotations':
      case 'Manage My Quotations':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        );
    }
  };

  const getCardIcon = (title) => {
    switch (title) {
      case 'Active RFQs':
      case 'Published RFQs':
      case 'Open RFQs':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'Pending Approvals':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'POs This Month':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'Overdue Invoices':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const columns = [
    {
      header: 'PO Number',
      accessor: 'poNumber',
      render: (row) => (
        <Link to={`/purchase-orders/${row._id}`} className="text-teal-600 font-semibold hover:text-teal-700">
          {row.poNumber}
        </Link>
      ),
    },
    {
      header: 'Vendor Name',
      accessor: (row) => row.vendor?.name || row.vendorName,
    },
    {
      header: 'Grand Total',
      accessor: (row) => `₹${row.grandTotal.toLocaleString()}`,
    },
    {
      header: 'PO Date',
      accessor: (row) => new Date(row.poDate || row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} />,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          <Skeleton type="card" />
          <Skeleton type="card" />
          <Skeleton type="card" />
          <Skeleton type="card" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 h-80 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-80 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-rose-800 animate-fade-in">
        <h3 className="font-semibold text-lg">Error Loading Dashboard</h3>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const cards = data?.cards || [];
  const actions = data?.actions || [];
  const recentPOs = data?.recentPurchaseOrders || [];
  const spendingTrend = data?.spendingTrend || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-header text-3xl">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <span className="font-semibold text-slate-800">{user?.firstName} {user?.lastName}</span>. Here is your overview.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {cards.map((card) => (
          <StatsCard
            key={card.title}
            title={card.title}
            value={card.value}
            description={card.description}
            icon={getCardIcon(card.title)}
          />
        ))}
      </div>

      {/* Visual Analytics Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Spending Trend Area Chart */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-navy-900">Spending Trends</h3>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last 6 Months</span>
          </div>
          <div className="h-64 w-full">
            {spendingTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No spending data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#0D9488" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        {actions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-navy-900 mb-5">Quick Actions</h3>
              <div className="space-y-3">
                {actions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-teal-100 hover:bg-teal-50/20 text-slate-700 hover:text-teal-700 transition-all duration-200 group active:scale-[0.98]"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400 group-hover:text-teal-600 transition-colors">
                        {getActionIcon(action.label)}
                      </span>
                      <span className="text-sm font-semibold">{action.label}</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="text-[11px] text-slate-400 text-center pt-4 border-t border-slate-50 mt-4 leading-normal">
              VendorBridge Smart Procurement Workflows
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-navy-900">Recent Purchase Orders</h3>
          <Link to="/purchase-orders" className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors flex items-center space-x-1">
            <span>View All</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <DataTable
          columns={columns}
          data={recentPOs}
          emptyMessage="No recent purchase orders found."
          onRowClick={(row) => navigate(`/purchase-orders/${row._id}`)}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
