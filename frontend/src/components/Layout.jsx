import { Outlet, Link, useNavigate } from 'react-router-dom';

const Layout = () => {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('vendorbridge_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="w-72 bg-white border-r border-slate-200 p-6">
          <div className="text-xl font-semibold mb-8">VendorBridge</div>
          <nav className="space-y-3 text-slate-700">
            <Link className="block rounded-lg px-4 py-2 hover:bg-slate-100" to="/">Dashboard</Link>
            <Link className="block rounded-lg px-4 py-2 hover:bg-slate-100" to="/vendors">Vendors</Link>
            <Link className="block rounded-lg px-4 py-2 hover:bg-slate-100" to="/rfqs">RFQs</Link>
            <Link className="block rounded-lg px-4 py-2 hover:bg-slate-100" to="/quotations">Quotations</Link>
          </nav>
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
