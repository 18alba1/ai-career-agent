export interface CandidateListItem {
  id: number;
  name: string;
  summary: string | null;
}

export interface Experience {
  company: string;
  role: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  description: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
}

export interface CandidateProfile {
  name: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  languages: string[];
}