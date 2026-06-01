import { useCallback, useMemo, useState } from "react";
import { contactService } from "../services/contactService";
import type { ContactEmail, ContactPhone } from "../types/contact";
import { computeContactStats } from "../utils/contactUtils";

export function useContactManager() {
  const [emails, setEmails] = useState<ContactEmail[]>([]);
  const [phones, setPhones] = useState<ContactPhone[]>([]);

  const stats = useMemo(
    () => computeContactStats({ emails, phones }),
    [emails, phones]
  );

  const requestAddEmail = useCallback(async (email: string) => {
    await contactService.addEmail({ email });
  }, []);

  const completeVerifyEmail = useCallback(async (email: string, otpCode: string) => {
    await contactService.verifyEmail({ email, otpCode });
    setEmails((prev) => {
      if (prev.some((e) => e.email.toLowerCase() === email.toLowerCase())) {
        return prev.map((e) =>
          e.email.toLowerCase() === email.toLowerCase()
            ? { ...e, isVerified: true }
            : e
        );
      }
      const isFirst = prev.length === 0;
      return [
        ...prev,
        { email, isVerified: true, isPrimary: isFirst },
      ];
    });
  }, []);

  const resendEmailOtp = useCallback(async (email: string) => {
    await contactService.resendEmailOtp({ email });
  }, []);

  const deleteEmail = useCallback(async (email: string) => {
    await contactService.deleteEmail({ email });
    setEmails((prev) => {
      const next = prev.filter((e) => e.email !== email);
      if (next.length > 0 && !next.some((e) => e.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }, []);

  const setPrimaryEmail = useCallback(async (email: string) => {
    await contactService.setPrimaryEmail({ email });
    setEmails((prev) =>
      prev.map((e) => ({
        ...e,
        isPrimary: e.email === email,
      }))
    );
  }, []);

  const requestAddPhone = useCallback(async (phoneNumber: string) => {
    await contactService.addPhone({ phoneNumber });
  }, []);

  const completeVerifyPhone = useCallback(
    async (phoneNumber: string, otpCode: string) => {
      await contactService.verifyPhone({ phoneNumber, otpCode });
      setPhones((prev) => {
        if (prev.some((p) => p.phoneNumber === phoneNumber)) {
          return prev.map((p) =>
            p.phoneNumber === phoneNumber ? { ...p, isVerified: true } : p
          );
        }
        const isFirst = prev.length === 0;
        return [
          ...prev,
          { phoneNumber, isVerified: true, isPrimary: isFirst },
        ];
      });
    },
    []
  );

  const resendPhoneOtp = useCallback(async (phoneNumber: string) => {
    await contactService.resendPhoneOtp({ phoneNumber });
  }, []);

  const deletePhone = useCallback(async (phoneNumber: string) => {
    await contactService.deletePhone({ phoneNumber });
    setPhones((prev) => {
      const next = prev.filter((p) => p.phoneNumber !== phoneNumber);
      if (next.length > 0 && !next.some((p) => p.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }, []);

  const setPrimaryPhone = useCallback(async (phoneNumber: string) => {
    await contactService.setPrimaryPhone({ phoneNumber });
    setPhones((prev) =>
      prev.map((p) => ({
        ...p,
        isPrimary: p.phoneNumber === phoneNumber,
      }))
    );
  }, []);

  return {
    emails,
    phones,
    stats,
    requestAddEmail,
    completeVerifyEmail,
    resendEmailOtp,
    deleteEmail,
    setPrimaryEmail,
    requestAddPhone,
    completeVerifyPhone,
    resendPhoneOtp,
    deletePhone,
    setPrimaryPhone,
  };
}
