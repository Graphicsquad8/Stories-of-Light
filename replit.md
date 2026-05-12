# Stories of Light

An English-language Islamic stories blog providing inspiring narratives, a comprehensive book section, user engagement features, and robust content management.

## Run & Operate

- **Run development server:** `npm run dev`
- **Build for production:** `npm run build`
- **Typecheck:** `npm run typecheck`
- **Generate Drizzle migrations:** `drizzle-kit generate:pg`
- **Push Drizzle migrations to DB:** `drizzle-kit push:pg`

**Required Environment Variables:**

- `APP_URL`: Used for CORS configuration (e.g., `https://www.storiesoflight.com`). Defaults to `*` if not set.
- `SESSION_SECRET`: Key for encrypting session data and AI model API keys.
- `DATABASE_URL`: Connection string for PostgreSQL.

## Stack

- **Frontend**: React (with TypeScript), Vite, Tailwind CSS, shadcn/ui, wouter, TanStack Query
- **Backend**: Express.js (with TypeScript)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js (local strategy, session-based)
- **File Uploads**: Multer
- **UI Components**: recharts (for admin dashboards)
- **Real-time**: WebSockets (`ws` package)

## Where things live

- **DB Schema**: `server/db/schema.ts`
- **API Routes**: `server/routes.ts`
- **Public Layout**: `client/src/components/public-layout.tsx`
- **Admin Layout**: `client/src/components/admin-layout.tsx`
- **Frontend Main CSS**: `client/src/index.css`
- **Home Page Content**: `client/src/pages/home.tsx`
- **Public Navigation Links**: `client/src/components/public-nav-link.tsx`
- **AI Model API Key Encryption**: `server/utils/encrypt.ts` (uses same pattern as Google OAuth client secret)
- **Homepage Section Configuration**: Stored in `siteSettings` (`homeSectionsConfig` key)

## Architecture decisions

- **Hybrid Ad Management**: Each ad slot can toggle between an automated platform (AdSense/Adsterra) and manually uploaded ads (image, GIF, video, HTML).
- **Soft Deletes**: All content (`categories`, `stories`, `books`, `motivational_stories`, `duas`) uses soft deletes (`deletedAt` timestamp) for data recovery, managed via a dedicated `/admin/trash` section.
- **Real-time Admin Updates**: WebSockets broadcast invalidation events (`{ type: "invalidate", keys: [...] }`) on content mutations, ensuring all admin dashboards update in real-time without refresh.
- **Dynamic Homepage Layout**: Homepage sections (`Hero`, `Categories`, `Featured Stories`, `Islamic Books`, `Motivational Stories`, `Duas`, `Latest Stories`) have a fixed render order. Their content (titles, descriptions, visibility, counts) is dynamically configured via admin settings.
- **Unified Category System**: A single `categories` table with a `type` field (`"story"`, `"book"`, `"motivational-story"`, `"dua"`) manages all content categories, including special entries for section pages.

## Product

- **AI Content Studio**: AI-powered content creation (text/image generation) for stories, motivational stories, duas, and books, with content type-specific publishing.
- **Hybrid Ad Management**: Granular control over ad slots, allowing dynamic switching between automated ad platforms and manual ad uploads.
- **Contributor Overview**: Personalized dashboard for staff members to track their content's performance and activity.
- **Comprehensive Admin Dashboard**: Analytics and statistics for content, users, and site performance, with both normal and graph views.
- **Rich Reading Experience**: Multi-part story and dua readers with audio, video, PDF rendering, bookmarking, and progress tracking.
- **Dynamic Footer Management**: Centralized admin page to manage site name, description, social media links, and custom "About" pages displayed in the footer.
- **User Dashboard**: Personalized dashboard for users to manage bookmarks, reading progress, ratings, and profile settings.
- **Moderator Role with Permissions**: Differentiated `moderator` role with configurable section-specific access permissions for managing content.
- **Dynamic Public UI**: The public site's header navigation and homepage sections dynamically load content and configurations from the database.
- **Content Rating System**: Users can rate and comment on stories, duas, and books, with admin toggles to enable/disable ratings per content type.
- **API Generator**: Tool for generating cURL commands with dynamic domain handling, query parameter builders, and request body editors.

## User preferences

- I prefer clear and concise communication.
- I like an iterative development approach, focusing on core functionalities first.
- Please ask for confirmation before implementing significant changes or new features.
- I value detailed explanations for complex technical decisions.

## Gotchas

- **API Key Security**: AI model API keys are AES-256-CBC encrypted using a `SESSION_SECRET`-derived key. Ensure `SESSION_SECRET` is robust and consistently managed.
- **CORS for Admin Routes**: Admin routes (`/api/admin/*`) are **not** CORS-enabled and are restricted to same-origin for security. Public API v1 routes (`/api/v1/*`) are CORS-enabled.
- **Moderator Passwords**: Original moderator passwords set by admins are stored in `plainPassword` for admin reference; these are not visible to moderators themselves.
- **Category Filtering**: `GET /api/categories` without a `type` parameter defaults to story categories. Use `?type=all` to retrieve all category types for admin displays.
- **Public Footer**: The "Admin" link is explicitly removed from the public footer; access is via `/image` or `/admin/login`.

## Pointers

- **UI Kit**: [shadcn/ui documentation](https://ui.shadcn.com/)
- **State Management**: [TanStack Query documentation](https://tanstack.com/query/latest)
- **ORM**: [Drizzle ORM documentation](https://orm.drizzle.team/docs/overview/postgresql)
- **Routing**: [wouter documentation](https://docs.wouter.com/)
- **PDF Viewer**: [react-pdf documentation](https://www.npmjs.com/package/react-pdf)
- **Charting Library**: [Recharts documentation](https://recharts.org/en-US/)