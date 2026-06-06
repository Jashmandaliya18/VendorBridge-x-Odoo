import { useQuery } from '@tanstack/react-query';
import { getQuotations } from '../api/quotations.js';

const QuotationsPage = () => {
  const { data: quotations = [], isLoading } = useQuery({ queryKey: ['quotations'], queryFn: () => getQuotations({}).then(r => r.data) });

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Quotations</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-6 py-3">RFQ ID</th>
              <th className="text-left px-6 py-3">Vendor</th>
              <th className="text-left px-6 py-3">Subtotal</th>
              <th className="text-left px-6 py-3">Total</th>
              <th className="text-left px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" className="px-6 py-3">Loading quotations...</td></tr>
            ) : quotations.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-3 text-center text-gray-500">No quotations found</td></tr>
            ) : (
              quotations.map(q => (
                <tr key={q._id} className="border-t hover:bg-slate-50">
                  <td className="px-6 py-3">{q.rfq?._id || q.rfq || '-'}</td>
                  <td className="px-6 py-3">{q.vendor?.name || q.vendor || '-'}</td>
                  <td className="px-6 py-3">₹{q.subtotal?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-3">₹{q.grandTotal?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${q.status === 'submitted' ? 'bg-blue-100 text-blue-800' : q.status === 'selected' ? 'bg-green-100 text-green-800' : q.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{q.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationsPage;
