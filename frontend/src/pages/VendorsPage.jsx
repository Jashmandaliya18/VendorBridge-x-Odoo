import { useQuery } from '@tanstack/react-query';
import { getVendors, getVendorStats } from '../api/vendors.js';

const VendorsPage = () => {
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({ queryKey: ['vendors'], queryFn: () => getVendors({}).then(r => r.data) });
  const { data: stats = {} } = useQuery({ queryKey: ['vendorStats'], queryFn: () => getVendorStats().then(r => r.data) });

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Vendors</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">All Vendors</div>
          <div className="text-2xl font-bold">{stats.all || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Active</div>
          <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Blocked</div>
          <div className="text-2xl font-bold text-red-600">{stats.blocked || 0}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-6 py-3">Name</th>
              <th className="text-left px-6 py-3">Email</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Category</th>
            </tr>
          </thead>
          <tbody>
            {vendorsLoading ? (
              <tr><td colSpan="4" className="px-6 py-3">Loading vendors...</td></tr>
            ) : vendors.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-3 text-center text-gray-500">No vendors found</td></tr>
            ) : (
              vendors.map(v => (
                <tr key={v._id} className="border-t hover:bg-slate-50">
                  <td className="px-6 py-3">{v.name}</td>
                  <td className="px-6 py-3">{v.email}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${v.status === 'active' ? 'bg-green-100 text-green-800' : v.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{v.status}</span></td>
                  <td className="px-6 py-3">{v.category || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorsPage;
