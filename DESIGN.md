# MSS Feedback — Full Design & Product Spec (from 100-question interview)

**Soul:** Calm · Clean · Minimal structure with Electric-Youth energy. "Built by a prodigy, not an AI."
**Voice:** Both student-first and official. Full creative freedom granted. Judge by sight.

---

## 1. Identity

- **Name:** suggest + tagline under logo (user will pick)
- **Logo:** designer's choice (bowl/plate mark concept)
- **Mascot:** yes, small plate/bowl character for empty states + login
- **Tagline:** yes, under name
- **Greeting:** personal greeting + date on home ("Good evening, Aditya · Thu 13 Aug")

## 2. Color System

- **Signature:** GOLDEN AMBER (primary actions, stars, highlights)
- **Accents:** 2–3 controlled — amber + deep green (sage) + warm plum; neutral warm grays
- **Light bg:** complete redesign, warm cream family
- **Dark mode:** GREEN-BLACK (deep forest-charcoal), not brown
- **Meals color-coded:** Breakfast = sunrise amber · Lunch = tomato/terracotta · Dinner = plum
- **Stars:** amber gold
- **Status chips:** designer's choice (soft pastels w/ strong text)
- **Admin:** calmer, more professional variant of same palette
- **Charts:** on-theme (amber + sage + plum series), honest scales (0-based)

## 3. Typography

- **Display/headings:** Space Grotesk (bold, technical-cool)
- **Body:** designer's choice (Inter kept, tuned)
- **Numbers/stats:** big display numerals (tabular for alignment)
- **Base size:** normal

## 4. Layout & Screens

- **Desktop:** SIDEBAR app layout (student + admin)
- **Mobile:** sticky header that SHRINKS on scroll + bottom nav
- **Home order:** designer's choice — announcement → greeting → meal ratings → menu → CTA → highlights/stats → issues → praise
- **Login:** SPLIT SCREEN on desktop (brand left, auth right); branded splash mobile
- **Profile:** hero card (emoji avatar, name, mess) + my stats (ratings/complaints/praises) + settings
- **Onboarding:** designer's choice — name + mess picker (multi-mess!)
- **Empty states:** custom illustration + text (plate mascot)
- **Complaints:** status tabs (Open/Resolved), pinned on top, filters (no search), WhatsApp share, animations
- **Praise:** TICKET/RECEIPT style cards
- **Announcements:** designer's choice (notice board section)

## 5. Components & Motion

- **Buttons:** designer's choice (chunky rounded, amber primary, ink secondary)
- **Press feedback:** bounce + ripple/sheen
- **Cards:** soft shadow + hairline border, LIFT on hover
- **Page transitions:** STAGGERED ENTRANCE
- **Scroll:** FADE-UP staggered
- **Dark toggle:** SOFT CROSSFADE
- **Avatars:** EMOJI AVATARS (user picks)
- **Icons:** CUSTOM icons (hand-crafted SVG set)
- **Loading:** skeletons + branded spinner
- **Rating:** EMOJI FACES (😖😕😐🙂🤩) + optional note
- **Success:** confetti burst on praise, check + glow on rating
- **Respect OS "reduce motion"**

## 6. Statistics (the centerpiece)

### Student (mini on home + full Stats page)
- Live averages per meal
- 7/30-day trend lines per meal
- Highlights: best/worst day, top dish
- Meal comparison (breakfast vs lunch vs dinner)
- Complaint stats (resolution speed, own complaints)
- Personal history (my ratings over time)
- Streaks + badges (gamification)

### Admin (dashboard + reports page)
- Daily average trend per meal (line)
- Rating distribution histogram (1★–5★)
- Complaints status donut
- Complaints over time (area)
- Resolution time (avg)
- Category breakdown
- Praise trend
- Engagement (active users)
- Weekly report (dashboard card + dedicated page)
- Meal-by-meal breakdown table

### Chart behavior
- Time ranges: presets (7/30/90/All) + custom date picker
- % change badges vs previous period
- Tooltips, legend toggle, animated draw-in, drill-down
- Narrative summary captions ("Lunch up 0.4★ this week")
- PNG export of charts
- Refresh on load

## 7. Multi-Mess Architecture

- Multiple messes (Eastern, Northern, Gargi exist; more later)
- Super admin (Aditya) creates messes, assigns committee members PER MESS with limited power; super admin retains ultimate power
- Students pick ONE mess at onboarding/profile
- Per-mess meal STRUCTURE differs (veg vs non-veg mess have different meals)
- Analytics separate per mess (no cross-mess comparison initially)
- Mess labels: real names

## 8. Rules & Features

- Rating: one per meal per day (cap kept), windows kept (configurable)
- Complaint categories: FIXED list + free text ("Other")
- Complaint photos: keep + polish gallery
- Anonymity: keep for both complaints + praise
- Resolution: both sides can close (admin marks resolved, student can close own)
- Veg marking: green dot on veg dishes (menu_items.is_veg)
- Menu: weekly template + daily override (polish current UX, calendar-style editor)
- Notification: PUSH when complaint resolved + in-app
- Sharing: WhatsApp share of complaint
- Language: English

## 9. Delivery

- Both redesign + stats together
- Phase order: foundation → identity → screens → student stats → admin analytics → multi-mess admin → features (streaks/push/share) → verify/deploy
- Rollback tag: ui-polish-baseline; commits on main
