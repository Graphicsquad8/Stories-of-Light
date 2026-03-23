import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { UserLayout } from "@/components/user-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BookmarkIcon, Star, FolderOpen, Clock, Save, Loader2, BookOpen,
  ArrowRight, Calendar, Mail, Shield, Lightbulb, User, Lock, Eye,
  EyeOff, Camera, CheckCircle2, Activity, Edit2, X, ChevronDown, Moon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

type Section =
  | "overview"
  | "bookmarks"
  | "saved-stories"
  | "duas"
  | "books"
  | "ratings"
  | "interests"
  | "settings"
  | "settings-profile"
  | "settings-password"
  | "settings-security";

const SECTION_TITLES: Record<Section, string> = {
  overview: "Overview",
  bookmarks: "My Bookmarks",
  "saved-stories": "Saved Stories",
  duas: "Saved Duas",
  books: "My Books",
  ratings: "My Ratings",
  interests: "My Interests",
  settings: "Settings",
  "settings-profile": "Settings",
  "settings-password": "Settings",
  "settings-security": "Settings",
};

function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: number | string; color: string;
}) {
  return (
    <Card className="p-5" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none" data-testid={`stat-value-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function OverviewSection({ dashboard, onNavigate }: { dashboard: any; onNavigate: (s: Section) => void }) {
  const { user } = useAuth();
  const memberSince = dashboard.user?.createdAt
    ? format(new Date(dashboard.user.createdAt), "MMMM yyyy")
    : "Recently joined";

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="p-6" data-testid="card-profile-overview">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {dashboard.user?.avatarUrl ? (
              <img src={dashboard.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-9 h-9 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold font-serif" data-testid="text-overview-name">
              {dashboard.user?.name || dashboard.user?.username}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-muted-foreground">
              {dashboard.user?.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {dashboard.user.email}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                Member since {memberSince}
              </span>
              <Badge variant="secondary" className="flex items-center gap-1 capitalize">
                <Shield className="w-3 h-3" />
                {dashboard.user?.role || "User"}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onNavigate("settings-profile")} data-testid="button-edit-profile">
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={BookmarkIcon} label="Story Bookmarks" value={dashboard.stats?.totalBookmarks || 0} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" />
        <StatCard icon={BookOpen} label="Book Bookmarks" value={dashboard.stats?.bookBookmarks || 0} color="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400" />
        <StatCard icon={Star} label="Book Ratings" value={dashboard.stats?.totalRatings || 0} color="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" />
        <StatCard icon={FolderOpen} label="Categories Explored" value={dashboard.stats?.categoriesExplored || 0} color="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" />
      </div>

      {(dashboard.lastReadStory || (dashboard.bookProgress && dashboard.bookProgress.length > 0)) && (
        <Card className="p-5 border-primary/20 bg-primary/5" data-testid="card-continue-reading">
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-4">
            <Clock className="w-4 h-4" />
            Continue Reading
          </div>
          <div className="space-y-4">
            {dashboard.lastReadStory && (
              <Link href={`/stories/${dashboard.lastReadStory.slug}`}>
                <div className="flex items-center gap-4 group cursor-pointer">
                  {dashboard.lastReadStory.thumbnail && (
                    <img src={dashboard.lastReadStory.thumbnail} alt={dashboard.lastReadStory.title} className="w-20 h-14 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold group-hover:text-primary transition-colors truncate" data-testid="text-last-story">
                      {dashboard.lastReadStory.title}
                    </h3>
                    {dashboard.lastReadStory.category && (
                      <Badge variant="secondary" className="text-xs mt-1">{dashboard.lastReadStory.category.name}</Badge>
                    )}
                    {dashboard.lastReadStory.readAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last read {format(new Date(dashboard.lastReadStory.readAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            )}
            {dashboard.bookProgress?.map((p: any) => (
              <Link key={p.bookId} href={`/books/${p.book.slug}/read`}>
                <div className="flex items-center gap-4 group cursor-pointer" data-testid={`continue-book-${p.bookId}`}>
                  {p.book.coverUrl ? (
                    <img src={p.book.coverUrl} alt={p.book.title} className="w-12 h-16 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-16 rounded bg-muted flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-sm group-hover:text-primary transition-colors truncate">{p.book.title}</h3>
                    <p className="text-xs text-muted-foreground">Page {p.lastPage}</p>
                    {p.updatedAt && (
                      <p className="text-xs text-muted-foreground">Last read {format(new Date(p.updatedAt), "MMM d, yyyy")}</p>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Bookmarks", section: "bookmarks" as Section, count: dashboard.stats?.totalBookmarks || 0, icon: BookmarkIcon, color: "text-emerald-600" },
          { label: "Saved Stories", section: "saved-stories" as Section, count: dashboard.motivationalBookmarks?.length || 0, icon: Lightbulb, color: "text-amber-500" },
          { label: "Dua", section: "duas" as Section, count: dashboard.duaBookmarks?.length || 0, icon: Moon, color: "text-teal-600" },
          { label: "My Books", section: "books" as Section, count: dashboard.stats?.bookBookmarks || 0, icon: BookOpen, color: "text-purple-600" },
        ].map(({ label, section, count, icon: Icon, color }) => (
          <Card key={section} className="p-4 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onNavigate(section)} data-testid={`card-quick-${section}`}>
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <Badge variant="secondary" className="text-xs">{count}</Badge>
            </div>
            <p className="font-medium text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 group-hover:text-primary transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BookmarksSection({ bookmarks }: { bookmarks: any[] }) {
  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="text-center py-16 max-w-sm mx-auto" data-testid="empty-bookmarks">
        <BookmarkIcon className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold mb-2">No bookmarks yet</h3>
        <p className="text-sm text-muted-foreground mb-5">Stories you save will appear here</p>
        <Link href="/"><Button variant="outline" data-testid="button-browse-stories">Browse Stories</Button></Link>
      </div>
    );
  }
  return (
    <div className="space-y-3 max-w-3xl" data-testid="list-bookmarks">
      {bookmarks.map((bm: any) => (
        <Link key={bm.id} href={`/stories/${bm.story.slug}`}>
          <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`bookmark-${bm.storyId}`}>
            {bm.story.thumbnail ? (
              <img src={bm.story.thumbnail} alt={bm.story.title} className="w-16 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-16 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-muted-foreground/40" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate group-hover:text-primary transition-colors">{bm.story.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {bm.story.category && <Badge variant="secondary" className="text-xs">{bm.story.category.name}</Badge>}
                {bm.createdAt && <span className="text-xs text-muted-foreground">Saved {format(new Date(bm.createdAt), "MMM d, yyyy")}</span>}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </Card>
        </Link>
      ))}
    </div>
  );
}

function SavedStoriesSection() {
  const { data: bookmarks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/motivational-bookmarks"],
  });

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="text-center py-16 max-w-sm mx-auto" data-testid="empty-saved-stories">
        <Lightbulb className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold mb-2">No saved stories</h3>
        <p className="text-sm text-muted-foreground mb-5">Motivational stories you save will appear here</p>
        <Link href="/motivational-stories"><Button variant="outline" data-testid="button-browse-motivational">Browse Stories</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl" data-testid="list-saved-stories">
      {bookmarks.map((bm: any) => (
        <Link key={bm.id} href={`/motivational-stories/${bm.story?.slug || ""}`}>
          <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`saved-story-${bm.id}`}>
            <div className="w-11 h-11 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate group-hover:text-primary transition-colors">{bm.story?.title || "Unknown"}</h3>
              {bm.story?.category && <Badge variant="secondary" className="text-xs mt-1">{bm.story.category}</Badge>}
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </Card>
        </Link>
      ))}
    </div>
  );
}

function SavedDuasSection() {
  const { data: bookmarks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/dua-bookmarks"],
  });

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="text-center py-16 max-w-sm mx-auto" data-testid="empty-saved-duas">
        <Moon className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold mb-2">No saved duas</h3>
        <p className="text-sm text-muted-foreground mb-5">Duas you save will appear here</p>
        <Link href="/duas"><Button variant="outline" data-testid="button-browse-duas">Browse Duas</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl" data-testid="list-saved-duas">
      {bookmarks.map((bm: any) => (
        <Link key={bm.id} href={`/duas/${bm.dua?.slug || ""}`}>
          <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`saved-dua-${bm.id}`}>
            <div className="w-11 h-11 rounded-lg bg-teal-100 dark:bg-teal-950 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate group-hover:text-primary transition-colors">{bm.dua?.title || "Unknown"}</h3>
              {bm.dua?.category && <Badge variant="secondary" className="text-xs mt-1">{bm.dua.category}</Badge>}
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </Card>
        </Link>
      ))}
    </div>
  );
}

function BooksSection({ bookBookmarks, bookProgress }: { bookBookmarks: any[]; bookProgress: any[] }) {
  const hasBookmarks = bookBookmarks && bookBookmarks.length > 0;
  const hasProgress = bookProgress && bookProgress.length > 0;

  if (!hasBookmarks && !hasProgress) {
    return (
      <div className="text-center py-16 max-w-sm mx-auto" data-testid="empty-books">
        <BookOpen className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold mb-2">No saved books</h3>
        <p className="text-sm text-muted-foreground mb-5">Books you save or start reading will appear here</p>
        <Link href="/books"><Button variant="outline" data-testid="button-browse-books">Browse Books</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {hasProgress && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Currently Reading
          </h3>
          <div className="space-y-3">
            {bookProgress.map((p: any) => (
              <Link key={p.bookId} href={`/books/${p.book.slug}/read`}>
                <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`book-progress-${p.bookId}`}>
                  {p.book.coverUrl ? (
                    <img src={p.book.coverUrl} alt={p.book.title} className="w-12 h-16 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-16 rounded bg-muted flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate group-hover:text-primary transition-colors">{p.book.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Page {p.lastPage}</p>
                    {p.updatedAt && <p className="text-xs text-muted-foreground">Last read {format(new Date(p.updatedAt), "MMM d, yyyy")}</p>}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasBookmarks && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <BookmarkIcon className="w-4 h-4 text-purple-500" /> Saved Books
          </h3>
          <div className="space-y-3">
            {bookBookmarks.map((bm: any) => (
              <Link key={bm.id} href={`/books/${bm.book?.slug}`}>
                <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`book-bookmark-${bm.id}`}>
                  {bm.book?.coverUrl ? (
                    <img src={bm.book.coverUrl} alt={bm.book.title} className="w-12 h-16 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-16 rounded bg-muted flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate group-hover:text-primary transition-colors">{bm.book?.title}</h3>
                    {bm.book?.author && <p className="text-xs text-muted-foreground mt-0.5">{bm.book.author}</p>}
                    {bm.createdAt && <p className="text-xs text-muted-foreground mt-1">Saved {format(new Date(bm.createdAt), "MMM d, yyyy")}</p>}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RatingsSection({ ratings }: { ratings: any[] }) {
  if (!ratings || ratings.length === 0) {
    return (
      <div className="text-center py-16 max-w-sm mx-auto" data-testid="empty-ratings">
        <Star className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold mb-2">No ratings yet</h3>
        <p className="text-sm text-muted-foreground mb-5">Books you rate will appear here</p>
        <Link href="/books"><Button variant="outline" data-testid="button-browse-books-ratings">Browse Books</Button></Link>
      </div>
    );
  }
  return (
    <div className="space-y-3 max-w-3xl" data-testid="list-ratings">
      {ratings.map((r: any) => (
        <Card key={r.id} className="p-4" data-testid={`rating-${r.id}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate">{r.bookTitle}</h3>
              <div className="flex items-center gap-1 mt-1.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                ))}
                <span className="text-sm text-muted-foreground ml-1">{r.rating}/5</span>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">"{r.comment}"</p>}
            </div>
            {r.createdAt && (
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {format(new Date(r.createdAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function InterestsSection({ categories }: { categories: Record<string, number> }) {
  const entries = Object.entries(categories || {});
  if (entries.length === 0) {
    return (
      <div className="text-center py-16 max-w-sm mx-auto" data-testid="empty-interests">
        <FolderOpen className="w-14 h-14 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold mb-2">No interests tracked yet</h3>
        <p className="text-sm text-muted-foreground mb-5">Bookmark stories to see your reading interests</p>
        <Link href="/"><Button variant="outline" data-testid="button-start-reading">Start Reading</Button></Link>
      </div>
    );
  }
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const colors = ["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-cyan-500"];

  return (
    <div className="space-y-4 max-w-2xl" data-testid="list-interests">
      {entries.sort((a, b) => b[1] - a[1]).map(([cat, count], i) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={cat} data-testid={`interest-bar-${cat.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium">{cat}</span>
              <span className="text-muted-foreground">{count} bookmarks · {pct}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${colors[i % colors.length]}`} style={{ width: `${Math.max(pct, 3)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettingsAccordion({
  id, title, description, icon: Icon, defaultOpen = false, children,
}: {
  id: string; title: string; description: string; icon: React.ElementType; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { setOpen(defaultOpen); }, [defaultOpen]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} data-testid={`section-settings-${id}`}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl border bg-card hover:bg-muted/40 transition-colors text-left group"
          data-testid={`toggle-settings-${id}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">{title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-xl px-5 py-5 bg-card -mt-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ProfileForm({ profile }: { profile: any }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile?.name || "");
    setEmail(profile?.email || "");
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string }) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/dashboard"] });
      refreshUser();
      toast({ title: "Profile updated successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Upload failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/dashboard"] });
      refreshUser();
      toast({ title: "Profile photo updated" });
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const initials = (name || user?.username || "U").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-5" data-testid="card-profile-settings">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-5 border-b">
        <div className="relative group shrink-0">
          <Avatar
            className="w-20 h-20 cursor-pointer ring-2 ring-transparent group-hover:ring-primary/30 transition-all"
            onClick={() => avatarInputRef.current?.click()}
            data-testid="avatar-upload-trigger"
          >
            <AvatarImage src={profile?.avatarUrl || undefined} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div
            className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            {avatarMutation.isPending ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" data-testid="input-avatar-file"
            onChange={e => { const f = e.target.files?.[0]; if (f) avatarMutation.mutate(f); e.target.value = ""; }} />
        </div>
        <div>
          <p className="font-medium text-sm">Profile Photo</p>
          <p className="text-sm text-muted-foreground mt-0.5">Click the photo above to upload a new image</p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF · Max 5MB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">Display Name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            data-testid="input-profile-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-email">Email Address</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            data-testid="input-profile-email"
          />
        </div>
      </div>

      <div>
        <Button
          onClick={() => updateMutation.mutate({ name, email })}
          disabled={updateMutation.isPending}
          data-testid="button-save-profile"
        >
          {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}

function PasswordForm() {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  const changeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: current,
        newPassword: newPass,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed successfully" });
      setCurrent(""); setNewPass(""); setConfirm(""); setError("");
    },
    onError: (err: any) => {
      const msg = err.message?.replace(/^\d+:\s*/, "");
      try { setError(JSON.parse(msg).message || msg); } catch { setError(msg); }
    },
  });

  const handleSubmit = () => {
    setError("");
    if (!current || !newPass || !confirm) { setError("Please fill in all fields"); return; }
    if (newPass !== confirm) { setError("New passwords do not match"); return; }
    if (newPass.length < 6) { setError("Password must be at least 6 characters"); return; }
    changeMutation.mutate();
  };

  return (
    <div className="space-y-4" data-testid="card-change-password">
      <p className="text-sm text-muted-foreground">
        Enter your current password to verify your identity, then choose a strong new password.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="pw-current">Current Password</Label>
          <div className="relative max-w-sm">
            <Input
              id="pw-current"
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={e => { setCurrent(e.target.value); setError(""); }}
              placeholder="Your current password"
              className="pr-10"
              data-testid="input-pw-current"
            />
            <Button type="button" variant="ghost" size="icon" tabIndex={-1}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
              onClick={() => setShowCurrent(s => !s)}>
              {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pw-new">New Password</Label>
          <div className="relative">
            <Input
              id="pw-new"
              type={showNew ? "text" : "password"}
              value={newPass}
              onChange={e => { setNewPass(e.target.value); setError(""); }}
              placeholder="At least 6 characters"
              className="pr-10"
              data-testid="input-pw-new"
            />
            <Button type="button" variant="ghost" size="icon" tabIndex={-1}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
              onClick={() => setShowNew(s => !s)}>
              {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pw-confirm">Confirm New Password</Label>
          <Input
            id="pw-confirm"
            type="password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(""); }}
            placeholder="Re-enter new password"
            data-testid="input-pw-confirm"
          />
          {newPass && confirm && newPass !== confirm && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive" data-testid="text-pw-error">{error}</p>}

      <Button onClick={handleSubmit} disabled={changeMutation.isPending} data-testid="button-change-password">
        {changeMutation.isPending
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Changing...</>
          : <><Lock className="w-4 h-4 mr-2" /> Update Password</>}
      </Button>
    </div>
  );
}

function SecurityInfo({ profile }: { profile: any }) {
  const { user } = useAuth();
  const memberSince = profile?.createdAt ? format(new Date(profile.createdAt), "MMMM d, yyyy") : "Unknown";
  const isGoogleAccount = !profile?.hasPassword;

  const items = [
    { icon: CheckCircle2, color: "text-emerald-500", label: "Account Status", value: "Verified & active" },
    { icon: Activity, color: "text-blue-500", label: "Member Since", value: memberSince },
    { icon: Mail, color: "text-rose-500", label: "Email", value: profile?.email || user?.email || "—" },
    {
      icon: Lock, color: "text-purple-500", label: "Sign-In Method",
      value: isGoogleAccount ? "Google Sign-In (no password)" : "Email & Password",
    },
    {
      icon: Shield, color: "text-amber-500", label: "Account Role",
      value: (user?.role === "admin" ? "Administrator" : user?.role === "moderator" ? "Moderator" : "Reader"),
    },
  ];

  return (
    <div className="space-y-3" data-testid="card-security">
      {items.map(({ icon: Icon, color, label, value }) => (
        <div key={label} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-muted/40 border">
          <Icon className={`w-4 h-4 shrink-0 ${color}`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium truncate">{value}</p>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-1">
        If you notice any unusual activity, please contact our support team immediately.
      </p>
    </div>
  );
}

function SettingsSection({ profile, activeSection }: { profile: any; activeSection: Section }) {
  return (
    <div className="max-w-2xl space-y-3">
      <SettingsAccordion
        id="profile"
        title="Profile Information"
        description="Update your name, email address, and profile photo"
        icon={User}
        defaultOpen={activeSection === "settings-profile"}
      >
        <ProfileForm profile={profile} />
      </SettingsAccordion>

      <SettingsAccordion
        id="password"
        title="Change Password"
        description="Set a new password to keep your account secure"
        icon={Lock}
        defaultOpen={activeSection === "settings-password"}
      >
        <PasswordForm />
      </SettingsAccordion>

      <SettingsAccordion
        id="security"
        title="Account Security"
        description="View your account details, sign-in method, and membership info"
        icon={Shield}
        defaultOpen={activeSection === "settings-security"}
      >
        <SecurityInfo profile={profile} />
      </SettingsAccordion>
    </div>
  );
}

function getInitialSection(): Section {
  if (typeof window === "undefined") return "overview";
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") as Section | null;
  const valid: Section[] = ["overview", "bookmarks", "saved-stories", "duas", "books", "ratings", "interests", "settings"];
  if (section && valid.includes(section)) return section;
  return "overview";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 max-w-4xl">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<Section>(getInitialSection);

  const { data: dashboard, isLoading: dashLoading } = useQuery<any>({
    queryKey: ["/api/profile/dashboard"],
  });

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/profile"],
  });

  const isLoading = dashLoading || profileLoading;

  const renderSection = () => {
    if (isLoading) return <DashboardSkeleton />;

    switch (activeSection) {
      case "overview":
        return <OverviewSection dashboard={dashboard || {}} onNavigate={setActiveSection} />;
      case "bookmarks":
        return <BookmarksSection bookmarks={profile?.bookmarks || dashboard?.recentBookmarks || []} />;
      case "saved-stories":
        return <SavedStoriesSection />;
      case "duas":
        return <SavedDuasSection />;
      case "books":
        return <BooksSection bookBookmarks={dashboard?.recentBookBookmarks || []} bookProgress={dashboard?.bookProgress || []} />;
      case "ratings":
        return <RatingsSection ratings={dashboard?.recentRatings || []} />;
      case "interests":
        return <InterestsSection categories={dashboard?.categoriesExplored || {}} />;
      case "settings":
      case "settings-profile":
      case "settings-password":
      case "settings-security":
        return <SettingsSection profile={profile} activeSection={activeSection} />;
      default:
        return null;
    }
  };

  return (
    <UserLayout
      activeSection={activeSection}
      onNavigate={setActiveSection}
      title={SECTION_TITLES[activeSection]}
    >
      {renderSection()}
    </UserLayout>
  );
}
