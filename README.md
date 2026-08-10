# MSS Feedback — NIT Agartala

Complaint & food-rating system for the NIT Agartala Mess & Service Society (MSS).

## Features
- **Daily food ratings** — 1–5 stars for Morning / Afternoon / Evening / Night meals, meal-hour windows, anonymous, public daily averages + weekly/monthly trend charts
- **Complaints** — categories (food, staff, cleanliness, infrastructure, other), photo attachments, optional anonymity, upvotes (1/user), comments, spam flags, status flow (New → In Progress → Resolved)
- **Praise wall** — commend the mess for great food & staff
- **Menu board** — daily menu + weekly template
- **Super-admin panel** — edit categories, meal slots & hours, messes, limits; manage users (ban/delete/reset); moderate complaints/ratings/comments; CSV exports; stats dashboard; announcements; email settings
- **Committee roles** — invited members can reply to complaints and view reports
- **Email alerts** — daily digest to committee, status-change emails to students
- Mobile-first, dark/light mode, English + Hindi

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres, Google Auth, Storage, RLS)
- Resend (transactional email)
- Hosted on Vercel

## Development
```bash
npm install
npm run dev
```
