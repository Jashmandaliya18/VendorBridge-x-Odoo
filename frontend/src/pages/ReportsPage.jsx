import { useQuery } from '@tanstack/react-query';
import { getSummary, getSpendingTrend, getVendorPerformance } from '../api/reports.js';
import StatsCard from '../components/StatsCard.jsx';
import DataTable from '../components/DataTable.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api/client.js';
import { toast } from 'react-toastify';

const COLORS = ['#0D9488', '#1E3A5F', '#5eead4', '#334e68', '#f59e0b', '#ef4444'];

const ReportsPage = () => {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['reportSummary'],
    queryFn: () => getSummary().then(r => r.data)
  });

  const { data: spendingTrendData = [], isLoading: trendLoading } = useQuery({
    queryKey: ['reportSpendingTrend'],
    queryFn: () => getSpendingTrend().then(r => r.data)
  });

  const { data: performance = [], isLoading: perfLoading } = useQuery({
    queryKey: ['reportVendorPerf'],
    queryFn: () => getVendorPerformance().then(r => r.data)
  });

  const handleExport = async (format) => {
    try {
      const response = await api.get(`/api/reports/export?format=${format}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: format === 'pdf' ? 'application/pdf' : 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `vendor_performance_report.${format}`;
      link.click();
      toast.success(`${format.toUpperCase()} export downloaded`);
    } catch (err) {
      toast.error('Failed to export report');
    }
  };

  const columns = [
    {
      header: 'Vendor Name',
      accessor: 'name',
    },
    {
      header: 'RFQs Assigned',
      accessor: 'rfqs',
    },
    {
      header: 'Win Rate (%)',
      accessor: (row) => `${row.winRate}%`,
    },
    {
      header: 'Average Rating',
      accessor: 'avgRating',
      render: (row) => (
        <div className="flex items-center text-amber-500">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs font-bold text-slate-600 ml-1">{row.avgRating || 0}/5</span>
        </div>
      )
    }
  ];

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedTrend = spendingTrendData.map((item) => ({
    month: `${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(-2)}`,
    amount: item.total,
  }));

  // Mock Category Spend for Pie Chart (often general category spend is built on RFQs or items)
  const categoryData = [
    { name: 'Office Equipment', value: 45000 },
    { name: 'IT Infrastructure', value: 120000 },
    { name: 'Facilities Supply', value: 25000 },
    { name: 'Corporate Logistics', value: 15000 }
  ];

  if (summaryLoading || trendLoading || perfLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-4">
          <Skeleton type="card" />
          <Skeleton type="card" />
          <Skeleton type="card" />
          <Skeleton type="card" />
        </div>
        <Skeleton type="table" rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header text-3xl">Reports & Analytics</h1>
          <p className="page-subtitle">Track organizational spending trends, categories, and vendor scorecards.</p>
        </div>
        
        <div className="flex items-center space-x-3.5 self-start sm:self-center">
          <button onClick={() => handleExport('csv')} className="btn-outline flex items-center space-x-1.5 py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Export CSV</span>
          </button>
          <button onClick={() => handleExport('pdf')} className="btn-teal flex items-center space-x-1.5 py-2 bg-navy-900 hover:bg-navy-800">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Card Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatsCard title="Total Spend" value={`₹${(summary?.totalSpend || 0).toLocaleString()}`} description="Cumulative invoice value paid" />
        <StatsCard title="Active Vendors" value={summary?.activeVendors || 0} description="Compliant & active partners" />
        <StatsCard title="PO Fulfillment" value={`${summary?.poFulfillment || 0}%`} description="Paid vs generated POs" />
        <StatsCard title="Overdue Invoices" value={summary?.overdueInvoices || 0} description="Invoices past due date" />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Spending Trends */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
          <h3 className="text-base font-semibold text-navy-900 mb-6">Aggregate Monthly Spend</h3>
          <div className="h-64 w-full">
            {formattedTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No spending data recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

        {/* Category-wise Spend */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between">
          <h3 className="text-base font-semibold text-navy-900 mb-4">Category-wise Spend</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-500 font-medium truncate">{entry.name}</span>
                </div>
                <span className="font-bold text-slate-700">₹{entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Scorecard */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-navy-900">Vendor Performance Scorecard</h3>
        <DataTable
          columns={columns}
          data={performance}
          emptyMessage="No vendor performance records found."
        />
      </div>
    </div>
  );
};

export default ReportsPage;
