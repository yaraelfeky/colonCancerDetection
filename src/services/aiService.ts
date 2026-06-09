import { axiosInstance } from "../api/axiosInstance";
import { USE_MOCK } from "../config/mockFlags";
import { getMockAiHistoryForPatient } from "../mocks/patientHistoryMockData";
import type { ApiResponse } from "../types/api";
import { apiUrl } from "../utils/apiUrl";
import { readAuthToken } from "../utils/authToken";
import { parseServiceError, unwrapApiDataOptional } from "../utils/apiResponse";

export interface AiHistoryItem {
  imageId: number;
  originalFileName?: string;
  label?: string;
  probability?: number;
  isCancerous?: boolean;
  analyzedAt?: string;
  patientId?: number;
  patientName?: string;
  notes?: string;
}

export interface AiAnalysisResult {
  imageId: number;
  originalFileName: string;
  patientId: number | null;
  label: string;
  probability: number;
  isCancerous: boolean;
  analyzedAt: string;
}

export interface ImageUploadResult {
  id: number;
  filePath?: string;
  fileName?: string;
}

async function parseFetchError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as ApiResponse;
    return j.message || res.statusText || "Request failed";
  } catch {
    return res.statusText || "Request failed";
  }
}

export const aiService = {
  async uploadImage(
    file: File,
    patientId: number,
    notes?: string
  ): Promise<ImageUploadResult> {
    const token = readAuthToken();
    const fd = new FormData();
    fd.append("Image", file);
    fd.append("patientId", String(patientId));
    if (notes) fd.append("notes", notes);

    const res = await fetch(apiUrl("/api/AI/upload"), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) throw new Error(await parseFetchError(res));
    const json = (await res.json()) as ApiResponse<ImageUploadResult>;
    const data = unwrapApiDataOptional(json);
    if (!data?.id) throw new Error("Invalid upload response");
    return data;
  },

  async analyze(imageId: number): Promise<AiAnalysisResult> {
    const token = readAuthToken();
    const res = await fetch(apiUrl(`/api/AI/analyze/${imageId}`), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(await parseFetchError(res));
    return (await res.json()) as AiAnalysisResult;
  },

  async getPatientHistory(patientId: number): Promise<AiHistoryItem[]> {
    if (USE_MOCK) {
      return getMockAiHistoryForPatient(patientId);
    }
    try {
      const res = await axiosInstance.get(`/api/AI/patient/${patientId}`);
      let list: any[] = [];
      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (res.data?.aiHistory && Array.isArray(res.data.aiHistory)) {
        list = res.data.aiHistory;
      }
      
      return list.map((item: any) => ({
        imageId: item.id || item.imageId,
        originalFileName: item.originalFileName,
        patientId: item.patientId,
        label: item.output?.classification || item.label,
        probability: item.output?.confidence || item.probability,
        isCancerous: item.output?.classification === 'cancerous' || item.isCancerous || false,
        analyzedAt: item.output?.processedAt || item.uploadedAt || item.analyzedAt,
        notes: item.notes
      }));
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  async deleteImage(id: number): Promise<void> {
    try {
      const { data } = await axiosInstance.delete<ApiResponse>(`/api/AI/image/${id}`);
      if (!data.success) throw new Error(data.message || "Delete failed");
    } catch (error) {
      throw new Error(await parseServiceError(error));
    }
  },

  getImageFileUrl(id: number): string {
    return apiUrl(`/api/AI/image/${id}/file`);
  },

  async fetchImageBlobUrl(id: number): Promise<string> {
    const token = readAuthToken();
    const res = await fetch(apiUrl(`/api/AI/image/${id}/file`), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to fetch image");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

export async function loadAllAiReports(
  patientIds: Array<{ id: number; name: string }>
): Promise<Array<AiHistoryItem & { patientName: string; patientId: number }>> {
  const results: Array<AiHistoryItem & { patientName: string; patientId: number }> = [];
  for (const p of patientIds) {
    try {
      const items = await aiService.getPatientHistory(p.id);
      items.forEach((item) => {
        results.push({ ...item, patientName: p.name, patientId: p.id });
      });
    } catch {
      /* skip patient on error */
    }
  }
  return results.sort((a, b) => {
    const ta = new Date(a.analyzedAt ?? 0).getTime();
    const tb = new Date(b.analyzedAt ?? 0).getTime();
    return tb - ta;
  });
}
