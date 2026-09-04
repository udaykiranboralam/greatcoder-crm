import type {
  User,
  Lead,
  Course,
  Conversation,
  ChatMessage,
  Demo,
  FollowUp,
  UserRole,
  LeadStatus,
  LeadTemperature,
  LeadSource,
  DemoStatus,
  FollowUpPriority,
  FollowUpStatus,
  LearningMode,
  IntentLevel,
  Sentiment,
} from "@prisma/client";

export type {
  UserRole,
  LeadStatus,
  LeadTemperature,
  LeadSource,
  DemoStatus,
  FollowUpPriority,
  FollowUpStatus,
  LearningMode,
  IntentLevel,
  Sentiment,
};

// Re-export Prisma entity types for convenience
export type {
  User,
  Lead,
  Course,
  Conversation,
  ChatMessage,
  Demo,
  FollowUp,
};

// ─── Lead types ────────────────────────────────────────────────────

export interface LeadWithRelations extends Lead {
  conversations?: Conversation[];
  demos?: Demo[];
  followUps?: FollowUp[];
  interestedCourse?: Course | null;
  assignedCounselor?: User | null;
}

export interface LeadScoreInput {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  qualification?: string | null;
  experience?: string | null;
  currentRole?: string | null;
  currentLocation?: string | null;
  interestedCourse?: string | null;
  careerGoal?: string | null;
  demoInterest?: boolean;
  preferredCallbackTime?: string | null;
  learningMode?: LearningMode | null;
  isFresher?: boolean | null;
  joiningTimeline?: string | null;
  questionsAsked?: string[];
  messageCount?: number;
  conversationSentiment?: Sentiment | null;
}

export interface ScoreBreakdown {
  courseInterest: number;
  careerUrgency: number;
  demoInterest: number;
  callbackInterest: number;
  phoneProvided: number;
  education: number;
  experience: number;
  location: number;
  timeline: number;
  questionsAsked: number;
  intentSignals: number;
}

export interface LeadScoreOutput {
  score: number;
  temperature: LeadTemperature;
  intentLevel: IntentLevel;
  sentiment: Sentiment;
  recommendedNextAction: string;
  probabilityDemoBooking: number;
  probabilityAdmission: number;
  breakdown: ScoreBreakdown;
}

// ─── Course Recommendation ─────────────────────────────────────────

export interface RecommendationInput {
  interests?: string;
  careerGoal?: string;
  background?: string;
  qualification?: string;
  experience?: string;
  currentRole?: string;
  isFresher?: boolean;
  age?: number;
}

export interface AlternativeCourse {
  courseId: string;
  courseName: string;
  confidence: number;
  reason: string;
}

export interface CourseRecommendation {
  courseId: string;
  courseName: string;
  confidence: number;
  reasoning: string;
  alternatives: AlternativeCourse[];
}

// ─── AI Service ────────────────────────────────────────────────────

export type DetectedLanguage = "english" | "telugu" | "tanglish";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIGenerateOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

export interface AIGenerateResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ─── Dashboard / Analytics ─────────────────────────────────────────

export interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  demoScheduled: number;
  demosToday: number;
  conversions: number;
  pendingFollowUps: number;
  avgLeadScore: number;
}

export interface LeadTrendPoint {
  date: string;
  count: number;
}

export interface SourceDistribution {
  source: LeadSource;
  count: number;
}

export interface StatusDistribution {
  status: LeadStatus;
  count: number;
}

export interface ConversionFunnel {
  totalLeads: number;
  demoScheduled: number;
  demosAttended: number;
  converted: number;
}

// ─── API Response ──────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Form / Chat Event types ───────────────────────────────────────

export interface LeadExtraction {
  name?: string;
  email?: string;
  phone?: string;
  qualification?: string;
  experience?: string;
  currentRole?: string;
  currentLocation?: string;
  interestedCourse?: string;
  careerGoal?: string;
  demoInterest: boolean;
  preferredCallbackTime?: string;
  learningMode?: LearningMode;
  isFresher?: boolean;
  joiningTimeline?: string;
  questionsAsked?: string[];
}

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
