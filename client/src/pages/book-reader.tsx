import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AudioPlayer } from "@/components/audio-player";
import { VideoPlayer } from "@/components/video-player";
import {
  ChevronLeft, ChevronRight, BookOpen, PanelLeftClose, PanelLeftOpen,
  Home, Headphones, ExternalLink, Lock,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect, useCallback } from "react";
import type { Book, BookPartWithPages } from "@shared/schema";

const PREVIEW_PAGE_LIMIT = 2;

export default function BookReaderPage() {
  const [, params] = useRoute("/books/:slug/read");
  const slug = params?.slug;
  const { user } = useAuth();
  const isPreviewMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "true";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [showAudio, setShowAudio] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [previewEnded, setPreviewEnded] = useState(false);

  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: ["/api/books/slug", slug],
    queryFn: () => fetch(`/api/books/slug/${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  const { data: parts, isLoading: partsLoading } = useQuery<BookPartWithPages[]>({
    queryKey: ["/api/books", book?.id, "parts"],
    queryFn: () => fetch(`/api/books/${book!.id}/parts`).then(r => r.json()),
    enabled: !!book?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { lastPage: number; lastChapterId?: string }) => {
      await apiRequest("POST", `/api/books/${book!.id}/progress`, data);
    },
  });

  const saveProgress = useCallback((partIndex: number, pageIndex: number) => {
    if (!user || !book || !parts) return;
    const part = parts[partIndex];
    saveMutation.mutate({ lastPage: partIndex * 100 + pageIndex, lastChapterId: part?.id });
  }, [user, book, parts]);

  const navigateTo = (partIdx: number, pageIdx: number) => {
    setActivePartIndex(partIdx);
    setActivePageIndex(pageIdx);
    setShowAudio(false);
    setShowVideo(false);
    saveProgress(partIdx, pageIdx);
    window.scrollTo(0, 0);
  };

  const activePart = parts?.[activePartIndex];
  const activePage = activePart?.pages?.[activePageIndex];
  const totalPages = activePart?.pages?.length ?? 0;
  const isFirstPage = activePageIndex === 0;

  const flatPages = parts?.flatMap((part, pi) =>
    (part.pages || []).map((page, pgi) => ({ partIdx: pi, pageIdx: pgi, part, page }))
  ) ?? [];
  const currentFlatIndex = flatPages.findIndex(fp => fp.partIdx === activePartIndex && fp.pageIdx === activePageIndex);
  const isAtPreviewLimit = isPreviewMode && currentFlatIndex >= PREVIEW_PAGE_LIMIT - 1;

  const handleNext = () => {
    if (isPreviewMode && currentFlatIndex >= PREVIEW_PAGE_LIMIT - 1) {
      setPreviewEnded(true);
      return;
    }
    if (activePageIndex < totalPages - 1) navigateTo(activePartIndex, activePageIndex + 1);
    else if (parts && activePartIndex < parts.length - 1) navigateTo(activePartIndex + 1, 0);
  };

  const handlePrev = () => {
    if (previewEnded) {
      setPreviewEnded(false);
      return;
    }
    if (activePageIndex > 0) navigateTo(activePartIndex, activePageIndex - 1);
    else if (activePartIndex > 0) { const prevPart = parts![activePartIndex - 1]; navigateTo(activePartIndex - 1, (prevPart.pages?.length ?? 1) - 1); }
  };

  const isAtStart = activePageIndex === 0 && activePartIndex === 0 && !previewEnded;
  const isAtEnd = previewEnded
    ? true
    : isPreviewMode
      ? isAtPreviewLimit
      : (parts ? activePageIndex >= totalPages - 1 && activePartIndex >= parts.length - 1 : true);

  useEffect(() => {
    setShowAudio(false);
    setShowVideo(false);
  }, [activePartIndex]);

  if (bookLoading || partsLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="h-14 border-b bg-background/95 flex items-center px-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r p-3 space-y-2 hidden lg:block">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
          <div className="flex-1 p-8 space-y-4">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <BookOpen className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Book Not Found</h1>
        <Link href="/books"><Button variant="outline">Back to Books</Button></Link>
      </div>
    );
  }

  if (!parts || parts.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <BookOpen className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">No Content Yet</h1>
        <p className="text-muted-foreground text-sm">This book doesn't have any parts or pages yet.</p>
        <Link href={`/books/${book.slug}`}><Button variant="outline"><Home className="w-4 h-4 mr-2" /> Book Details</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="reader-container">
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Button size="icon" variant="ghost" className="shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)} data-testid="button-toggle-sidebar">
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </Button>
          <span className="font-serif font-semibold text-sm sm:text-base truncate" data-testid="text-reader-title">{book.title}</span>
          <span className="hidden sm:block text-xs text-muted-foreground shrink-0">
            Part {activePartIndex + 1}/{parts.length} · Page {activePageIndex + 1}/{totalPages}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isPreviewMode && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-0.5 mr-1 font-medium">
              <Lock className="w-3 h-3" /> Preview
            </span>
          )}
          <Button size="icon" variant="ghost" disabled={isAtStart} onClick={handlePrev} data-testid="button-prev-page">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" disabled={isAtEnd && !isAtPreviewLimit} onClick={handleNext} data-testid="button-next-page">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Link href={`/books/${book.slug}`}>
            <Button size="icon" variant="ghost" data-testid="button-close-reader">
              <Home className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className={`${sidebarOpen ? "w-48 lg:w-48" : "w-0 overflow-hidden"} shrink-0 border-r bg-muted/30 transition-all duration-300`} data-testid="reader-sidebar">
          <div className="sticky top-14">
            <div className="p-2 px-3 border-b">
              <h2 className="font-semibold text-sm">Parts</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="p-1.5 space-y-0.5">
                {parts.map((part, i) => (
                  <button
                    key={part.id}
                    onClick={() => navigateTo(i, 0)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${activePartIndex === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    data-testid={`sidebar-part-${part.id}`}
                  >
                    <span className="text-xs opacity-60 mr-1.5">{i + 1}.</span>
                    {part.title}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 py-8 max-w-4xl">
            {isFirstPage && activePart && (
              <div className="mb-8">
                <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-3 text-center" data-testid="text-part-title">
                  {activePart.title}
                </h2>
                {activePart.summary && (
                  <p className="text-muted-foreground leading-relaxed mb-5 text-base" data-testid="text-part-summary">
                    {activePart.summary}
                  </p>
                )}

                <div className="flex items-center gap-3 mb-5">
                  <button
                    disabled={!activePart.audioUrl}
                    onClick={() => { setShowAudio(!showAudio); setShowVideo(false); }}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${activePart.audioUrl ? showAudio ? "text-primary underline underline-offset-2" : "text-primary hover:underline hover:underline-offset-2" : "text-muted-foreground cursor-not-allowed opacity-50"}`}
                    data-testid="button-toggle-audio"
                  >
                    <Headphones className="w-4 h-4" />
                    {showAudio ? "Hide Audio" : "Listen"}
                  </button>
                  <span className="text-muted-foreground/40 select-none">|</span>
                  <Button
                    variant={showVideo ? "default" : "outline"}
                    size="sm"
                    disabled={!activePart.videoUrl}
                    onClick={() => { setShowVideo(!showVideo); setShowAudio(false); }}
                    data-testid="button-toggle-video"
                  >
                    {showVideo ? "Hide Video" : "Watch"}
                  </Button>
                </div>

                {showAudio && activePart.audioUrl && (
                  <div className="mb-5">
                    <AudioPlayer url={activePart.audioUrl} title={`Listen: ${activePart.title}`} />
                  </div>
                )}

                {showVideo && activePart.videoUrl ? (
                  <div className="mx-3 sm:mx-5 mb-5">
                    <div className="aspect-video rounded-xl overflow-hidden max-h-[52vh]">
                      <VideoPlayer url={activePart.videoUrl} wrapperClassName="w-full h-full" />
                    </div>
                    <div className="bg-muted/50 rounded-md flex items-center justify-center py-5 text-xs text-muted-foreground border border-dashed mt-3" data-testid="ad-below-video">
                      Ad Space — Video Companion
                    </div>
                  </div>
                ) : (
                  !showAudio && activePart.coverImage && (
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

            {previewEnded ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-6" data-testid="preview-ended-banner">
                <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold mb-2">Preview Ends Here</h2>
                  <p className="text-muted-foreground max-w-md">
                    You've read the free preview. To continue reading the full book, get your copy below.
                  </p>
                </div>
                {((book as any).amazonAffiliateLink || (book as any).affiliateLink) && (
                  <a href={(book as any).amazonAffiliateLink || (book as any).affiliateLink} target="_blank" rel="noopener noreferrer nofollow">
                    <Button size="lg" data-testid="button-buy-from-preview">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {(book as any).buyButtonLabel || "Buy on Amazon"}
                    </Button>
                  </a>
                )}
                <Link href={`/books/${book.slug}`}>
                  <Button variant="outline" size="lg" data-testid="button-back-to-detail">
                    <Home className="w-4 h-4 mr-2" /> Back to Book Details
                  </Button>
                </Link>
              </div>
            ) : activePage?.content ? (
              <div
                className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-foreground/90"
                dangerouslySetInnerHTML={{ __html: activePage.content }}
                data-testid="content-page"
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileTextIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No content on this page yet.</p>
              </div>
            )}

            {!previewEnded && (
              <div className="flex items-center justify-between mt-10 pt-6 border-t gap-4">
                <Button
                  variant="outline"
                  disabled={isAtStart}
                  onClick={handlePrev}
                  data-testid="button-prev-bottom"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground text-center">
                  {isPreviewMode
                    ? `Preview · Page ${Math.min(currentFlatIndex + 1, PREVIEW_PAGE_LIMIT)} of ${PREVIEW_PAGE_LIMIT}`
                    : `Part ${activePartIndex + 1} of ${parts.length} · Page ${activePageIndex + 1} of ${totalPages}`}
                </span>
                <Button
                  variant={isAtPreviewLimit ? "default" : "outline"}
                  onClick={handleNext}
                  disabled={isAtEnd && !isAtPreviewLimit}
                  data-testid="button-next-bottom"
                >
                  {isAtPreviewLimit ? (
                    <><Lock className="w-4 h-4 mr-1" /> Get Full Book</>
                  ) : (
                    <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </div>
            )}
          </div>
        </main>

        <aside className="hidden xl:block w-[300px] shrink-0 border-l" data-testid="sidebar-ads-right">
          <div className="sticky top-14 p-3 space-y-4">
            <div className="bg-muted/50 rounded-lg flex items-center justify-center text-xs text-muted-foreground border border-dashed min-h-[250px] p-4 text-center" data-testid="ad-sidebar-small">
              AdSense Placeholder — 300x250
            </div>
            <div className="bg-muted/50 rounded-lg flex items-center justify-center text-xs text-muted-foreground border border-dashed min-h-[600px] p-4 text-center" data-testid="ad-sidebar-large">
              AdSense Placeholder — 300x600
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
