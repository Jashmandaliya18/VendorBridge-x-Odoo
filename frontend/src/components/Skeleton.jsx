const Skeleton = ({ type = 'text', rows = 3 }) => {
  if (type === 'table') {
    return (
      <div className="space-y-4 w-full">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-center space-x-4">
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-card">
        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
        <div className="h-8 bg-slate-200 rounded animate-pulse w-2/3" />
        <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-4 bg-slate-200 rounded animate-pulse w-full" />
      ))}
    </div>
  );
};

export default Skeleton;
