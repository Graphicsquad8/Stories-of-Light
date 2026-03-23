# Stories of Light - Islamic Stories Blog

## Overview
"Stories of Light" is an English-language Islamic stories blog designed for Western audiences. Its primary purpose is to offer inspiring Islamic narratives through a public-facing platform, user accounts, and an administrative dashboard. The project aims to provide a rich content experience, including a comprehensive "Books" section offering both free online reading and affiliate links for paid books. The platform emphasizes user engagement through features like bookmarking and reading progress tracking, while enabling robust content management for administrators.

## Dua Section
- **Public listing** (`/duas`): Shows published dua collections with search, cards, empty states.
- **Public reader** (`/duas/:slug`): Multi-part reader with Arabic text (RTL, Amiri font), English translation, and Explanation & Virtues pages. Side panel lists all duas in the collection. Navigation buttons to step through parts and pages.
- **Admin management** (`/admin/duas`): CRUD for dua collections. Toggle published/draft via switch. Link to edit individual duas per collection.
- **Admin editor** (`/admin/duas/:id/edit`): Add/edit/delete individual duas within a collection. Fields: Title, Arabic text, English translation, Explanation & Virtues. Accordion list with field preview.
- **DB tables**: `duas` (id, title, slug, description, thumbnail, orderIndex, published, deletedAt, createdAt, updatedAt) and `dua_parts` (id, duaId, title, arabicText, translation, explanation, orderIndex, createdAt).
- **API routes**: `GET/POST /api/duas`, `GET /api/duas/:slug` (public, published only). `GET/POST/PATCH/DELETE /api/admin/duas/:id`, `POST /api/admin/duas/:id/parts`, `PATCH/DELETE /api/admin/dua-parts/:id`, `POST /api/admin/duas/:id/reorder-parts`.
- **Sidebar**: "Duas" appears in admin sidebar with Moon icon, requires `books` permission (same as books section).
- **Footer categories**: Admin can choose which categories appear in the footer from `/admin/footer`. Stored as JSON array in `footerCategoryIds` setting. Empty = show all.

## Footer Management System
- **Admin page** (`/admin/footer`): Admin-only. Manage all footer content from one place.
- **Website Name**: Editable from Footer Management, stored in `siteSettings` as `siteName`. Appears in header and footer.
- **Footer Description**: Editable, stored as `footerDescription`. Appears below site name in footer.
- **Social Media Links**: Dynamic, stored as JSON array in `socialLinks` setting. Admin selects platform (Facebook, X/Twitter, Instagram, YouTube, TikTok, LinkedIn, Pinterest, Telegram, WhatsApp, Snapchat) + URL. Icons shown horizontally in footer below site name. Social icons use `react-icons/fa6`.
- **About Pages**: Full CRUD via `footer_pages` DB table (id, title, slug, content, orderIndex, published). Shown as links in footer About column. Public URL: `/page/:slug`. Admin can create/edit/delete/publish-toggle pages with article-style content.
- **Admin link removed**: "Admin" link removed from public footer. Admin panel accessible only via `/image` (hidden) or `/admin/login`.
- **Hidden login route**: `/image` → shows Admin Login page for security.
- **Social Media moved**: Social media settings removed from Admin Settings page, now managed exclusively in Footer Management.

## User Dashboard (v2)
- **Route**: `/dashboard` — replaces both the old `/dashboard` and `/profile` pages (profile now redirects to dashboard)
- **Layout**: Admin-panel-inspired sidebar layout using shadcn `SidebarProvider`. Uses `user-layout.tsx` which redirects unauthenticated users to `/login` and admin/moderator users to `/image`.
- **Sections (state-based navigation)**:
  - **Overview** — Profile card, 4 stat cards (story bookmarks, book bookmarks, ratings, categories), continue-reading widget, quick-access cards
  - **Bookmarks** — All story bookmarks from `/api/profile`
  - **Saved Stories** — Motivational stories from `/api/user/motivational-bookmarks`
  - **My Books** — Book reading progress + saved books from `/api/profile/dashboard`
  - **Ratings** — Book ratings
  - **Interests** — Category bar chart from `categoriesExplored` key in dashboard API
  - **Settings → Profile Info** — Update name, email, upload avatar photo
  - **Settings → Change Password** — Current password + new password (no email required — uses session)
  - **Settings → Account Security** — Member since, role, email, account type info
