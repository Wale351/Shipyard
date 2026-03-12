export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  website_url?: string;
  twitter_handle?: string;
  github_handle?: string;
  role?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface App {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  github_url?: string;
  builder_id: string;
  category_id?: string;
  tech_stack: string[];
  screenshots?: string[];
  build_time?: string;
  status?: string;
  is_featured?: boolean;
  created_at: string;
  
  // Joined relations for UI
  builder?: User;
  category?: Category;
  votes_count?: number;
  comments_count?: number;
  trending_score?: number;
}

export interface Vote {
  id: string;
  user_id: string;
  app_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  app_id: string;
  parent_id?: string;
  content: string;
  created_at: string;
  
  // Joined relations for UI
  user?: User;
}

export interface Follower {
  id: string;
  follower_id: string;
  builder_id: string;
  created_at: string;
}

