import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead, markAllRead } from '../api/notifications.js';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.read) {
      try {
        await markNotificationRead(n._id);
        setNotifications(prev => prev.map(item => item._id === n._id ? { ...item, read: true } : item));
      } catch (err) {
        console.error(err);
      }
    }
    setIsOpen(false);

    // Navigate to appropriate page based on notification type
    if (n.type === 'rfq') {
      navigate(`/rfqs/${n.entityId}`);
    } else if (n.type === 'quotation') {
      navigate(`/quotations/${n.entityId}`);
    } else if (n.type === 'approval') {
      navigate(`/approvals/${n.entityId}`);
    } else if (n.type === 'po') {
      navigate(`/purchase-orders/${n.entityId}`);
    } else if (n.type === 'invoice') {
      navigate(`/invoices/${n.entityId}`);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'rfq':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        );
      case 'quotation':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.22.11a3.13 3.13 0 003.51-.318 3.13 3.13 0 00.75-3.133 3.14 3.14 0 00-2.01-2.406 3.14 3.14 0 01-2.01-2.405 3.13 3.13 0 01.75-3.133 3.13 3.13 0 013.5-.318l.22.11M3 5.25h18" />
            </svg>
          </div>
        );
      case 'approval':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'po':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H9.75M3 16.25V5.625c0-.621.504-1.125 1.125-1.125h15.75c.621 0 1.125.504 1.125 1.125v10.625c0 .621-.504 1.125-1.125 1.125H4.125C3.504 17.375 3 16.871 3 16.25z" />
            </svg>
          </div>
        );
      case 'invoice':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5M4.5 9h15M5.25 13.5h13.5" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.04 9.04 0 01-5.137 0M9 15.75h6M12 5.25v10.5m-3-10.5h6" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200 active:scale-95"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.04 9.04 0 01-5.137 0M9 15.75h6M12 5.25v10.5m-3-10.5h6m-1.5-1.5H18M6.75 15.75h10.5a1.5 1.5 0 001.5-1.5v-6a6 6 0 00-12 0v6a1.5 1.5 0 001.5 1.5z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
            <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-slate-400">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-start space-x-3.5 px-5 py-3.5 hover:bg-slate-50/50 cursor-pointer transition-colors ${
                    !n.read ? 'bg-slate-50/20' : ''
                  }`}
                >
                  {getTypeIcon(n.type)}
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${!n.read ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <button
                          onClick={(e) => handleMarkRead(n._id, e)}
                          className="w-2 h-2 bg-teal-500 rounded-full hover:scale-125 transition-transform"
                          title="Mark as read"
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">{n.message}</p>
                    <span className="text-[9px] text-slate-400 block pt-0.5">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
