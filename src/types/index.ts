export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'movie' | 'series' | 'anime' | 'manga';
  description: string;
  image_url: string;
  release_date: string;
  rating: number;
  rating_count: number;
  genre: string[];
  status: 'completed' | 'ongoing' | 'upcoming';
  episodes?: number;
  chapters?: number;
  created_at: string;
}

export interface UserMediaList {
  id: string;
  user_id: string;
  media_id: string;
  status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped' | 'on_hold';
  rating?: number;
  progress: number;
  is_public: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  media_id?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  media?: MediaItem;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  parent_id?: string;
  created_at: string;
  user?: User;
  replies?: Comment[];
}

export interface Rating {
  id: string;
  user_id: string;
  media_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
}