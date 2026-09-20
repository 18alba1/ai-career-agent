export type InterviewLanguage = "en" | "sv";
export type AnswerMode = "silence" | "button";
export type ThinkTime = 0 | 5 | 10 | 15 | 30;

export interface JobListItem {
  id: number;
  title: string;
  company: string;
}

export type QuestionCategory = "technical" | "project" | "behavioral" | "motivation";
export type QuestionBasis =
  | "candidate_experience"
  | "candidate_project"
  | "candidate_skill"
  | "job_requirement"
  | "general";

export interface InterviewQuestion {
  category: QuestionCategory;
  question: string;
  purpose: string;
  basis: QuestionBasis;
}

export interface InterviewTurn {
  question: string;
  answer: string;
  category: QuestionCategory;
  basis: QuestionBasis;
}

export interface NextQuestionRequest {
  history: { question: string; answer: string }[];
  language: InterviewLanguage;
}

export interface InterviewEvaluationRequest {
  question: string;
  answer: string;
  question_category: string;
  question_basis: string;
}

export interface InterviewEvaluation {
  overall_score: number;
  relevance_score: number;
  clarity_score: number;
  grounding_score: number;
  category_specific_score: number;
  category_specific_label: string;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

export interface InterviewReportRequest {
  history: InterviewTurn[];
  evaluations: InterviewEvaluation[];
}

export interface InterviewReport {
  overall_score: number;
  technical_score: number;
  behavioral_score: number;
  communication_score: number;
  grounding_score: number;
  strongest_answers: string[];
  weakest_answers: string[];
  recurring_strengths: string[];
  recurring_weaknesses: string[];
  recommendations: string[];
  summary: string;
}

export interface TranscribeResponse {
  transcript: string;
}
