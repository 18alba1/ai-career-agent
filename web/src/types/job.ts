export interface Job {
  id: number;
  title: string;
  company: string;
  description: string;
  url: string | null;
  created_at: string;
}

export interface JobCreate {
  title: string;
  company: string;
  description: string;
  url?: string | null;
}

export type RequirementImportance =
  | "required"
  | "preferred";

export interface JobRequirement {
  name: string;
  importance: RequirementImportance;
}

export interface JobRequirements {
  technical_skills: JobRequirement[];
  soft_skills: JobRequirement[];
  experience_requirements: JobRequirement[];
  education_requirements: JobRequirement[];
  languages: JobRequirement[];
}

export interface JobFitRequirementMatch {
  requirement: string;
  importance: RequirementImportance;
  category: string;
  similarity: number;
  status: string;
  evidence: string;
}

export interface JobFit {
  candidate_id: number;
  job_id: number;
  overall_score: number;

  category_scores: {
    technical: number;
    soft: number;
    experience: number;
    education: number;
    languages: number;
  };

  requirement_matches: JobFitRequirementMatch[];
}