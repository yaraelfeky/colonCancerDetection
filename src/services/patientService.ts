import { axiosInstance } from "../api/axiosInstance";
import { USE_MOCK } from "../config/mockFlags";
import { getMockPatients } from "../mocks/medicalRecordMockStore";
import {
  buildMockPatientList,
  DEMO_META,
  type MockListPatientCard,
} from "../mocks/patientListMock";
import type { ApiResponse } from "../types/api";
import type { DoctorPatientDto, ListPatient, PatientDetailProfile } from "../types/patient";
import { apiUrl } from "../utils/apiUrl";
import { parseServiceError, unwrapApiDataOrEmpty, unwrapApiDataOptional } from "../utils/apiResponse";
import { aiService } from "./aiService";
import { medicalRecordService } from "./medicalRecordService";
import { countPendingInMedicalRecord } from "../types/medicalRecord";

export type { ListPatient, PatientDetailProfile, DoctorPatientDto } from "../types/patient";

const BASE = "/api/Patient";
const DOCTOR_PATIENTS = "/api/Doctor/Patients";

export interface PatientProfileDto {
  id?: number;
  name?: string;
  userName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  age?: number;
  gender?: string;
  joinedAt?: string;
  [key: string]: unknown;
}

function readRecordField(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function formatBloodType(raw: string | null): string {
  if (!raw) return "—";
  return raw
    .replace(/_Positive$/i, "+")
    .replace(/_Negative$/i, "−")
    .replace(/_/g, " ");
}

export function resolvePatientImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const normalized = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return apiUrl(normalized);
}

function mockCardToListPatient(card: MockListPatientCard): ListPatient {
  return {
    id: card.id,
    name: card.name,
    email: null,
    imagePath: null,
    imageUrl: null,
    dateOfBirth: null,
    bloodType: null,
    age: card.age,
    gender: card.gender,
    lastScan: card.lastScan,
    pendingReviews: card.pendingReviews,
  };
}

function normalizeDoctorPatientDto(raw: Record<string, unknown>): ListPatient | null {
  const userId = Number(readRecordField(raw, "userId", "UserId", "id", "Id", "patientId", "PatientId"));
  if (!userId || Number.isNaN(userId)) return null;

  const userName = String(
    readRecordField(raw, "userName", "UserName", "name", "Name", "patientName", "PatientName") ??
      `Patient #${userId}`
  );
  const email = readRecordField(raw, "email", "Email");
  const imagePath = readRecordField(raw, "imagePath", "ImagePath");
  const dateOfBirth = readRecordField(raw, "dateOfBirth", "DateOfBirth");
  const bloodType = readRecordField(raw, "bloodType", "BloodType");

  const emailStr = email != null ? String(email) : null;
  const imagePathStr = imagePath != null ? String(imagePath) : null;
  const dobStr = dateOfBirth != null ? String(dateOfBirth) : null;
  const bloodTypeStr = bloodType != null ? String(bloodType) : null;

  return {
    id: userId,
    name: userName,
    email: emailStr,
    imagePath: imagePathStr,
    imageUrl: resolvePatientImageUrl(imagePathStr),
    dateOfBirth: dobStr,
    bloodType: bloodTypeStr,
    age: calculateAge(dobStr),
    lastScan: null,
    pendingReviews: 0,
  };
}

async function fetchDoctorPatientsFromApi(): Promise<ListPatient[]> {
  const { data } = await axiosInstance.get(DOCTOR_PATIENTS);
  let list: unknown[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === "object" && Array.isArray((data as any).data)) {
    list = (data as any).data;
  }
  
  return list
    .map((item) => normalizeDoctorPatientDto(item as Record<string, unknown>))
    .filter((item): item is ListPatient => item !== null);
}

