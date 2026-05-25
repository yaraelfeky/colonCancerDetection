import type { MedicalRecordState } from "../services/medicalRecordService";

export interface MockListPatient {
  id: number;
  name: string;
}

export type MockEntryStatus = 0 | 1 | 2;

export interface MockMedicalEntryBase {
  id: number;
  status: MockEntryStatus;
  isPending?: boolean;
  reviewNote?: string | null;
  note?: string | null;
}

export const MOCK_PATIENTS: MockListPatient[] = [
  { id: 1, name: "Ahmed Mohamed" },
  { id: 2, name: "Sara Hassan" },
  { id: 3, name: "Omar Adel" },
  { id: 4, name: "Fatima Nour" },
  { id: 5, name: "Mina Nabil" },
  { id: 6, name: "Hagar Ahmed" },
  { id: 7, name: "Youssef Kamal" },
];

function pending(id: number): MockMedicalEntryBase {
  return { id, status: 0, isPending: true };
}

function approved(id: number, reviewNote?: string): MockMedicalEntryBase {
  return { id, status: 1, isPending: false, reviewNote: reviewNote ?? null };
}

function rejected(id: number, reviewNote: string): MockMedicalEntryBase {
  return { id, status: 2, isPending: false, reviewNote };
}

/** Seed records keyed by patient id — deep-cloned into the mock store at init. */
export function buildSeedMedicalRecords(): Record<number, MedicalRecordState> {
  return {
    1: {
      allergies: [
        { ...pending(101), name: "Penicillin", severity: "High", reaction: "Rash" },
        { ...approved(102), name: "Pollen", severity: "Low", reaction: "Sneezing" },
        { ...rejected(103, "Low risk — patient confirmed no reaction."), name: "Shellfish", severity: "Medium", reaction: "Hives" },
      ],
      visits: [
        {
          ...approved(201),
          date: "2025-01-10T10:00:00Z",
          doctorName: "Dr. Smith",
          reasonForVisit: "Routine check",
          diagnosis: "Healthy",
          treatmentPlan: "Annual follow-up",
        },
        {
          ...approved(202),
          date: "2025-03-15T14:30:00Z",
          doctorName: "Dr. Lee",
          reasonForVisit: "Abdominal pain",
          diagnosis: "Mild gastritis",
          treatmentPlan: "PPI for 2 weeks",
        },
      ],
      surgeries: [
        {
          ...approved(301),
          name: "Appendectomy",
          date: "2020-06-15T08:00:00Z",
          outcome: "Successful",
        },
      ],
      tests: [
        {
          ...approved(401),
          name: "Colonoscopy",
          date: "2025-01-10T11:00:00Z",
          result: "Single polyp removed",
        },
        {
          ...approved(402),
          name: "FIT Test",
          date: "2025-02-01T09:00:00Z",
          result: "Negative",
        },
      ],
      medications: [
        {
          ...approved(501),
          name: "Aspirin",
          dosage: "100mg",
          frequency: "Daily",
          startDate: "2025-01-01T00:00:00Z",
          endDate: null,
          reminderTimes: ["08:00"],
          daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          notes: "After meals",
        },
      ],
      familyConditions: [
        {
          ...pending(601),
          name: "Colon Cancer",
          relative: "Father",
          diagnosisDate: "2010-03-01T00:00:00Z",
        },
        {
          ...approved(602),
          name: "Type 2 Diabetes",
          relative: "Mother",
          diagnosisDate: "2015-07-12T00:00:00Z",
        },
      ],
    },
    2: {
      allergies: [
        { ...approved(1101), name: "Latex", severity: "Medium", reaction: "Contact dermatitis" },
      ],
      visits: [
        {
          ...pending(1201),
          date: "2025-04-02T09:15:00Z",
          doctorName: "Dr. Patel",
          reasonForVisit: "Screening follow-up",
          diagnosis: "Pending pathology",
          treatmentPlan: "Await biopsy results",
        },
      ],
      surgeries: [
        {
          ...approved(1301),
          name: "Polyp removal",
          date: "2024-11-20T10:00:00Z",
          outcome: "Benign",
        },
      ],
      tests: [
        {
          ...approved(1401),
          name: "CT Abdomen",
          date: "2025-03-28T16:00:00Z",
          result: "No metastasis",
        },
      ],
      medications: [
        {
          ...approved(1501),
          name: "Metformin",
          dosage: "500mg",
          frequency: "Twice daily",
          startDate: "2024-06-01T00:00:00Z",
          endDate: null,
          notes: "With meals",
        },
      ],
      familyConditions: [
        {
          ...approved(1601),
          name: "Polyps",
          relative: "Brother",
          diagnosisDate: "2018-09-01T00:00:00Z",
        },
      ],
    },
    3: {
      allergies: [
        { ...approved(2101), name: "Ibuprofen", severity: "Low", reaction: "Mild nausea" },
      ],
      visits: [
        {
          ...approved(2201),
          date: "2025-02-20T11:00:00Z",
          doctorName: "Dr. Chen",
          reasonForVisit: "Post-op review",
          diagnosis: "Recovering well",
          treatmentPlan: "Resume normal diet",
        },
      ],
      surgeries: [
        {
          ...pending(2301),
          name: "Colectomy (partial)",
          date: "2025-02-10T07:30:00Z",
          outcome: "Awaiting pathology",
        },
      ],
      tests: [
        {
          ...approved(2401),
          name: "Blood panel",
          date: "2025-02-18T08:00:00Z",
          result: "Within normal limits",
        },
      ],
      medications: [
        {
          ...approved(2501),
          name: "Omeprazole",
          dosage: "20mg",
          frequency: "Daily",
          startDate: "2025-02-11T00:00:00Z",
          endDate: "2025-05-11T00:00:00Z",
          notes: null,
        },
      ],
      familyConditions: [
        {
          ...rejected(2601, "Patient reports distant relative only."),
          name: "Crohn's disease",
          relative: "Uncle",
          diagnosisDate: "2005-01-15T00:00:00Z",
        },
      ],
    },
    4: {
      allergies: [
        { ...approved(3101), name: "Aspirin", severity: "Medium", reaction: "GI upset" },
        { ...pending(3102), name: "Codeine", severity: "High", reaction: "Breathing difficulty" },
      ],
      visits: [
        {
          ...approved(3201),
          date: "2025-01-05T13:00:00Z",
          doctorName: "Dr. Wilson",
          reasonForVisit: "Medication review",
          diagnosis: "Stable",
          treatmentPlan: "Continue current regimen",
        },
      ],
      surgeries: [
        {
          ...approved(3301),
          name: "Hernia repair",
          date: "2019-04-10T09:00:00Z",
          outcome: "Successful",
        },
      ],
      tests: [
        {
          ...pending(3401),
          name: "MRI Abdomen",
          date: "2025-05-01T10:30:00Z",
          result: "Radiologist review pending",
        },
        {
          ...approved(3402),
          name: "Stool culture",
          date: "2025-04-12T08:00:00Z",
          result: "Negative",
        },
      ],
      medications: [
        {
          ...approved(3501),
          name: "Vitamin D",
          dosage: "1000 IU",
          frequency: "Daily",
          startDate: "2024-01-01T00:00:00Z",
          endDate: null,
          notes: null,
        },
      ],
      familyConditions: [
        {
          ...approved(3601),
          name: "Colorectal polyps",
          relative: "Sister",
          diagnosisDate: "2022-06-20T00:00:00Z",
        },
      ],
    },
    5: {
      allergies: [
        { ...approved(4101), name: "None documented", severity: "—", reaction: "—" },
      ],
      visits: [
        {
          ...approved(4201),
          date: "2024-12-01T10:00:00Z",
          doctorName: "Dr. Brown",
          reasonForVisit: "Annual physical",
          diagnosis: "Normal",
          treatmentPlan: "Screening in 1 year",
        },
      ],
      surgeries: [
        {
          ...approved(4301),
          name: "Gallbladder removal",
          date: "2017-08-22T08:00:00Z",
          outcome: "Successful",
        },
      ],
      tests: [
        {
          ...approved(4401),
          name: "Ultrasound",
          date: "2024-12-02T09:00:00Z",
          result: "Unremarkable",
        },
      ],
      medications: [
        {
          ...pending(4501),
          name: "Folic acid",
          dosage: "5mg",
          frequency: "Daily",
          startDate: "2025-05-10T00:00:00Z",
          endDate: null,
          reminderTimes: ["09:00"],
          daysOfWeek: ["Monday", "Wednesday", "Friday"],
          notes: "New prescription — pending approval",
        },
      ],
      familyConditions: [
        {
          ...approved(4601),
          name: "Stomach cancer",
          relative: "Grandfather",
          diagnosisDate: "1998-11-01T00:00:00Z",
        },
      ],
    },
    6: {
      allergies: [
        { ...pending(5101), name: "Sulfa drugs", severity: "High", reaction: "Stevens-Johnson risk" },
      ],
      visits: [
        {
          ...approved(5201),
          date: "2025-03-01T15:00:00Z",
          doctorName: "Dr. Garcia",
          reasonForVisit: "Symptom check",
          diagnosis: "IBS suspected",
          treatmentPlan: "Dietary changes, follow-up 4 weeks",
        },
      ],
      surgeries: [],
      tests: [
        {
          ...approved(5401),
          name: "Colonoscopy",
          date: "2025-02-14T11:30:00Z",
          result: "Normal mucosa",
        },
      ],
      medications: [
        {
          ...approved(5501),
          name: "Mesalamine",
          dosage: "800mg",
          frequency: "Three times daily",
          startDate: "2025-01-20T00:00:00Z",
          endDate: null,
          notes: "GI specialist",
        },
      ],
      familyConditions: [
        {
          ...pending(5601),
          name: "Ulcerative colitis",
          relative: "Mother",
          diagnosisDate: "2008-04-15T00:00:00Z",
        },
      ],
    },
    /** Patient with empty tests tab — verifies empty-state UI */
    7: {
      allergies: [
        { ...approved(7101), name: "Dust mites", severity: "Low", reaction: "Rhinitis" },
      ],
      visits: [
        {
          ...approved(7201),
          date: "2025-04-18T10:00:00Z",
          doctorName: "Dr. Ali",
          reasonForVisit: "Initial consult",
          diagnosis: "Low risk screening",
          treatmentPlan: "Schedule colonoscopy",
        },
      ],
      surgeries: [
        {
          ...approved(7301),
          name: "None",
          date: "2010-01-01T00:00:00Z",
          outcome: "N/A",
        },
      ],
      tests: [],
      medications: [
        {
          ...approved(7501),
          name: "Multivitamin",
          dosage: "1 tablet",
          frequency: "Daily",
          startDate: "2024-10-01T00:00:00Z",
          endDate: null,
          notes: null,
        },
      ],
      familyConditions: [
        {
          ...approved(7601),
          name: "Hypertension",
          relative: "Father",
          diagnosisDate: "2012-08-01T00:00:00Z",
        },
      ],
    },
  };
}
