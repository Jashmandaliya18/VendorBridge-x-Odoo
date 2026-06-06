import mongoose from 'mongoose';
import assert from 'assert';

// ============================================================
// VendorBridge x Odoo — Comprehensive Test Suite
// Tests all roles, workflows, and edge cases with hardcoded data
// ============================================================

process.env.PORT = '5001';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/vendorbridge_test';
process.env.JWT_SECRET = 'supersecretkeyforvendorbridgetestsuite';
process.env.JWT_EXPIRES_IN = '1d';

const BASE_URL = 'http://localhost:5001/api';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────
// HELPER: Make an authenticated API request
// ─────────────────────────────────────────────────────────────
async function apiRequest(endpoint, options = {}, token = '') {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers || {})
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`API Error [${res.status}] on ${endpoint}: ${data.message || JSON.stringify(data)}`);
  }
  return { status: res.status, data };
}

// ─────────────────────────────────────────────────────────────
// HELPER: Expect an API request to fail with a specific status
// ─────────────────────────────────────────────────────────────
async function expectFailure(endpoint, options = {}, token = '', expectedStatus = 403) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  assert.strictEqual(res.status, expectedStatus, `Expected HTTP ${expectedStatus} but got ${res.status} — ${JSON.stringify(data)}`);
  return { status: res.status, data };
}

