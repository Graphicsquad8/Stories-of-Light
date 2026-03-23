import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star, Eye, BookmarkIcon, ChevronLeft, ChevronRight,
  Loader2, Menu, X, BookOpen, ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import type { MotivationalStoryWithLessons, MotivationalStory, MotivationalLesson } from "@shared/schema";

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="p-0.5"
          data-testid={`star-input-${s}`}
        >
          <Star className={`w-6 h-6 transition-colors ${s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
        </button>
      ))}
    </div>
  );
}

export default function MotivationalStoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const { data: story, isLoading } = useQuery<MotivationalStoryWithLessons>({
    queryKey: ["/api/motivational-stories/slug", slug],
    queryFn: () => fetch(`/api/motivational-stories/slug/${slug}`).then(r => {
      if (!r.ok) throw new Error("Story not found");
      return r.json();
    }),
    enabled: !!slug,
  });

  const sortedLessons = story?.lessons?.slice().sort((a, b) => a.orderIndex - b.orderIndex) || [];

  const activeLesson = sortedLessons.find(l => l.id === activeLessonId) || null;
  const activeLessonIndex = activeLesson ? sortedLessons.indexOf(activeLesson) : -1;

  const { data: bookmarkStatus } = useQuery<{ bookmarked: boolean }>({
    queryKey: ["/api/motivational-stories", story?.id, "bookmark"],
    queryFn: () => fetch(`/api/motivational-stories/${story!.id}/bookmark`, { credentials: "include" }).then(r => {
      if (!r.ok) return { bookmarked: false };
      return r.json();
    }),
    enabled: !!story && !!user,
  });

  const { data: ratings } = useQuery<any[]>({
    queryKey: ["/api/motivational-stories", story?.id, "ratings"],
    queryFn: () => fetch(`/api/motivational-stories/${story!.id}/ratings`).then(r => {
      if (!r.ok) return [];
      return r.json();
    }),
    enabled: !!story,
  });

  const { data: related } = useQuery<MotivationalStory[]>({
    queryKey: ["/api/motivational-stories", story?.id, "related"],
    queryFn: () => fetch(`/api/motivational-stories/${story!.id}/related`).then(r => {
      if (!r.ok) return [];
      return r.json();
    }),
    enabled: !!story,
  });

  const { data: progress } = useQuery<any>({
    queryKey: ["/api/motivational-stories", story?.id, "progress"],
    queryFn: () => fetch(`/api/motivational-stories/${story!.id}/progress`, { credentials: "include" }).then(r => {
      if (!r.ok) return null;
      return r.json();
    }),
    enabled: !!story && !!user,
  });

  useEffect(() => {
    if (story?.id) {
      fetch(`/api/motivational-stories/${story.id}/view`, { method: "POST" }).catch(() => {});
    }
  }, [story?.id]);

  useEffect(() => {
    if (progress?.lastLessonId && sortedLessons.length > 0 && !activeLessonId) {
      const found = sortedLessons.find(l => l.id === progress.lastLessonId);
      if (found) {
        setActiveLessonId(found.id);
      }
    }
  }, [progress, sortedLessons.length]);

  useEffect(() => {
    if (sortedLessons.length > 0 && !activeLessonId && !progress) {
      setActiveLessonId(sortedLessons[0].id);
    }
  }, [sortedLessons.length, activeLessonId, progress]);

  const progressMutation = useMutation({
    mutationFn: async (lastLessonId: string) => {
      await apiRequest("POST", `/api/motivational-stories/${story!.id}/progress`, { lastLessonId });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/motivational-stories/${story!.id}/bookmark`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/motivational-stories", story?.id, "bookmark"] });
    },
  });

  const rateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/motivational-stories/${story!.id}/rate`, { rating: ratingValue, comment: ratingComment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/motivational-stories", story?.id, "ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/motivational-stories/slug", slug] });
      toast({ title: "Rating submitted" });
    },
  });

  const selectLesson = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId);
    if (user && story) {
      progressMutation.mutate(lessonId);
    }
  }, [user, story]);

  const goToPreviousLesson = () => {
    if (activeLessonIndex > 0) {
      selectLesson(sortedLessons[activeLessonIndex - 1].id);
    }
  };

  const goToNextLesson = () => {
    if (activeLessonIndex < sortedLessons.length - 1) {
      selectLesson(sortedLessons[activeLessonIndex + 1].id);
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PublicLayout>
    );
  }

  if (!story) {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-2">Story Not Found</h1>
          <p className="text-muted-foreground mb-4">The story you're looking for doesn't exist.</p>
          <Link href="/motivational-stories">
            <Button variant="outline" data-testid="button-go-back">Back to Stories</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const displayContent = activeLesson?.content || (sortedLessons.length === 0 ? story.content : null);

  return (
    <PublicLayout>
      <div data-testid="motivational-story-detail">
        <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {sortedLessons.length > 0 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden shrink-0"
                    data-testid="button-toggle-sidebar"
                  >
                    {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </Button>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h1 className="font-serif text-lg sm:text-xl font-bold truncate" data-testid="text-story-title">
                      {story.title}
                    </h1>
                    {story.category && (
                      <Badge variant="secondary" data-testid="badge-story-category">{story.category}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= Math.round(story.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`}
                          data-testid={`star-display-${s}`}
                        />
                      ))}
                      <span className="ml-1 text-muted-foreground" data-testid="text-rating-count">
                        ({story.totalRatings || 0} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground" data-testid="text-views-count">
                      <Eye className="w-3.5 h-3.5" /> {story.views || 0} views
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {user && (
                  <Button
                    size="icon"
                    variant={bookmarkStatus?.bookmarked ? "default" : "outline"}
                    onClick={() => bookmarkMutation.mutate()}
                    disabled={bookmarkMutation.isPending}
                    data-testid="button-bookmark"
                  >
                    <BookmarkIcon className={`w-4 h-4 ${bookmarkStatus?.bookmarked ? "fill-current" : ""}`} />
                  </Button>
                )}
                <Link href="/motivational-stories">
                  <Button size="icon" variant="ghost" data-testid="button-back-home">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="flex min-h-[calc(100vh-12rem)]">
            {sortedLessons.length > 0 && (
              <aside
                className={`${sidebarOpen ? "block" : "hidden"} lg:block w-64 shrink-0 border-r bg-muted/30`}
                data-testid="lessons-sidebar"
              >
                <div className="sticky top-[4.5rem]">
                  <div className="p-3 border-b">
                    <h2 className="font-semibold text-sm">Islamic Stories</h2>
                  </div>
                  <ScrollArea className="h-[calc(100vh-10rem)]">
                    <div className="p-2 space-y-0.5">
                      {sortedLessons.map((lesson, i) => (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            selectLesson(lesson.id);
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            activeLessonId === lesson.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                          data-testid={`sidebar-lesson-${lesson.id}`}
                        >
                          <span className="text-xs opacity-60 mr-2">{i + 1}.</span>
                          {lesson.title}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </aside>
            )}

            <main className="flex-1 min-w-0">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {displayContent ? (
                  <div
                    className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-foreground/90"
                    dangerouslySetInnerHTML={{ __html: displayContent }}
                    data-testid="content-lesson"
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground" data-testid="text-no-content">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Content for this story is coming soon.</p>
                  </div>
                )}

                {sortedLessons.length > 0 && (
                  <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
                    <Button
                      variant="outline"
                      disabled={activeLessonIndex <= 0}
                      onClick={goToPreviousLesson}
                      data-testid="button-prev-lesson"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <span className="text-sm text-muted-foreground" data-testid="text-lesson-progress">
                      {activeLessonIndex + 1} / {sortedLessons.length}
                    </span>
                    <Button
                      variant="outline"
                      disabled={activeLessonIndex >= sortedLessons.length - 1}
                      onClick={goToNextLesson}
                      data-testid="button-next-lesson"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}

                {user && (
                  <Card className="p-6 mt-8" data-testid="card-rating-form">
                    <h3 className="font-serif text-lg font-semibold mb-4">Rate This Story</h3>
                    <div className="space-y-3">
                      <StarRatingInput value={ratingValue} onChange={setRatingValue} />
                      <Textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Write a short review (optional)..."
                        rows={3}
                        data-testid="input-rating-comment"
                      />
                      <Button
                        onClick={() => rateMutation.mutate()}
                        disabled={ratingValue === 0 || rateMutation.isPending}
                        data-testid="button-submit-rating"
                      >
                        {rateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Submit Rating
                      </Button>
                    </div>
                  </Card>
                )}

                {ratings && ratings.length > 0 && (
                  <div className="mt-8" data-testid="section-reviews">
                    <h3 className="font-serif text-lg font-semibold mb-4" data-testid="text-reviews-heading">
                      Reviews ({ratings.length})
                    </h3>
                    <div className="space-y-3">
                      {ratings.map((r: any) => (
                        <Card key={r.id} className="p-4" data-testid={`review-${r.id}`}>
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm" data-testid={`review-username-${r.id}`}>
                                {r.username || "Anonymous"}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                                ))}
                              </div>
                            </div>
                            {r.createdAt && (
                              <span className="text-xs text-muted-foreground" data-testid={`review-date-${r.id}`}>
                                {format(new Date(r.createdAt), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                          {r.comment && (
                            <p className="text-sm text-muted-foreground" data-testid={`review-comment-${r.id}`}>{r.comment}</p>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8" data-testid="ad-story-bottom">
                  <div className="bg-muted/50 rounded-md flex items-center justify-center py-6 text-xs text-muted-foreground border border-dashed">
                    Ad Space - story-bottom
                  </div>
                </div>

                {related && related.length > 0 && (
                  <div className="mt-12" data-testid="section-related">
                    <h3 className="font-serif text-lg font-semibold mb-4" data-testid="text-related-heading">
                      You May Also Like
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {related.slice(0, 4).map((rel) => (
                        <Link key={rel.id} href={`/motivational-stories/${rel.slug}`}>
                          <Card className="overflow-hidden group cursor-pointer hover-elevate" data-testid={`related-story-${rel.id}`}>
                            <div className="p-4">
                              <h4 className="font-medium text-sm line-clamp-2 mb-1">{rel.title}</h4>
                              {rel.category && (
                                <Badge variant="secondary" className="text-xs">{rel.category}</Badge>
                              )}
                              {rel.description && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{rel.description}</p>
                              )}
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
