import Skeleton from './Skeleton.jsx';
import EmptyState from './EmptyState.jsx';

const DataTable = ({
  columns,
  data = [],
  isLoading = false,
  emptyMessage = "No records found",
  emptyCTA,
  onRowClick,
}) => {
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton type="table" rows={5} />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card p-12 text-center">
        <EmptyState message={emptyMessage} cta={emptyCTA} />
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIdx) => (
              <tr
                key={row._id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`hover:bg-slate-50/80 transition-colors duration-150 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col, colIdx) => {
                  const value = col.accessor
                    ? typeof col.accessor === "function"
                      ? col.accessor(row)
                      : row[col.accessor]
                    : null;
                  return (
                    <td
                      key={colIdx}
                      className={`px-6 py-4.5 text-sm text-slate-700 font-medium ${col.className || ""}`}
                    >
                      {col.render ? col.render(row, value) : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
