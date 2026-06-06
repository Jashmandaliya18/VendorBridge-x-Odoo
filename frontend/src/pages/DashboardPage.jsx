import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/dashboard.js';
import { useAuth } from '../context/AuthContext.jsx';

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load dashboard'));
  }, []);

  const cards = data?.cards || [];
  const actions = data?.actions || [];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-slate-500">Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Role: <span className="font-semibold text-slate-900">{user?.role}</span></p>
        </div>
      </div>

      {error && <div className="mt-6 rounded-xl bg-rose-100 px-4 py-3 text-rose-800">{error}</div>}

      {!data ? (
        <div className="mt-6 text-slate-500">Loading dashboard...</div>
      ) : (
        <>
          <div className="mt-6 grid gap-5 md:grid-cols-4">
            {cards.map((card) => (
              <div key={card.title} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="text-sm text-slate-500">{card.title}</div>
                <div className="mt-3 text-3xl font-semibold">{card.value}</div>
                {card.description && <div className="mt-3 text-sm text-slate-500">{card.description}</div>}
              </div>
            ))}
          </div>

          {actions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Quick actions</h2>
              <div className="flex flex-wrap gap-3">
                {actions.map((action) => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-sm hover:bg-slate-800"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;
