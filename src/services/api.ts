import type {
  ProfileFeedback,
  ConversationResponse,
  JobData,
  JobConversationResponse,
  JobCreationResponse,
} from "../types";

const API_BASE = "/api";

export async function sendMessage(
  message: string,
  conversationHistory: { role: string; content: string }[],
  profileFeedback: ProfileFeedback[]
): Promise<ConversationResponse> {
  const response = await fetch(`${API_BASE}/query/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      conversationHistory,
      profileFeedback,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao processar mensagem");
  }

  return response.json();
}

export async function exportToCsv(
  conversationHistory: { role: string; content: string }[],
  profileFeedback: ProfileFeedback[]
): Promise<Blob> {
  const response = await fetch(`${API_BASE}/query/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversationHistory,
      profileFeedback,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao exportar CSV");
  }

  return response.blob();
}

// Job API
export async function sendJobMessage(
  message: string,
  conversationHistory: { role: string; content: string }[],
  currentJobData: JobData
): Promise<JobConversationResponse> {
  const response = await fetch(`${API_BASE}/jobs/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      conversationHistory,
      currentJobData,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao processar mensagem");
  }

  return response.json();
}

export async function createJob(
  jobData: JobData
): Promise<JobCreationResponse> {
  const response = await fetch(`${API_BASE}/jobs/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao criar vaga");
  }

  return response.json();
}

export interface ExportCandidatesResponse {
  success: boolean;
  clickUpTaskId?: string;
  clickUpTaskUrl?: string;
  candidatesCount: number;
  error?: string;
}

export interface CandidateForExport {
  name: string;
  profileUrl: string;
  headline?: string;
  currentCompany?: string;
  feedback?: "interesting" | "not_interesting";
  reason?: string;
}

export async function exportCandidatesToClickUp(
  clickUpListId: string,
  jobTitle: string,
  candidates: CandidateForExport[]
): Promise<ExportCandidatesResponse> {
  const response = await fetch(`${API_BASE}/jobs/export-candidates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clickUpListId,
      jobTitle,
      candidates,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao exportar candidatos");
  }

  return response.json();
}

/**
 * Exporta TODOS os candidatos que atendem ao filtro para o ClickUp
 * (não apenas os que foram exibidos/avaliados)
 */
export async function exportAllCandidatesToClickUp(
  clickUpListId: string,
  jobTitle: string,
  conversationHistory: { role: string; content: string }[],
  profileFeedback: ProfileFeedback[]
): Promise<ExportCandidatesResponse> {
  const response = await fetch(`${API_BASE}/query/export-clickup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clickUpListId,
      jobTitle,
      conversationHistory,
      profileFeedback,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao exportar candidatos");
  }

  return response.json();
}