// ─────────────────────────────────────────────────────────────
// TEST RUNNER
// ─────────────────────────────────────────────────────────────
async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║    VendorBridge x Odoo — Full System Test Suite          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ──────────────────────────────
  // SETUP: Fresh database
  // ──────────────────────────────
  try {
    console.log('📦 Setting up: Connecting to test database...');
    await mongoose.connect(process.env.MONGO_URI);
    await mongoose.connection.dropDatabase();
    console.log('✔  Test database cleared (clean slate).\n');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Failed to setup test database:', err.message);
    process.exit(1);
  }

  console.log('🚀 Starting backend server on port 5001...');
  await import('../server.js');
  await delay(2500);
  console.log('✔  Backend ready.\n');

  // ──────────────────────────────
  // TOKEN & ID STORAGE
  // ──────────────────────────────
  let adminToken = '';
  let officerToken = '';
  let managerToken = '';
  let vendorToken = '';

  let vendorId = '';           // Vendor company profile
  let secondVendorId = '';     // Second vendor for testing rejection
  let rfqId = '';
  let quotationId = '';
  let approvalId = '';
  let poId = '';
  let invoiceId = '';

  let passCount = 0;
  let failCount = 0;

  function pass(msg) {
    console.log(`  ✅ ${msg}`);
    passCount++;
  }

  function fail(msg, err) {
    console.error(`  ❌ ${msg}: ${err.message}`);
    failCount++;
  }

  // ════════════════════════════════════════════════════════════
  // SECTION 1: AUTHENTICATION
  // ════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SECTION 1: Authentication & Access Control');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // TC-1.1: Admin login
  try {
    const r = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@vendorbridge.test', password: 'AdminBridge@12345' })
    });
    adminToken = r.data.accessToken;
    assert.ok(adminToken, 'Admin token should be returned');
    assert.strictEqual(r.data.user.role, 'admin', 'Role should be admin');
    pass('TC-1.1: Admin can login with valid credentials');
  } catch (e) { fail('TC-1.1: Admin login', e); }

  // TC-1.2: Officer login
  try {
    const r = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'officer@vendorbridge.test', password: 'Password123!' })
    });
    officerToken = r.data.accessToken;
    assert.strictEqual(r.data.user.role, 'officer');
    pass('TC-1.2: Officer can login with valid credentials');
  } catch (e) { fail('TC-1.2: Officer login', e); }

  // TC-1.3: Manager login
  try {
    const r = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'manager@vendorbridge.test', password: 'Password123!' })
    });
    managerToken = r.data.accessToken;
    assert.strictEqual(r.data.user.role, 'manager');
    pass('TC-1.3: Manager can login with valid credentials');
  } catch (e) { fail('TC-1.3: Manager login', e); }

  // TC-1.4: Vendor login
  try {
    const r = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'vendor@vendorbridge.test', password: 'Password123!' })
    });
    vendorToken = r.data.accessToken;
    assert.strictEqual(r.data.user.role, 'vendor');
    pass('TC-1.4: Vendor user can login with valid credentials');
  } catch (e) { fail('TC-1.4: Vendor login', e); }

  // TC-1.5: Invalid credentials rejected
  try {
    await expectFailure('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@vendorbridge.test', password: 'WrongPassword!' })
    }, '', 401);
    pass('TC-1.5: Invalid credentials are properly rejected (401)');
  } catch (e) { fail('TC-1.5: Invalid credentials', e); }

  // TC-1.6: Protected route without token returns 401
  try {
    await expectFailure('/vendors', { method: 'GET' }, '', 401);
    pass('TC-1.6: Protected routes require authentication token (401)');
  } catch (e) { fail('TC-1.6: Auth required', e); }

  // ════════════════════════════════════════════════════════════
  // SECTION 2: VENDOR MANAGEMENT (Admin Approval Flow)
  // ════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SECTION 2: Vendor Management & Admin Approval');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // TC-2.1: Vendor user cannot create a vendor profile
  try {
    await expectFailure('/vendors', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hacker Vendor', email: 'hack@test.com' })
    }, vendorToken, 403);
    pass('TC-2.1: Vendor role CANNOT create vendor profiles (403 Forbidden)');
  } catch (e) { fail('TC-2.1: Vendor cannot create vendor', e); }

  // TC-2.2: Officer creates a vendor (status defaults to pending)
  try {
    const r = await apiRequest('/vendors', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Apex Electronics Ltd',
        category: 'Electronics & Hardware',
        gstNumber: '29ABCDE1234F1ZH',
        contactNumber: '+91 98765 43210',
        email: 'apex@vendor.test',
        address: '789 Industrial Area, Phase II, Bangalore, India'
      })
    }, officerToken);
    vendorId = r.data._id;
    assert.ok(vendorId, 'Vendor ID should be returned');
    assert.strictEqual(r.data.status, 'pending', 'New vendor status should be "pending"');
    assert.strictEqual(r.data.name, 'Apex Electronics Ltd');
    pass('TC-2.2: Officer creates vendor — status defaults to "pending"');
  } catch (e) { fail('TC-2.2: Create vendor', e); }

  // TC-2.3: Second vendor created (for rejection test)
  try {
    const r = await apiRequest('/vendors', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Shady Supplies Co',
        category: 'Generic',
        email: 'shady@bad.test',
        address: 'Unknown Location'
      })
    }, officerToken);
    secondVendorId = r.data._id;
    assert.strictEqual(r.data.status, 'pending');
    pass('TC-2.3: Second vendor created with "pending" status for rejection test');
  } catch (e) { fail('TC-2.3: Create second vendor', e); }

  // TC-2.4: Vendor user cannot access vendor list (role protection)
  try {
    await expectFailure('/vendors', { method: 'GET' }, vendorToken, 403);
    pass('TC-2.4: Vendor role CANNOT list vendors (403 Forbidden)');
  } catch (e) { fail('TC-2.4: Vendor cannot list vendors', e); }

  // TC-2.5: Manager can view vendor list
  try {
    const r = await apiRequest('/vendors', { method: 'GET' }, managerToken);
    assert.ok(Array.isArray(r.data), 'Response should be an array');
    assert.ok(r.data.length >= 2, 'At least 2 vendors should be listed');
    pass(`TC-2.5: Manager can view vendor list (${r.data.length} vendors found)`);
  } catch (e) { fail('TC-2.5: Manager views vendors', e); }

  // TC-2.6: Admin approves vendor (pending → active)
  try {
    const r = await apiRequest(`/vendors/${vendorId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' })
    }, adminToken);
    assert.strictEqual(r.data.status, 'active', 'Vendor status should be "active" after admin approval');
    pass('TC-2.6: Admin APPROVES vendor — status changes from "pending" to "active"');
  } catch (e) { fail('TC-2.6: Admin approves vendor', e); }

  // TC-2.7: Admin rejects second vendor (pending → blocked)
  try {
    const r = await apiRequest(`/vendors/${secondVendorId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'blocked' })
    }, adminToken);
    assert.strictEqual(r.data.status, 'blocked', 'Rejected vendor status should be "blocked"');
    pass('TC-2.7: Admin REJECTS vendor — status changes from "pending" to "blocked"');
  } catch (e) { fail('TC-2.7: Admin rejects vendor', e); }

  // TC-2.8: Officer CANNOT change vendor status (admin-only)
  try {
    await expectFailure(`/vendors/${vendorId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'blocked' })
    }, officerToken, 403);
    pass('TC-2.8: Officer CANNOT change vendor status (403 — admin only)');
  } catch (e) { fail('TC-2.8: Officer cannot change vendor status', e); }

  // TC-2.9: Invalid status is rejected
  try {
    await expectFailure(`/vendors/${vendorId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'invalid_status' })
    }, adminToken, 400);
    pass('TC-2.9: Invalid vendor status is rejected (400 Bad Request)');
  } catch (e) { fail('TC-2.9: Invalid status rejected', e); }

  // TC-2.10: Admin checks vendor stats
  try {
    const r = await apiRequest('/vendors/stats', { method: 'GET' }, adminToken);
    assert.strictEqual(r.data.active, 1, 'Should be 1 active vendor');
    assert.strictEqual(r.data.blocked, 1, 'Should be 1 blocked vendor');
    assert.strictEqual(r.data.pending, 0, 'Should be 0 pending vendors');
    assert.strictEqual(r.data.all, 2, 'Should be 2 total vendors');
    pass('TC-2.10: Vendor stats are accurate (1 active, 1 blocked, 0 pending, 2 total)');
  } catch (e) { fail('TC-2.10: Vendor stats', e); }

  // ════════════════════════════════════════════════════════════
  // SECTION 3: RFQ WORKFLOW
  // ════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SECTION 3: RFQ Creation & Publishing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const rfqDeadline = new Date();
  rfqDeadline.setDate(rfqDeadline.getDate() + 7);

  // TC-3.1: Vendor cannot create RFQs
  try {
    await expectFailure('/rfqs', {
      method: 'POST',
      body: JSON.stringify({ title: 'Unauthorized RFQ', deadline: rfqDeadline.toISOString() })
    }, vendorToken, 403);
    pass('TC-3.1: Vendor CANNOT create RFQs (403 Forbidden)');
  } catch (e) { fail('TC-3.1: Vendor cannot create RFQ', e); }

  // TC-3.2: Officer creates RFQ (defaults to draft)
  try {
    const r = await apiRequest('/rfqs', {
      method: 'POST',
      body: JSON.stringify({
        title: 'High-Performance Development Laptops 2026',
        category: 'IT Equipment',
        description: 'Procurement of high-performance laptops and monitors for the engineering team.',
        deadline: rfqDeadline.toISOString(),
        vendorIds: [vendorId],
        lineItems: [
          { itemName: 'MacBook Pro 16"', description: 'M3 Max, 36GB RAM, 1TB SSD', quantity: 5, unit: 'pcs' },
          { itemName: 'Dell UltraSharp 32" Monitor', description: '4K USB-C Monitor', quantity: 10, unit: 'pcs' }
        ]
      })
    }, officerToken);
    rfqId = r.data._id;
    assert.ok(rfqId, 'RFQ ID should be returned');
    assert.strictEqual(r.data.status, 'draft', 'New RFQ should default to "draft"');
    assert.strictEqual(r.data.title, 'High-Performance Development Laptops 2026');
    assert.strictEqual(r.data.lineItems.length, 2, 'Should have 2 line items');
    pass(`TC-3.2: Officer creates RFQ — status defaults to "draft" (ID: ${rfqId})`);
  } catch (e) { fail('TC-3.2: Create RFQ', e); }

  // TC-3.3: Draft RFQ can be updated
  try {
    const r = await apiRequest(`/rfqs/${rfqId}`, {
      method: 'PUT',
      body: JSON.stringify({ description: 'Updated: Procurement for Q2 engineering team expansion.' })
    }, officerToken);
    assert.ok(r.data.description.includes('Updated'), 'Description should be updated');
    pass('TC-3.3: Draft RFQ can be updated');
  } catch (e) { fail('TC-3.3: Update draft RFQ', e); }

  // TC-3.4: Vendor can view published RFQs (before publishing, list may be empty)
  try {
    const r = await apiRequest('/rfqs', { method: 'GET' }, vendorToken);
    assert.ok(Array.isArray(r.data));
    pass(`TC-3.4: Vendor can view RFQ list (currently ${r.data.length} published RFQs)`);
  } catch (e) { fail('TC-3.4: Vendor views RFQs', e); }

  // TC-3.5: Officer publishes RFQ
  try {
    const r = await apiRequest(`/rfqs/${rfqId}/publish`, { method: 'PATCH' }, officerToken);
    assert.strictEqual(r.data.status, 'published', 'RFQ status should be "published"');
    pass('TC-3.5: Officer PUBLISHES RFQ — status changes from "draft" to "published"');
  } catch (e) { fail('TC-3.5: Publish RFQ', e); }

  // TC-3.6: Published RFQ cannot be updated
  try {
    await expectFailure(`/rfqs/${rfqId}`, {
      method: 'PUT',
      body: JSON.stringify({ description: 'Should not update published RFQ' })
    }, officerToken, 400);
    pass('TC-3.6: Published RFQ CANNOT be updated (400 Bad Request)');
  } catch (e) { fail('TC-3.6: Published RFQ cannot be updated', e); }

  // ════════════════════════════════════════════════════════════
  // SECTION 4: QUOTATION SUBMISSION
  // ════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SECTION 4: Quotation Submission (Vendor Flow)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // TC-4.1: Vendor submits a draft quotation
  try {
    const r = await apiRequest('/quotations', {
      method: 'POST',
      body: JSON.stringify({
        rfq: rfqId,
        vendor: vendorId,
        gstPercent: 18,
        notes: 'Prices are valid for 30 days. Includes 3-year onsite warranty.',
        deliveryDays: 10,
        paymentTerms: 'Net 30 Days',
        lineItems: [
          { rfqLineItemIndex: 0, itemName: 'MacBook Pro 16"', quantity: 5, unit: 'pcs', unitPrice: 210000, total: 1050000 },
          { rfqLineItemIndex: 1, itemName: 'Dell UltraSharp 32" Monitor', quantity: 10, unit: 'pcs', unitPrice: 45000, total: 450000 }
        ]
      })
    }, vendorToken);
    quotationId = r.data._id;
    assert.ok(quotationId, 'Quotation ID should exist');
    assert.strictEqual(r.data.status, 'draft', 'Quotation should default to "draft"');
    assert.strictEqual(r.data.subtotal, 1500000, `Subtotal should be ₹15,00,000 (got ₹${r.data.subtotal})`);
    assert.strictEqual(r.data.gstAmount, 270000, `GST (18%) should be ₹2,70,000 (got ₹${r.data.gstAmount})`);
    assert.strictEqual(r.data.grandTotal, 1770000, `Grand Total should be ₹17,70,000 (got ₹${r.data.grandTotal})`);
    pass(`TC-4.1: Vendor creates draft quotation — Subtotal: ₹15L, GST: ₹2.7L, Total: ₹17.7L`);
  } catch (e) { fail('TC-4.1: Vendor creates quotation', e); }

  // TC-4.2: Vendor can view their own quotation
  try {
    const r = await apiRequest(`/quotations/${quotationId}`, { method: 'GET' }, vendorToken);
    assert.strictEqual(r.data._id, quotationId);
    pass('TC-4.2: Vendor can view their own quotation');
  } catch (e) { fail('TC-4.2: Vendor views quotation', e); }

  // TC-4.3: Vendor submits quotation
  try {
    const r = await apiRequest(`/quotations/${quotationId}/submit`, { method: 'PATCH' }, vendorToken);
    assert.strictEqual(r.data.status, 'submitted', 'Quotation status should be "submitted"');
    pass('TC-4.3: Vendor SUBMITS quotation — status changes to "submitted"');
  } catch (e) { fail('TC-4.3: Submit quotation', e); }

  // TC-4.4: Vendor cannot update submitted quotation (only drafts allowed)
  try {
    await expectFailure(`/quotations/${quotationId}`, {
      method: 'PUT',
      body: JSON.stringify({ notes: 'Trying to update submitted quotation' })
    }, vendorToken, 400);
    pass('TC-4.4: Vendor CANNOT update submitted quotation (400 — only drafts allowed)');
  } catch (e) { fail('TC-4.4: Cannot update submitted quotation', e); }

  // TC-4.5: Officer views all submitted quotations
  try {
    const r = await apiRequest('/quotations', { method: 'GET', query: 'status=submitted' }, officerToken);
    assert.ok(Array.isArray(r.data));
    pass(`TC-4.5: Officer can view all quotations (${r.data.length} total)`);
  } catch (e) { fail('TC-4.5: Officer views quotations', e); }

  // ════════════════════════════════════════════════════════════
  // SECTION 5: QUOTATION SELECTION & APPROVAL WORKFLOW
  // ════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SECTION 5: Quotation Selection & Multi-Level Approval');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // TC-5.1: Vendor cannot select quotations (officer/admin only)
  try {
    await expectFailure(`/quotations/${quotationId}/select`, { method: 'PATCH' }, vendorToken, 403);
    pass('TC-5.1: Vendor CANNOT select quotations (403 Forbidden)');
  } catch (e) { fail('TC-5.1: Vendor cannot select quotation', e); }

  // TC-5.2: Officer selects the quotation (triggers approval workflow)
  try {
    const r = await apiRequest(`/quotations/${quotationId}/select`, { method: 'PATCH' }, officerToken);
    assert.strictEqual(r.data.status, 'selected', 'Quotation status should be "selected"');
    pass('TC-5.2: Officer SELECTS quotation — approval workflow triggered');
  } catch (e) { fail('TC-5.2: Officer selects quotation', e); }

  // TC-5.3: Manager can see approvals assigned to them
  try {
    const r = await apiRequest('/approvals', { method: 'GET' }, managerToken);
    assert.ok(Array.isArray(r.data), 'Response should be array');
    const myApproval = r.data.find(a => a.quotation?._id === quotationId || a.quotation === quotationId);
    assert.ok(myApproval, 'An approval document should exist for the selected quotation');
    approvalId = myApproval._id;
    pass(`TC-5.3: Manager sees approval in queue (Approval ID: ${approvalId})`);
  } catch (e) { fail('TC-5.3: Manager sees approvals', e); }

  // TC-5.4: Manager cannot be approved by a vendor (role protection)
  try {
    await expectFailure(`/approvals/${approvalId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ remarks: 'Vendor trying to approve' })
    }, vendorToken, 403);
    pass('TC-5.4: Vendor CANNOT approve quotations (403 Forbidden)');
  } catch (e) { fail('TC-5.4: Vendor cannot approve', e); }

  // TC-5.5: Manager approves the quotation
  try {
    const r = await apiRequest(`/approvals/${approvalId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ remarks: 'Prices are competitive and align with Q2 budget. Proceeding.' })
    }, managerToken);
    assert.strictEqual(r.data.status, 'approved', 'Approval status should be "approved"');
    pass('TC-5.5: Manager APPROVES quotation — approval workflow complete!');
  } catch (e) { fail('TC-5.5: Manager approves quotation', e); }

  // TC-5.6: Verify RFQ is now closed after approval
  try {
    const r = await apiRequest(`/rfqs/${rfqId}`, { method: 'GET' }, officerToken);
    assert.strictEqual(r.data.status, 'closed', 'RFQ should be "closed" after quotation is fully approved');
    pass('TC-5.6: RFQ is automatically "closed" after quotation approval');
  } catch (e) { fail('TC-5.6: RFQ auto-closes after approval', e); }

  // ════════════════════════════════════════════════════════════
  // SECTION 6: PURCHASE ORDER GENERATION
  // ════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SECTION 6: Purchase Order Generation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // TC-6.1: Vendor cannot generate a PO
  try {
    await expectFailure('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({ quotationId, billTo: { name: 'Hack Inc' } })
    }, vendorToken, 403);
    pass('TC-6.1: Vendor CANNOT generate Purchase Orders (403 Forbidden)');
  } catch (e) { fail('TC-6.1: Vendor cannot create PO', e); }

  // TC-6.2: Officer generates PO from approved quotation
  try {
    const r = await apiRequest('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({
        quotationId,
        billTo: {
          name: 'VendorBridge Corp Ltd',
          address: '123 Corporate Tower, Tech Park, Bangalore, India',
          gstin: '29XYZAB5678C1Z9'
        }
      })
    }, officerToken);
    poId = r.data._id;
    assert.ok(poId, 'PO ID should be returned');
    assert.ok(r.data.poNumber, 'PO Number should be auto-generated');
    assert.strictEqual(r.data.status, 'pending_payment', 'PO status should be "pending_payment"');
    assert.strictEqual(r.data.grandTotal, 1770000, `PO Grand Total should match quotation (₹17,70,000)`);
    pass(`TC-6.2: Officer generates PO — PO No: ${r.data.poNumber}, Amount: ₹17,70,000`);
  } catch (e) { fail('TC-6.2: Generate PO', e); }

  // TC-6.3: PO can be fetched by ID
  try {
    const r = await apiRequest(`/purchase-orders/${poId}`, { method: 'GET' }, officerToken);
    assert.strictEqual(r.data._id, poId);
    assert.ok(r.data.vendor, 'PO should have vendor populated');
    pass('TC-6.3: PO can be fetched by ID with vendor details');
  } catch (e) { fail('TC-6.3: Fetch PO', e); }

  // ════════════════════════════════════════════════════════════
  // SECTION 7: INVOICE LIFECYCLE
  // ════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SECTION 7: Invoice Generation & Payment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const invoiceDueDate = new Date();
  invoiceDueDate.setDate(invoiceDueDate.getDate() + 30);

  // TC-7.1: Generate invoice from PO
  try {
    const r = await apiRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify({ purchaseOrderId: poId, dueDate: invoiceDueDate.toISOString() })
    }, officerToken);
    invoiceId = r.data._id;
    assert.ok(invoiceId, 'Invoice ID should be returned');
    assert.ok(r.data.invoiceNumber, 'Invoice Number should be auto-generated');
    assert.strictEqual(r.data.status, 'pending', 'Invoice status should default to "pending"');
    assert.strictEqual(r.data.grandTotal, 1770000, 'Invoice total should match PO amount (₹17,70,000)');
    pass(`TC-7.1: Invoice generated — Invoice No: ${r.data.invoiceNumber}, Due: ${invoiceDueDate.toLocaleDateString()}`);
  } catch (e) { fail('TC-7.1: Generate invoice', e); }

  // TC-7.2: Mark invoice as paid
  try {
    const r = await apiRequest(`/invoices/${invoiceId}/mark-paid`, { method: 'PATCH' }, officerToken);
    assert.strictEqual(r.data.status, 'paid', 'Invoice status should be "paid"');
    pass('TC-7.2: Invoice marked as PAID — procurement flow complete!');
  } catch (e) { fail('TC-7.2: Mark invoice paid', e); }

  // TC-7.3: Cannot re-pay an already-paid invoice
  try {
    await expectFailure(`/invoices/${invoiceId}/mark-paid`, { method: 'PATCH' }, officerToken, 400);
    pass('TC-7.3: Already-paid invoice cannot be paid again (400 Bad Request)');
  } catch (e) { fail('TC-7.3: Re-pay prevention', e); }

  // ════════════════════════════════════════════════════════════
  // SECTION 8: ROLE-BASED DASHBOARD CONTENT
  // ════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SECTION 8: Role-Based Dashboard Content');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // TC-8.1: Admin dashboard has vendor stats
  try {
    const r = await apiRequest('/dashboard', { method: 'GET' }, adminToken);
    assert.strictEqual(r.data.role, 'admin', 'Dashboard role should be admin');
    const hasPendingVendors = r.data.cards.some(c => c.title === 'Pending Vendors');
    const hasActiveVendors = r.data.cards.some(c => c.title === 'Active Vendors');
    assert.ok(hasPendingVendors, 'Admin dashboard should have "Pending Vendors" card');
    assert.ok(hasActiveVendors, 'Admin dashboard should have "Active Vendors" card');
    assert.ok(Array.isArray(r.data.pendingVendorsList), 'Admin should receive pending vendors list');
    pass('TC-8.1: Admin dashboard shows Pending Vendors + Active Vendors cards');
  } catch (e) { fail('TC-8.1: Admin dashboard', e); }

  // TC-8.2: Officer dashboard has procurement stats
  try {
    const r = await apiRequest('/dashboard', { method: 'GET' }, officerToken);
    assert.strictEqual(r.data.role, 'officer');
    const hasActiveRFQs = r.data.cards.some(c => c.title === 'Active RFQs');
    const hasDraftRFQs = r.data.cards.some(c => c.title === 'My Draft RFQs');
    assert.ok(hasActiveRFQs, 'Officer dashboard should have Active RFQs card');
    assert.ok(hasDraftRFQs, 'Officer dashboard should have My Draft RFQs card');
    pass('TC-8.2: Officer dashboard shows Active RFQs + Draft RFQs cards');
  } catch (e) { fail('TC-8.2: Officer dashboard', e); }

  // TC-8.3: Manager dashboard shows approval queue
  try {
    const r = await apiRequest('/dashboard', { method: 'GET' }, managerToken);
    assert.strictEqual(r.data.role, 'manager');
    const hasPendingApprovals = r.data.cards.some(c => c.title === 'Pending Approvals');
    assert.ok(hasPendingApprovals, 'Manager dashboard should have Pending Approvals card');
    pass('TC-8.3: Manager dashboard shows Pending Approvals card');
  } catch (e) { fail('TC-8.3: Manager dashboard', e); }

  // TC-8.4: Vendor dashboard shows only their own data
  try {
    const r = await apiRequest('/dashboard', { method: 'GET' }, vendorToken);
    assert.strictEqual(r.data.role, 'vendor');
    const hasMyQuotations = r.data.cards.some(c => c.title === 'My Quotations');
    const hasNoVendorCards = !r.data.cards.some(c => c.title === 'Pending Vendors' || c.title === 'Active Vendors');
    assert.ok(hasMyQuotations, 'Vendor dashboard should show "My Quotations" card');
    assert.ok(hasNoVendorCards, 'Vendor dashboard should NOT show vendor management cards');
    assert.ok(Array.isArray(r.data.pendingVendorsList) && r.data.pendingVendorsList.length === 0, 'Vendor should NOT receive pending vendor list');
    pass('TC-8.4: Vendor dashboard shows only their own quotations — no admin cards');
  } catch (e) { fail('TC-8.4: Vendor dashboard isolation', e); }

  // ════════════════════════════════════════════════════════════
  // SECTION 9: ACTIVITY LOGS & NOTIFICATIONS
  // ════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SECTION 9: Activity Logs & Notifications');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // TC-9.1: Admin can view activity logs
  try {
    const r = await apiRequest('/activity', { method: 'GET' }, adminToken);
    assert.ok(Array.isArray(r.data), 'Activity logs should be an array');
    assert.ok(r.data.length > 0, 'Should have activity logs recorded');
    const hasVendorActivity = r.data.some(a => a.eventType === 'vendor');
    assert.ok(hasVendorActivity, 'Should have vendor-related activity entries');
    pass(`TC-9.1: Activity logs recorded (${r.data.length} entries, vendor actions logged)`);
  } catch (e) { fail('TC-9.1: Activity logs', e); }

  // TC-9.2: Admin has notifications for pending vendor approval
  try {
    const r = await apiRequest('/notifications', { method: 'GET' }, adminToken);
    assert.ok(Array.isArray(r.data), 'Notifications should be an array');
    pass(`TC-9.2: Admin received ${r.data.length} notifications`);
  } catch (e) { fail('TC-9.2: Admin notifications', e); }

  // TC-9.3: Vendor notifications (approval updates)
  try {
    const r = await apiRequest('/notifications', { method: 'GET' }, vendorToken);
    assert.ok(Array.isArray(r.data), 'Notifications should be an array');
    pass(`TC-9.3: Vendor received ${r.data.length} notifications (approval status updates)`);
  } catch (e) { fail('TC-9.3: Vendor notifications', e); }

  // ════════════════════════════════════════════════════════════
  // FINAL RESULTS SUMMARY
  // ════════════════════════════════════════════════════════════
  const totalTests = passCount + failCount;
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(`║              TEST RESULTS SUMMARY                        ║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Total Tests  : ${String(totalTests).padEnd(38)} ║`);
  console.log(`║  ✅ Passed    : ${String(passCount).padEnd(38)} ║`);
  console.log(`║  ❌ Failed    : ${String(failCount).padEnd(38)} ║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  if (failCount > 0) {
    console.error(`⚠️  ${failCount} test(s) failed. Please review the errors above.`);
    process.exit(1);
  } else {
    console.log('🎉 All tests PASSED! The VendorBridge system is fully operational.');
    process.exit(0);
  }
}

runTests();
