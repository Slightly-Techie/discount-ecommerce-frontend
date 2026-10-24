// Client-side checks that mirror the API's rules for /users/register/, so people
// see the problem before submitting instead of a generic "Registration failed".

/** "024 123-4567" → "0241234567". Keeps a leading +. */
export function normalizePhone(value: string): string {
  return value.trim().replace(/[\s\-().]/g, "");
}

/** Same rule as the API's validate_phonenumber: 10–15 digits, optional leading +. */
export function phoneError(value: string): string | null {
  const phone = normalizePhone(value);
  if (!phone) return "Phone number is required";
  if (!/^\+?\d{10,15}$/.test(phone)) return "Enter 10 to 15 digits, e.g. 0241234567 or +233241234567";
  return null;
}

/** The parts of Django's default password validators we can check without the server. */
export function passwordError(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 8) return "Use at least 8 characters";
  if (/^\d+$/.test(password)) return "Use letters as well as numbers";
  return null;
}
