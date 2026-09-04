import {
  LeadTemperature,
  IntentLevel,
  Sentiment,
} from "@prisma/client";
import type {
  LeadScoreInput,
  LeadScoreOutput,
  ScoreBreakdown,
} from "@/types";

// ─── Scoring Weights ────────────────────────────────────────────────

const WEIGHTS = {
  courseInterest: 15,
  careerUrgency: 12,
  demoInterest: 15,
  callbackInterest: 8,
  phoneProvided: 10,
  education: 8,
  experience: 8,
  location: 5,
  timeline: 10,
  questionsAsked: 5,
  intentSignals: 4,
};

const TOTAL_MAX_SCORE = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

// ─── Individual Score Functions ─────────────────────────────────────

function scoreCourseInterest(interest?: string | null): number {
  if (!interest) return 0;
  const lowest = ["exploring", "not sure", "just browsing", "confused"];
  if (lowest.some((w) => interest.toLowerCase().includes(w))) {
    return Math.round(WEIGHTS.courseInterest * 0.3);
  }
  return WEIGHTS.courseInterest;
}

function scoreCareerUrgency(goal?: string | null): number {
  if (!goal) return 0;
  const urgent = [
    "career change", "immediately", "asap", "need job", "switch", "transition",
    "career switch", "trying to get in", "looking for job", "get placed",
  ];
  const isUrgent = urgent.some((w) => goal.toLowerCase().includes(w));
  return isUrgent ? WEIGHTS.careerUrgency : Math.round(WEIGHTS.careerUrgency * 0.7);
}

function scoreDemoInterest(demoInterest: boolean): number {
  return demoInterest ? WEIGHTS.demoInterest : 0;
}

function scoreCallbackInterest(callbackTime?: string | null): number {
  if (!callbackTime) return 0;
  return WEIGHTS.callbackInterest;
}

function scorePhoneProvided(phone?: string | null): number {
  if (!phone) return 0;
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) return WEIGHTS.phoneProvided;
  if (digits.length >= 7) return Math.round(WEIGHTS.phoneProvided * 0.6);
  return Math.round(WEIGHTS.phoneProvided * 0.3);
}

function scoreEducation(qualification?: string | null): number {
  if (!qualification) return 0;
  const q = qualification.toLowerCase();
  if (/b\.?tech|bachelor|be\b|b\.e|m\.tech|mca|msc|bsc/.test(q)) {
    return WEIGHTS.education;
  }
  if (/intermediate|diploma|12th|polytechnic/.test(q)) {
    return Math.round(WEIGHTS.education * 0.7);
  }
  return Math.round(WEIGHTS.education * 0.5);
}

function scoreExperience(experience?: string | null, isFresher?: boolean | null): number {
  if (isFresher === true || (experience && experience.toLowerCase().includes("fresher"))) {
    return Math.round(WEIGHTS.experience * 0.6);
  }
  if (!experience) return 0;
  const match = experience.match(/(\d+)/);
  if (match) {
    const years = parseInt(match[1]);
    if (years >= 5) return WEIGHTS.experience;
    if (years >= 2) return Math.round(WEIGHTS.experience * 0.9);
    if (years >= 1) return Math.round(WEIGHTS.experience * 0.75);
  }
  return Math.round(WEIGHTS.experience * 0.4);
}

function scoreLocation(location?: string | null): number {
  if (!location) return 0;
  const nearby = ["hyderabad", "secunderabad", "madapur", "madapura", "gachibowli",
    "kondapur", "hitech", "cyberabad", "madhapur"];
  const l = location.toLowerCase();
  if (nearby.some((n) => l.includes(n))) return WEIGHTS.location;
  return Math.round(WEIGHTS.location * 0.6);
}

function scoreTimeline(timeline?: string | null): number {
  if (!timeline) return 0;
  const t = timeline.toLowerCase();
  if (/immediately|now|asap|within a week|this month|within 2 weeks/.test(t)) {
    return WEIGHTS.timeline;
  }
  if (/within a month|next month|1 month|soon/.test(t)) {
    return Math.round(WEIGHTS.timeline * 0.8);
  }
  if (/3 months|quarter|few months/.test(t)) {
    return Math.round(WEIGHTS.timeline * 0.5);
  }
  if (/6 months|next year|year/.test(t)) {
    return Math.round(WEIGHTS.timeline * 0.2);
  }
  return Math.round(WEIGHTS.timeline * 0.4);
}

function scoreQuestionsAsked(questions?: string[]): number {
  if (!questions || questions.length === 0) return 0;
  if (questions.length >= 5) return WEIGHTS.questionsAsked;
  if (questions.length >= 3) return Math.round(WEIGHTS.questionsAsked * 0.7);
  return Math.round(WEIGHTS.questionsAsked * 0.3);
}

