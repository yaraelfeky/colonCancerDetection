import type { ContactStats, ContactSummary } from "../types/contact";

export function computeContactStats(summary: ContactSummary): ContactStats {
  return {
    totalEmails: summary.emails.length,
    verifiedEmails: summary.emails.filter((e) => e.isVerified).length,
    totalPhones: summary.phones.length,
    verifiedPhones: summary.phones.filter((p) => p.isVerified).length,
  };
}
