import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import VendorsPage from './pages/VendorsPage.jsx';
import VendorDetailPage from './pages/VendorDetailPage.jsx';
import RFQsPage from './pages/RFQsPage.jsx';
import CreateRFQPage from './pages/CreateRFQPage.jsx';
import RFQDetailPage from './pages/RFQDetailPage.jsx';
import QuotationsPage from './pages/QuotationsPage.jsx';
import SubmitQuotationPage from './pages/SubmitQuotationPage.jsx';
import QuotationDetailPage from './pages/QuotationDetailPage.jsx';
import QuotationComparisonPage from './pages/QuotationComparisonPage.jsx';
import ApprovalsPage from './pages/ApprovalsPage.jsx';
import ApprovalDetailPage from './pages/ApprovalDetailPage.jsx';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage.jsx';
import PODetailPage from './pages/PODetailPage.jsx';
import InvoicesPage from './pages/InvoicesPage.jsx';
import InvoiceDetailPage from './pages/InvoiceDetailPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import ActivityLogsPage from './pages/ActivityLogsPage.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="vendors/:id" element={<VendorDetailPage />} />
        
        <Route path="rfqs" element={<RFQsPage />} />
        <Route path="rfqs/new" element={<CreateRFQPage />} />
        <Route path="rfqs/:id" element={<RFQDetailPage />} />
        <Route path="rfqs/:id/compare" element={<QuotationComparisonPage />} />
        
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="quotations/:id" element={<QuotationDetailPage />} />
        <Route path="quotations/submit/:rfqId" element={<SubmitQuotationPage />} />
        
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="approvals/:id" element={<ApprovalDetailPage />} />
        
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="purchase-orders/:id" element={<PODetailPage />} />
        
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        
        <Route path="reports" element={<ReportsPage />} />
        <Route path="activity" element={<ActivityLogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
