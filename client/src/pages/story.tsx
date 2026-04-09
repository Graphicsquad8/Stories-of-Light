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
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { StoryWithCategory, StoryPartWithPages } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[16/10] w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!related || related.length === 0) return null;

  return (
    <section className="mt-12" data-testid="section-related">
      <h2 className="font-serif text-2xl font-bold mb-6">Related Stories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {related.map((story) => (
          <Link key={story.id} href={`/stories/${story.slug}`}>
            <Card className="group overflow-hidden cursor-pointer hover-elevate" data-testid={`card-related-${story.slug}`}>
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={story.thumbnail || "/images/category-history.png"}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                {story.category && (
                  <Badge variant="secondary" className="mb-2">{story.category.name}</Badge>
                )}
                <h3 className="font-serif font-semibold line-clamp-2" dangerouslySetInnerHTML={{ __html: story.title }} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SidebarAds() {
  return (
    <aside className="hidden lg:block lg:col-span-1" data-testid="sidebar-ads">
      <div className="sticky top-20 space-y-4">
        <div className="w-[300px] h-[250px] flex">
          <AdSlot slot="sidebar-small" label="AdSense Placeholder — 300×250" className="w-full h-full" />
        </div>
        <div className="w-[300px] h-[600px] flex">
          <AdSlot slot="sidebar-large" label="AdSense Placeholder — 300×600" className="w-full h-full" />
        </div>
      </div>
    </aside>
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
                    <>
                      <div className="my-4 rounded-xl overflow-hidden" data-testid="video-embed-container">
                        <VideoPlayer url={activePart.videoUrl} wrapperClassName="aspect-video w-full" />
                      </div>
                      <div className="my-5">
                        <AdSlot slot="in-article" className="w-full" />
                      </div>
                    </>
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
                <StoryAdBand />
              </div>

              <StoryRatingSection story={story} />

              <RelatedStories storyId={story.id} />
            </div>
          </main>

          <aside className={`hidden xl:block w-[300px] shrink-0 border-l ${!sidebarOpen ? "mr-4" : ""}`} data-testid="sidebar-ads-right">
            <div className="sticky top-[4.5rem] p-3 space-y-4">
              <div className="w-[300px] h-[250px] flex">
                <AdSlot slot="sidebar-small" label="AdSense Placeholder — 300×250" className="w-full h-full" />
              </div>
              <div className="w-[300px] h-[600px] flex">
                <AdSlot slot="sidebar-large" label="AdSense Placeholder — 300×600" className="w-full h-full" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StoryAdBand() {
  return (
    <div className="border-y py-4">
      <AdSlot slot="banner" className="w-full" />
    </div>
  );
}

function LegacyView({ story }: { story: StoryWithCategory }) {
  const categoryHref = story.category
    ? `/${(story.category as any).urlSlug || story.category.slug}`
    : "/";

  return (
    <div data-testid="legacy-story-view">
      {/* ── Hero Section ── */}
      {story.thumbnail ? (
        <section className="relative overflow-hidden" data-testid="section-story-hero">
          <div className="absolute inset-0">
            <img
              src={story.thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/65" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-6 text-white/80 hover:text-white hover:bg-white/10" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Stories
              </Button>
            </Link>
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {story.category && (
                  <Link href={categoryHref}>
                    <Badge variant="secondary" data-testid="badge-story-category">{story.category.name}</Badge>
                  </Link>
                )}
                {story.publishedAt && (
                  <span className="text-sm text-white/70 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(story.publishedAt), "MMMM d, yyyy")}
                  </span>
                )}
                {(story as any).ratingEnabled && (story as any).totalRatings > 0 && (
                  <div className="flex items-center gap-1 text-sm text-white/80" data-testid="text-story-avg-rating">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{((story as any).averageRating || 0).toFixed(1)}</span>
                    <span className="text-white/60">({(story as any).totalRatings})</span>
                  </div>
                )}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-white" data-testid="text-story-title" dangerouslySetInnerHTML={{ __html: story.title }} />
              {story.excerpt && (
                <p className="text-lg text-white/80 leading-relaxed max-w-2xl" data-testid="text-story-excerpt" dangerouslySetInnerHTML={{ __html: story.excerpt }} />
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stories
            </Button>
          </Link>
          <header className="mb-6 max-w-3xl">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {story.category && (
                <Link href={categoryHref}>
                  <Badge data-testid="badge-story-category">{story.category.name}</Badge>
                </Link>
              )}
              {story.publishedAt && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {format(new Date(story.publishedAt), "MMMM d, yyyy")}
                </span>
              )}
              {(story as any).ratingEnabled && (story as any).totalRatings > 0 && (
                <div className="flex items-center gap-1 text-sm" data-testid="text-story-avg-rating">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{((story as any).averageRating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({(story as any).totalRatings})</span>
                </div>
              )}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4" data-testid="text-story-title" dangerouslySetInnerHTML={{ __html: story.title }} />
            {story.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed" data-testid="text-story-excerpt" dangerouslySetInnerHTML={{ __html: story.excerpt }} />
            )}
          </header>
        </div>
      )}

      {/* ── Top Banner Ad Band ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <StoryAdBand />
      </div>

      {/* ── Article + Sidebar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <article className="lg:col-span-3">
            {story.audioUrl && (
              <div className="mb-8">
                <AudioPlayer url={story.audioUrl} title={`Listen: ${story.title}`} />
              </div>
            )}

            {story.youtubeUrl && (
              <div className="mb-8">
                <VideoPlayer url={story.youtubeUrl} />
              </div>
            )}

            <div
              className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-foreground/90"
              dangerouslySetInnerHTML={{ __html: story.content || "" }}
              data-testid="content-story"
            />

            {story.tags && story.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-8 pt-8 border-t flex-wrap" data-testid="section-tags">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {story.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
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

            {/* ── Bottom Banner Ad Band ── */}
            <div className="mt-8">
              <StoryAdBand />
            </div>

            <StoryRatingSection story={story} />

            <RelatedStories storyId={story.id} />
          </article>

          <SidebarAds />
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