- **RBAC**: `user-layout.tsx` checks `user.role` — admin/moderator are redirected to `/image`; regular users cannot access admin routes (admin-layout.tsx already blocks non-staff)

## Password Change Fix
- `POST /api/auth/change-password` now requires authentication (`requireAuth`) and uses `req.user.email` from the session — users no longer need to re-enter their email address

## User/Moderator Management
- **Users page** (`/admin/users`): Admin-only. Lists all registered users with search, edit (name/email/role), delete.
- **Moderators page** (`/admin/moderators`): Admin-only. Create moderators with email/password, set section permissions (categories, articles, books, motivational-stories, trash, settings). View credentials (password shown/hidden). Edit or remove moderators.
- **Roles**: `user` (public), `moderator` (limited admin access), `admin` (full access).
- **Moderator permissions**: Stored as `text[]` in users table (`permissions` column). Admin sees everything; moderators see only sections granted.
- **Moderator login**: Moderators use their email/password to log in via the same admin login page. `requireStaff` middleware allows both admins and moderators. User/moderator management routes remain `requireAdmin` only.
- **Auth context**: `isAdmin`, `isModerator`, `isStaff`, `permissions[]`, `hasPermission(section)` exposed from `useAuth()`.
- **Sidebar**: Permission-based — moderators see only granted sections. Admin badge shown for moderators. User email shown in footer.
- **Menu order**: Dashboard > Categories > All Articles > Books > Motivational Stories > Users > Moderators > Trash > Settings. Articles sub-group (Sahaba/Awliya/Karamat/History) visible when `articles` permission granted.
- **Plain password**: `plainPassword` field on users table stores original moderator passwords set by admin (for admin reference; moderators do not see this).

## Category System (Page Management)
- **Unified categories table**: Single `categories` DB table with `type` field: `"story"` | `"book"` | `"motivational-story"` | `"dua"`.
- **Admin categories page** (`/image/categories`): Single unified list (no tabs) showing ALL categories together. Story categories (Sahaba, Awliya, etc.) + section page entries (Books, Motivational Stories, Duas) all appear in one list. Type badges distinguish them (blue=Story, amber=Books Page, green=Motivational Stories Page, purple=Duas Page).
- **Section page entries**: Three pre-seeded singleton entries with type=book/motivational-story/dua represent the Books, Motivational Stories, and Duas section pages. Admin edits their name/description/cover from the Categories page; changes instantly reflect on public page heroes.
- **Public page dynamic heroes**: `books.tsx`, `motivational-stories.tsx`, and `duas.tsx` fetch their hero title/description/cover image from `/api/categories?type=<type>` (first result) instead of hardcoded values.
- **Content form category fields**: Books, Motivational Stories, and Duas admin forms use simple text inputs for sub-categorization (free text like "Seerah", "Morning", "Patience"). Not connected to the managed categories system.
- **API**: `GET /api/categories?type=story` (or no type) → story categories (homepage). `GET /api/categories?type=<type>` → filtered. `GET /api/categories?type=all` → all types (admin list).
- **Content count badges**: Story entries show story count (by ID); section page entries show content count (books/stories/duas by category name).

## User Preferences
I prefer clear and concise communication.
I like an iterative development approach, focusing on core functionalities first.
Please ask for confirmation before implementing significant changes or new features.
I value detailed explanations for complex technical decisions.

## System Architecture
The application is built with a modern web stack, featuring a React-based frontend using TypeScript, Vite, Tailwind CSS, and shadcn/ui for a contemporary and responsive user interface. The backend is an Express.js application, also in TypeScript, interacting with a PostgreSQL database via Drizzle ORM. Authentication is handled using Passport.js with a local strategy and session-based management. File uploads for media like audio, book covers, PDFs, and previews are managed by Multer. The system is designed with distinct public and administrative layouts, ensuring role-based access control.

