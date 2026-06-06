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

export function clearLocalProfile(): void {
  localStorage.removeItem(LOCAL_PROFILE_KEY);
  localStorage.removeItem(LOCAL_AVATAR_KEY);
  notifyDoctorProfileChanged();
}

export function readLocalAvatarDataUrl(): string | null {
  try {
    const val = localStorage.getItem(LOCAL_AVATAR_KEY);
    if (!val || val === "REMOVED") return null;
    return val;
  } catch {
    return null;
  }
}

export function writeLocalAvatarDataUrl(dataUrl: string | null): void {
  if (dataUrl) {
    localStorage.setItem(LOCAL_AVATAR_KEY, dataUrl);
  } else {
    // Store sentinel so we know user explicitly removed (vs never set)
    localStorage.setItem(LOCAL_AVATAR_KEY, "REMOVED");
  }
  notifyDoctorProfileChanged();
}

/** Returns true if the user has explicitly removed their avatar */
export function isLocalAvatarRemoved(): boolean {
  try {
    return localStorage.getItem(LOCAL_AVATAR_KEY) === "REMOVED";
  } catch {
    return false;
  }
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
    userName: (l.userName ?? a.userName) || undefined,
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
    profileImageUrl: isLocalAvatarRemoved() ? undefined : (avatarData || l.profileImageUrl || a.profileImageUrl),
    education: l.education !== undefined ? l.education : a.education,
    experience: l.experience !== undefined ? l.experience : a.experience,
    achievements: l.achievements !== undefined ? l.achievements : a.achievements,
    schedule: l.schedule !== undefined ? l.schedule : a.schedule,
    stats: l.stats !== undefined ? l.stats : a.stats,
    reviews: l.reviews !== undefined ? l.reviews : a.reviews,
  };
  return merged;
}
