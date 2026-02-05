export type ApiList<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
} | T[];

export type Category = {
  id: number;
  short_name: string;
  long_name: string;
  img_url: string;
};

export type UserPublic = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  account_type?: number;
  is_staff?: boolean;
  icon_id?: number;
  icon64_url?: string | null;
  icon170_url?: string | null;
};

export type UserDetail = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_business: boolean;
  is_staff: boolean;
  icon64_url?: string | null;
  icon170_url?: string | null;
};

export type Problem = {
  id: number;
  title: string;
  time_limit: number;
  memory_limit: number;
  statement: string;
  editorial: string;
  categories: Category[];
  code?: string;
};

export type ProblemListItem = {
  id: number;
  title: string;
  time_limit: number;
  memory_limit: number;
  categories: Category[];
  solved_count: number;
  user_status: "solved" | "attempted" | "none";
};

export type Submission = {
  id: number;
  user: UserPublic;
  problem: Problem;
  verdict: string | null;
  verdict_code: string | null;
  verdict_testcase: number | null;
  time: number | null;
  memory: number | null;
  language: string;
  code: string;
  send_time: string;
  updated_at: string;
};

export type SubmissionListItem = {
  id: number;
  user_id: number;
  username: string;
  problem_id: number;
  problem_title: string;
  verdict: string | null;
  verdict_code: string | null;
  verdict_testcase: number | null;
  time: number | null;
  memory: number | null;
  language: string;
  send_time: string;
  updated_at: string;
};

export type SalaryRange = {
  min?: number | string;
  max?: number | string;
  currency?: string;
};

export type Job = {
  id: number;
  title: string;
  location: string;
  user: UserPublic;
  salary_range: SalaryRange | null;
  info: string;
  created_at: string;
};

export type JobListItem = {
  id: number;
  title: string;
  location: string;
  user_id: number;
  username: string;
  salary_range: SalaryRange | null;
  created_at: string;
};
