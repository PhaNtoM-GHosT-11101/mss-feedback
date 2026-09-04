-- Multi-tenant performance: index institution_id / mess_id / meal_id filters.
-- Every tenant-scoped query filters on institution_id (and often mess_id), and
-- RLS applies current_institution_id() as a security barrier. None of these FK
-- columns were indexed, so tenant pages did full table scans. Add composite
-- indexes matching the real query patterns.

-- Home: WHERE institution_id=? AND is_active ORDER BY sort_order
CREATE INDEX IF NOT EXISTS meals_institution_active_idx
  ON public.meals (institution_id, is_active, sort_order);

-- Home: WHERE institution_id=? AND is_active ORDER BY created_at DESC LIMIT 3
CREATE INDEX IF NOT EXISTS announcements_institution_active_created_idx
  ON public.announcements (institution_id, is_active, created_at DESC);

-- Home: WHERE institution_id=? AND is_flagged=false LIMIT 500 (list page)
--       WHERE institution_id=? AND is_pinned/upvote (home top issues)
CREATE INDEX IF NOT EXISTS complaints_institution_created_idx
  ON public.complaints (institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS complaints_institution_pinned_upvotes_idx
  ON public.complaints (institution_id, is_pinned, upvote_count DESC);
-- Committee/top issues scoping by mess too
CREATE INDEX IF NOT EXISTS complaints_institution_mess_idx
  ON public.complaints (institution_id, mess_id);

-- Home + reports: WHERE institution_id=? [AND rating_date=?] [ORDER BY rating_date]
CREATE INDEX IF NOT EXISTS ratings_institution_date_idx
  ON public.ratings (institution_id, rating_date);

-- Home: WHERE institution_id=? ORDER BY created_at DESC LIMIT 3
CREATE INDEX IF NOT EXISTS praises_institution_created_idx
  ON public.praises (institution_id, created_at DESC);

-- Home: WHERE institution_id=? AND mess_id=? ; admin menu settings
CREATE INDEX IF NOT EXISTS mess_meal_settings_institution_mess_idx
  ON public.mess_meal_settings (institution_id, mess_id);

-- Admin menu: WHERE institution_id=? AND is_active ORDER BY name
CREATE INDEX IF NOT EXISTS messes_institution_active_name_idx
  ON public.messes (institution_id, is_active, name);

-- Admin menu: WHERE institution_id=? [AND mess_id=?] ; template/weekday filters
CREATE INDEX IF NOT EXISTS menu_items_institution_idx
  ON public.menu_items (institution_id, mess_id);

-- Profiles: WHERE institution_id=? (admin users/onboard), WHERE id=? (PK)
CREATE INDEX IF NOT EXISTS profiles_institution_idx
  ON public.profiles (institution_id);

-- Notifications: WHERE institution_id=? AND user_id=? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS notifications_institution_user_idx
  ON public.notifications (institution_id, user_id, created_at DESC);

-- Admin: WHERE institution_id=? ; admin_members scoped by mess too
CREATE INDEX IF NOT EXISTS admin_members_institution_idx
  ON public.admin_members (institution_id);
CREATE INDEX IF NOT EXISTS admin_members_institution_mess_idx
  ON public.admin_members (institution_id, mess_id);

-- Comments/upvotes/flags: RLS + admin pages filter by institution_id
CREATE INDEX IF NOT EXISTS complaint_comments_institution_idx
  ON public.complaint_comments (institution_id, complaint_id, created_at);
CREATE INDEX IF NOT EXISTS complaint_upvotes_institution_idx
  ON public.complaint_upvotes (institution_id, complaint_id);
CREATE INDEX IF NOT EXISTS complaint_flags_institution_idx
  ON public.complaint_flags (institution_id, complaint_id);

-- complaint_categories: WHERE institution_id=? AND is_active ORDER BY sort_order
CREATE INDEX IF NOT EXISTS complaint_categories_institution_active_idx
  ON public.complaint_categories (institution_id, is_active, sort_order);