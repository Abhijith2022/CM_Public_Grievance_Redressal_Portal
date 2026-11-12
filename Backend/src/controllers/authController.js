const { User } = require('../models');
const { USER_ROLES, KERALA_DISTRICTS } = require('../constants/keralaData');
const { AppError, asyncHandler } = require('../utils/errors');
const { signToken } = require('../middleware/auth');
const { DEMO_CREDENTIALS } = require('../services/seedService');

const register = asyncHandler(async (req, res) => {
  const { name, email, mobileNumber, password, district = '' } = req.body;
  const trimmedDistrict = String(district || '').trim();

  if (!name || !email || !mobileNumber || !password) {
    throw new AppError(
      'Name, email, mobile number, and password are required.',
      400,
      'MISSING_FIELDS'
    );
  }

  if (String(password).length < 6) {
    throw new AppError('Password must be at least 6 characters long.', 400, 'WEAK_PASSWORD');
  }

  if (trimmedDistrict && !KERALA_DISTRICTS.includes(trimmedDistrict)) {
    throw new AppError('Invalid Kerala district selected.', 400, 'INVALID_DISTRICT');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    mobileNumber: String(mobileNumber).trim(),
    passwordHash,
    role: USER_ROLES.CITIZEN,
    district: trimmedDistrict,
  });

  const token = signToken(user);

  res.status(201).json({
    success: true,
    message: 'Citizen account registered successfully.',
    data: {
      token,
      user,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, expectedRole } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400, 'MISSING_CREDENTIALS');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail })
    .select('+passwordHash')
    .populate('department', 'name code');

  if (!user || !(await user.comparePassword(String(password)))) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated. Contact administrator.', 403, 'ACCOUNT_INACTIVE');
  }

  if (expectedRole && user.role !== expectedRole) {
    throw new AppError(
      `This portal login is restricted to ${expectedRole.replace('_', ' ')} accounts.`,
      403,
      'ROLE_MISMATCH'
    );
  }

  const token = signToken(user);
  const safeUser = user.toJSON();

  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      token,
      user: safeUser,
    },
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully. Please clear the stored JWT on the client.',
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

const getDemoAccounts = asyncHandler(async (_req, res) => {
  const expose =
    process.env.EXPOSE_DEMO_CREDENTIALS === 'true' || process.env.NODE_ENV !== 'production';

  if (!expose) {
    throw new AppError('Demo credential listing is disabled in this environment.', 403, 'DISABLED');
  }

  res.json({
    success: true,
    notice: 'Fictional test credentials provided strictly for recruitment prototype evaluation.',
    data: DEMO_CREDENTIALS,
  });
});

module.exports = {
  register,
  login,
  logout,
  me,
  getDemoAccounts,
};
