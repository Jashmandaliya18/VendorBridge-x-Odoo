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

// Role constants for readability
const ADMIN_ONLY = ['admin'];
const ADMIN_OFFICER = ['admin', 'officer'];
const ADMIN_OFFICER_MANAGER = ['admin', 'officer', 'manager'];
const NON_VENDOR = ['admin', 'officer', 'manager'];
const ALL_ROLES = ['admin', 'officer', 'manager', 'vendor'];

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected layout */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Dashboard - all roles, but shows role-specific content */}
        <Route index element={<DashboardPage />} />

        {/* Vendors - admin, officer, manager can view; admin/officer can create */}
        <Route
          path="vendors"
          element={
            <ProtectedRoute allowedRoles={NON_VENDOR}>
              <VendorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="vendors/:id"
          element={
            <ProtectedRoute allowedRoles={NON_VENDOR}>
              <VendorDetailPage />
            </ProtectedRoute>
          }
        />

        {/* RFQs - all roles can view, officers/admins can create */}
        <Route path="rfqs" element={<RFQsPage />} />
        <Route
          path="rfqs/new"
          element={
            <ProtectedRoute allowedRoles={ADMIN_OFFICER}>
              <CreateRFQPage />
            </ProtectedRoute>
          }
        />
        <Route path="rfqs/:id" element={<RFQDetailPage />} />
        <Route
          path="rfqs/:id/compare"
          element={
            <ProtectedRoute allowedRoles={ADMIN_OFFICER_MANAGER}>
              <QuotationComparisonPage />
            </ProtectedRoute>
          }
        />

        {/* Quotations */}
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="quotations/:id" element={<QuotationDetailPage />} />
        <Route
          path="quotations/submit/:rfqId"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <SubmitQuotationPage />
            </ProtectedRoute>
          }
        />

        {/* Approvals - admin, officer, manager */}
        <Route
          path="approvals"
          element={
            <ProtectedRoute allowedRoles={NON_VENDOR}>
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="approvals/:id"
          element={
            <ProtectedRoute allowedRoles={NON_VENDOR}>
              <ApprovalDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Purchase Orders - all roles (vendor sees their own) */}
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="purchase-orders/:id" element={<PODetailPage />} />

        {/* Invoices - all roles (vendor sees their own) */}
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />

        {/* Reports - admin, officer, manager */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={NON_VENDOR}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Activity Logs - admin, officer, manager */}
        <Route
          path="activity"
          element={
            <ProtectedRoute allowedRoles={NON_VENDOR}>
              <ActivityLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all: redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
