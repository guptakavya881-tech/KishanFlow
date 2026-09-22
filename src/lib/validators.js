export function validateMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') return false;
  // Clean spaces or hyphens
  const cleaned = mobile.replace(/[\s-]/g, '');
  // Indian mobile standard (10 digits, usually starting with 6, 7, 8, or 9, or standard 10 digits)
  return /^[6-9]\d{9}$/.test(cleaned) || /^\d{10}$/.test(cleaned);
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateFarmerRegistration(data) {
  const errors = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full Name is required (at least 2 characters).';
  }

  if (!data.mobile || !data.mobile.trim()) {
    errors.mobile = 'Mobile number is required.';
  } else if (!validateMobile(data.mobile)) {
    errors.mobile = 'Please enter a valid 10-digit mobile number.';
  }

  if (!data.location || !data.location.trim()) {
    errors.location = 'Location (village/city/state) is required.';
  }

  if (!data.password) {
    errors.password = 'Create Password is required.';
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirm Password is required.';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateBuyerRegistration(data) {
  const errors = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full Name is required (at least 2 characters).';
  }

  if (!data.mobile || !data.mobile.trim()) {
    errors.mobile = 'Mobile number is required.';
  } else if (!validateMobile(data.mobile)) {
    errors.mobile = 'Please enter a valid 10-digit mobile number.';
  }

  if (!data.email || !data.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.password) {
    errors.password = 'Create Password is required.';
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirm Password is required.';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateAdminRegistration(data) {
  const errors = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full Name is required (at least 2 characters).';
  }

  if (!data.mobile || !data.mobile.trim()) {
    errors.mobile = 'Mobile number is required.';
  } else if (!validateMobile(data.mobile)) {
    errors.mobile = 'Please enter a valid 10-digit mobile number.';
  }

  if (!data.email || !data.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.password) {
    errors.password = 'Create Password is required.';
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirm Password is required.';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSupplierRegistration(data) {
  const errors = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full Name is required (at least 2 characters).';
  }

  if (!data.mobile || !data.mobile.trim()) {
    errors.mobile = 'Mobile number is required.';
  } else if (!validateMobile(data.mobile)) {
    errors.mobile = 'Please enter a valid 10-digit mobile number.';
  }

  if (!data.email || !data.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.password) {
    errors.password = 'Create Password is required.';
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirm Password is required.';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
