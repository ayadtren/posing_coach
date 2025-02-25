// User types
export type UserRole = 'athlete' | 'coach' | 'admin';
export type SubscriptionTier = 'free' | 'premium' | 'elite';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  subscription_tier: SubscriptionTier;
  competition_date?: string;
  division?: string;
  height?: number;
  weight?: number;
  created_at: string;
  updated_at: string;
}

// Pose types
export type PoseCategory = 'front' | 'back' | 'side' | 'transitions' | 'mandatory' | 'custom';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export interface PoseTutorial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: PoseCategory;
  difficulty: DifficultyLevel;
  duration: number; // in seconds
  requires_subscription: SubscriptionTier;
  coach_id: string;
  created_at: string;
  updated_at: string;
}

// Progress tracking
export interface UserRecording {
  id: string;
  user_id: string;
  pose_id?: string;
  video_url: string;
  thumbnail_url: string;
  duration: number;
  notes?: string;
  created_at: string;
}

export interface CoachFeedback {
  id: string;
  recording_id: string;
  coach_id: string;
  text_feedback?: string;
  audio_feedback_url?: string;
  video_annotations?: string; // JSON string of annotations
  rating: number; // 1-10
  created_at: string;
}

// Training plans
export interface TrainingPlan {
  id: string;
  title: string;
  description: string;
  duration_weeks: number;
  difficulty: DifficultyLevel;
  requires_subscription: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

export interface DailyAssignment {
  id: string;
  plan_id: string;
  day_number: number;
  title: string;
  description: string;
  pose_ids: string[]; // Array of pose IDs to practice
  duration_minutes: number;
  created_at: string;
} 