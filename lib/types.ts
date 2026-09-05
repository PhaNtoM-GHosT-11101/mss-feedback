export type Mess = {
  id: string;
  name: string;
  is_active: boolean;
  mess_type?: "none" | "veg" | "non_veg";
};

export type Category = {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  is_mess: boolean | null;
};

export type Meal = {
  id: string;
  name: string;
  start_hour: number;
  end_hour: number;
  sort_order: number;
  is_active: boolean;
};

export type Profile = {
  id: string;
  full_name: string;
  roll_no: string | null;
  mess_id: string | null;
  is_banned: boolean;
};

export type Complaint = {
  id: string;
  category_id: string | null;
  mess_id: string | null;
  title: string;
  description: string;
  is_anonymous: boolean;
  status: "new" | "in_progress" | "resolved";
  resolution_note: string | null;
  photo_urls: string[];
  upvote_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  // via security-definer functions (not the user_id column)
  complaint_author?: string | null;
  complaint_author_roll?: string | null;
  // server-side only (service role); column hidden from authenticated
  user_id?: string | null;
  closed_by?: "student" | "committee" | null;
  // extra from joins on the server
  category?: { name: string } | null;
  mess?: { name: string } | null;
  author_name?: string | null;
  author_roll?: string | null;
};

export type Comment = {
  id: string;
  complaint_id: string;
  body: string;
  is_deleted: boolean;
  created_at: string;
  author_name?: string | null;
  comment_author?: string | null;
};

export type Rating = {
  id: string;
  meal_id: string;
  stars: number;
  comment: string | null;
  rating_date: string;
  created_at: string;
};

export type Praise = {
  id: string;
  mess_id: string | null;
  text: string;
  is_anonymous: boolean;
  created_at: string;
  author_name?: string | null;
  praise_author?: string | null;
};

export type MenuItem = {
  id: string;
  meal_id: string;
  mess_id: string | null;
  item_text: string;
  menu_date: string | null;
  weekday: number | null;
  is_template: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  is_active: boolean;
  created_at: string;
};

export type MealAverage = {
  meal_id: string;
  avg: number;
  count: number;
};

export type SettingValue = {
  daily_complaint_limit?: number;
};
