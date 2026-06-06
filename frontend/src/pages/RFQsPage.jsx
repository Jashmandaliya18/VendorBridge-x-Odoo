import { useQuery } from '@tanstack/react-query';
import { getRFQs } from '../api/rfqs.js';

const RFQsPage = () => {
  const { data: rfqs = [], isLoading } = useQuery({ queryKey: ['rfqs'], queryFn: () => getRFQs({}).then(r => r.data) });

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">RFQs</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-6 py-3">Title</th>
              <th className="text-left px-6 py-3">Description</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Created Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" className="px-6 py-3">Loading RFQs...</td></tr>
            ) : rfqs.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-3 text-center text-gray-500">No RFQs found</td></tr>
            ) : (
              rfqs.map(rfq => (
                <tr key={rfq._id} className="border-t hover:bg-slate-50">
                  <td className="px-6 py-3">{rfq.title}</td>
                  <td className="px-6 py-3">{rfq.description || '-'}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${rfq.status === 'published' ? 'bg-blue-100 text-blue-800' : rfq.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>{rfq.status}</span></td>
                  <td className="px-6 py-3">{new Date(rfq.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RFQsPage;
