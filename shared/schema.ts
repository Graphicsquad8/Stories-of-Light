import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  name: text("name"),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  permissions: text("permissions").array(),
  plainPassword: text("plain_password"),
  avatarUrl: text("avatar_url"),
  otpCode: text("otp_code"),
  otpExpiry: timestamp("otp_expiry"),
  lastReadStoryId: varchar("last_read_story_id"),
  lastReadAt: timestamp("last_read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  urlSlug: text("url_slug"),
  type: text("type").notNull().default("story"),
  description: text("description"),
  image: text("image"),
  orderIndex: integer("order_index").default(0).notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  categoryId: varchar("category_id").references(() => categories.id),
  thumbnail: text("thumbnail"),
  youtubeUrl: text("youtube_url"),
  audioUrl: text("audio_url"),
  tags: text("tags").array(),
  views: integer("views").default(0).notNull(),
  averageRating: real("average_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  ratingEnabled: boolean("rating_enabled").default(true),
  status: text("status").notNull().default("draft"),
  featured: boolean("featured").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  author: text("author").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  affiliateLink: text("affiliate_link"),
  category: text("category"),
  type: text("type").notNull().default("free"),
  price: text("price"),
  previewPages: text("preview_pages").array(),
  fullContentUrl: text("full_content_url"),
  amazonAffiliateLink: text("amazon_affiliate_link"),
  buyButtonLabel: text("buy_button_label"),
  averageRating: real("average_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  ratingEnabled: boolean("rating_enabled").default(true),
  published: boolean("published").default(true),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const bookChapters = pgTable("book_chapters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  startPage: integer("start_page").notNull().default(1),
  endPage: integer("end_page").notNull().default(1),
});

export const bookBookmarks = pgTable("book_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookProgress = pgTable("book_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  lastChapterId: varchar("last_chapter_id"),
  lastPage: integer("last_page").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookRatings = pgTable("book_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  deletedAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  averageRating: true,
  totalRatings: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
  averageRating: true,
  totalRatings: true,
  views: true,
  deletedAt: true,
});

export const insertBookChapterSchema = createInsertSchema(bookChapters).omit({
  id: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertBookRatingSchema = z.object({
  bookId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
export type BookChapter = typeof bookChapters.$inferSelect;
export type InsertBookChapter = z.infer<typeof insertBookChapterSchema>;
export type BookBookmark = typeof bookBookmarks.$inferSelect;
export type BookProgressRecord = typeof bookProgress.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type BookRating = typeof bookRatings.$inferSelect;

export const motivationalStories = pgTable("motivational_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  content: text("content"),
  category: text("category"),
  views: integer("views").default(0),
  averageRating: real("average_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  ratingEnabled: boolean("rating_enabled").default(true),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const motivationalLessons = pgTable("motivational_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => motivationalStories.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const motivationalBookmarks = pgTable("motivational_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => motivationalStories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const motivationalRatings = pgTable("motivational_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => motivationalStories.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const motivationalProgress = pgTable("motivational_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => motivationalStories.id, { onDelete: "cascade" }),
  lastLessonId: varchar("last_lesson_id"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMotivationalStorySchema = createInsertSchema(motivationalStories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  averageRating: true,
  totalRatings: true,
  views: true,
  deletedAt: true,
});

export const insertMotivationalLessonSchema = createInsertSchema(motivationalLessons).omit({
  id: true,
  createdAt: true,
});

export const insertMotivationalRatingSchema = z.object({
  storyId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export type InsertMotivationalStory = z.infer<typeof insertMotivationalStorySchema>;
export type MotivationalStory = typeof motivationalStories.$inferSelect;
export type InsertMotivationalLesson = z.infer<typeof insertMotivationalLessonSchema>;
export type MotivationalLesson = typeof motivationalLessons.$inferSelect;
export type MotivationalBookmark = typeof motivationalBookmarks.$inferSelect;
export type MotivationalRating = typeof motivationalRatings.$inferSelect;
export type MotivationalProgress = typeof motivationalProgress.$inferSelect;
export type MotivationalStoryWithLessons = MotivationalStory & { lessons: MotivationalLesson[] };

export const storyParts = pgTable("story_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary"),
  coverImage: text("cover_image"),
  videoUrl: text("video_url"),
  audioUrl: text("audio_url"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storyPages = pgTable("story_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partId: varchar("part_id").notNull().references(() => storyParts.id, { onDelete: "cascade" }),
  content: text("content"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storyReadingProgress = pgTable("story_reading_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  lastPartId: varchar("last_part_id"),
  lastPageIndex: integer("last_page_index").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStoryPartSchema = createInsertSchema(storyParts).omit({
  id: true,
  createdAt: true,
});

export const insertStoryPageSchema = createInsertSchema(storyPages).omit({
  id: true,
  createdAt: true,
});

export type InsertStoryPart = z.infer<typeof insertStoryPartSchema>;
export type StoryPart = typeof storyParts.$inferSelect;
export type InsertStoryPage = z.infer<typeof insertStoryPageSchema>;
export type StoryPage = typeof storyPages.$inferSelect;
export type StoryPartWithPages = StoryPart & { pages: StoryPage[] };
export type StoryReadingProgress = typeof storyReadingProgress.$inferSelect;

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

export const duas = pgTable("duas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  category: text("category"),
  views: integer("views").default(0),
  averageRating: real("average_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  ratingEnabled: boolean("rating_enabled").default(true),
  orderIndex: integer("order_index").default(0).notNull(),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const duaRatings = pgTable("dua_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  duaId: varchar("dua_id").notNull().references(() => duas.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storyRatings = pgTable("story_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const duaParts = pgTable("dua_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  duaId: varchar("dua_id").notNull().references(() => duas.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  arabicText: text("arabic_text"),
  transliteration: text("transliteration"),
  translation: text("translation"),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDuaSchema = createInsertSchema(duas).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true, averageRating: true, totalRatings: true });
export const insertDuaPartSchema = createInsertSchema(duaParts).omit({ id: true, createdAt: true });
export const insertDuaRatingSchema = z.object({
  duaId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});
export const insertStoryRatingSchema = z.object({
  storyId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});
export type InsertDua = z.infer<typeof insertDuaSchema>;
export type Dua = typeof duas.$inferSelect;
export type InsertDuaPart = z.infer<typeof insertDuaPartSchema>;
export type DuaPart = typeof duaParts.$inferSelect;
export type DuaWithParts = Dua & { parts: DuaPart[] };
export type DuaRating = typeof duaRatings.$inferSelect;
export type StoryRating = typeof storyRatings.$inferSelect;

export const footerPages = pgTable("footer_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  orderIndex: integer("order_index").default(0).notNull(),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFooterPageSchema = createInsertSchema(footerPages).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFooterPage = z.infer<typeof insertFooterPageSchema>;
export type FooterPage = typeof footerPages.$inferSelect;

export type StoryWithCategory = Story & { category: Category | null };
export type BookWithChapters = Book & { chapters: BookChapter[] };

export const bookParts = pgTable("book_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary"),
  coverImage: text("cover_image"),
  videoUrl: text("video_url"),
  audioUrl: text("audio_url"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookPages = pgTable("book_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partId: varchar("part_id").notNull().references(() => bookParts.id, { onDelete: "cascade" }),
  content: text("content"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookPartSchema = createInsertSchema(bookParts).omit({ id: true, createdAt: true });
export const insertBookPageSchema = createInsertSchema(bookPages).omit({ id: true, createdAt: true });

export type InsertBookPart = z.infer<typeof insertBookPartSchema>;
export type BookPart = typeof bookParts.$inferSelect;
export type InsertBookPage = z.infer<typeof insertBookPageSchema>;
export type BookPage = typeof bookPages.$inferSelect;

export const duaBookmarks = pgTable("dua_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  duaId: varchar("dua_id").notNull().references(() => duas.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DuaBookmark = typeof duaBookmarks.$inferSelect;
export type BookPartWithPages = BookPart & { pages: BookPage[] };
