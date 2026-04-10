import {
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Story, type InsertStory,
  type StoryWithCategory,
  type Book, type InsertBook,
  type BookChapter, type InsertBookChapter,
  type BookWithChapters,
  type BookBookmark, type BookProgressRecord,
  type Bookmark, type BookRating,
  type MotivationalStory, type InsertMotivationalStory,
  type MotivationalLesson, type InsertMotivationalLesson,
  type MotivationalStoryWithLessons,
  type MotivationalBookmark, type MotivationalRating,
  type MotivationalProgress,
  type StoryPart, type InsertStoryPart,
  type StoryPage, type InsertStoryPage,
  type StoryPartWithPages,
  type StoryReadingProgress,
  type BookPart, type InsertBookPart,
  type BookPage, type InsertBookPage,
  type BookPartWithPages,
  type FooterPage, type InsertFooterPage,
  type Dua, type InsertDua,
  type DuaPart, type InsertDuaPart,
  type DuaWithParts,
  type DuaBookmark,
  type DuaRating, type StoryRating,
  users, categories, stories, books, bookChapters, bookBookmarks, bookProgress,
  bookmarks, bookRatings, passwordResetTokens, siteSettings,
  motivationalStories, motivationalLessons, motivationalBookmarks,
  motivationalRatings, motivationalProgress,
  storyParts, storyPages, storyReadingProgress,
  bookParts, bookPages, footerPages,
  duas, duaParts, duaBookmarks, duaRatings, storyRatings
} from "@shared/schema";
import { eq, desc, and, or, ilike, sql, count, sum, inArray, asc, gte, lte, ne, isNull, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

function toUrlSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersStats(): Promise<{ total: number; activeCount: number; bookmarkCount: number; ratingCount: number; recentCount: number }>;
  getUsersFiltered(opts?: { search?: string; activeFilter?: string; sort?: string; startDate?: string; endDate?: string; limit?: number }): Promise<{ users: User[]; total: number }>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithEmail(data: { email: string; password: string; name?: string; username: string; role?: string; permissions?: string[]; plainPassword?: string }): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  setUserOtp(userId: string, code: string, expiry: Date): Promise<void>;
  clearUserOtp(userId: string): Promise<void>;

  getCategories(type?: string): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(cat: InsertCategory): Promise<Category>;
  updateCategory(id: string, cat: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  restoreCategory(id: string): Promise<boolean>;
  permanentDeleteCategory(id: string): Promise<boolean>;
  getDeletedCategories(): Promise<Category[]>;
  getCategoryStoryCounts(): Promise<Record<string, number>>;
  getCategoryBookCounts(): Promise<Record<string, number>>;
  getCategoryMotivationalCounts(): Promise<Record<string, number>>;
  getCategoryDuaCounts(): Promise<Record<string, number>>;
  getCategoryStoryViewCounts(): Promise<Record<string, number>>;
  getCategoryBookViewCounts(): Promise<Record<string, number>>;
  getCategoryMotivationalViewCounts(): Promise<Record<string, number>>;
  getCategoryDuaViewCounts(): Promise<Record<string, number>>;

  getStories(opts?: { status?: string; categoryId?: string; featured?: boolean; search?: string; limit?: number; offset?: number; userId?: string; startDate?: string; endDate?: string; sortBy?: "views" | "date" }): Promise<StoryWithCategory[]>;
  getStoryById(id: string): Promise<StoryWithCategory | undefined>;
  getStoryBySlug(slug: string): Promise<StoryWithCategory | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: string, story: Partial<InsertStory>): Promise<Story | undefined>;
  deleteStory(id: string): Promise<boolean>;
  deleteStories(ids: string[]): Promise<boolean>;
  restoreStory(id: string): Promise<boolean>;
  permanentDeleteStory(id: string): Promise<boolean>;
  getDeletedStories(): Promise<StoryWithCategory[]>;
  getStoryCount(status?: string): Promise<number>;
  getStoryTotalViews(): Promise<number>;
  getRecentStoryCount(days: number): Promise<number>;
  incrementStoryViews(id: string): Promise<void>;
  getRelatedStories(storyId: string, categoryId: string | null, limit?: number): Promise<StoryWithCategory[]>;

  getBooks(opts?: { type?: string; category?: string; search?: string; sort?: string; minRating?: number; userId?: string; published?: boolean }): Promise<Book[]>;
  getBookById(id: string): Promise<Book | undefined>;
  getBookBySlug(slug: string): Promise<BookWithChapters | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: string, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: string): Promise<boolean>;
  restoreBook(id: string): Promise<boolean>;
  permanentDeleteBook(id: string): Promise<boolean>;
  getDeletedBooks(): Promise<Book[]>;
  incrementBookViews(id: string): Promise<void>;
  getFeaturedFreeBooks(limit?: number): Promise<Book[]>;
  getBookCategories(): Promise<string[]>;
  getBooksAdmin(opts?: { type?: string; category?: string; search?: string; sort?: string; published?: boolean; userId?: string; startDate?: string; endDate?: string; limit?: number; offset?: number }): Promise<{ books: Book[]; total: number }>;
  getBooksAdminStats(): Promise<{ total: number; freeTotal: number; paidTotal: number; totalViews: number; freeViews: number; paidViews: number; published: number; publishedFree: number; publishedPaid: number; recentCount: number; recentFree: number; recentPaid: number; fiveStarCount: number; fiveStarFree: number; fiveStarPaid: number; fourStarCount: number; fourStarFree: number; fourStarPaid: number }>;
  getBookCategoriesAdmin(): Promise<string[]>;

  getBookChapters(bookId: string): Promise<BookChapter[]>;
  createBookChapter(chapter: InsertBookChapter): Promise<BookChapter>;
  updateBookChapter(id: string, data: Partial<InsertBookChapter>): Promise<BookChapter | undefined>;
  deleteBookChapter(id: string): Promise<boolean>;
  deleteBookChaptersByBookId(bookId: string): Promise<void>;

  getBookBookmark(userId: string, bookId: string): Promise<BookBookmark | undefined>;
  createBookBookmark(userId: string, bookId: string): Promise<BookBookmark>;
  deleteBookBookmark(userId: string, bookId: string): Promise<boolean>;
  getUserBookBookmarks(userId: string): Promise<(BookBookmark & { book: Book })[]>;
  getBookBookmarkCount(userId: string): Promise<number>;

  getBookProgress(userId: string, bookId: string): Promise<BookProgressRecord | undefined>;
  upsertBookProgress(userId: string, bookId: string, lastChapterId: string | null, lastPage: number): Promise<BookProgressRecord>;
  getUserBookProgress(userId: string): Promise<(BookProgressRecord & { book: Book })[]>;

  getBookmarks(userId: string): Promise<(Bookmark & { story: StoryWithCategory })[]>;
  getBookmark(userId: string, storyId: string): Promise<Bookmark | undefined>;
  createBookmark(userId: string, storyId: string): Promise<Bookmark>;
  deleteBookmark(userId: string, storyId: string): Promise<boolean>;

  getBookRatings(bookId: string): Promise<BookRating[]>;
  getUserBookRating(userId: string, bookId: string): Promise<BookRating | undefined>;
  createBookRating(userId: string, bookId: string, rating: number, comment?: string): Promise<BookRating>;
  updateBookAverageRating(bookId: string): Promise<void>;

  getBookmarkCount(userId: string): Promise<number>;
  getUserBookRatings(userId: string): Promise<(BookRating & { bookTitle: string })[]>;
  getUserBookRatingCount(userId: string): Promise<number>;

  getRecommendedBooks(bookId: string, category: string | null, limit?: number): Promise<Book[]>;

  getBookParts(bookId: string): Promise<BookPartWithPages[]>;
  getBookPartById(id: string): Promise<BookPart | undefined>;
  createBookPart(part: InsertBookPart): Promise<BookPart>;
  updateBookPart(id: string, data: Partial<InsertBookPart>): Promise<BookPart | undefined>;
  deleteBookPart(id: string): Promise<boolean>;
  getBookPages(partId: string): Promise<BookPage[]>;
  createBookPage(page: InsertBookPage): Promise<BookPage>;
  updateBookPage(id: string, data: Partial<InsertBookPage>): Promise<BookPage | undefined>;
  deleteBookPage(id: string): Promise<boolean>;
  duplicateBookPart(id: string, bookId: string): Promise<BookPartWithPages>;
  duplicateBookPage(id: string): Promise<BookPage>;

  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date } | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<Record<string, string>>;

  getMotivationalStories(opts?: { category?: string; search?: string; sort?: string; published?: boolean; limit?: number; offset?: number; userId?: string; startDate?: string; endDate?: string }): Promise<{ stories: MotivationalStory[]; total: number }>;
  getMotivationalStoryById(id: string): Promise<MotivationalStoryWithLessons | undefined>;
  getMotivationalStoryBySlug(slug: string): Promise<MotivationalStoryWithLessons | undefined>;
  createMotivationalStory(story: InsertMotivationalStory): Promise<MotivationalStory>;
  updateMotivationalStory(id: string, story: Partial<InsertMotivationalStory>): Promise<MotivationalStory | undefined>;
  deleteMotivationalStory(id: string): Promise<boolean>;
  restoreMotivationalStory(id: string): Promise<boolean>;
  permanentDeleteMotivationalStory(id: string): Promise<boolean>;
  getDeletedMotivationalStories(): Promise<MotivationalStory[]>;
  duplicateMotivationalStory(id: string): Promise<MotivationalStory>;
  getMotivationalStoryCount(published?: boolean): Promise<number>;
  getMotivationalTotalViews(): Promise<number>;
  getRecentMotivationalCount(days: number): Promise<number>;
  getMotivationalRatingDistribution(): Promise<{ fiveStarCount: number; fourStarCount: number }>;

  getDuas(opts?: { published?: boolean; search?: string; category?: string; sort?: string; limit?: number; offset?: number; userId?: string; startDate?: string; endDate?: string }): Promise<{ duas: Dua[]; total: number }>;
  getDuaCategories(): Promise<string[]>;
  getDuaCategoriesAdmin(): Promise<string[]>;
  getDuaTotalViews(): Promise<number>;
  getRecentDuaCount(days: number): Promise<number>;
  getDuaRatingDistribution(): Promise<{ fiveStarCount: number; fourStarCount: number }>;
  getDuaRatings(duaId: string): Promise<DuaRating[]>;
  getUserDuaRating(userId: string, duaId: string): Promise<DuaRating | undefined>;
  createDuaRating(userId: string, duaId: string, rating: number, comment?: string): Promise<DuaRating>;
  updateDuaAverageRating(duaId: string): Promise<void>;

  getStoryRatings(storyId: string): Promise<StoryRating[]>;
  getUserStoryRating(userId: string, storyId: string): Promise<StoryRating | undefined>;
  createStoryRating(userId: string, storyId: string, rating: number, comment?: string): Promise<StoryRating>;
  updateStoryAverageRating(storyId: string): Promise<void>;

  incrementDuaViews(id: string): Promise<void>;
  getDuaBySlug(slug: string): Promise<DuaWithParts | undefined>;
  getDuaById(id: string): Promise<DuaWithParts | undefined>;
  createDua(data: InsertDua): Promise<Dua>;
  updateDua(id: string, data: Partial<InsertDua>): Promise<Dua | undefined>;
  deleteDua(id: string): Promise<boolean>;
  getDuaParts(duaId: string): Promise<DuaPart[]>;
  createDuaPart(data: InsertDuaPart): Promise<DuaPart>;
  updateDuaPart(id: string, data: Partial<InsertDuaPart>): Promise<DuaPart | undefined>;
  deleteDuaPart(id: string): Promise<boolean>;
  reorderDuaParts(duaId: string, orderedIds: string[]): Promise<void>;
  duplicateDua(id: string): Promise<Dua>;

  getFooterPages(publishedOnly?: boolean): Promise<FooterPage[]>;
  getFooterPageBySlug(slug: string): Promise<FooterPage | undefined>;
  getFooterPageById(id: string): Promise<FooterPage | undefined>;
  createFooterPage(data: InsertFooterPage): Promise<FooterPage>;
  updateFooterPage(id: string, data: Partial<InsertFooterPage>): Promise<FooterPage | undefined>;
  deleteFooterPage(id: string): Promise<boolean>;

  getMotivationalLessons(storyId: string): Promise<MotivationalLesson[]>;
  createMotivationalLesson(lesson: InsertMotivationalLesson): Promise<MotivationalLesson>;
  updateMotivationalLesson(id: string, data: Partial<InsertMotivationalLesson>): Promise<MotivationalLesson | undefined>;
  deleteMotivationalLesson(id: string): Promise<boolean>;

  toggleMotivationalBookmark(userId: string, storyId: string): Promise<boolean>;
  getMotivationalBookmarks(userId: string): Promise<(MotivationalBookmark & { story: MotivationalStory })[]>;
  isMotivationalBookmarked(userId: string, storyId: string): Promise<boolean>;

  toggleDuaBookmark(userId: string, duaId: string): Promise<boolean>;
  getDuaBookmarks(userId: string): Promise<(DuaBookmark & { dua: Dua })[]>;
  isDuaBookmarked(userId: string, duaId: string): Promise<boolean>;

  createMotivationalRating(userId: string, storyId: string, rating: number, comment?: string): Promise<MotivationalRating>;
  getMotivationalRatings(storyId: string): Promise<(MotivationalRating & { username: string })[]>;
  getUserMotivationalRating(userId: string, storyId: string): Promise<MotivationalRating | undefined>;
  updateMotivationalAverageRating(storyId: string): Promise<void>;

  incrementMotivationalViews(id: string): Promise<void>;

  upsertMotivationalProgress(userId: string, storyId: string, lastLessonId: string): Promise<MotivationalProgress>;
  getMotivationalProgress(userId: string, storyId: string): Promise<MotivationalProgress | undefined>;

  getMotivationalCategories(): Promise<string[]>;
  getMotivationalCategoriesAdmin(): Promise<string[]>;
  getPopularMotivationalStories(limit?: number): Promise<MotivationalStory[]>;
  getRelatedMotivationalStories(storyId: string, category: string | null, limit?: number): Promise<MotivationalStory[]>;

  duplicateStory(id: string): Promise<Story>;

  getStoryParts(storyId: string): Promise<StoryPartWithPages[]>;
  getStoryPartById(id: string): Promise<StoryPart | undefined>;
  createStoryPart(part: InsertStoryPart): Promise<StoryPart>;
  updateStoryPart(id: string, data: Partial<InsertStoryPart>): Promise<StoryPart | undefined>;
  deleteStoryPart(id: string): Promise<boolean>;
  duplicateStoryPart(id: string, storyId: string): Promise<StoryPartWithPages>;
  duplicateStoryPage(id: string): Promise<StoryPage>;

  getStoryPages(partId: string): Promise<StoryPage[]>;
  createStoryPage(page: InsertStoryPage): Promise<StoryPage>;
  updateStoryPage(id: string, data: Partial<InsertStoryPage>): Promise<StoryPage | undefined>;
  deleteStoryPage(id: string): Promise<boolean>;

  getStoryReadingProgress(userId: string, storyId: string): Promise<StoryReadingProgress | undefined>;
  upsertStoryReadingProgress(userId: string, storyId: string, lastPartId: string, lastPageIndex: number): Promise<StoryReadingProgress>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createUserWithEmail(data: { email: string; password: string; name?: string; username: string; role?: string; permissions?: string[]; plainPassword?: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      username: data.username,
      email: data.email,
      name: data.name || null,
      password: data.password,
      role: data.role || "user",
      permissions: data.permissions ?? null,
      plainPassword: data.plainPassword ?? null,
    }).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "user")).orderBy(users.createdAt);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role)).orderBy(users.createdAt);
  }

  async getUsersStats(): Promise<{ total: number; activeCount: number; bookmarkCount: number; ratingCount: number; recentCount: number }> {
    const since10 = new Date(Date.now() - 10 * 86400000);
    const since30 = new Date(Date.now() - 30 * 86400000);
    const [totalRes, activeRes, recentRes, bookmarkRes, ratingRes] = await Promise.all([
      db.select({ c: count() }).from(users).where(eq(users.role, "user")),
      db.select({ c: count() }).from(users).where(and(eq(users.role, "user"), isNotNull(users.lastReadAt), gte(users.lastReadAt, since10))),
      db.select({ c: count() }).from(users).where(and(eq(users.role, "user"), gte(users.createdAt, since30))),
      pool.query(`SELECT COUNT(DISTINCT user_id)::int AS c FROM (
        SELECT user_id FROM bookmarks
        UNION ALL SELECT user_id FROM book_bookmarks
        UNION ALL SELECT user_id FROM dua_bookmarks
        UNION ALL SELECT user_id FROM motivational_bookmarks
      ) t WHERE user_id IN (SELECT id FROM users WHERE role = 'user')`),
      pool.query(`SELECT COUNT(DISTINCT user_id)::int AS c FROM (
        SELECT user_id FROM story_ratings
        UNION ALL SELECT user_id FROM book_ratings
        UNION ALL SELECT user_id FROM dua_ratings
        UNION ALL SELECT user_id FROM motivational_ratings
      ) t WHERE user_id IN (SELECT id FROM users WHERE role = 'user')`),
    ]);
    return {
      total: totalRes[0]?.c ?? 0,
      activeCount: activeRes[0]?.c ?? 0,
      bookmarkCount: bookmarkRes.rows[0]?.c ?? 0,
      ratingCount: ratingRes.rows[0]?.c ?? 0,
      recentCount: recentRes[0]?.c ?? 0,
    };
  }

  async getUsersFiltered(opts: { search?: string; activeFilter?: string; sort?: string; startDate?: string; endDate?: string; limit?: number } = {}): Promise<{ users: User[]; total: number }> {
    const { search, activeFilter, sort, startDate, endDate, limit = 200 } = opts;
    const since10 = new Date(Date.now() - 10 * 86400000);
    const since30 = new Date(Date.now() - 30 * 86400000);

    const conds: any[] = [eq(users.role, "user")];
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      conds.push(or(
        sql`lower(${users.username}) like ${like}`,
        sql`lower(coalesce(${users.email}, '')) like ${like}`,
        sql`lower(coalesce(${users.name}, '')) like ${like}`,
      ));
    }
    if (startDate) conds.push(gte(users.createdAt, new Date(startDate)));
    if (endDate) conds.push(lte(users.createdAt, new Date(endDate)));

    if (activeFilter === "active") {
      conds.push(isNotNull(users.lastReadAt));
      conds.push(gte(users.lastReadAt, since10));
    }
    if (activeFilter === "new") conds.push(gte(users.createdAt, since30));

    if (activeFilter === "bookmarked") {
      conds.push(sql`${users.id} IN (
        SELECT DISTINCT user_id FROM bookmarks
        UNION ALL SELECT user_id FROM book_bookmarks
        UNION ALL SELECT user_id FROM dua_bookmarks
        UNION ALL SELECT user_id FROM motivational_bookmarks
      )`);
    }
    if (activeFilter === "rated") {
      conds.push(sql`${users.id} IN (
        SELECT DISTINCT user_id FROM story_ratings
        UNION ALL SELECT user_id FROM book_ratings
        UNION ALL SELECT user_id FROM dua_ratings
        UNION ALL SELECT user_id FROM motivational_ratings
      )`);
    }

    const where = and(...conds);
    const orderCol = activeFilter === "active"
      ? desc(users.lastReadAt)
      : sort === "oldest" ? asc(users.createdAt)
      : sort === "az" ? asc(users.username)
      : desc(users.createdAt);

    const [allUsers, countResult] = await Promise.all([
      db.select().from(users).where(where).orderBy(orderCol).limit(limit),
      db.select({ count: count() }).from(users).where(where),
    ]);
    return { users: allUsers, total: countResult[0]?.count ?? 0 };
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCategories(type?: string): Promise<Category[]> {
    const conds: any[] = [isNull(categories.deletedAt)];
    if (type) conds.push(eq(categories.type, type));
    return db.select().from(categories).where(and(...conds)).orderBy(categories.orderIndex, categories.name);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [cat] = await db.select().from(categories).where(and(eq(categories.id, id), isNull(categories.deletedAt)));
    return cat;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [byUrlSlug] = await db.select().from(categories).where(and(eq(categories.urlSlug, slug), isNull(categories.deletedAt)));
    if (byUrlSlug) return byUrlSlug;
    const [bySlug] = await db.select().from(categories).where(and(eq(categories.slug, slug), isNull(categories.deletedAt)));
    return bySlug;
  }

  async createCategory(cat: InsertCategory): Promise<Category> {
    const urlSlug = cat.urlSlug || toUrlSlug(cat.name);
    const [created] = await db.insert(categories).values({ ...cat, urlSlug }).returning();
    return created;
  }

  async updateCategory(id: string, cat: Partial<InsertCategory>): Promise<Category | undefined> {
    const updateData: Partial<InsertCategory> = { ...cat };
    if (cat.name && !cat.urlSlug) updateData.urlSlug = toUrlSlug(cat.name);
    const [updated] = await db.update(categories).set(updateData).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    await db.update(categories).set({ deletedAt: new Date() }).where(eq(categories.id, id));
    return true;
  }

  async restoreCategory(id: string): Promise<boolean> {
    await db.update(categories).set({ deletedAt: null }).where(eq(categories.id, id));
    return true;
  }

  async permanentDeleteCategory(id: string): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  async getDeletedCategories(): Promise<Category[]> {
    return db.select().from(categories).where(isNotNull(categories.deletedAt)).orderBy(desc(categories.deletedAt));
  }

  async getCategoryStoryCounts(): Promise<Record<string, number>> {
    const rows = await db
      .select({ categoryId: stories.categoryId, count: count() })
      .from(stories)
      .where(eq(stories.status, "published"))
      .groupBy(stories.categoryId);
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.categoryId) map[r.categoryId] = r.count;
    }
    return map;
  }

  async getCategoryBookCounts(): Promise<Record<string, number>> {
    const rows = await db
      .select({ name: books.category, count: count() })
      .from(books)
      .where(and(isNull(books.deletedAt), isNotNull(books.category)))
      .groupBy(books.category);
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.name) map[r.name] = r.count;
    }
    return map;
  }

  async getCategoryMotivationalCounts(): Promise<Record<string, number>> {
    const rows = await db
      .select({ name: motivationalStories.category, count: count() })
      .from(motivationalStories)
      .where(and(isNull(motivationalStories.deletedAt), isNotNull(motivationalStories.category)))
      .groupBy(motivationalStories.category);
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.name) map[r.name] = r.count;
    }
    return map;
  }

  async getCategoryDuaCounts(): Promise<Record<string, number>> {
    const rows = await db
      .select({ name: duas.category, count: count() })
      .from(duas)
      .where(and(isNull(duas.deletedAt), isNotNull(duas.category)))
      .groupBy(duas.category);
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.name) map[r.name] = r.count;
    }
    return map;
  }

  async getCategoryStoryViewCounts(): Promise<Record<string, number>> {
    const rows = await db
      .select({ categoryId: stories.categoryId, total: sum(stories.views) })
      .from(stories)
      .where(and(isNull(stories.deletedAt), eq(stories.status, "published")))
      .groupBy(stories.categoryId);
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.categoryId) map[r.categoryId] = Number(r.total) || 0;
    }
    return map;
  }

  async getCategoryBookViewCounts(): Promise<Record<string, number>> {
    const rows = await db
      .select({ name: books.category, total: sum(books.views) })
      .from(books)
      .where(and(isNull(books.deletedAt), isNotNull(books.category)))
      .groupBy(books.category);
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.name) map[r.name] = Number(r.total) || 0;
    }
    return map;
  }

  async getCategoryMotivationalViewCounts(): Promise<Record<string, number>> {
    const rows = await db
      .select({ name: motivationalStories.category, total: sum(motivationalStories.views) })
      .from(motivationalStories)
      .where(and(isNull(motivationalStories.deletedAt), isNotNull(motivationalStories.category)))
      .groupBy(motivationalStories.category);
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.name) map[r.name] = Number(r.total) || 0;
    }
    return map;
  }

  async getCategoryDuaViewCounts(): Promise<Record<string, number>> {
    const rows = await db
      .select({ name: duas.category, total: sum(duas.views) })
      .from(duas)
      .where(and(isNull(duas.deletedAt), isNotNull(duas.category)))
      .groupBy(duas.category);
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.name) map[r.name] = Number(r.total) || 0;
    }
    return map;
  }

  async getStories(opts?: { status?: string; categoryId?: string; featured?: boolean; search?: string; limit?: number; offset?: number; userId?: string; startDate?: string; endDate?: string; sortBy?: "views" | "date" }): Promise<StoryWithCategory[]> {
    const conditions: any[] = [isNull(stories.deletedAt)];
    if (opts?.status) conditions.push(eq(stories.status, opts.status));
    if (opts?.categoryId) conditions.push(eq(stories.categoryId, opts.categoryId));
    if (opts?.featured !== undefined) conditions.push(eq(stories.featured, opts.featured));
    if (opts?.search) conditions.push(ilike(stories.title, `%${opts.search}%`));
    if (opts?.userId) conditions.push(eq(stories.userId, opts.userId));
    if (opts?.startDate) conditions.push(gte(stories.createdAt, new Date(opts.startDate)));
    if (opts?.endDate) conditions.push(lte(stories.createdAt, new Date(opts.endDate)));

    const orderCol = opts?.sortBy === "views" ? desc(stories.views) : desc(stories.createdAt);

    const rows = await db
      .select({ story: stories, category: categories })
      .from(stories)
      .leftJoin(categories, eq(stories.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(orderCol)
      .limit(opts?.limit ?? 50)
      .offset(opts?.offset ?? 0);

    return rows.map((r) => ({ ...r.story, category: r.category }));
  }

  async getStoryById(id: string): Promise<StoryWithCategory | undefined> {
    const [row] = await db
      .select({ story: stories, category: categories })
      .from(stories)
      .leftJoin(categories, eq(stories.categoryId, categories.id))
      .where(and(eq(stories.id, id), isNull(stories.deletedAt)));
    if (!row) return undefined;
    return { ...row.story, category: row.category };
  }

  async getStoryBySlug(slug: string): Promise<StoryWithCategory | undefined> {
    const [row] = await db
      .select({ story: stories, category: categories })
      .from(stories)
      .leftJoin(categories, eq(stories.categoryId, categories.id))
      .where(and(eq(stories.slug, slug), isNull(stories.deletedAt)));
    if (!row) return undefined;
    return { ...row.story, category: row.category };
  }

  async createStory(story: InsertStory): Promise<Story> {
    const [created] = await db.insert(stories).values(story).returning();
    return created;
  }

  async updateStory(id: string, story: Partial<InsertStory>): Promise<Story | undefined> {
    const [updated] = await db.update(stories).set({ ...story, updatedAt: new Date() }).where(eq(stories.id, id)).returning();
    return updated;
  }

  async deleteStory(id: string): Promise<boolean> {
    await db.update(stories).set({ deletedAt: new Date() }).where(eq(stories.id, id));
    return true;
  }

  async deleteStories(ids: string[]): Promise<boolean> {
    for (const id of ids) {
      await db.update(stories).set({ deletedAt: new Date() }).where(eq(stories.id, id));
    }
    return true;
  }

  async restoreStory(id: string): Promise<boolean> {
    await db.update(stories).set({ deletedAt: null }).where(eq(stories.id, id));
    return true;
  }

  async permanentDeleteStory(id: string): Promise<boolean> {
    await db.delete(stories).where(eq(stories.id, id));
    return true;
  }

  async getDeletedStories(): Promise<StoryWithCategory[]> {
    const rows = await db
      .select({ story: stories, category: categories })
      .from(stories)
      .leftJoin(categories, eq(stories.categoryId, categories.id))
      .where(isNotNull(stories.deletedAt))
      .orderBy(desc(stories.deletedAt));
    return rows.map((r) => ({ ...r.story, category: r.category }));
  }

  async getStoryCount(status?: string): Promise<number> {
    const conditions: any[] = [isNull(stories.deletedAt)];
    if (status) conditions.push(eq(stories.status, status));
    const [result] = await db.select({ count: count() }).from(stories).where(and(...conditions));
    return result?.count ?? 0;
  }

  async getStoryTotalViews(): Promise<number> {
    const [result] = await db.select({ total: sum(stories.views) }).from(stories).where(isNull(stories.deletedAt));
    return Number(result?.total) || 0;
  }

  async getRecentStoryCount(days: number): Promise<number> {
    const since = new Date(Date.now() - days * 86400000);
    const [result] = await db.select({ count: count() }).from(stories)
      .where(and(isNull(stories.deletedAt), gte(stories.createdAt, since)));
    return result?.count ?? 0;
  }

  async incrementStoryViews(id: string): Promise<void> {
    await db.update(stories).set({ views: sql`${stories.views} + 1` }).where(eq(stories.id, id));
  }

  async getRelatedStories(storyId: string, categoryId: string | null, limit = 4): Promise<StoryWithCategory[]> {
    const conditions = [
      eq(stories.status, "published"),
      isNull(stories.deletedAt),
      sql`${stories.id} != ${storyId}`,
    ];
    if (categoryId) conditions.push(eq(stories.categoryId, categoryId));

    const rows = await db
      .select({ story: stories, category: categories })
      .from(stories)
      .leftJoin(categories, eq(stories.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(stories.createdAt))
      .limit(limit);

    return rows.map((r) => ({ ...r.story, category: r.category }));
  }

  async getBooks(opts?: { type?: string; category?: string; search?: string; sort?: string; minRating?: number; userId?: string; published?: boolean }): Promise<Book[]> {
    const conditions: any[] = [isNull(books.deletedAt)];
    if (opts?.type && opts.type !== "all") conditions.push(eq(books.type, opts.type));
    if (opts?.category) conditions.push(eq(books.category, opts.category));
    if (opts?.search) conditions.push(ilike(books.title, `%${opts.search}%`));
    if (opts?.minRating) conditions.push(gte(books.averageRating, opts.minRating));
    if (opts?.userId) conditions.push(eq(books.userId, opts.userId));
    if (opts?.published !== undefined) conditions.push(eq(books.published, opts.published));

    let orderBy;
    switch (opts?.sort) {
      case "most-viewed": orderBy = desc(books.views); break;
      case "highest-rated": orderBy = desc(books.averageRating); break;
      case "newest": default: orderBy = desc(books.createdAt); break;
    }

    return db.select().from(books).where(and(...conditions)).orderBy(orderBy);
  }

  async getBookById(id: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(and(eq(books.id, id), isNull(books.deletedAt)));
    return book;
  }

  async getBookBySlug(slug: string): Promise<BookWithChapters | undefined> {
    const [book] = await db.select().from(books).where(and(eq(books.slug, slug), isNull(books.deletedAt)));
    if (!book) return undefined;
    const chapters = await this.getBookChapters(book.id);
    return { ...book, chapters };
  }

  async createBook(book: InsertBook): Promise<Book> {
    const [created] = await db.insert(books).values(book).returning();
    return created;
  }

  async updateBook(id: string, book: Partial<InsertBook>): Promise<Book | undefined> {
    const [updated] = await db.update(books).set(book).where(eq(books.id, id)).returning();
    return updated;
  }

  async deleteBook(id: string): Promise<boolean> {
    await db.update(books).set({ deletedAt: new Date() }).where(eq(books.id, id));
    return true;
  }

  async restoreBook(id: string): Promise<boolean> {
    await db.update(books).set({ deletedAt: null }).where(eq(books.id, id));
    return true;
  }

  async permanentDeleteBook(id: string): Promise<boolean> {
    await db.delete(books).where(eq(books.id, id));
    return true;
  }

  async getDeletedBooks(): Promise<Book[]> {
    return db.select().from(books).where(isNotNull(books.deletedAt)).orderBy(desc(books.deletedAt));
  }

  async incrementBookViews(id: string): Promise<void> {
    await db.update(books).set({ views: sql`${books.views} + 1` }).where(eq(books.id, id));
  }

  async getFeaturedFreeBooks(limit = 6): Promise<Book[]> {
    return db.select().from(books)
      .where(eq(books.type, "free"))
      .orderBy(sql`RANDOM()`)
      .limit(limit);
  }

  async getBookCategories(): Promise<string[]> {
    const rows = await db.selectDistinct({ category: books.category }).from(books).where(sql`${books.category} IS NOT NULL`);
    return rows.map(r => r.category!).filter(Boolean);
  }

  async getBookCategoriesAdmin(): Promise<string[]> {
    const rows = await db.selectDistinct({ category: books.category }).from(books).where(and(isNull(books.deletedAt), sql`${books.category} IS NOT NULL`));
    return rows.map(r => r.category!).filter(Boolean).sort();
  }

  async getBooksAdmin(opts?: { type?: string; category?: string; search?: string; sort?: string; published?: boolean; userId?: string; startDate?: string; endDate?: string; limit?: number; offset?: number }): Promise<{ books: Book[]; total: number }> {
    const conditions: any[] = [isNull(books.deletedAt)];
    if (opts?.type && opts.type !== "all") conditions.push(eq(books.type, opts.type));
    if (opts?.category && opts.category !== "all") conditions.push(eq(books.category, opts.category));
    if (opts?.search) conditions.push(ilike(books.title, `%${opts.search}%`));
    if (opts?.published !== undefined) conditions.push(eq(books.published, opts.published));
    if (opts?.userId) conditions.push(eq(books.userId, opts.userId));
    if (opts?.startDate) conditions.push(gte(books.createdAt, new Date(opts.startDate)));
    if (opts?.endDate) conditions.push(lte(books.createdAt, new Date(opts.endDate)));

    let orderBy;
    switch (opts?.sort) {
      case "most-viewed": orderBy = desc(books.views); break;
      case "highest-rated": orderBy = desc(books.averageRating); break;
      default: orderBy = desc(books.createdAt); break;
    }

    const lim = opts?.limit ?? 50;
    const off = opts?.offset ?? 0;
    const [allBooks, countResult] = await Promise.all([
      db.select().from(books).where(and(...conditions)).orderBy(orderBy).limit(lim).offset(off),
      db.select({ count: count() }).from(books).where(and(...conditions)),
    ]);
    return { books: allBooks, total: countResult[0]?.count ?? 0 };
  }

  async getBooksAdminStats(): Promise<{ total: number; freeTotal: number; paidTotal: number; totalViews: number; freeViews: number; paidViews: number; published: number; publishedFree: number; publishedPaid: number; recentCount: number; recentFree: number; recentPaid: number; fiveStarCount: number; fiveStarFree: number; fiveStarPaid: number; fourStarCount: number; fourStarFree: number; fourStarPaid: number }> {
    const since30 = new Date(Date.now() - 30 * 86400000);
    const base = isNull(books.deletedAt);
    const [
      totalRes, freeRes, paidRes,
      viewsRes, freeViewsRes, paidViewsRes,
      pubRes, pubFreeRes, pubPaidRes,
      recentRes, recentFreeRes, recentPaidRes,
      fiveStarRes, fiveStarFreeRes, fiveStarPaidRes,
      fourStarRes, fourStarFreeRes, fourStarPaidRes,
    ] = await Promise.all([
      db.select({ c: count() }).from(books).where(base),
      db.select({ c: count() }).from(books).where(and(base, eq(books.type, "free"))),
      db.select({ c: count() }).from(books).where(and(base, eq(books.type, "paid"))),
      db.select({ v: sum(books.views) }).from(books).where(base),
      db.select({ v: sum(books.views) }).from(books).where(and(base, eq(books.type, "free"))),
      db.select({ v: sum(books.views) }).from(books).where(and(base, eq(books.type, "paid"))),
      db.select({ c: count() }).from(books).where(and(base, eq(books.published, true))),
      db.select({ c: count() }).from(books).where(and(base, eq(books.type, "free"), eq(books.published, true))),
      db.select({ c: count() }).from(books).where(and(base, eq(books.type, "paid"), eq(books.published, true))),
      db.select({ c: count() }).from(books).where(and(base, gte(books.createdAt, since30))),
      db.select({ c: count() }).from(books).where(and(base, eq(books.type, "free"), gte(books.createdAt, since30))),
      db.select({ c: count() }).from(books).where(and(base, eq(books.type, "paid"), gte(books.createdAt, since30))),
      db.select({ c: count() }).from(books).where(and(base, gte(books.averageRating, 4.1))),
      db.select({ c: count() }).from(books).where(and(base, eq(books.type, "free"), gte(books.averageRating, 4.1))),
      db.select({ c: count() }).from(books).where(and(base, eq(books.type, "paid"), gte(books.averageRating, 4.1))),
      db.select({ c: count() }).from(books).where(and(base, gte(books.averageRating, 3.5), lte(books.averageRating, 4.0))),
      db.select({ c: count() }).from(books).where(and(base, eq(books.type, "free"), gte(books.averageRating, 3.5), lte(books.averageRating, 4.0))),
      db.select({ c: count() }).from(books).where(and(base, eq(books.type, "paid"), gte(books.averageRating, 3.5), lte(books.averageRating, 4.0))),
    ]);
    return {
      total: totalRes[0]?.c ?? 0,
      freeTotal: freeRes[0]?.c ?? 0,
      paidTotal: paidRes[0]?.c ?? 0,
      totalViews: Number(viewsRes[0]?.v) || 0,
      freeViews: Number(freeViewsRes[0]?.v) || 0,
      paidViews: Number(paidViewsRes[0]?.v) || 0,
      published: pubRes[0]?.c ?? 0,
      publishedFree: pubFreeRes[0]?.c ?? 0,
      publishedPaid: pubPaidRes[0]?.c ?? 0,
      recentCount: recentRes[0]?.c ?? 0,
      recentFree: recentFreeRes[0]?.c ?? 0,
      recentPaid: recentPaidRes[0]?.c ?? 0,
      fiveStarCount: fiveStarRes[0]?.c ?? 0,
      fiveStarFree: fiveStarFreeRes[0]?.c ?? 0,
      fiveStarPaid: fiveStarPaidRes[0]?.c ?? 0,
      fourStarCount: fourStarRes[0]?.c ?? 0,
      fourStarFree: fourStarFreeRes[0]?.c ?? 0,
      fourStarPaid: fourStarPaidRes[0]?.c ?? 0,
    };
  }

  async getBookChapters(bookId: string): Promise<BookChapter[]> {
    return db.select().from(bookChapters)
      .where(eq(bookChapters.bookId, bookId))
      .orderBy(asc(bookChapters.orderIndex));
  }

  async createBookChapter(chapter: InsertBookChapter): Promise<BookChapter> {
    const [created] = await db.insert(bookChapters).values(chapter).returning();
    return created;
  }

  async updateBookChapter(id: string, data: Partial<InsertBookChapter>): Promise<BookChapter | undefined> {
    const [updated] = await db.update(bookChapters).set(data).where(eq(bookChapters.id, id)).returning();
    return updated;
  }

  async deleteBookChapter(id: string): Promise<boolean> {
    await db.delete(bookChapters).where(eq(bookChapters.id, id));
    return true;
  }

  async deleteBookChaptersByBookId(bookId: string): Promise<void> {
    await db.delete(bookChapters).where(eq(bookChapters.bookId, bookId));
  }

  async getBookBookmark(userId: string, bookId: string): Promise<BookBookmark | undefined> {
    const [bm] = await db.select().from(bookBookmarks)
      .where(and(eq(bookBookmarks.userId, userId), eq(bookBookmarks.bookId, bookId)));
    return bm;
  }

  async createBookBookmark(userId: string, bookId: string): Promise<BookBookmark> {
    const [bm] = await db.insert(bookBookmarks).values({ userId, bookId }).returning();
    return bm;
  }

  async deleteBookBookmark(userId: string, bookId: string): Promise<boolean> {
    await db.delete(bookBookmarks)
      .where(and(eq(bookBookmarks.userId, userId), eq(bookBookmarks.bookId, bookId)));
    return true;
  }

  async getUserBookBookmarks(userId: string): Promise<(BookBookmark & { book: Book })[]> {
    const rows = await db.select({ bookmark: bookBookmarks, book: books })
      .from(bookBookmarks)
      .innerJoin(books, eq(bookBookmarks.bookId, books.id))
      .where(eq(bookBookmarks.userId, userId))
      .orderBy(desc(bookBookmarks.createdAt));
    return rows.map(r => ({ ...r.bookmark, book: r.book }));
  }

  async getBookBookmarkCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(bookBookmarks).where(eq(bookBookmarks.userId, userId));
    return result?.count ?? 0;
  }

  async getBookProgress(userId: string, bookId: string): Promise<BookProgressRecord | undefined> {
    const [p] = await db.select().from(bookProgress)
      .where(and(eq(bookProgress.userId, userId), eq(bookProgress.bookId, bookId)));
    return p;
  }

  async upsertBookProgress(userId: string, bookId: string, lastChapterId: string | null, lastPage: number): Promise<BookProgressRecord> {
    const existing = await this.getBookProgress(userId, bookId);
    if (existing) {
      const [updated] = await db.update(bookProgress)
        .set({ lastChapterId, lastPage, updatedAt: new Date() })
        .where(eq(bookProgress.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(bookProgress)
      .values({ userId, bookId, lastChapterId, lastPage })
      .returning();
    return created;
  }

  async getUserBookProgress(userId: string): Promise<(BookProgressRecord & { book: Book })[]> {
    const rows = await db.select({ progress: bookProgress, book: books })
      .from(bookProgress)
      .innerJoin(books, eq(bookProgress.bookId, books.id))
      .where(eq(bookProgress.userId, userId))
      .orderBy(desc(bookProgress.updatedAt));
    return rows.map(r => ({ ...r.progress, book: r.book }));
  }

  async getBookmarks(userId: string): Promise<(Bookmark & { story: StoryWithCategory })[]> {
    const rows = await db
      .select({ bookmark: bookmarks, story: stories, category: categories })
      .from(bookmarks)
      .innerJoin(stories, eq(bookmarks.storyId, stories.id))
      .leftJoin(categories, eq(stories.categoryId, categories.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));

    return rows.map(r => ({
      ...r.bookmark,
      story: { ...r.story, category: r.category },
    }));
  }

  async getBookmark(userId: string, storyId: string): Promise<Bookmark | undefined> {
    const [bm] = await db.select().from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.storyId, storyId)));
    return bm;
  }

  async createBookmark(userId: string, storyId: string): Promise<Bookmark> {
    const [bm] = await db.insert(bookmarks).values({ userId, storyId }).returning();
    return bm;
  }

  async deleteBookmark(userId: string, storyId: string): Promise<boolean> {
    await db.delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.storyId, storyId)));
    return true;
  }

  async getBookRatings(bookId: string): Promise<BookRating[]> {
    return db.select().from(bookRatings)
      .where(eq(bookRatings.bookId, bookId))
      .orderBy(desc(bookRatings.createdAt));
  }

  async getUserBookRating(userId: string, bookId: string): Promise<BookRating | undefined> {
    const [r] = await db.select().from(bookRatings)
      .where(and(eq(bookRatings.userId, userId), eq(bookRatings.bookId, bookId)));
    return r;
  }

  async createBookRating(userId: string, bookId: string, rating: number, comment?: string): Promise<BookRating> {
    const existing = await this.getUserBookRating(userId, bookId);
    if (existing) {
      const [updated] = await db.update(bookRatings)
        .set({ rating, comment })
        .where(eq(bookRatings.id, existing.id))
        .returning();
      await this.updateBookAverageRating(bookId);
      return updated;
    }
    const [created] = await db.insert(bookRatings).values({ userId, bookId, rating, comment }).returning();
    await this.updateBookAverageRating(bookId);
    return created;
  }

  async updateBookAverageRating(bookId: string): Promise<void> {
    const [result] = await db.select({
      avg: sql<number>`COALESCE(AVG(${bookRatings.rating}), 0)`,
      total: count(),
    }).from(bookRatings).where(eq(bookRatings.bookId, bookId));

    await db.update(books).set({
      averageRating: result.avg,
      totalRatings: result.total,
    }).where(eq(books.id, bookId));
  }

  async getBookmarkCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(bookmarks).where(eq(bookmarks.userId, userId));
    return result?.count ?? 0;
  }

  async getUserBookRatings(userId: string): Promise<(BookRating & { bookTitle: string })[]> {
    const rows = await db.select({
      rating: bookRatings,
      bookTitle: books.title,
    }).from(bookRatings)
      .innerJoin(books, eq(bookRatings.bookId, books.id))
      .where(eq(bookRatings.userId, userId))
      .orderBy(desc(bookRatings.createdAt));
    return rows.map(r => ({ ...r.rating, bookTitle: r.bookTitle }));
  }

  async getUserBookRatingCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(bookRatings).where(eq(bookRatings.userId, userId));
    return result?.count ?? 0;
  }

  async getRecommendedBooks(bookId: string, category: string | null, limit = 4): Promise<Book[]> {
    const conditions = [ne(books.id, bookId)];
    if (category) conditions.push(eq(books.category, category));
    return db.select().from(books)
      .where(and(...conditions))
      .orderBy(desc(books.averageRating))
      .limit(limit);
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
  }

  async getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: Date } | undefined> {
    const [row] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    if (!row) return undefined;
    return { userId: row.userId, expiresAt: row.expiresAt };
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  }

  async setUserOtp(userId: string, code: string, expiry: Date): Promise<void> {
    await db.update(users).set({ otpCode: code, otpExpiry: expiry }).where(eq(users.id, userId));
  }

  async clearUserOtp(userId: string): Promise<void> {
    await db.update(users).set({ otpCode: null, otpExpiry: null }).where(eq(users.id, userId));
  }

  async getSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db.insert(siteSettings).values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const rows = await db.select().from(siteSettings);
    const result: Record<string, string> = {};
    for (const row of rows) {
      if (row.value) result[row.key] = row.value;
    }
    return result;
  }

  async getMotivationalStories(opts?: { category?: string; search?: string; sort?: string; published?: boolean; limit?: number; offset?: number; userId?: string; startDate?: string; endDate?: string }): Promise<{ stories: MotivationalStory[]; total: number }> {
    const conditions: any[] = [isNull(motivationalStories.deletedAt)];
    if (opts?.published !== undefined) conditions.push(eq(motivationalStories.published, opts.published));
    if (opts?.category) conditions.push(eq(motivationalStories.category, opts.category));
    if (opts?.search) conditions.push(ilike(motivationalStories.title, `%${opts.search}%`));
    if (opts?.userId) conditions.push(eq(motivationalStories.userId, opts.userId));
    if (opts?.startDate) conditions.push(gte(motivationalStories.createdAt, new Date(opts.startDate)));
    if (opts?.endDate) conditions.push(lte(motivationalStories.createdAt, new Date(opts.endDate)));
    const where = and(...conditions);

    let orderBy;
    switch (opts?.sort) {
      case "most-viewed": orderBy = desc(motivationalStories.views); break;
      case "highest-rated": orderBy = desc(motivationalStories.averageRating); break;
      case "newest": default: orderBy = desc(motivationalStories.createdAt); break;
    }

    const [totalResult] = await db.select({ count: count() }).from(motivationalStories).where(where);
    const rows = await db.select().from(motivationalStories).where(where).orderBy(orderBy).limit(opts?.limit ?? 50).offset(opts?.offset ?? 0);
    return { stories: rows, total: totalResult?.count ?? 0 };
  }

  async getMotivationalTotalViews(): Promise<number> {
    const [result] = await db.select({ total: sum(motivationalStories.views) }).from(motivationalStories).where(isNull(motivationalStories.deletedAt));
    return Number(result?.total) || 0;
  }

  async getRecentMotivationalCount(days: number): Promise<number> {
    const since = new Date(Date.now() - days * 86400000);
    const [result] = await db.select({ count: count() }).from(motivationalStories)
      .where(and(isNull(motivationalStories.deletedAt), gte(motivationalStories.createdAt, since)));
    return result?.count ?? 0;
  }

  async getMotivationalRatingDistribution(): Promise<{ fiveStarCount: number; fourStarCount: number }> {
    const [fiveStar] = await db.select({ count: count() }).from(motivationalStories)
      .where(and(isNull(motivationalStories.deletedAt), gte(motivationalStories.averageRating, 4.1)));
    const [fourStar] = await db.select({ count: count() }).from(motivationalStories)
      .where(and(isNull(motivationalStories.deletedAt), gte(motivationalStories.averageRating, 3.5), lte(motivationalStories.averageRating, 4.0)));
    return { fiveStarCount: fiveStar?.count ?? 0, fourStarCount: fourStar?.count ?? 0 };
  }

  async getMotivationalStoryById(id: string): Promise<MotivationalStoryWithLessons | undefined> {
    const [story] = await db.select().from(motivationalStories).where(and(eq(motivationalStories.id, id), isNull(motivationalStories.deletedAt)));
    if (!story) return undefined;
    const lessons = await this.getMotivationalLessons(story.id);
    return { ...story, lessons };
  }

  async getMotivationalStoryBySlug(slug: string): Promise<MotivationalStoryWithLessons | undefined> {
    const [story] = await db.select().from(motivationalStories).where(and(eq(motivationalStories.slug, slug), isNull(motivationalStories.deletedAt)));
    if (!story) return undefined;
    const lessons = await this.getMotivationalLessons(story.id);
    return { ...story, lessons };
  }

  async createMotivationalStory(story: InsertMotivationalStory): Promise<MotivationalStory> {
    const [created] = await db.insert(motivationalStories).values(story).returning();
    return created;
  }

  async updateMotivationalStory(id: string, story: Partial<InsertMotivationalStory>): Promise<MotivationalStory | undefined> {
    const [updated] = await db.update(motivationalStories).set({ ...story, updatedAt: new Date() }).where(eq(motivationalStories.id, id)).returning();
    return updated;
  }

  async deleteMotivationalStory(id: string): Promise<boolean> {
    await db.update(motivationalStories).set({ deletedAt: new Date() }).where(eq(motivationalStories.id, id));
    return true;
  }

  async restoreMotivationalStory(id: string): Promise<boolean> {
    await db.update(motivationalStories).set({ deletedAt: null }).where(eq(motivationalStories.id, id));
    return true;
  }

  async permanentDeleteMotivationalStory(id: string): Promise<boolean> {
    await db.delete(motivationalStories).where(eq(motivationalStories.id, id));
    return true;
  }

  async getDeletedMotivationalStories(): Promise<MotivationalStory[]> {
    return db.select().from(motivationalStories).where(isNotNull(motivationalStories.deletedAt)).orderBy(desc(motivationalStories.deletedAt));
  }

  async duplicateMotivationalStory(id: string): Promise<MotivationalStory> {
    const story = await this.getMotivationalStoryById(id);
    if (!story) throw new Error("Story not found");
    const newSlug = `${story.slug}-copy-${Date.now()}`;
    const [newStory] = await db.insert(motivationalStories).values({
      title: `${story.title} (Copy)`,
      slug: newSlug,
      category: story.category,
      description: story.description,
      content: story.content,
      published: false,
    }).returning();
    const lessons = await this.getMotivationalLessons(id);
    for (const lesson of lessons) {
      await db.insert(motivationalLessons).values({
        storyId: newStory.id,
        title: lesson.title,
        orderIndex: lesson.orderIndex,
        content: lesson.content,
      });
    }
    return newStory;
  }

  async getMotivationalStoryCount(published?: boolean): Promise<number> {
    const conditions: any[] = [isNull(motivationalStories.deletedAt)];
    if (published !== undefined) conditions.push(eq(motivationalStories.published, published));
    const [result] = await db.select({ count: count() }).from(motivationalStories).where(and(...conditions));
    return result?.count ?? 0;
  }

  async getMotivationalLessons(storyId: string): Promise<MotivationalLesson[]> {
    return db.select().from(motivationalLessons)
      .where(eq(motivationalLessons.storyId, storyId))
      .orderBy(asc(motivationalLessons.orderIndex));
  }

  async createMotivationalLesson(lesson: InsertMotivationalLesson): Promise<MotivationalLesson> {
    const [created] = await db.insert(motivationalLessons).values(lesson).returning();
    return created;
  }

  async updateMotivationalLesson(id: string, data: Partial<InsertMotivationalLesson>): Promise<MotivationalLesson | undefined> {
    const [updated] = await db.update(motivationalLessons).set(data).where(eq(motivationalLessons.id, id)).returning();
    return updated;
  }

  async deleteMotivationalLesson(id: string): Promise<boolean> {
    await db.delete(motivationalLessons).where(eq(motivationalLessons.id, id));
    return true;
  }

  async toggleMotivationalBookmark(userId: string, storyId: string): Promise<boolean> {
    const [existing] = await db.select().from(motivationalBookmarks)
      .where(and(eq(motivationalBookmarks.userId, userId), eq(motivationalBookmarks.storyId, storyId)));
    if (existing) {
      await db.delete(motivationalBookmarks).where(eq(motivationalBookmarks.id, existing.id));
      return false;
    }
    await db.insert(motivationalBookmarks).values({ userId, storyId });
    return true;
  }

  async getMotivationalBookmarks(userId: string): Promise<(MotivationalBookmark & { story: MotivationalStory })[]> {
    const rows = await db.select({ bookmark: motivationalBookmarks, story: motivationalStories })
      .from(motivationalBookmarks)
      .innerJoin(motivationalStories, eq(motivationalBookmarks.storyId, motivationalStories.id))
      .where(eq(motivationalBookmarks.userId, userId))
      .orderBy(desc(motivationalBookmarks.createdAt));
    return rows.map(r => ({ ...r.bookmark, story: r.story }));
  }

  async isMotivationalBookmarked(userId: string, storyId: string): Promise<boolean> {
    const [existing] = await db.select().from(motivationalBookmarks)
      .where(and(eq(motivationalBookmarks.userId, userId), eq(motivationalBookmarks.storyId, storyId)));
    return !!existing;
  }

  async toggleDuaBookmark(userId: string, duaId: string): Promise<boolean> {
    const [existing] = await db.select().from(duaBookmarks)
      .where(and(eq(duaBookmarks.userId, userId), eq(duaBookmarks.duaId, duaId)));
    if (existing) {
      await db.delete(duaBookmarks).where(eq(duaBookmarks.id, existing.id));
      return false;
    }
    await db.insert(duaBookmarks).values({ userId, duaId });
    return true;
  }

  async getDuaBookmarks(userId: string): Promise<(DuaBookmark & { dua: Dua })[]> {
    const rows = await db.select({ bookmark: duaBookmarks, dua: duas })
      .from(duaBookmarks)
      .innerJoin(duas, eq(duaBookmarks.duaId, duas.id))
      .where(eq(duaBookmarks.userId, userId))
      .orderBy(desc(duaBookmarks.createdAt));
    return rows.map(r => ({ ...r.bookmark, dua: r.dua }));
  }

  async isDuaBookmarked(userId: string, duaId: string): Promise<boolean> {
    const [existing] = await db.select().from(duaBookmarks)
      .where(and(eq(duaBookmarks.userId, userId), eq(duaBookmarks.duaId, duaId)));
    return !!existing;
  }

  async createMotivationalRating(userId: string, storyId: string, rating: number, comment?: string): Promise<MotivationalRating> {
    const existing = await this.getUserMotivationalRating(userId, storyId);
    if (existing) {
      const [updated] = await db.update(motivationalRatings)
        .set({ rating, comment })
        .where(eq(motivationalRatings.id, existing.id))
        .returning();
      await this.updateMotivationalAverageRating(storyId);
      return updated;
    }
    const [created] = await db.insert(motivationalRatings).values({ userId, storyId, rating, comment }).returning();
    await this.updateMotivationalAverageRating(storyId);
    return created;
  }

  async getMotivationalRatings(storyId: string): Promise<(MotivationalRating & { username: string })[]> {
    const rows = await db.select({ rating: motivationalRatings, username: users.username })
      .from(motivationalRatings)
      .innerJoin(users, eq(motivationalRatings.userId, users.id))
      .where(eq(motivationalRatings.storyId, storyId))
      .orderBy(desc(motivationalRatings.createdAt));
    return rows.map(r => ({ ...r.rating, username: r.username }));
  }

  async getUserMotivationalRating(userId: string, storyId: string): Promise<MotivationalRating | undefined> {
    const [r] = await db.select().from(motivationalRatings)
      .where(and(eq(motivationalRatings.userId, userId), eq(motivationalRatings.storyId, storyId)));
    return r;
  }

  async updateMotivationalAverageRating(storyId: string): Promise<void> {
    const [result] = await db.select({
      avg: sql<number>`COALESCE(AVG(${motivationalRatings.rating}), 0)`,
      total: count(),
    }).from(motivationalRatings).where(eq(motivationalRatings.storyId, storyId));
    await db.update(motivationalStories).set({
      averageRating: result.avg,
      totalRatings: result.total,
    }).where(eq(motivationalStories.id, storyId));
  }

  async incrementMotivationalViews(id: string): Promise<void> {
    await db.update(motivationalStories).set({ views: sql`${motivationalStories.views} + 1` }).where(eq(motivationalStories.id, id));
  }

  async upsertMotivationalProgress(userId: string, storyId: string, lastLessonId: string): Promise<MotivationalProgress> {
    const [existing] = await db.select().from(motivationalProgress)
      .where(and(eq(motivationalProgress.userId, userId), eq(motivationalProgress.storyId, storyId)));
    if (existing) {
      const [updated] = await db.update(motivationalProgress)
        .set({ lastLessonId, updatedAt: new Date() })
        .where(eq(motivationalProgress.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(motivationalProgress).values({ userId, storyId, lastLessonId }).returning();
    return created;
  }

  async getMotivationalProgress(userId: string, storyId: string): Promise<MotivationalProgress | undefined> {
    const [p] = await db.select().from(motivationalProgress)
      .where(and(eq(motivationalProgress.userId, userId), eq(motivationalProgress.storyId, storyId)));
    return p;
  }

  async getMotivationalCategories(): Promise<string[]> {
    const rows = await db.selectDistinct({ category: motivationalStories.category })
      .from(motivationalStories)
      .where(and(sql`${motivationalStories.category} IS NOT NULL`, eq(motivationalStories.published, true), isNull(motivationalStories.deletedAt)));
    return rows.map(r => r.category!).filter(Boolean);
  }

  async getMotivationalCategoriesAdmin(): Promise<string[]> {
    const rows = await db.selectDistinct({ category: motivationalStories.category })
      .from(motivationalStories)
      .where(and(sql`${motivationalStories.category} IS NOT NULL`, isNull(motivationalStories.deletedAt)));
    return rows.map(r => r.category!).filter(Boolean).sort();
  }

  async getPopularMotivationalStories(limit = 4): Promise<MotivationalStory[]> {
    return db.select().from(motivationalStories)
      .where(and(eq(motivationalStories.published, true), isNull(motivationalStories.deletedAt)))
      .orderBy(desc(motivationalStories.views), desc(motivationalStories.averageRating))
      .limit(limit);
  }

  async getRelatedMotivationalStories(storyId: string, category: string | null, limit = 4): Promise<MotivationalStory[]> {
    const conditions = [eq(motivationalStories.published, true), ne(motivationalStories.id, storyId), isNull(motivationalStories.deletedAt)];
    if (category) conditions.push(eq(motivationalStories.category, category));
    return db.select().from(motivationalStories)
      .where(and(...conditions))
      .orderBy(desc(motivationalStories.averageRating))
      .limit(limit);
  }
  async getStoryParts(storyId: string): Promise<StoryPartWithPages[]> {
    const parts = await db.select().from(storyParts)
      .where(eq(storyParts.storyId, storyId))
      .orderBy(asc(storyParts.orderIndex));
    const result: StoryPartWithPages[] = [];
    for (const part of parts) {
      const pages = await db.select().from(storyPages)
        .where(eq(storyPages.partId, part.id))
        .orderBy(asc(storyPages.orderIndex));
      result.push({ ...part, pages });
    }
    return result;
  }

  async getStoryPartById(id: string): Promise<StoryPart | undefined> {
    const [part] = await db.select().from(storyParts).where(eq(storyParts.id, id));
    return part;
  }

  async createStoryPart(part: InsertStoryPart): Promise<StoryPart> {
    const [created] = await db.insert(storyParts).values(part).returning();
    return created;
  }

  async updateStoryPart(id: string, data: Partial<InsertStoryPart>): Promise<StoryPart | undefined> {
    const [updated] = await db.update(storyParts).set(data).where(eq(storyParts.id, id)).returning();
    return updated;
  }

  async deleteStoryPart(id: string): Promise<boolean> {
    const result = await db.delete(storyParts).where(eq(storyParts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getStoryPages(partId: string): Promise<StoryPage[]> {
    return db.select().from(storyPages)
      .where(eq(storyPages.partId, partId))
      .orderBy(asc(storyPages.orderIndex));
  }

  async createStoryPage(page: InsertStoryPage): Promise<StoryPage> {
    const [created] = await db.insert(storyPages).values(page).returning();
    return created;
  }

  async updateStoryPage(id: string, data: Partial<InsertStoryPage>): Promise<StoryPage | undefined> {
    const [updated] = await db.update(storyPages).set(data).where(eq(storyPages.id, id)).returning();
    return updated;
  }

  async deleteStoryPage(id: string): Promise<boolean> {
    const result = await db.delete(storyPages).where(eq(storyPages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getStoryReadingProgress(userId: string, storyId: string): Promise<StoryReadingProgress | undefined> {
    const [p] = await db.select().from(storyReadingProgress)
      .where(and(eq(storyReadingProgress.userId, userId), eq(storyReadingProgress.storyId, storyId)));
    return p;
  }

  async upsertStoryReadingProgress(userId: string, storyId: string, lastPartId: string, lastPageIndex: number): Promise<StoryReadingProgress> {
    const existing = await this.getStoryReadingProgress(userId, storyId);
    if (existing) {
      const [updated] = await db.update(storyReadingProgress)
        .set({ lastPartId, lastPageIndex, updatedAt: new Date() })
        .where(eq(storyReadingProgress.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(storyReadingProgress)
      .values({ userId, storyId, lastPartId, lastPageIndex })
      .returning();
    return created;
  }

  async duplicateStory(id: string): Promise<Story> {
    const story = await this.getStoryById(id);
    if (!story) throw new Error("Story not found");
    const newSlug = `${story.slug}-copy-${Date.now()}`;
    const [newStory] = await db.insert(stories).values({
      title: `${story.title} (Copy)`,
      slug: newSlug,
      excerpt: story.excerpt,
      content: story.content,
      categoryId: story.categoryId,
      thumbnail: story.thumbnail,
      youtubeUrl: story.youtubeUrl,
      audioUrl: story.audioUrl,
      tags: story.tags,
      status: "draft",
      featured: false,
      publishedAt: null,
    }).returning();
    const parts = await this.getStoryParts(id);
    for (const part of parts) {
      const [newPart] = await db.insert(storyParts).values({
        storyId: newStory.id,
        title: part.title,
        summary: part.summary,
        coverImage: part.coverImage,
        videoUrl: part.videoUrl,
        audioUrl: part.audioUrl,
        orderIndex: part.orderIndex,
      }).returning();
      for (const page of part.pages) {
        await db.insert(storyPages).values({
          partId: newPart.id,
          content: page.content,
          orderIndex: page.orderIndex,
        });
      }
    }
    return newStory;
  }

  async duplicateStoryPage(id: string): Promise<StoryPage> {
    const [page] = await db.select().from(storyPages).where(eq(storyPages.id, id));
    if (!page) throw new Error("Page not found");
    const siblings = await db.select().from(storyPages).where(eq(storyPages.partId, page.partId));
    const maxOrder = siblings.reduce((max, p) => Math.max(max, p.orderIndex), 0);
    const [newPage] = await db.insert(storyPages).values({
      partId: page.partId,
      content: page.content,
      orderIndex: maxOrder + 1,
    }).returning();
    return newPage;
  }

  async duplicateStoryPart(id: string, storyId: string): Promise<StoryPartWithPages> {
    const part = await this.getStoryPartById(id);
    if (!part) throw new Error("Part not found");
    const existingParts = await this.getStoryParts(storyId);
    const maxOrder = existingParts.reduce((max, p) => Math.max(max, p.orderIndex), 0);
    const [newPart] = await db.insert(storyParts).values({
      storyId,
      title: `${part.title} (Copy)`,
      summary: part.summary,
      coverImage: part.coverImage,
      videoUrl: part.videoUrl,
      audioUrl: part.audioUrl,
      orderIndex: maxOrder + 1,
    }).returning();
    const pages = await this.getStoryPages(id);
    const newPages: StoryPage[] = [];
    for (const page of pages) {
      const [newPage] = await db.insert(storyPages).values({
        partId: newPart.id,
        content: page.content,
        orderIndex: page.orderIndex,
      }).returning();
      newPages.push(newPage);
    }
    return { ...newPart, pages: newPages };
  }

  async getBookParts(bookId: string): Promise<BookPartWithPages[]> {
    const parts = await db.select().from(bookParts)
      .where(eq(bookParts.bookId, bookId))
      .orderBy(asc(bookParts.orderIndex));
    const result: BookPartWithPages[] = [];
    for (const part of parts) {
      const pages = await db.select().from(bookPages)
        .where(eq(bookPages.partId, part.id))
        .orderBy(asc(bookPages.orderIndex));
      result.push({ ...part, pages });
    }
    return result;
  }

  async getBookPartById(id: string): Promise<BookPart | undefined> {
    const [part] = await db.select().from(bookParts).where(eq(bookParts.id, id));
    return part;
  }

  async createBookPart(part: InsertBookPart): Promise<BookPart> {
    const [created] = await db.insert(bookParts).values(part).returning();
    return created;
  }

  async updateBookPart(id: string, data: Partial<InsertBookPart>): Promise<BookPart | undefined> {
    const [updated] = await db.update(bookParts).set(data).where(eq(bookParts.id, id)).returning();
    return updated;
  }

  async deleteBookPart(id: string): Promise<boolean> {
    const result = await db.delete(bookParts).where(eq(bookParts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getBookPages(partId: string): Promise<BookPage[]> {
    return db.select().from(bookPages)
      .where(eq(bookPages.partId, partId))
      .orderBy(asc(bookPages.orderIndex));
  }

  async createBookPage(page: InsertBookPage): Promise<BookPage> {
    const [created] = await db.insert(bookPages).values(page).returning();
    return created;
  }

  async updateBookPage(id: string, data: Partial<InsertBookPage>): Promise<BookPage | undefined> {
    const [updated] = await db.update(bookPages).set(data).where(eq(bookPages.id, id)).returning();
    return updated;
  }

  async deleteBookPage(id: string): Promise<boolean> {
    const result = await db.delete(bookPages).where(eq(bookPages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async duplicateBookPart(id: string, bookId: string): Promise<BookPartWithPages> {
    const part = await this.getBookPartById(id);
    if (!part) throw new Error("Part not found");
    const existingParts = await this.getBookParts(bookId);
    const maxOrder = existingParts.reduce((max, p) => Math.max(max, p.orderIndex), 0);
    const [newPart] = await db.insert(bookParts).values({
      bookId,
      title: `${part.title} (Copy)`,
      summary: part.summary,
      coverImage: part.coverImage,
      videoUrl: part.videoUrl,
      audioUrl: part.audioUrl,
      orderIndex: maxOrder + 1,
    }).returning();
    const pages = await this.getBookPages(id);
    const newPages: BookPage[] = [];
    for (const page of pages) {
      const [newPage] = await db.insert(bookPages).values({
        partId: newPart.id,
        content: page.content,
        orderIndex: page.orderIndex,
      }).returning();
      newPages.push(newPage);
    }
    return { ...newPart, pages: newPages };
  }

  async duplicateBookPage(id: string): Promise<BookPage> {
    const [page] = await db.select().from(bookPages).where(eq(bookPages.id, id));
    if (!page) throw new Error("Page not found");
    const siblings = await db.select().from(bookPages).where(eq(bookPages.partId, page.partId));
    const maxOrder = siblings.reduce((max, p) => Math.max(max, p.orderIndex), 0);
    const [newPage] = await db.insert(bookPages).values({
      partId: page.partId,
      content: page.content,
      orderIndex: maxOrder + 1,
    }).returning();
    return newPage;
  }

  async getDuas(opts: { published?: boolean; search?: string; category?: string; sort?: string; limit?: number; offset?: number; userId?: string; startDate?: string; endDate?: string } = {}): Promise<{ duas: Dua[]; total: number }> {
    const conditions = [isNull(duas.deletedAt)];
    if (opts.published !== undefined) conditions.push(eq(duas.published, opts.published));
    if (opts.search) conditions.push(ilike(duas.title, `%${opts.search}%`));
    if (opts.category) conditions.push(eq(duas.category, opts.category));
    if (opts.userId) conditions.push(eq(duas.userId, opts.userId));
    if (opts.startDate) conditions.push(gte(duas.createdAt, new Date(opts.startDate)));
    if (opts.endDate) conditions.push(lte(duas.createdAt, new Date(opts.endDate)));
    const where = and(...conditions);
    let orderClause;
    if (opts.sort === "oldest") orderClause = [asc(duas.createdAt)];
    else if (opts.sort === "most-viewed") orderClause = [desc(duas.views), desc(duas.createdAt)];
    else orderClause = [desc(duas.createdAt)];
    const [totalResult, results] = await Promise.all([
      db.select({ count: count() }).from(duas).where(where),
      db.select().from(duas).where(where).orderBy(...orderClause).limit(opts.limit ?? 50).offset(opts.offset ?? 0),
    ]);
    return { duas: results, total: totalResult[0]?.count ?? 0 };
  }

  async getDuaCategories(): Promise<string[]> {
    const rows = await db.selectDistinct({ category: duas.category }).from(duas).where(and(isNull(duas.deletedAt), eq(duas.published, true)));
    return rows.map(r => r.category).filter((c): c is string => !!c).sort();
  }

  async getDuaCategoriesAdmin(): Promise<string[]> {
    const rows = await db.selectDistinct({ category: duas.category }).from(duas).where(isNull(duas.deletedAt));
    return rows.map(r => r.category).filter((c): c is string => !!c).sort();
  }

  async getDuaTotalViews(): Promise<number> {
    const [result] = await db.select({ total: sum(duas.views) }).from(duas).where(isNull(duas.deletedAt));
    return Number(result?.total) || 0;
  }

  async getRecentDuaCount(days: number): Promise<number> {
    const since = new Date(Date.now() - days * 86400000);
    const [result] = await db.select({ count: count() }).from(duas)
      .where(and(isNull(duas.deletedAt), gte(duas.createdAt, since)));
    return result?.count ?? 0;
  }

  async getDuaRatingDistribution(): Promise<{ fiveStarCount: number; fourStarCount: number }> {
    const [fiveStar] = await db.select({ count: count() }).from(duaRatings).where(eq(duaRatings.rating, 5));
    const [fourStar] = await db.select({ count: count() }).from(duaRatings).where(eq(duaRatings.rating, 4));
    return { fiveStarCount: fiveStar?.count ?? 0, fourStarCount: fourStar?.count ?? 0 };
  }

  async getDuaRatings(duaId: string): Promise<DuaRating[]> {
    return db.select().from(duaRatings).where(eq(duaRatings.duaId, duaId)).orderBy(desc(duaRatings.createdAt));
  }

  async getUserDuaRating(userId: string, duaId: string): Promise<DuaRating | undefined> {
    const [r] = await db.select().from(duaRatings).where(and(eq(duaRatings.userId, userId), eq(duaRatings.duaId, duaId)));
    return r;
  }

  async createDuaRating(userId: string, duaId: string, rating: number, comment?: string): Promise<DuaRating> {
    const existing = await this.getUserDuaRating(userId, duaId);
    if (existing) {
      const [updated] = await db.update(duaRatings).set({ rating, comment }).where(eq(duaRatings.id, existing.id)).returning();
      await this.updateDuaAverageRating(duaId);
      return updated;
    }
    const [created] = await db.insert(duaRatings).values({ userId, duaId, rating, comment }).returning();
    await this.updateDuaAverageRating(duaId);
    return created;
  }

  async updateDuaAverageRating(duaId: string): Promise<void> {
    const [result] = await db.select({
      avg: sql<number>`COALESCE(AVG(${duaRatings.rating}), 0)`,
      total: count(),
    }).from(duaRatings).where(eq(duaRatings.duaId, duaId));
    await db.update(duas).set({ averageRating: result.avg, totalRatings: result.total, updatedAt: new Date() }).where(eq(duas.id, duaId));
  }

  async getStoryRatings(storyId: string): Promise<StoryRating[]> {
    return db.select().from(storyRatings).where(eq(storyRatings.storyId, storyId)).orderBy(desc(storyRatings.createdAt));
  }

  async getUserStoryRating(userId: string, storyId: string): Promise<StoryRating | undefined> {
    const [r] = await db.select().from(storyRatings).where(and(eq(storyRatings.userId, userId), eq(storyRatings.storyId, storyId)));
    return r;
  }

  async createStoryRating(userId: string, storyId: string, rating: number, comment?: string): Promise<StoryRating> {
    const existing = await this.getUserStoryRating(userId, storyId);
    if (existing) {
      const [updated] = await db.update(storyRatings).set({ rating, comment }).where(eq(storyRatings.id, existing.id)).returning();
      await this.updateStoryAverageRating(storyId);
      return updated;
    }
    const [created] = await db.insert(storyRatings).values({ userId, storyId, rating, comment }).returning();
    await this.updateStoryAverageRating(storyId);
    return created;
  }

  async updateStoryAverageRating(storyId: string): Promise<void> {
    const [result] = await db.select({
      avg: sql<number>`COALESCE(AVG(${storyRatings.rating}), 0)`,
      total: count(),
    }).from(storyRatings).where(eq(storyRatings.storyId, storyId));
    await db.update(stories).set({ averageRating: result.avg, totalRatings: result.total, updatedAt: new Date() }).where(eq(stories.id, storyId));
  }

  async incrementDuaViews(id: string): Promise<void> {
    await db.update(duas).set({ views: sql`${duas.views} + 1` }).where(eq(duas.id, id));
  }

  private async getDuaWithParts(dua: Dua): Promise<DuaWithParts> {
    const parts = await db.select().from(duaParts).where(eq(duaParts.duaId, dua.id)).orderBy(asc(duaParts.orderIndex));
    return { ...dua, parts };
  }

  async getDuaBySlug(slug: string): Promise<DuaWithParts | undefined> {
    const [dua] = await db.select().from(duas).where(and(eq(duas.slug, slug), isNull(duas.deletedAt)));
    if (!dua) return undefined;
    return this.getDuaWithParts(dua);
  }

  async getDuaById(id: string): Promise<DuaWithParts | undefined> {
    const [dua] = await db.select().from(duas).where(and(eq(duas.id, id), isNull(duas.deletedAt)));
    if (!dua) return undefined;
    return this.getDuaWithParts(dua);
  }

  async createDua(data: InsertDua): Promise<Dua> {
    const [dua] = await db.insert(duas).values(data).returning();
    return dua;
  }

  async updateDua(id: string, data: Partial<InsertDua>): Promise<Dua | undefined> {
    const [dua] = await db.update(duas).set({ ...data, updatedAt: new Date() }).where(eq(duas.id, id)).returning();
    return dua;
  }

  async deleteDua(id: string): Promise<boolean> {
    const result = await db.update(duas).set({ deletedAt: new Date() }).where(eq(duas.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getDuaParts(duaId: string): Promise<DuaPart[]> {
    return db.select().from(duaParts).where(eq(duaParts.duaId, duaId)).orderBy(asc(duaParts.orderIndex));
  }

  async createDuaPart(data: InsertDuaPart): Promise<DuaPart> {
    const [part] = await db.insert(duaParts).values(data).returning();
    return part;
  }

  async updateDuaPart(id: string, data: Partial<InsertDuaPart>): Promise<DuaPart | undefined> {
    const [part] = await db.update(duaParts).set(data).where(eq(duaParts.id, id)).returning();
    return part;
  }

  async deleteDuaPart(id: string): Promise<boolean> {
    const result = await db.delete(duaParts).where(eq(duaParts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async duplicateDua(id: string): Promise<Dua> {
    const original = await this.getDuaById(id);
    if (!original) throw new Error("Dua not found");
    const newSlug = `${original.slug}-copy-${Date.now()}`;
    const newDua = await this.createDua({
      title: `${original.title} (Copy)`,
      slug: newSlug,
      description: original.description,
      thumbnail: original.thumbnail,
      category: original.category,
      orderIndex: original.orderIndex,
      published: false,
    });
    for (const part of original.parts) {
      await this.createDuaPart({
        duaId: newDua.id,
        title: part.title,
        arabicText: part.arabicText,
        transliteration: part.transliteration,
        translation: part.translation,
        explanation: part.explanation,
        orderIndex: part.orderIndex,
      });
    }
    return newDua;
  }

  async reorderDuaParts(duaId: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(duaParts).set({ orderIndex: i }).where(and(eq(duaParts.id, orderedIds[i]), eq(duaParts.duaId, duaId)));
    }
  }

  async getFooterPages(publishedOnly = false): Promise<FooterPage[]> {
    if (publishedOnly) {
      return db.select().from(footerPages).where(eq(footerPages.published, true)).orderBy(asc(footerPages.orderIndex));
    }
    return db.select().from(footerPages).orderBy(asc(footerPages.orderIndex));
  }

  async getFooterPageBySlug(slug: string): Promise<FooterPage | undefined> {
    const [page] = await db.select().from(footerPages).where(eq(footerPages.slug, slug));
    return page;
  }

  async getFooterPageById(id: string): Promise<FooterPage | undefined> {
    const [page] = await db.select().from(footerPages).where(eq(footerPages.id, id));
    return page;
  }

  async createFooterPage(data: InsertFooterPage): Promise<FooterPage> {
    const [page] = await db.insert(footerPages).values(data).returning();
    return page;
  }

  async updateFooterPage(id: string, data: Partial<InsertFooterPage>): Promise<FooterPage | undefined> {
    const [page] = await db.update(footerPages).set({ ...data, updatedAt: new Date() }).where(eq(footerPages.id, id)).returning();
    return page;
  }

  async deleteFooterPage(id: string): Promise<boolean> {
    const result = await db.delete(footerPages).where(eq(footerPages.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
