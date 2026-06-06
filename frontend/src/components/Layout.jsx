import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Layout = () => {
  const { user, logout } = useAuth();
  const role = user?.role || '';

  const navItems = [
    { to: '/', label: 'Dashboard' },
  ];

  if (['admin', 'officer'].includes(role)) {
    navItems.push(
      { to: '/vendors', label: 'Vendors' },
      { to: '/rfqs', label: 'RFQs' },
      { to: '/quotations', label: 'Quotations' },
    );
  } else if (role === 'manager') {
    navItems.push(
      { to: '/rfqs', label: 'RFQs' },
      { to: '/quotations', label: 'Quotations' },
    );
  } else if (role === 'vendor') {
    navItems.push({ to: '/quotations', label: 'My Quotations' });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="w-72 bg-white border-r border-slate-200 p-6">
          <div className="text-xl font-semibold mb-8">VendorBridge</div>
          <nav className="space-y-3 text-slate-700">
            {navItems.map((item) => (
              <Link key={item.to} className="block rounded-lg px-4 py-2 hover:bg-slate-100" to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{role}</div>
          </div>

          <button onClick={logout} className="mt-8 w-full rounded-lg bg-slate-900 px-4 py-2 text-white">Logout</button>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
