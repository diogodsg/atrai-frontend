export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  profiles?: Profile[];
  totalProfiles?: number;
  searchCriteria?: string;
  query?: string;
}

export interface Profile {
  profile_id: string;
  full_name: string;
  headline: string;
  current_job_title: string;
  current_company: string;
  seniority: string;
  city: string;
  state: string;
  profile_url: string;
  profile_image_url?: string;
  about_me?: string;
  area?: string;
  macroarea?: string;
}

export interface ProfileFeedback {
  profileId: string;
  profileName: string;
  interesting: boolean;
  reason?: string;
  removed?: boolean;
}

export interface ConversationResponse {
  query: string;
  explanation: string;
  data: Profile[];
  totalRows: number;
  assistantMessage: string;
  searchCriteria: string;
}

// Job types
export interface JobData {
  title?: string;
  area?: string;
  seniority?: "Junior" | "Pleno" | "Sênior";
  openingReason?: "Substituição" | "Aumento de time" | "Novo projeto";
  challenges?: string;
  reportsTo?: string;
  influenceOver?: string;
  responsibilities?: string[];
  first3MonthsDeliverables?: string;
  criticalRoutines?: string;
  technicalSkills?: string[];
  behavioralSkills?: string[];
  preferredExperience?: string;
  metricsAndKPIs?: string;
  workFormat?: "Presencial" | "Híbrido" | "Remoto";
  hybridDays?: string;
  salary?: string;
  benefits?: string;
  contractType?: "CLT" | "PJ" | "Estágio";
  additionalNotes?: string;
}

export interface JobConversationResponse {
  assistantMessage: string;
  currentJobData: JobData;
  isComplete: boolean;
  missingFields: string[];
}

export interface JobCreationResponse {
  job: JobData;
  clickUpListId?: string;
  clickUpListUrl?: string;
  searchQuery: string;
}
