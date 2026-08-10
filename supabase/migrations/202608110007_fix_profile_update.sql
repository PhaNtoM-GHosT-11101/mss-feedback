-- Missing UPDATE grant for profiles (onboarding saves mess_id/roll_no)
grant update (full_name, roll_no, mess_id)
  on public.profiles to authenticated;