function scoreIntentSignals(
  demoInterest: boolean,
  callbackTime?: string | null,
  sentiment?: Sentiment | null,
  messageCount?: number
): number {
  let score = 0;
  const max = WEIGHTS.intentSignals;

  if (demoInterest) score += max * 0.3;
  if (callbackTime) score += max * 0.2;
  if (sentiment === "POSITIVE") score += max * 0.25;
  if (messageCount && messageCount >= 5) score += max * 0.15;
  if (messageCount && messageCount >= 10) score += max * 0.1;

  return Math.min(Math.round(score), max);
}

// ─── Temperature & Intent Classification ────────────────────────────

function classifyTemperature(score: number): LeadTemperature {
  if (score >= 75) return "HOT";
  if (score >= 45) return "WARM";
  return "COLD";
}

function classifyIntentLevel(score: number, demoInterest: boolean): IntentLevel {
  if (score >= 70 || demoInterest) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function classifySentiment(
  explicitSentiment?: Sentiment | null,
  score?: number
): Sentiment {
  if (explicitSentiment) return explicitSentiment;
  if (score && score >= 70) return "POSITIVE";
  if (score && score < 30) return "NEGATIVE";
  return "NEUTRAL";
}

// ─── Next Action Recommendation ────────────────────────────────────

function recommendNextAction(
  temperature: LeadTemperature,
  intentLevel: IntentLevel,
  demoInterest: boolean,
  hasPhone: boolean,
  sentiment: Sentiment
): string {
  if (temperature === "HOT" && hasPhone) {
    if (demoInterest)
      return "Call immediately to confirm demo slot and discuss enrollment.";
    return "Counselor should call within the next available working period.";
  }
  if (temperature === "WARM" && hasPhone) {
    return "Schedule a follow-up call within 24-48 hours and send course details.";
  }
  if (intentLevel === "HIGH")
    return "Positive follow-up within today; send WhatsApp with course brochure.";
  if (temperature === "COLD")
    return "Add to nurture sequence; send occasional course updates and offers.";
  return "Send course information and check in after a few days.";
}

// ─── Probability Estimations ───────────────────────────────────────

function estimateDemoBookingProbability(
  score: number,
  demoInterest: boolean,
  temperature: LeadTemperature
): number {
  let base = score / 100;
  if (demoInterest) base = Math.min(base + 0.2, 1);
  if (temperature === "WARM") base = Math.min(base + 0.1, 1);
  if (temperature === "COLD") base = base - 0.1;
  return Math.round(Math.max(0, Math.min(base, 1)) * 100) / 100;
}

function estimateAdmissionProbability(
  score: number,
  temperature: LeadTemperature,
  demoInterest: boolean,
  sentiment?: Sentiment
): number {
  let base = score / 100 * 0.8;
  if (demoInterest) base += 0.1;
  if (temperature === "HOT") base = Math.min(base + 0.1, 1);
  if (sentiment === "POSITIVE") base = Math.min(base + 0.05, 1);
  return Math.round(Math.max(0, Math.min(base, 1)) * 100) / 100;
}

// ─── Main Scoring Function ─────────────────────────────────────────

export function calculateLeadScore(input: LeadScoreInput): LeadScoreOutput {
  const demoInterest = input.demoInterest ?? false;
  const breakdown: ScoreBreakdown = {
    courseInterest: scoreCourseInterest(input.interestedCourse),
    careerUrgency: scoreCareerUrgency(input.careerGoal),
    demoInterest: scoreDemoInterest(demoInterest),
    callbackInterest: scoreCallbackInterest(input.preferredCallbackTime),
    phoneProvided: scorePhoneProvided(input.phone),
    education: scoreEducation(input.qualification),
    experience: scoreExperience(input.experience, input.isFresher),
    location: scoreLocation(input.currentLocation),
    timeline: scoreTimeline(input.joiningTimeline),
    questionsAsked: scoreQuestionsAsked(input.questionsAsked),
    intentSignals: scoreIntentSignals(
      demoInterest,
      input.preferredCallbackTime,
      input.conversationSentiment,
      input.messageCount
    ),
  };

  const rawScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const normalizedScore = Math.round((rawScore / TOTAL_MAX_SCORE) * 100);
  const score = Math.min(Math.max(normalizedScore, 0), 100);

  const temperature = classifyTemperature(score);
  const intentLevel = classifyIntentLevel(score, demoInterest);
  const sentiment = classifySentiment(input.conversationSentiment, score);
  const recommendedNextAction = recommendNextAction(
    temperature,
    intentLevel,
    demoInterest,
    !!input.phone,
    sentiment
  );
  const probabilityDemoBooking = estimateDemoBookingProbability(
    score,
    demoInterest,
    temperature
  );
  const probabilityAdmission = estimateAdmissionProbability(
    score,
    temperature,
    demoInterest,
    sentiment
  );

  return {
    score,
    temperature,
    intentLevel,
    sentiment,
    recommendedNextAction,
    probabilityDemoBooking,
    probabilityAdmission,
    breakdown,
  };
}
