import { USE_MOCK } from "../config/mockFlags";
import { getMockPatientHistory, type PatientHistoryEvent } from "../mocks/patientHistoryMockData";

export type { PatientHistoryEvent, HistoryEventType } from "../mocks/patientHistoryMockData";

export const patientHistoryService = {
  async getByPatient(patientId: number): Promise<PatientHistoryEvent[]> {
    if (USE_MOCK) {
      const events = getMockPatientHistory(patientId);
      console.log("API Response:", { success: true, data: events });
      return events;
    }
    // Real API placeholder — wire when backend endpoint exists
    console.warn("patientHistoryService: real API not implemented");
    return [];
  },
};
