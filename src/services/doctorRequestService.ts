import { axiosInstance } from "../api/axiosInstance";

const BASE = "/api/DoctorRequest";
export function defaultPrescription(): DoctorRequestPrescriptionPayload {
  return {
    Name: "N/A",
    Dosage: "N/A",
    Frequency: "N/A",
    StartDate: new Date().toISOString(),
    DaysOfWeek: [2],
  };
}


export function buildPostPayload(
  patientId: number,
  subject: string,
  message: string,
  requestType: 1 | 2,
  importance: 1 | 2 | 3
): DoctorRequestPostPayload {
  return {
    PatientId: patientId,
    Subject: subject,
    Message: message,
    RequestType: requestType,
    Importance: importance,
    Prescription: defaultPrescription(),
  };
}

export function buildPutPayload(
  patientId: number,
  subject: string,
  message: string,
  requestType: 1 | 2,
  importance: 1 | 2 | 3
): DoctorRequestPutPayload {
  return {
    ...buildPostPayload(
      patientId,
      subject,
      message,
      requestType,
      importance
    ),
    ImageIdsToRemove: [],
  };
}

export type DoctorRequestPrescriptionPayload = {
  Name: string;
  Dosage: string;
  Frequency: string;
  StartDate: string;
  DaysOfWeek: number[];
};

export type DoctorRequestPostPayload = {
  PatientId: number;
  Subject: string;
  Message: string;
  RequestType: 1 | 2;
  Importance: 1 | 2 | 3;
  Prescription: DoctorRequestPrescriptionPayload;
};

export type DoctorRequestPutPayload =
  DoctorRequestPostPayload & {
    ImageIdsToRemove: number[];
  };

async function parseAxiosError(error: any): Promise<string> {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    "Request failed"
  );
}

export const doctorRequestService = {
  async list(): Promise<any[]> {
    try {
      const { data } = await axiosInstance.get(BASE);
      return data?.data ?? [];
    } catch (error) {
      throw new Error(await parseAxiosError(error));
    }
  },

  async getById(id: number): Promise<any> {
    try {
      const { data } = await axiosInstance.get(`${BASE}/${id}`);
      return data?.data;
    } catch (error) {
      throw new Error(await parseAxiosError(error));
    }
  },

  // async create(payload: DoctorRequestPostPayload): Promise<any> {
  //   try {
  //     console.log("CREATE PAYLOAD:", payload);

  //     const { data } = await axiosInstance.post(BASE, payload);

  //     console.log("CREATE RESPONSE:", data);

  //     return data?.data ?? data;
  //   } catch (error) {
  //     console.error("CREATE ERROR:", error);
  //     throw new Error(await parseAxiosError(error));
  //   }
  // },

  async create(payload: DoctorRequestPostPayload): Promise<any> {
  try {
    console.log("CREATE PAYLOAD:", payload);

    const form = new URLSearchParams();
    form.append("PatientId", String(payload.PatientId));
    form.append("Subject", payload.Subject);
    form.append("Message", payload.Message);
    form.append("RequestType", String(payload.RequestType));
    form.append("Importance", String(payload.Importance));
    form.append("Prescription.Name", payload.Prescription.Name);
    form.append("Prescription.Dosage", payload.Prescription.Dosage);
    form.append("Prescription.Frequency", payload.Prescription.Frequency);
    form.append("Prescription.StartDate", payload.Prescription.StartDate);
    payload.Prescription.DaysOfWeek.forEach((day) =>
      form.append("Prescription.DaysOfWeek", String(day))
    );

    const { data } = await axiosInstance.post(BASE, form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    console.log("CREATE RESPONSE:", data);
    return data?.data ?? data;
  } catch (error) {
    console.error("CREATE ERROR:", error);
    throw new Error(await parseAxiosError(error));
  }
},

  async update(
    id: number,
    payload: DoctorRequestPutPayload
  ): Promise<any> {
    try {
      const { data } = await axiosInstance.put(
        `${BASE}/${id}`,
        payload
      );

      return data?.data ?? data;
    } catch (error) {
      throw new Error(await parseAxiosError(error));
    }
  },

  async remove(id: number): Promise<void> {
    try {
      await axiosInstance.delete(`${BASE}/${id}`);
    } catch (error) {
      throw new Error(await parseAxiosError(error));
    }
  },

 };