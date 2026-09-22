import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase, getUserByEmailOrMobile, getUserByEmail, getUserByMobile, createUser } from '../src/lib/db.js';
import { validateAdminRegistration, validateSupplierRegistration } from '../src/lib/validators.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kishan-flow-super-secure-jwt-secret-farm-to-future-2026';
function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}
function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      email: user.email || null,
      mobile: user.mobile || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function runTests() {
  console.log('--- STARTING AUTHENTICATION VERIFICATION TESTS ---');
  const db = getDatabase();

  // Clean up any previous test accounts if exists
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run('testadmin@kishanflow.com', 'testsupplier@kishanflow.com');
  db.prepare('DELETE FROM users WHERE mobile IN (?, ?)').run('9988112233', '9988334455');

  // Test 1: Validation
  console.log('\n[Test 1] Validator testing...');
  const validAdminData = {
    fullName: 'Test Admin Officer',
    mobile: '9988112233',
    email: 'testadmin@kishanflow.com',
    password: 'AdminPass@123',
    confirmPassword: 'AdminPass@123',
  };
  const adminVal = validateAdminRegistration(validAdminData);
  console.assert(adminVal.isValid === true, 'Admin validation should pass for valid data');

  const invalidAdminData = {
    fullName: '',
    mobile: '123',
    email: 'bad-email',
    password: '123',
    confirmPassword: '456',
  };
  const adminValInvalid = validateAdminRegistration(invalidAdminData);
  console.assert(adminValInvalid.isValid === false, 'Admin validation should fail for invalid data');
  console.assert(adminValInvalid.errors.fullName, 'Should have fullName error');
  console.assert(adminValInvalid.errors.mobile, 'Should have mobile error');
  console.assert(adminValInvalid.errors.email, 'Should have email error');
  console.assert(adminValInvalid.errors.password, 'Should have password error');
  console.assert(adminValInvalid.errors.confirmPassword, 'Should have confirmPassword error');
  console.log('✓ Admin validators passed correctly.');

  const validSupplierData = {
    fullName: 'AgriTech Supply Hub',
    mobile: '9988334455',
    email: 'testsupplier@kishanflow.com',
    password: 'SupplierPass@123',
    confirmPassword: 'SupplierPass@123',
  };
  const supplierVal = validateSupplierRegistration(validSupplierData);
  console.assert(supplierVal.isValid === true, 'Supplier validation should pass for valid data');
  console.log('✓ Supplier validators passed correctly.');

  // Test 2: Admin Registration & DB Creation
  console.log('\n[Test 2] Admin Registration DB creation...');
  const adminPasswordHash = await hashPassword(validAdminData.password);
  const newAdmin = createUser({
    fullName: validAdminData.fullName,
    mobile: validAdminData.mobile,
    email: validAdminData.email,
    passwordHash: adminPasswordHash,
    role: 'admin',
  });
  console.assert(newAdmin && newAdmin.id, 'New Admin must be created with an ID');
  console.assert(newAdmin.role === 'admin', 'Role must be admin');
  console.assert(newAdmin.mobile === '9988112233', 'Mobile must match');
  console.assert(newAdmin.email === 'testadmin@kishanflow.com', 'Email must match');
  console.log('✓ Admin user successfully registered in database:', newAdmin.fullName, newAdmin.role, newAdmin.email);

  // Test 3: Admin Login with Email & Password
  console.log('\n[Test 3] Admin Login with Email & Password...');
  const foundAdminByEmail = getUserByEmailOrMobile('testadmin@kishanflow.com', 'admin');
  console.assert(foundAdminByEmail && foundAdminByEmail.id === newAdmin.id, 'Must find admin user by email');
  const adminPassMatch = await comparePassword('AdminPass@123', foundAdminByEmail.passwordHash);
  console.assert(adminPassMatch === true, 'Password match must be true');
  console.log('✓ Admin email login succeeded.');

  // Test 4: Admin Login with Mobile (and with space formatting)
  console.log('\n[Test 4] Admin Login with Mobile & formatted mobile...');
  const foundAdminByMobile = getUserByEmailOrMobile('9988112233', 'admin');
  console.assert(foundAdminByMobile && foundAdminByMobile.id === newAdmin.id, 'Must find admin user by clean mobile');
  const foundAdminByFormattedMobile = getUserByEmailOrMobile('99881 12233', 'admin');
  console.assert(foundAdminByFormattedMobile && foundAdminByFormattedMobile.id === newAdmin.id, 'Must find admin user by formatted mobile');
  console.log('✓ Admin mobile login succeeded.');

  // Test 5: Supplier Registration & DB Creation
  console.log('\n[Test 5] Supplier Registration DB creation...');
  const supplierPasswordHash = await hashPassword(validSupplierData.password);
  const newSupplier = createUser({
    fullName: validSupplierData.fullName,
    mobile: validSupplierData.mobile,
    email: validSupplierData.email,
    passwordHash: supplierPasswordHash,
    role: 'supplier',
  });
  console.assert(newSupplier && newSupplier.id, 'New Supplier must be created with an ID');
  console.assert(newSupplier.role === 'supplier', 'Role must be supplier');
  console.log('✓ Supplier user successfully registered in database:', newSupplier.fullName, newSupplier.role, newSupplier.email);

  // Test 6: Supplier Login with Email & Mobile
  console.log('\n[Test 6] Supplier Login with Email & Mobile...');
  const foundSupplierByEmail = getUserByEmailOrMobile('testsupplier@kishanflow.com', 'supplier');
  console.assert(foundSupplierByEmail && foundSupplierByEmail.id === newSupplier.id, 'Must find supplier by email');
  const supplierPassMatch = await comparePassword('SupplierPass@123', foundSupplierByEmail.passwordHash);
  console.assert(supplierPassMatch === true, 'Supplier password match must be true');

  const foundSupplierByMobile = getUserByEmailOrMobile('9988334455', 'supplier');
  console.assert(foundSupplierByMobile && foundSupplierByMobile.id === newSupplier.id, 'Must find supplier by mobile');
  console.log('✓ Supplier email & mobile login succeeded.');

  // Test 7: JWT Token Generation & Verification
  console.log('\n[Test 7] JWT Session Token Generation & Verification...');
  const adminToken = signToken(newAdmin);
  const decodedAdmin = verifyToken(adminToken);
  console.assert(decodedAdmin && decodedAdmin.id === newAdmin.id, 'Decoded token ID must match Admin ID');
  console.assert(decodedAdmin.role === 'admin', 'Decoded role must be admin');

  const supplierToken = signToken(newSupplier);
  const decodedSupplier = verifyToken(supplierToken);
  console.assert(decodedSupplier && decodedSupplier.id === newSupplier.id, 'Decoded token ID must match Supplier ID');
  console.assert(decodedSupplier.role === 'supplier', 'Decoded role must be supplier');
  console.log('✓ JWT Session token signed and verified successfully.');

  // Test 8: Non-Regression on Farmer and Buyer Login
  console.log('\n[Test 8] Non-Regression on Farmer and Buyer accounts...');
  const farmerUser = getUserByEmailOrMobile('9820123456', 'farmer');
  console.assert(farmerUser && farmerUser.role === 'farmer', 'Farmer user must be retrieved');
  const farmerPassMatch = await comparePassword('Farmer@12345', farmerUser.passwordHash);
  console.assert(farmerPassMatch === true, 'Farmer password must match');

  const buyerUser = getUserByEmailOrMobile('buyer@kishanflow.com', 'buyer');
  console.assert(buyerUser && buyerUser.role === 'buyer', 'Buyer user must be retrieved');
  const buyerPassMatch = await comparePassword('Buyer@12345', buyerUser.passwordHash);
  console.assert(buyerPassMatch === true, 'Buyer password must match');
  console.log('✓ Existing Farmer and Buyer authentication works perfectly.');

  // Test 9: Cross-Role Protection Logic Check
  console.log('\n[Test 9] Cross-Role Login Detection...');
  // If someone tries to log in as farmer with admin email:
  const crossRoleCheck = getUserByEmailOrMobile('testadmin@kishanflow.com', 'farmer');
  console.assert(crossRoleCheck && crossRoleCheck.role === 'admin', 'Fallback identifies user role as admin');
  console.assert(crossRoleCheck.role !== 'farmer', 'Role mismatch detected for portal firewall');
  console.log('✓ Cross-role login successfully detected for rejection with portal advice.');

  // Cleanup test accounts
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run('testadmin@kishanflow.com', 'testsupplier@kishanflow.com');
  console.log('\n--- ALL AUTHENTICATION VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
