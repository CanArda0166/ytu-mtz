/**
 * Masking utilities for user data privacy.
 */

export function maskEmail(email: string) {
  if (!email) return email;
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const username = parts[0];
  const domain = parts[1];
  
  let maskedUsername = username;
  if (username.length > 6) {
    maskedUsername = username.substring(0, 3) + "***" + username.substring(username.length - 3);
  } else {
    maskedUsername = username[0] + "***" + (username[username.length - 1] || "");
  }
  
  return maskedUsername + "@" + domain;
}

export function maskPhone(phone: string) {
  if (!phone || phone.length < 3) return phone;
  return "*".repeat(phone.length - 3) + phone.slice(-3);
}

export function maskName(str: string) {
  if (!str) return str;
  return str.charAt(0) + "***";
}

export function maskTc(tc: string) {
  if (!tc || tc.length < 2) return tc;
  return tc[0] + "*".repeat(tc.length - 2) + tc[tc.length - 1];
}

export function maskBirthDate(date: Date | string) {
  if (!date) return date;
  return "****-**-**";
}
