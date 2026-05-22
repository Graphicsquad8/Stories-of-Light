import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { AudioPlayer } from "@/components/audio-player";
import { VideoPlayer } from "@/components/video-player";
import { AdSlot } from "@/components/ad-slot";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Clock, Tag, Share2, Bookmark, BookmarkCheck,
  ChevronLeft, ChevronRight, Video, Headphones, Menu, X,
  PanelLeftClose, PanelLeftOpen, PlayCircle, PauseCircle, Star, Loader2,
  Eye, User, Play, Link2, Home, Languages,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { StoryWithCategory, StoryPartWithPages } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback, useRef } from "react";

/* ── Helpers ── */
function calcReadingTime(content: string): number {
  const text = (content || "").replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n || 0);
}
function extractHeadings(html: string): string[] {
  return [...(html || "").matchAll(/<h([23])[^>]*?>(.*?)<\/h\1>/gis)]
    .map(m => m[2].replace(/<[^>]*>/g, "").trim())
    .filter(Boolean);
}

function BookmarkButton({ storyId }: { storyId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: bookmarkStatus } = useQuery<{ bookmarked: boolean }>({
    queryKey: ["/api/bookmarks", storyId],
    queryFn: async () => {
      const res = await fetch(`/api/bookmarks/${storyId}`, { credentials: "include" });
      if (!res.ok) return { bookmarked: false };
      return res.json();
    },
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bookmarks", { storyId });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks", storyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/dashboard"] });
      toast({ title: data.bookmarked ? "Bookmarked" : "Bookmark removed" });
    },
  });

  if (!user) return null;

  const isBookmarked = bookmarkStatus?.bookmarked;

  return (
    <Button
      variant={isBookmarked ? "default" : "outline"}
      size="sm"
      onClick={() => toggleMutation.mutate()}
      disabled={toggleMutation.isPending}
      data-testid="button-bookmark"
    >
      {isBookmarked ? (
        <BookmarkCheck className="w-4 h-4 mr-2" />
      ) : (
        <Bookmark className="w-4 h-4 mr-2" />
      )}
      {isBookmarked ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}

function RelatedStories({ storyId }: { storyId: string }) {
  const { data: related, isLoading } = useQuery<StoryWithCategory[]>({
    queryKey: ["/api/stories", storyId, "related"],
    queryFn: async () => {
      const res = await fetch(`/api/stories/${storyId}/related`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div data-testid="section-related">
      <h2 className="font-serif text-sm font-bold mb-3 text-foreground">Related Stories</h2>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-[72px] h-[72px] rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5 pt-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3 w-16 mt-1" />
              </div>
            </div>
          ))}
        </div>
      ) : !related || related.length === 0 ? null : (
        <div className="space-y-3">
          {related.slice(0, 4).map(story => (
            <Link key={story.id} href={`/stories/${story.slug}`}>
              <div className="flex gap-3 group cursor-pointer" data-testid={`card-related-${story.slug}`}>
                <div className="w-[72px] h-[72px] rounded-lg overflow-hidden shrink-0 border border-border/40">
                  <img
                    src={story.thumbnail || "/images/category-history.png"}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p
                    className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug"
                    dangerouslySetInnerHTML={{ __html: story.title }}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {calcReadingTime(story.content || "")} min read
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sidebar widgets ── */

function IslamicBooksAdCard({ adSlotsMap, contentId, contentType }: { adSlotsMap: Record<string, any>; contentId: string; contentType: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl" data-testid="ad-islamic-books">
      <div
        className="rounded-xl p-5 relative overflow-hidden min-h-[190px] flex flex-col justify-between"
        style={{ background: "radial-gradient(circle at 88% 45%, hsl(42 80% 55% / 0.28) 0%, transparent 55%), hsl(155 56% 13%)" }}
      >
        <span className="absolute top-2.5 right-2.5 text-[9px] font-bold bg-white/15 text-white/80 px-1.5 py-0.5 rounded uppercase tracking-wide">AD</span>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-yellow-400/20 opacity-70 pointer-events-none" />
        <div className="absolute right-7 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-yellow-300/15 pointer-events-none" />
        <div className="absolute right-11 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-yellow-400/10 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-emerald-300 text-[10px] font-semibold mb-1 uppercase tracking-widest">Special Offer</p>
          <h3 className="text-white font-bold text-lg leading-tight">Islamic Books</h3>
        </div>
        <div className="relative z-10">
          <p className="text-white/65 text-xs leading-relaxed mb-4 max-w-[58%]">Get up to 30% off on selected Islamic books.</p>
          <Button size="sm" className="bg-white text-emerald-900 hover:bg-white/90 rounded-lg font-semibold text-xs px-4 h-8">Shop Now</Button>
        </div>
      </div>
      {adSlotsMap["sidebar-small"] !== false && (
        <div className="absolute inset-0 z-20">
          <AdSlot slot="sidebar-small" className="w-full h-full" disabled={adSlotsMap["sidebar-small"] === false} contentId={contentId} contentType={contentType} contentManualMode={adSlotsMap["sidebar-small_mode"] === "manual"} />
        </div>
      )}
    </div>
  );
}

function ListenToStoriesAdCard({ adSlotsMap, contentId, contentType }: { adSlotsMap: Record<string, any>; contentId: string; contentType: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl" data-testid="ad-listen-stories">
      <div
        className="rounded-xl p-5 relative overflow-hidden min-h-[160px]"
        style={{ background: "linear-gradient(135deg, hsl(220 30% 14%) 0%, hsl(220 25% 21%) 100%)" }}
      >
        <span className="absolute top-2.5 right-2.5 text-[9px] font-bold bg-white/15 text-white/80 px-1.5 py-0.5 rounded uppercase tracking-wide">AD</span>
        <div className="absolute right-2 bottom-2 text-white/8 pointer-events-none">
          <Headphones className="w-20 h-20" />
        </div>
        <div className="relative z-10 max-w-[68%]">
          <h3 className="text-white font-bold text-sm leading-snug mb-1">Listen to Islamic Stories on the Go</h3>
          <p className="text-white/55 text-xs mb-4">Audiobooks now available!</p>
          <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-lg font-semibold text-xs px-4 h-8">Listen Now</Button>
        </div>
      </div>
      {adSlotsMap["sidebar-small-2"] !== false && (
        <div className="absolute inset-0 z-20">
          <AdSlot slot="sidebar-small-2" className="w-full h-full" disabled={adSlotsMap["sidebar-small-2"] === false} contentId={contentId} contentType={contentType} contentManualMode={adSlotsMap["sidebar-small-2_mode"] === "manual"} />
        </div>
      )}
    </div>
  );
}

const QURAN_VERSE = {
  arabic: "وَاصْبِرُوا ۚ إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ",
  translation: '"And be patient; for, indeed, Allah is with the patient."',
  reference: "— Surah Al-Anfal (8:46)",
};

function QuranVerseWidget() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4" data-testid="quran-verse-widget">
      <h3 className="font-serif text-sm font-bold mb-3 text-foreground">Quran Verses</h3>
      <p className="text-lg text-right leading-loose text-foreground font-medium" dir="rtl" lang="ar">{QURAN_VERSE.arabic}</p>
      <p className="text-xs text-muted-foreground italic leading-relaxed mt-2">{QURAN_VERSE.translation}</p>
      <p className="text-xs text-primary/70 font-medium mt-1">{QURAN_VERSE.reference}</p>
      <div className="mt-3 flex justify-end opacity-10">
        <svg viewBox="0 0 64 28" className="w-16 h-7 fill-primary">
          <path d="M0,28 L0,18 Q4,4 8,18 L8,13 Q13,3 18,13 L18,18 Q21,8 24,4 Q27,8 30,18 L30,13 Q35,3 40,13 L40,18 Q45,4 50,18 L50,28 L56,28 L56,16 Q60,3 64,16 L64,28 Z"/>
        </svg>
      </div>
    </div>
  );
}

function InThisArticle({ headings }: { headings: string[] }) {
  return (
    <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/30 p-5 mb-6" data-testid="in-this-article">
      <h3 className="font-serif text-sm font-semibold mb-3 text-foreground">In This Article</h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {headings.map((h, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-primary/60 mt-0.5 shrink-0 leading-none">•</span>
            <span className="line-clamp-1 leading-snug">{h}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickNavigation({ headings }: { headings: string[] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4" data-testid="quick-nav">
      <h3 className="font-serif text-sm font-bold mb-3 text-foreground">Quick Navigation</h3>
      <div className="space-y-0.5">
        {headings.map((h, i) => (
          <div key={i} className="flex items-center justify-between group py-1.5 px-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer">
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-1 leading-snug">{h}</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary shrink-0 ml-2 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ShareArticle({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const enc = encodeURIComponent;
  const handleCopy = () => {
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => {});
  };
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4" data-testid="share-article">
      <h3 className="font-serif text-sm font-bold mb-3 text-foreground">Share this article</h3>
      <div className="flex items-center gap-2.5">
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer"
          className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted transition-colors text-[#1877F2]" title="Share on Facebook">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`} target="_blank" rel="noopener noreferrer"
          className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted transition-colors text-foreground" title="Share on X (Twitter)">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href={`https://wa.me/?text=${enc(title + " " + url)}`} target="_blank" rel="noopener noreferrer"
          className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted transition-colors text-[#25D366]" title="Share on WhatsApp">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
        <button onClick={handleCopy}
          className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground" title="Copy link">
          <Link2 className="w-4 h-4" />
        </button>
        {copied && <span className="text-xs text-primary font-medium">Copied!</span>}
      </div>
    </div>
  );
}

function InArticleBannerAd({ adSlotsMap, contentId, contentType }: { adSlotsMap: Record<string, any>; contentId: string; contentType: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden mb-6" data-testid="banner-ad-inline">
      <div className="border border-border/60 bg-card rounded-xl shadow-sm p-4 flex items-center gap-4">
        <span className="absolute top-2.5 right-2.5 text-[9px] font-bold bg-muted text-muted-foreground/70 px-1.5 py-0.5 rounded uppercase tracking-wide">AD</span>
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
          <Home className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Support Stories of Light</p>
          <p className="text-xs text-muted-foreground leading-relaxed">Ads help us keep creating authentic Islamic content for everyone.</p>
        </div>
        <Button size="sm" className="shrink-0 rounded-lg">Learn More</Button>
      </div>
      <div className="absolute inset-0 z-10">
        <AdSlot slot="sidebar-large" className="w-full h-full" disabled={adSlotsMap["sidebar-large"] === false} contentId={contentId} contentType={contentType} contentManualMode={adSlotsMap["sidebar-large_mode"] === "manual"} />
      </div>
    </div>
  );
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => onChange(s)} className="p-0.5" data-testid={`star-input-${s}`}>
          <Star className={`w-6 h-6 transition-colors ${s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
        </button>
      ))}
    </div>
  );
}

function StoryRatingSection({ story }: { story: StoryWithCategory }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const { data: myRating } = useQuery<any>({
    queryKey: ["/api/stories", story.id, "my-rating"],
    queryFn: () => fetch(`/api/stories/${story.id}/my-rating`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
    enabled: !!user,
  });

  const { data: ratings } = useQuery<any[]>({
    queryKey: ["/api/stories", story.id, "ratings"],
    queryFn: () => fetch(`/api/stories/${story.id}/ratings`).then(r => r.json()),
  });

  useEffect(() => {
    if (myRating) {
      setRatingValue(myRating.rating);
      setRatingComment(myRating.comment || "");
    }
  }, [myRating]);

  const rateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/stories/${story.id}/rate`, { rating: ratingValue, comment: ratingComment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories", story.id, "ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories", story.id, "my-rating"] });
      toast({ title: "Rating submitted" });
    },
  });

  if (!(story as any).ratingEnabled) return null;

  return (
    <>
      {user && (
        <Card className="p-6 mt-8" data-testid="card-rating-form">
          <h3 className="font-serif text-lg font-semibold mb-4">Rate This Story</h3>
          <div className="space-y-3">
            <StarRatingInput value={ratingValue} onChange={setRatingValue} />
            <Textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Write a short review (optional)..." rows={3} data-testid="input-rating-comment" />
            <Button onClick={() => rateMutation.mutate()} disabled={ratingValue === 0 || rateMutation.isPending} data-testid="button-submit-rating">
              {rateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {myRating ? "Update Rating" : "Submit Rating"}
            </Button>
          </div>
        </Card>
      )}
      {ratings && ratings.length > 0 && (
        <div className="mt-8">
          <h3 className="font-serif text-lg font-semibold mb-4" data-testid="text-reviews-heading">Reviews ({ratings.length})</h3>
          <div className="space-y-3">
            {ratings.map((r: any) => (
              <Card key={r.id} className="p-4" data-testid={`review-${r.id}`}>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function MultiPartView({ story, parts }: { story: StoryWithCategory; parts: StoryPartWithPages[] }) {
  const adSlotsMap: Record<string, any> = (() => { try { return JSON.parse((story as any).adSlots || "{}"); } catch { return {}; } })();
  const { user } = useAuth();
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlaySeconds] = useState(30);

  const activePart = parts[activePartIndex];
  const activePage = activePart?.pages?.[activePageIndex];
  const totalPages = activePart?.pages?.length || 0;
  const isFirstPage = activePageIndex === 0;
  const pageHeadings = extractHeadings(activePage?.content || "");

  const { data: progress } = useQuery<any>({
    queryKey: ["/api/stories", story.id, "reading-progress"],
    queryFn: () => fetch(`/api/stories/${story.id}/reading-progress`, { credentials: "include" }).then(r => {
      if (!r.ok) return null;
      return r.json();
    }),
    enabled: !!user,
  });

  const progressMutation = useMutation({
    mutationFn: async ({ partId, pageIndex }: { partId: string; pageIndex: number }) => {
      await apiRequest("POST", `/api/stories/${story.id}/reading-progress`, { lastPartId: partId, lastPageIndex: pageIndex });
    },
  });

  useEffect(() => {
    if (progress?.lastPartId && parts.length > 0) {
      const pIdx = parts.findIndex(p => p.id === progress.lastPartId);
      if (pIdx >= 0) {
        setActivePartIndex(pIdx);
        const maxPage = (parts[pIdx].pages?.length || 1) - 1;
        setActivePageIndex(Math.min(Math.max(progress.lastPageIndex || 0, 0), maxPage));
      }
    }
  }, [progress, parts.length]);

  const navigateTo = useCallback((partIdx: number, pageIdx: number) => {
    setActivePartIndex(partIdx);
    setActivePageIndex(pageIdx);
    setShowVideo(false);
    setShowAudio(false);
    if (user) {
      progressMutation.mutate({ partId: parts[partIdx].id, pageIndex: pageIdx });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user, parts]);

  const goToPreviousPage = () => {
    if (activePageIndex > 0) {
      navigateTo(activePartIndex, activePageIndex - 1);
    } else if (activePartIndex > 0) {
      const prevPart = parts[activePartIndex - 1];
      navigateTo(activePartIndex - 1, (prevPart.pages?.length || 1) - 1);
    }
  };

  const goToNextPage = () => {
    if (activePageIndex < totalPages - 1) {
      navigateTo(activePartIndex, activePageIndex + 1);
    } else if (activePartIndex < parts.length - 1) {
      navigateTo(activePartIndex + 1, 0);
    }
  };

  const isVeryFirst = activePartIndex === 0 && activePageIndex === 0;
  const isVeryLast = activePartIndex === parts.length - 1 && activePageIndex === totalPages - 1;

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      if (isVeryLast) {
        setAutoPlay(false);
        return;
      }
      if (activePageIndex < totalPages - 1) {
        navigateTo(activePartIndex, activePageIndex + 1);
      } else if (activePartIndex < parts.length - 1) {
        navigateTo(activePartIndex + 1, 0);
      }
    }, autoPlaySeconds * 1000);
    return () => clearInterval(timer);
  }, [autoPlay, activePartIndex, activePageIndex, totalPages, parts.length, isVeryLast, autoPlaySeconds, navigateTo]);

  return (
    <div data-testid="multi-part-story">
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3" style={{ maxWidth: "1400px" }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="shrink-0 lg:hidden"
                data-testid="button-toggle-sidebar"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
              <div className="min-w-0">
                <h1 className="font-serif text-lg sm:text-xl font-bold truncate" data-testid="text-story-title" dangerouslySetInnerHTML={{ __html: story.title }} />
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  {story.category && (
                    <Link href={`/${(story.category as any).urlSlug || story.category.slug}`}>
                      <Badge variant="secondary" data-testid="badge-story-category">{story.category.name}</Badge>
                    </Link>
                  )}
                  <span className="text-muted-foreground" data-testid="text-part-page-indicator">
                    Part {activePartIndex + 1} — Page {activePageIndex + 1}/{totalPages}
                  </span>
                  {(story as any).ratingEnabled && (story as any).totalRatings > 0 && (
                    <div className="flex items-center gap-1 text-sm" data-testid="text-story-avg-rating">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{((story as any).averageRating || 0).toFixed(1)}</span>
                      <span className="text-muted-foreground">({(story as any).totalRatings})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <BookmarkButton storyId={story.id} />
              <Link href="/">
                <Button size="icon" variant="ghost" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto" style={{ maxWidth: "1400px" }}>
        <div className="flex min-h-[calc(100vh-12rem)]">
          <aside
            className={`${sidebarOpen ? "w-48 lg:w-48" : "w-0 overflow-hidden"} shrink-0 border-r bg-muted/30 transition-all duration-300`}
            data-testid="parts-sidebar"
          >
            <div className="sticky top-[4.5rem]">
              <div className="p-2 px-3 border-b flex items-center justify-between">
                <h2 className="font-semibold text-sm">Parts</h2>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0 hidden lg:flex"
                  onClick={() => setSidebarOpen(false)}
                  data-testid="button-collapse-sidebar"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-10rem)]">
                <div className="p-1.5 space-y-0.5">
                  {parts.map((part, i) => (
                    <button
                      key={part.id}
                      onClick={() => {
                        navigateTo(i, 0);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                        activePartIndex === i
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      data-testid={`sidebar-part-${part.id}`}
                    >
                      <span className="text-xs opacity-60 mr-1.5">{i + 1}.</span>
                      <span dangerouslySetInnerHTML={{ __html: part.title }} />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </aside>

          {!sidebarOpen && (
            <div className="shrink-0 hidden lg:block">
              <div className="sticky top-[4.5rem] pt-3 pl-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setSidebarOpen(true)}
                  data-testid="button-expand-sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <main className="flex-1 min-w-0">
            <div className={`px-4 sm:px-6 py-8 ${sidebarOpen ? "max-w-4xl" : ""}`}>
              {isFirstPage && (
                <div className="mb-8">
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-3 text-center" data-testid="text-part-title">
                    {activePart.title}
                  </h2>
                  {activePart.summary && (
                    <p className="text-muted-foreground leading-relaxed mb-5 text-base" data-testid="text-part-summary">
                      {activePart.summary}
                    </p>
                  )}

                  {(activePart.audioUrl || activePart.videoUrl) && (
                    <div className="flex items-center gap-3 mb-5" data-testid="media-controls">
                      <button
                        disabled={!activePart.audioUrl}
                        onClick={() => { setShowAudio(!showAudio); setShowVideo(false); }}
                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                          activePart.audioUrl
                            ? showAudio
                              ? "text-primary underline underline-offset-2"
                              : "text-primary hover:underline hover:underline-offset-2"
                            : "text-muted-foreground cursor-not-allowed opacity-50"
                        }`}
                        data-testid="button-toggle-audio"
                      >
                        <Headphones className="w-4 h-4" />
                        {showAudio ? "Hide Audio" : "Listen"}
                      </button>
                      {activePart.videoUrl && (
                        <>
                          <span className="text-muted-foreground/40 select-none">|</span>
                          <Button
                            variant={showVideo ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setShowVideo(!showVideo); setShowAudio(false); }}
                            data-testid="button-toggle-video"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            {showVideo ? "Hide Video" : "Watch"}
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {showAudio && activePart.audioUrl && (
                    <div className="mb-5">
                      <AudioPlayer url={activePart.audioUrl} title={`Listen: ${activePart.title}`} />
                    </div>
                  )}

                  {showVideo && activePart.videoUrl ? (
                    <div className="my-4 rounded-xl overflow-hidden" data-testid="video-embed-container">
                      <VideoPlayer url={activePart.videoUrl} wrapperClassName="aspect-video w-full" />
                    </div>
                  ) : (
                    activePart.coverImage && (
                      <div className="my-4 rounded-xl overflow-hidden" data-testid="cover-photo-container">
                        <img
                          src={activePart.coverImage}
                          alt={activePart.title}
                          className="w-full h-auto max-h-[72vh] object-cover block"
                          loading="lazy"
                          data-testid="img-part-cover"
                        />
                      </div>
                    )
                  )}
                  <InArticleBannerAd adSlotsMap={adSlotsMap} contentId={story.id} contentType="story" />
                </div>
              )}

              {activePage?.content ? (
                <div
                  className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: activePage.content }}
                  data-testid="content-page"
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground" data-testid="text-no-content">
                  <p>Content for this page is coming soon.</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  disabled={isVeryFirst}
                  onClick={goToPreviousPage}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground" data-testid="text-page-progress">
                  Part {activePartIndex + 1} — Page {activePageIndex + 1}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={isVeryLast}
                  onClick={goToNextPage}
                  data-testid="button-next-page"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {activePageIndex === totalPages - 1 && activePartIndex < parts.length - 1 && (
                <div className="text-center mt-6">
                  <Button
                    size="lg"
                    onClick={() => navigateTo(activePartIndex + 1, 0)}
                    data-testid="button-next-part"
                  >
                    Continue to Part {activePartIndex + 2}: {parts[activePartIndex + 1]?.title}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 mt-8 pt-8 border-t">
                <div className="flex items-center gap-2">
                  <BookmarkButton storyId={story.id} />
                  <Button variant="ghost" size="sm" onClick={() => navigator.share?.({ title: story.title, url: window.location.href }).catch(() => {})} data-testid="button-share">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="mt-8">
                <StoryAdBand adSlotsMap={adSlotsMap} contentId={story.id} contentType="story" />
              </div>

              <StoryRatingSection story={story} />

              <div className="xl:hidden">
                <RelatedStories storyId={story.id} />
              </div>
            </div>
          </main>

          <aside className={`hidden xl:block w-[300px] shrink-0 border-l ${!sidebarOpen ? "mr-4" : ""}`} data-testid="sidebar-ads-right">
            <div className="sticky top-[4.5rem] p-3 space-y-4">
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <RelatedStories storyId={story.id} />
              </div>
              <IslamicBooksAdCard adSlotsMap={adSlotsMap} contentId={story.id} contentType="story" />
              <QuranVerseWidget />
              {pageHeadings.length > 0 && <QuickNavigation headings={pageHeadings} />}
              <ShareArticle title={story.title} />
              <ListenToStoriesAdCard adSlotsMap={adSlotsMap} contentId={story.id} contentType="story" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StoryAdBand({ adSlotsMap, contentId, contentType }: { adSlotsMap: Record<string, any>; contentId?: string; contentType?: string }) {
  return (
    <div className="border-y py-4">
      <AdSlot slot="banner" className="w-full" disabled={adSlotsMap["banner"] === false} contentId={contentId} contentType={contentType} contentManualMode={adSlotsMap["banner_mode"] === "manual"} />
    </div>
  );
}

function LegacyView({ story }: { story: StoryWithCategory }) {
  const adSlotsMap: Record<string, any> = (() => { try { return JSON.parse((story as any).adSlots || "{}"); } catch { return {}; } })();
  const categoryHref = story.category ? `/${(story.category as any).urlSlug || story.category.slug}` : "/";
  const [showVideo, setShowVideo] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [translateLang, setTranslateLang] = useState<"" | "bn" | "ar">("");
  const [showTransMenu, setShowTransMenu] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedData, setTranslatedData] = useState<Record<string, { title: string; excerpt: string; content: string }>>({});
  const transMenuRef = useRef<HTMLDivElement>(null);

  const readingTime = calcReadingTime(story.content || "");
  const views = (story as any).views || 0;
  const headings = extractHeadings(story.content || "");
  const authorName = (story as any).authorName || "Stories of Light Team";

  const displayTitle = translateLang && translatedData[translateLang] ? translatedData[translateLang].title : "";
  const displayExcerpt = translateLang && translatedData[translateLang] ? translatedData[translateLang].excerpt : "";
  const displayContent = translateLang && translatedData[translateLang] ? translatedData[translateLang].content : (story.content || "");
  const displayDir = translateLang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (transMenuRef.current && !transMenuRef.current.contains(e.target as Node)) {
        setShowTransMenu(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleTranslate(lang: "" | "bn" | "ar") {
    setShowTransMenu(false);
    if (!lang) { setTranslateLang(""); return; }
    if (translatedData[lang]) { setTranslateLang(lang); return; }
    setTranslating(true);
    try {
      const translateChunk = async (text: string): Promise<string> => {
        if (!text.trim()) return text;
        const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=en|${lang}`);
        const d = await r.json();
        return d.responseData?.translatedText || text;
      };
      const plainTitle = story.title.replace(/<[^>]+>/g, "");
      const plainExcerpt = (story.excerpt || "").replace(/<[^>]+>/g, "");
      const div = document.createElement("div");
      div.innerHTML = story.content || "";
      const blocks = Array.from(div.querySelectorAll("h1,h2,h3,h4,h5,h6,p,li,blockquote"));
      const [tTitle, tExcerpt, ...tBlocks] = await Promise.all([
        translateChunk(plainTitle),
        translateChunk(plainExcerpt),
        ...blocks.map(el => translateChunk((el.textContent || "").trim())),
      ]);
      blocks.forEach((el, i) => { if (tBlocks[i]) el.textContent = tBlocks[i]; });
      setTranslatedData(prev => ({ ...prev, [lang]: { title: tTitle, excerpt: tExcerpt, content: div.innerHTML } }));
      setTranslateLang(lang);
    } catch {
      // translation failed silently
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div data-testid="legacy-story-view" className="bg-background">

      {/* ── Article Header ── */}
      <div className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-7">

          {/* Breadcrumb — full width */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" />
              Home
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
            {story.category && (
              <>
                <Link href={categoryHref} className="hover:text-foreground transition-colors">{story.category.name}</Link>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
              </>
            )}
            <span className="text-foreground/55 truncate max-w-[200px]" dangerouslySetInnerHTML={{ __html: story.title }} />
          </nav>

          {/* Two-column layout: article meta | related stories */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

            {/* ── Left: Article Meta ── */}
            <div className="flex-1 min-w-0">
              {/* Category badge */}
              {story.category && (
                <Link href={categoryHref}>
                  <Badge className="mb-3 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer font-medium" data-testid="badge-story-category">
                    {story.category.name}
                  </Badge>
                </Link>
              )}

              {/* Title */}
              {displayTitle ? (
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-[2rem] xl:text-[2.25rem] font-bold text-foreground leading-[1.2] mb-3" dir={displayDir} data-testid="text-story-title">
                  {displayTitle}
                </h1>
              ) : (
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-[2rem] xl:text-[2.25rem] font-bold text-foreground leading-[1.2] mb-3" dangerouslySetInnerHTML={{ __html: story.title }} data-testid="text-story-title" />
              )}

              {/* Excerpt */}
              {(displayExcerpt || story.excerpt) && (
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-5" dir={displayDir} data-testid="text-story-excerpt">
                  {displayExcerpt || story.excerpt}
                </p>
              )}

              {/* Author + Meta + Bookmark */}
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-none">{authorName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                    {story.publishedAt && (
                      <span>{format(new Date(story.publishedAt), "MMM d, yyyy")}</span>
                    )}
                    <span className="opacity-40">·</span>
                    <span>{readingTime} min read</span>
                    <span className="opacity-40">·</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatViews(views)} views
                    </span>
                    {(story as any).ratingEnabled && (story as any).totalRatings > 0 && (
                      <>
                        <span className="opacity-40">·</span>
                        <span className="flex items-center gap-1" data-testid="text-story-avg-rating">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {((story as any).averageRating || 0).toFixed(1)} ({(story as any).totalRatings})
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <BookmarkButton storyId={story.id} />
              </div>

              {/* Action buttons: Listen | Play | Translate | Share */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={showAudio ? "default" : "outline"}
                  size="sm"
                  className="rounded-full gap-1.5 text-xs h-8 px-3"
                  disabled={!story.audioUrl}
                  onClick={() => { setShowAudio(v => !v); setShowVideo(false); }}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  {showAudio ? "Hide Audio" : "Listen"}
                </Button>
                <Button
                  variant={showVideo ? "default" : "outline"}
                  size="sm"
                  className="rounded-full gap-1.5 text-xs h-8 px-3"
                  disabled={!story.youtubeUrl}
                  onClick={() => { setShowVideo(v => !v); setShowAudio(false); }}
                >
                  <Play className="w-3.5 h-3.5" />
                  {showVideo ? "Stop Video" : "Play Video"}
                </Button>

                {/* Translate dropdown */}
                <div className="relative" ref={transMenuRef}>
                  <Button
                    variant={translateLang ? "default" : "outline"}
                    size="sm"
                    className="rounded-full gap-1.5 text-xs h-8 px-3"
                    onClick={() => setShowTransMenu(v => !v)}
                    disabled={translating}
                    title="Translate article"
                  >
                    {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
                    <span className="select-none">
                      {translateLang === "bn" ? "বাংলা" : translateLang === "ar" ? "العربية" : "AA"}
                    </span>
                  </Button>
                  {showTransMenu && (
                    <div className="absolute left-0 top-full mt-1.5 bg-background border border-border rounded-xl shadow-lg z-50 py-1 min-w-[170px]">
                      <button
                        onClick={() => handleTranslate("")}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors rounded-t-xl ${!translateLang ? "font-semibold text-primary" : ""}`}
                      >
                        🇬🇧 English (Original)
                      </button>
                      <button
                        onClick={() => handleTranslate("bn")}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors ${translateLang === "bn" ? "font-semibold text-primary" : ""}`}
                      >
                        🇧🇩 Bangla
                      </button>
                      <button
                        onClick={() => handleTranslate("ar")}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors rounded-b-xl ${translateLang === "ar" ? "font-semibold text-primary" : ""}`}
                      >
                        🇸🇦 Arabic
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs h-8 px-3"
                  onClick={() => navigator.share?.({ title: story.title, url: window.location.href }).catch(() => {})}
                  data-testid="button-share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </Button>
              </div>
            </div>

            {/* ── Right: Related Stories (desktop only) ── */}
            <div className="hidden lg:block w-[260px] xl:w-[280px] shrink-0">
              <RelatedStories storyId={story.id} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content + Sidebar ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

          {/* ── Article Column ── */}
          <article>

            {/* Cover image with centered play button overlay */}
            {story.thumbnail && (
              <div className="relative rounded-xl overflow-hidden mb-6 shadow-sm" data-testid="section-story-cover">
                {showVideo && story.youtubeUrl ? (
                  <div className="aspect-video w-full">
                    <VideoPlayer url={story.youtubeUrl} wrapperClassName="w-full h-full" />
                  </div>
                ) : (
                  <>
                    <img src={story.thumbnail} alt="" className="w-full aspect-video object-cover block" loading="lazy" />
                    {story.youtubeUrl && (
                      <button
                        className="absolute inset-0 flex items-center justify-center group"
                        onClick={() => setShowVideo(true)}
                        data-testid="button-play-video"
                        aria-label="Play video"
                      >
                        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors" />
                        <div className="relative w-16 h-16 rounded-full bg-white shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <Play className="w-7 h-7 text-primary fill-primary ml-0.5" />
                        </div>
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Audio player */}
            {showAudio && story.audioUrl && (
              <div className="mb-6">
                <AudioPlayer url={story.audioUrl} title={`Listen: ${story.title}`} />
              </div>
            )}

            {/* Video with no thumbnail fallback */}
            {story.youtubeUrl && !story.thumbnail && (
              <div className="mb-6 rounded-xl overflow-hidden shadow-sm">
                <VideoPlayer url={story.youtubeUrl} />
              </div>
            )}

            {/* Banner ad below cover */}
            <InArticleBannerAd adSlotsMap={adSlotsMap} contentId={story.id} contentType="story" />

            {/* In This Article */}
            {headings.length > 1 && <InThisArticle headings={headings} />}

            {/* Article content */}
            <div
              className="prose dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-foreground/90"
              dir={displayDir}
              dangerouslySetInnerHTML={{ __html: displayContent }}
              data-testid="content-story"
            />

            {/* Tags */}
            {story.tags && story.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-8 pt-8 border-t flex-wrap" data-testid="section-tags">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {story.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}

            {/* Bottom actions */}
            <div className="flex items-center gap-2 mt-8 pt-8 border-t">
              <BookmarkButton storyId={story.id} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.share?.({ title: story.title, url: window.location.href }).catch(() => {})}
                data-testid="button-share-bottom"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Bottom banner ad */}
            <div className="mt-8">
              <StoryAdBand adSlotsMap={adSlotsMap} contentId={story.id} contentType="story" />
            </div>

            <StoryRatingSection story={story} />

            {/* Mobile: related stories at bottom of article */}
            <div className="lg:hidden mt-10 pt-8 border-t">
              <h2 className="font-serif text-xl font-bold mb-5">Related Stories</h2>
              <RelatedStories storyId={story.id} />
            </div>
          </article>

          {/* ── Right Sidebar ── */}
          <aside className="hidden lg:block" data-testid="sidebar-story">
            <div className="sticky top-20 space-y-5">
              <IslamicBooksAdCard adSlotsMap={adSlotsMap} contentId={story.id} contentType="story" />
              <QuranVerseWidget />
              {headings.length > 0 && <QuickNavigation headings={headings} />}
              <ShareArticle title={story.title} />
              <ListenToStoriesAdCard adSlotsMap={adSlotsMap} contentId={story.id} contentType="story" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function StoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const { data: story, isLoading, error } = useQuery<StoryWithCategory>({
    queryKey: ["/api/stories/by-slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/stories/by-slug/${slug}`);
      if (!res.ok) throw new Error("Story not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: parts } = useQuery<StoryPartWithPages[]>({
    queryKey: ["/api/stories", story?.id, "parts"],
    queryFn: () => fetch(`/api/stories/${story!.id}/parts`).then(r => r.json()),
    enabled: !!story?.id,
  });

  useEffect(() => {
    if (story) {
      fetch(`/api/stories/${story.id}/view`, { method: "POST" }).catch(() => {});
      if (user) {
        fetch(`/api/stories/${story.id}/track-read`, {
          method: "POST",
          credentials: "include",
        }).catch(() => {});
      }
    }
  }, [story?.id, user?.id]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6 max-w-4xl">
            <Skeleton className="h-10 w-3/4" />
            <div className="flex gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="aspect-video w-full rounded-md" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !story) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-12 text-center max-w-4xl">
            <h2 className="font-serif text-2xl font-bold mb-3">Story Not Found</h2>
            <p className="text-muted-foreground mb-6">The story you're looking for doesn't exist or has been removed.</p>
            <Link href="/">
              <Button data-testid="button-go-home">Go Home</Button>
            </Link>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  if (story.category && (story.category as any).isActive === false) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="p-12 text-center max-w-lg mx-auto" data-testid="card-category-inactive">
            <h2 className="font-serif text-2xl font-bold mb-3">Content Unavailable</h2>
            <p className="text-muted-foreground mb-6">This story is in a category that is currently not available to the public.</p>
            <Link href="/">
              <Button data-testid="button-go-home-inactive">Return to Home</Button>
            </Link>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  const hasParts = parts && parts.length > 0;

  return (
    <PublicLayout>
      {hasParts ? (
        <MultiPartView story={story} parts={parts} />
      ) : (
        <LegacyView story={story} />
      )}
    </PublicLayout>
  );
}
