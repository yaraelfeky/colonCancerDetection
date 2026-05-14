import { axiosInstance } from "../api/axiosInstance";

export interface AdminDoctorListItem {
  doctorUserId: string;
  userName: string;
  email: string;
  professionalPracticeLicense?: string;
  issuingAuthority?: string;
  licenseExpirationDate?: string | null;
  approvalStatus: "Pending" | "Approved" | "Rejected";
  registeredAt: string;
  approvedAt?: string | null;
}

/** Full doctor details returned by GET /api/admin/doctors/{doctorUserId} */
export interface AdminDoctorDetails {
  doctorUserId: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
  status?: string;
  professionalPracticeLicense?: string;
  issuingAuthority?: string;
  registeredAt ?: string;
  approvedAt ?: string;
  [key: string]: unknown;
}

/**
 * Safely unwrap an array from various response shapes:
 * - []
 * - { data: [] }
 * - { doctors: [] }
 * - { items: [] }
 * - { result: [] }
 * - single object → [object]
 */
function unwrapArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    // Try common wrapper keys
    for (const key of ["data", "doctors", "items", "result", "$values"]) {
      if (key in obj) {
        const v = obj[key];
        if (Array.isArray(v)) return v as T[];
      }
    }

    // If it looks like a single doctor object (has an id-like field), wrap it
    if ("doctorUserId" in obj || "id" in obj || "email" in obj) {
      return [obj as T];
    }
  }

  console.warn("[adminDoctorService] Could not unwrap array from:", raw);
  return [];
}

/**
 * Unwrap a single object from various response shapes.
 */
function unwrapObject<T>(raw: unknown): T | null {
  if (!raw) return null;

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    // Direct object with expected fields
    if ("doctorUserId" in obj || "id" in obj || "email" in obj) {
      return obj as T;
    }

    // Wrapped in { data: {...} }
    for (const key of ["data", "doctor", "result"]) {
      if (key in obj && obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        return obj[key] as T;
      }
    }
  }

  console.warn("[adminDoctorService] Could not unwrap object from:", raw);
  return null;
}

export const adminDoctorService = {
  async getPending(): Promise<AdminDoctorListItem[]> {
    console.log("[adminDoctorService] Fetching pending doctors...");
    const { data } = await axiosInstance.get("/api/admin/doctors/pending");
    console.log("[adminDoctorService] Pending raw response:", data);
    const result = unwrapArray<AdminDoctorListItem>(data);
    console.log("[adminDoctorService] Pending parsed:", result.length, "doctors");
    return result;
  },

  async getApproved(): Promise<AdminDoctorListItem[]> {
    console.log("[adminDoctorService] Fetching approved doctors...");
    const { data } = await axiosInstance.get("/api/admin/doctors/approved");
    console.log("[adminDoctorService] Approved raw response:", data);
    const result = unwrapArray<AdminDoctorListItem>(data);
    console.log("[adminDoctorService] Approved parsed:", result.length, "doctors");
    return result;
  },

  async getDetails(doctorUserId: string): Promise<AdminDoctorDetails | null> {
    console.log("[adminDoctorService] Fetching details for:", doctorUserId);
    const { data } = await axiosInstance.get(`/api/admin/doctors/${doctorUserId}`);
    console.log("[adminDoctorService] Details raw response:", data);
    return unwrapObject<AdminDoctorDetails>(data);
  },

  async approve(doctorUserId: string): Promise<void> {
    console.log("[adminDoctorService] Approving doctor:", doctorUserId);
    await axiosInstance.post(`/api/admin/doctors/${doctorUserId}/approve`);
    console.log("[adminDoctorService] Doctor approved successfully");
  },

  async reject(doctorUserId: string,reason: string): Promise<void> {
    console.log("[adminDoctorService] Rejecting doctor:", doctorUserId);
    await axiosInstance.post(`/api/admin/doctors/${doctorUserId}/reject`,
     {
      reason,
     }
    );
    console.log("[adminDoctorService] Doctor rejected successfully");
  },
};
