export type RoadmapStatus = "now" | "next" | "later" | "done" | "blocked";

export type ArtifactType =
  | "project"
  | "paper"
  | "competition"
  | "talk"
  | "award"
  | "dataset";

export interface Milestone {
  date: string;
  status: RoadmapStatus;
  evidence?: string;
  note?: string;
}

export interface RoadmapNode {
  title: string;
  slug: string;
  track: string;
  status: RoadmapStatus;
  summary: string;
  cover?: string;
  highlights: string[];
  milestones: Milestone[];
  related_posts: string[];
  related_artifacts: string[];
  progress?: number;
  last_updated: string;
}

export interface BlogPost {
  title: string;
  slug: string;
  date: string;
  tags: string[];
  summary: string;
  cover?: string;
  collection: string;
  related_nodes: string[];
  reading_time?: number;
  updated_at?: string;
}

export interface HeroMetric {
  label: string;
  value: string;
  detail?: string;
  icon?: string;
}

export interface Artifact {
  title: string;
  slug: string;
  type: ArtifactType;
  date: string;
  venue?: string;
  summary: string;
  links: { label: string; url: string }[];
  tags: string[];
  related_nodes: string[];
  cover?: string;
}

