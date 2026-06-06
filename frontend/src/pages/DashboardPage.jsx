import { useEffect, useState } from 'react';
import { getDashboard } from '../api/dashboard.js';

const DashboardPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getDashboard().then((res) => setData(res.data)).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>
      {!data ? (
        <div className="text-slate-500">Loading dashboard...</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">Active RFQs<div className="mt-2 text-3xl font-semibold">{data.activeRFQs}</div></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">Pending Approvals<div className="mt-2 text-3xl font-semibold">{data.pendingApprovals}</div></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">POs This Month<div className="mt-2 text-3xl font-semibold">₹{data.posThisMonth}</div></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">Overdue Invoices<div className="mt-2 text-3xl font-semibold">{data.overdueInvoices}</div></div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
