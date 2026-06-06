import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'vendor' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      const { data } = await registerUser(formData);
      login(data.user, data.accessToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to register');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-semibold mb-6">Create your account</h1>
        {error && <div className="mb-4 rounded-lg bg-rose-100 px-4 py-3 text-rose-800">{error}</div>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" autoComplete="given-name" required className="rounded-xl border border-slate-300 px-4 py-3" />
            <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" autoComplete="family-name" required className="rounded-xl border border-slate-300 px-4 py-3" />
          </div>
          <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="Email" autoComplete="email" required className="rounded-xl border border-slate-300 px-4 py-3" />
          <input name="password" value={form.password} onChange={handleChange} type="password" placeholder="Password" autoComplete="new-password" required className="rounded-xl border border-slate-300 px-4 py-3" />
          <select name="role" value={form.role} onChange={handleChange} autoComplete="role" className="rounded-xl border border-slate-300 px-4 py-3">
            <option value="admin">Admin</option>
            <option value="officer">Procurement Officer</option>
            <option value="manager">Manager</option>
            <option value="vendor">Vendor</option>
          </select>
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-3 text-white">Register</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-slate-900 font-semibold">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
