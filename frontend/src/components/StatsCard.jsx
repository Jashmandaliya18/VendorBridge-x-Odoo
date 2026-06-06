const StatsCard = ({ title, value, description, icon, trend }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start justify-between shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 animate-slide-up group">
      <div className="space-y-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors duration-200">
          {title}
        </span>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-navy-900 tracking-tight">
            {value}
          </span>
          {trend && (
            <span className={`text-xs font-semibold ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend.label}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          {description}
        </p>
      </div>
      
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100/50 shadow-sm group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-100/30 transition-all duration-300">
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