Key architectural decisions include:
- **UI/UX**: Responsive design, dark/light mode toggle, consistent layouts (`public-layout.tsx`, `admin-layout.tsx`). Usage of shadcn/ui ensures a polished and accessible component library.
- **Frontend Routing**: `wouter` for lightweight and performant client-side routing.
- **State Management**: TanStack Query for server state management, ensuring efficient data fetching, caching, and synchronization.
- **Content Management**: Dedicated admin dashboards for CRUD operations on stories, categories, books, and motivational stories, including multi-part story management and rich text editing.
- **Media Handling**: Secure storage and streaming of uploaded content (audio, PDFs, images) with dedicated static routes.
- **Reading Experience**: Custom audio player for story narrations and `react-pdf` for rendering free books online, with features like progress saving and chapter navigation.
- **User Engagement**: Features like bookmarking, reading progress tracking, and user ratings/reviews are integrated into story and book detail pages and aggregated on the user dashboard.
- **SEO**: Implementation of SEO meta tags for better search engine visibility.
- **Category-Specific Routes**: Stories accessible via `/sahaba/:slug`, `/awliya/:slug`, `/history/:slug`, `/karamat/:slug`, `/prophets-companions/:slug` — all resolve to the same multi-part story reader.
- **Auto-Play**: Timer-based page auto-advance (30s interval) in the multi-part story reader, toggleable via a Play/Pause button in the sticky header.
- **Duplicate Story**: Admin can clone any story (with all parts and pages) as a draft via the duplicate button in the stories list.
- **Duplicate Part**: Admin can clone any individual part (with all pages) within a story via the duplicate button in the story editor.
- **Category Ordering**: Categories have an `orderIndex` field. Admin can reorder them with up/down arrows in the Categories admin page. Home page renders category tiles in the stored order.
- **Category Image Upload**: Admin can upload images directly for categories (upload button in the category dialog), not just enter URLs.
- **Category Tile Images**: Home page CategoryTiles uses each category's own image field directly (no hardcoded slug-to-image mapping).
- **Delete Story from Editor**: Story editor page has a "Delete Story" button with confirmation dialog that removes the story and all its Parts/Pages (cascade).
- **Local Video Support**: Story reader's VideoPlayer component handles both YouTube URLs (iframe embed) and uploaded local video paths (/uploads/videos/) with a native video element.
- **Video Upload**: Admin Part editor supports uploading video files (MP4/WebM, max 500 MB) to /api/upload/video; served from /uploads/videos/.
- **Media Upload in Parts**: Both "Edit Part" and "Add Part" dialogs in the story editor have upload buttons for Audio, Video, and Cover Image alongside manual URL inputs.
- **Soft Delete / Trash System**: All DELETE operations on categories, stories, books, and motivational stories now set a `deletedAt` timestamp (soft delete) instead of permanently removing records. Soft-deleted items are hidden from all public and admin list queries. Admin Trash page (`/admin/trash`) displays them grouped by type with Restore and Permanent Delete actions. API routes: `GET /api/admin/trash`, `POST /api/admin/trash/restore/:type/:id`, `DELETE /api/admin/trash/permanent/:type/:id`.
- **Dynamic Header Navigation**: The public site header (`public-layout.tsx`) replaces hardcoded category links with a live `useQuery` against `/api/categories`. The footer category list is also dynamically rendered. Categories always reflect what's in the database (in `orderIndex` order), including any new categories admins create.

## External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Passport.js**: Authentication middleware for Express.js.
- **Multer**: Node.js middleware for handling `multipart/form-data`, used for file uploads.
- **react-pdf**: Library for displaying PDF documents in React applications, utilizing `pdfjs` worker from unpkg CDN.
- **AdSense**: Placeholders integrated for potential monetization through advertisements.
- **Amazon Affiliate Program**: Integration for paid book affiliate links.
- **Resend (Planned)**: Future integration for email delivery in the forgot password flow.