import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivityLogs } from '../api/activity.js';
import Skeleton from '../components/Skeleton.jsx';

const ActivityLogsPage = () => {
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['activityLogs', eventType, page],
    queryFn: () => getActivityLogs({ eventType, page, limit: 15 }).then(r => r.data)
  });

  useEffect(() => {
    // Reset logs list when filter type changes
    setLogs([]);
    setPage(1);
  }, [eventType]);

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setLogs(data);
      } else {
        setLogs(prev => [...prev, ...data]);
      }
    }
  }, [data, page]);

  const getEventColor = (type) => {
    switch (type) {
      case 'rfq':
        return 'bg-blue-500 border-blue-200';
      case 'quotation':
        return 'bg-purple-500 border-purple-200';
      case 'approval':
        return 'bg-amber-500 border-amber-200';
      case 'po':
        return 'bg-emerald-500 border-emerald-200';
      case 'invoice':
        return 'bg-rose-500 border-rose-200';
      case 'vendor':
        return 'bg-teal-500 border-teal-200';
      default:
        return 'bg-slate-500 border-slate-200';
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'rfq':
        return (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'quotation':
        return (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'approval':
        return (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'po':
        return (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
          </svg>
        );
      case 'invoice':
        return (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'vendor':
        return (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7" />
          </svg>
        );
      default:
        return (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="page-header text-3xl">Activity Logs</h1>
        <p className="page-subtitle">Immutable write-once system audit logs for administrative tracking & compliance.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 w-full overflow-x-auto">
        {['', 'rfq', 'quotation', 'approval', 'po', 'invoice', 'vendor'].map((type) => (
          <button 
            key={type}
            onClick={() => setEventType(type)}
            className={`px-4.5 py-3.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all duration-200 whitespace-nowrap shrink-0 ${
              eventType === type ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {type === '' ? 'All Logs' : `${type}s`}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-card">
        {isLoading && page === 1 ? (
          <Skeleton type="text" rows={5} />
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            No system actions recorded.
          </div>
        ) : (
          <div className="space-y-8 relative pl-7 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {logs.map((log) => (
              <div key={log._id} className="relative space-y-1 group">
                {/* Visual Icon circle indicator */}
                <div className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${getEventColor(log.eventType)}`}>
                  {getEventIcon(log.eventType)}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">
                    {log.description}
                  </p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                    {log.eventType}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium">
                  {log.performedBy && (
                    <span>
                      User ID: {String(log.performedBy._id || log.performedBy).slice(-6).toUpperCase()}
                    </span>
                  )}
                  {log.performedBy && <span>•</span>}
                  <span>
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {data && data.length === 15 && (
          <div className="flex justify-center pt-8 border-t border-slate-50 mt-8">
            <button 
              onClick={() => setPage(p => p + 1)}
              className="btn-outline py-2.5 px-6 text-xs"
            >
              Load More Activities
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogsPage;
