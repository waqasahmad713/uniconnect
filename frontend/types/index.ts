export type UserPublic = {
  id: string;
  username: string;
  full_name: string;
  university: string;
  department: string;
  role: string;
  batch: string | null;
  bio: string | null;
  current_job: string | null;
  company: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  profile_picture_url: string | null;
  affiliation_verified: boolean;
  skills: string[];
};

export type UserMe = UserPublic & {
  email: string;
  email_verified: boolean;
  is_admin: boolean;
};

export type ApiHealth = {
  status: string;
  service: string;
  database: "connected" | "disconnected";
  environment: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  post_type: string;
  tags: string[];
  created_at: string;
  like_count: number;
  comment_count: number;
  liked: boolean;
  saved: boolean;
  is_owner: boolean;
  image_url: string | null;
  github_url: string | null;
  external_url: string | null;
  author: UserPublic;
};

export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  description: string;
  opportunity_type: string;
  location: string | null;
  work_mode: string;
  deadline: string | null;
  application_url: string | null;
  skills: string[];
  author_name: string;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  location: string | null;
  is_online: boolean;
  organizer_name: string;
};