async function fetchDoctorPatients(): Promise<ListPatient[]> {
  if (USE_MOCK) {
    return getMockPatients().map((p) => ({
      id: p.id,
      name: p.name,
      email: null,
      imagePath: null,
      imageUrl: null,
      dateOfBirth: null,
      bloodType: null,
      age: DEMO_META[p.id]?.age ?? null,
      gender: DEMO_META[p.id]?.gender,
      lastScan: null,
      pendingReviews: 0,
    }));
  }
  try {
    return await fetchDoctorPatientsFromApi();
  } catch (error) {
    throw new Error(await parseServiceError(error));
  }
}

async function enrichPatientSummary(patient: ListPatient): Promise<ListPatient> {
  if (USE_MOCK) {
    const card = buildMockPatientList().find((p) => p.id === patient.id);
    return card ? mockCardToListPatient(card) : patient;
  }

  try {
    const [aiData, pendingRecord] = await Promise.all([
      aiService.getPatientHistory(patient.id).catch(() => []),
      medicalRecordService.getPending(patient.id).catch(() => ({})),
    ]);

    const sortedScans = [...aiData].sort((a, b) => {
      const ta = new Date(a.analyzedAt ?? 0).getTime();
      const tb = new Date(b.analyzedAt ?? 0).getTime();
      return tb - ta;
    });
    const latest = sortedScans[0];

    return {
      ...patient,
      lastScan:
        latest?.analyzedAt != null
          ? {
              isCancerous: Boolean(latest.isCancerous),
              analyzedAt: latest.analyzedAt,
            }
          : null,
      pendingReviews: countPendingInMedicalRecord(pendingRecord),
    };
  } catch {
    return { ...patient, lastScan: null, pendingReviews: 0 };
  }
}

function buildMockDetailProfile(patientId: number): PatientDetailProfile | null {
  const mockMeta = getMockPatients().find((p) => p.id === patientId);
  if (!mockMeta) return null;
  const demo = DEMO_META[patientId];
  return {
    id: patientId,
    name: mockMeta.name,
    email: `${mockMeta.name.split(" ")[0]?.toLowerCase() ?? "patient"}@email.com`,
    phone: "01012345678",
    imagePath: null,
    imageUrl: null,
    dateOfBirth: null,
    bloodType: null,
    age: demo?.age ?? null,
    gender: demo?.gender ?? "—",
    joinedAt: "2024-01-15",
  };
}

export const patientService = {
  async getProfile(): Promise<PatientProfileDto | null> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<PatientProfileDto>>(BASE);
      return unwrapApiDataOptional(data);
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async updateProfile(form: FormData): Promise<void> {
    try {
      const { data } = await axiosInstance.put<ApiResponse>(BASE, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!data.success) throw new Error(data.message || "Update failed");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async getDoctorPatients(): Promise<ListPatient[]> {
    return fetchDoctorPatients();
  },

  async getMyPatients(): Promise<ListPatient[]> {
    return fetchDoctorPatients();
  },

  async getDoctorPatientsWithSummaries(): Promise<ListPatient[]> {
    if (USE_MOCK) {
      return buildMockPatientList().map(mockCardToListPatient);
    }
    const patients = await fetchDoctorPatientsFromApi();
    return Promise.all(patients.map(enrichPatientSummary));
  },

  async getPatientDetailProfile(patientId: number): Promise<PatientDetailProfile | null> {
    if (USE_MOCK) {
      return buildMockDetailProfile(patientId);
    }
    const patients = await fetchDoctorPatientsFromApi();
    const found = patients.find((p) => p.id === patientId);
    if (!found) return null;
    return {
      id: found.id,
      name: found.name,
      email: found.email,
      phone: null,
      imagePath: found.imagePath,
      imageUrl: found.imageUrl,
      dateOfBirth: found.dateOfBirth,
      bloodType: found.bloodType,
      age: found.age,
    };
  },
};

export function normalizePatientProfile(
  p: PatientProfileDto & Record<string, unknown>,
  fallbackId?: number
): PatientProfileDto {
  return {
    ...p,
    id: Number(p.id ?? fallbackId ?? 0),
    name: String(p.name ?? p.userName ?? "Patient"),
    email: p.email as string | undefined,
    phone: (p.phone ?? p.phoneNumber) as string | undefined,
  };
}
