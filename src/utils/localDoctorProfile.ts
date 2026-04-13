import type { DoctorProfileDto } from "../types/doctor";

const LOCAL_PROFILE_KEY = "colonai_doctor_profile_v1";
const LOCAL_AVATAR_KEY = "colonai_doctor_avatar_dataurl";

export function notifyDoctorProfileChanged(): void {
  window.dispatchEvent(new Event("colonai-local-profile-changed"));
}

export function readLocalProfile(): Partial<DoctorProfileDto> | null {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<DoctorProfileDto>;
  } catch {
    return null;
  }
}

export function writeLocalProfile(patch: Partial<DoctorProfileDto>): void {
  const prev = readLocalProfile() ?? {};
  const next: Partial<DoctorProfileDto> = { ...prev, ...patch };
  localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(next));
  notifyDoctorProfileChanged();
}

export function readLocalAvatarDataUrl(): string | null {
  try {
    return localStorage.getItem(LOCAL_AVATAR_KEY);
  } catch {
    return null;
  }
}

export function writeLocalAvatarDataUrl(dataUrl: string | null): void {
  if (dataUrl) {
    localStorage.setItem(LOCAL_AVATAR_KEY, dataUrl);
  } else {
    localStorage.removeItem(LOCAL_AVATAR_KEY);
  }
  notifyDoctorProfileChanged();
}

/** Merge API payload with locally saved doctor fields (local wins on conflicts). */
export function mergeDoctorProfile(
  api: DoctorProfileDto | null | undefined,
  local: Partial<DoctorProfileDto> | null | undefined
): DoctorProfileDto {
  const a = api ?? {};
  const l = local ?? {};
  const avatarData = readLocalAvatarDataUrl();
  const merged: DoctorProfileDto = {
    ...a,
    ...l,
    fullName: (l.fullName ?? a.fullName) || undefined,
    email: (l.email ?? a.email) || undefined,
    phoneNumber: (l.phoneNumber ?? a.phoneNumber) || undefined,
    specialty: (l.specialty ?? a.specialty) || undefined,
    degrees: (l.degrees ?? a.degrees) || undefined,
    clinicName: (l.clinicName ?? a.clinicName) || undefined,
    consultationFee: (l.consultationFee ?? a.consultationFee) || undefined,
    bio: (l.bio ?? a.bio) || undefined,
    yearsOfExperience:
      l.yearsOfExperience !== undefined && l.yearsOfExperience !== null
        ? l.yearsOfExperience
        : a.yearsOfExperience,
    isProfileComplete: l.isProfileComplete ?? a.isProfileComplete,
    profileImageUrl: avatarData || l.profileImageUrl || a.profileImageUrl,
    education: l.education !== undefined ? l.education : a.education,
    experience: l.experience !== undefined ? l.experience : a.experience,
    achievements: l.achievements !== undefined ? l.achievements : a.achievements,
    schedule: l.schedule !== undefined ? l.schedule : a.schedule,
    stats: l.stats !== undefined ? l.stats : a.stats,
    reviews: l.reviews !== undefined ? l.reviews : a.reviews,
  };
  return merged;
}
