import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft, ChevronRight, BookOpen, ArrowLeft, BookmarkIcon,
  Menu, X,
} from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { DuaWithParts, Dua } from "@shared/schema";

function RelatedDuas({ duaId }: { duaId: string }) {
  const { data: related, isLoading } = useQuery<Dua[]>({
    queryKey: ["/api/duas", duaId, "related"],
    queryFn: async () => {
      const res = await fetch(`/api/duas/${duaId}/related`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!duaId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (!related || related.length === 0) return null;

  return (
    <section className="mt-10" data-testid="section-related-duas">
      <h2 className="font-serif text-lg font-semibold mb-4">Related Duas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {related.slice(0, 3).map((d) => (
          <Link key={d.id} href={`/duas/${d.slug}`}>
            <Card className="group overflow-hidden cursor-pointer hover-elevate p-4" data-testid={`card-related-dua-${d.id}`}>
              {d.category && (
                <Badge variant="secondary" className="mb-2 text-xs">{d.category}</Badge>
              )}
              <h3 className="font-medium text-sm line-clamp-2">{d.title}</h3>
              {d.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.description}</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function getPartPages(part: { arabicText?: string | null; transliteration?: string | null; translation?: string | null; explanation?: string | null }) {
  const pages: string[] = [];
  if (part.arabicText || part.transliteration || part.translation) pages.push("Dua & Translation");
  if (part.explanation) pages.push("Explanation & Virtues");
  return pages.length > 0 ? pages : ["Content"];
}

export default function DuaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePartId, setActivePartId] = useState<string | null>(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);

  const { data: dua, isLoading, isError } = useQuery<DuaWithParts>({
    queryKey: ["/api/duas", slug],
    queryFn: async () => {
      const res = await fetch(`/api/duas/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const sortedParts = dua?.parts?.slice().sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)) || [];
  const activePart = sortedParts.find(p => p.id === activePartId) || null;
  const activePartIndex = activePart ? sortedParts.indexOf(activePart) : -1;

  useEffect(() => {
    if (sortedParts.length > 0 && !activePartId) {
      setActivePartId(sortedParts[0].id);
    }
  }, [sortedParts.length, activePartId]);

  const { data: bookmarkStatus } = useQuery<{ bookmarked: boolean }>({
    queryKey: ["/api/duas", dua?.id, "bookmark"],
    queryFn: () => fetch(`/api/duas/${dua!.id}/bookmark`, { credentials: "include" }).then(r => {
      if (!r.ok) return { bookmarked: false };
      return r.json();
    }),
    enabled: !!user && !!dua?.id,
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/duas/${dua!.id}/bookmark`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/duas", dua?.id, "bookmark"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/dua-bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/dashboard"] });
    },
  });

  const pages = activePart ? getPartPages(activePart) : [];
  const isFirst = activePartIndex === 0 && selectedPageIndex === 0;
  const isLast = activePartIndex === sortedParts.length - 1 && selectedPageIndex === pages.length - 1;

  const selectPart = useCallback((partId: string) => {
    setActivePartId(partId);
    setSelectedPageIndex(0);
  }, []);

  const goToPreviousPage = () => {
    if (selectedPageIndex > 0) {
      setSelectedPageIndex(i => i - 1);
    } else if (activePartIndex > 0) {
      const prevPart = sortedParts[activePartIndex - 1];
      const prevPages = getPartPages(prevPart);
      setActivePartId(prevPart.id);
      setSelectedPageIndex(prevPages.length - 1);
    }
  };

  const goToNextPage = () => {
    if (selectedPageIndex < pages.length - 1) {
      setSelectedPageIndex(i => i + 1);
    } else if (activePartIndex < sortedParts.length - 1) {
      setActivePartId(sortedParts[activePartIndex + 1].id);
      setSelectedPageIndex(0);
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

  if (isError || !dua) {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-serif text-2xl font-bold mb-2">Dua Not Found</h1>
          <p className="text-muted-foreground mb-4">This dua doesn't exist or has been removed.</p>
          <Link href="/duas">
            <Button variant="outline" data-testid="button-go-back">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Duas
            </Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div data-testid="dua-detail">

        {/* ── Sticky top bar ── */}
        <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {sortedParts.length > 0 && (
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
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h1 className="font-serif text-lg sm:text-xl font-bold truncate" data-testid="text-dua-title">
                      {dua.title}
                    </h1>
                    {dua.category && (
                      <Badge variant="secondary" data-testid="badge-dua-category">{dua.category}</Badge>
                    )}
                  </div>
                  {dua.description && (() => {
                    const MAX = 90;
                    const hasMore = dua.description.length > MAX;
                    const preview = hasMore ? dua.description.slice(0, MAX) + "…" : dua.description;
                    return (
                      <div className="flex items-center gap-2 max-w-xl" data-testid="text-dua-desc">
                        <p className="text-sm text-muted-foreground truncate flex-1">
                          {descExpanded ? dua.description : preview}
                        </p>
                        {hasMore && (
                          <button
                            onClick={() => setDescExpanded(v => !v)}
                            className="text-sm text-primary font-medium hover:underline focus:outline-none shrink-0"
                            data-testid="button-desc-learn-more"
                          >
                            {descExpanded ? "Show less" : "Learn More"}
                          </button>
                        )}
                      </div>
                    );
                  })()}
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
                <Link href="/duas">
                  <Button size="icon" variant="ghost" data-testid="button-back-duas">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-7xl mx-auto">
          <div className="flex min-h-[calc(100vh-12rem)]">

            {/* ── Sidebar ── */}
            {sortedParts.length > 0 && (
              <aside
                className={`${sidebarOpen ? "block" : "hidden"} lg:block w-64 shrink-0 border-r bg-muted/30`}
                data-testid="duas-sidebar"
              >
                <div className="sticky top-[4.5rem]">
                  <div className="p-3 border-b">
                    <h2 className="font-semibold text-sm">Duas in Collection</h2>
                  </div>
                  <ScrollArea className="h-[calc(100vh-10rem)]">
                    <div className="p-2 space-y-0.5">
                      {sortedParts.map((part, i) => (
                        <button
                          key={part.id}
                          onClick={() => {
                            selectPart(part.id);
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            activePartId === part.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                          data-testid={`sidebar-part-${part.id}`}
                        >
                          <span className="text-xs opacity-60 mr-2">{i + 1}.</span>
                          {part.title}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </aside>
            )}

            {/* ── Main content ── */}
            <main className="flex-1 min-w-0">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {sortedParts.length === 0 && (
                  <div className="text-center py-20 text-muted-foreground border rounded-xl">
                    <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-40" />
                    <p className="font-medium">No duas have been added yet.</p>
                  </div>
                )}

                {activePart && (
                  <article data-testid="dua-content">
                    <h2 className="font-serif text-2xl font-bold mb-3" data-testid="text-part-title">
                      {activePart.title}
                    </h2>

                    {/* Page tab buttons */}
                    <div className="flex gap-2 flex-wrap mb-5">
                      {pages.map((label, idx) => (
                        <Button
                          key={idx}
                          size="sm"
                          variant={selectedPageIndex === idx ? "default" : "outline"}
                          onClick={() => setSelectedPageIndex(idx)}
                          data-testid={`button-dua-page-${idx}`}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>

                    {/* Page 0: Dua & Translation */}
                    {selectedPageIndex === 0 && (
                      <div className="space-y-5">
                        {activePart.arabicText && (
                          <div className="border rounded-xl p-8 bg-card shadow-sm" data-testid="box-arabic">
                            <p
                              className="text-3xl leading-[3.5rem] text-right"
                              dir="rtl"
                              lang="ar"
                              data-testid="text-arabic"
                              style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}
                            >
                              {activePart.arabicText}
                            </p>
                          </div>
                        )}
                        {activePart.transliteration && (
                          <div className="border rounded-xl px-6 py-5 bg-muted/30" data-testid="box-transliteration">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Transliteration</p>
                            <p className="text-base leading-relaxed text-foreground/80 italic font-medium tracking-wide" data-testid="text-transliteration">
                              {activePart.transliteration}
                            </p>
                          </div>
                        )}
                        {activePart.translation && (
                          <div className="border rounded-xl px-6 py-5 bg-card" data-testid="box-translation">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Translation</p>
                            <p className="text-base leading-relaxed text-foreground/80 italic" data-testid="text-translation">
                              {activePart.translation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Page 1: Explanation & Virtues */}
                    {selectedPageIndex === 1 && activePart.explanation && (
                      <div className="border rounded-xl p-6 bg-card min-h-[200px]">
                        <div
                          className="prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed"
                          data-testid="text-explanation"
                        >
                          {activePart.explanation.split("\n").filter(Boolean).map((para, i) => (
                            <p key={i} className="mb-4">{para}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    {sortedParts.length > 0 && (
                      <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t" data-testid="dua-navigation">
                        <Button
                          variant="outline"
                          disabled={isFirst}
                          onClick={goToPreviousPage}
                          data-testid="button-prev-part"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>
                        <span className="text-sm text-muted-foreground" data-testid="text-part-progress">
                          Dua {activePartIndex + 1} of {sortedParts.length} · Page {selectedPageIndex + 1} of {pages.length}
                        </span>
                        <Button
                          variant="outline"
                          disabled={isLast}
                          onClick={goToNextPage}
                          data-testid="button-next-part"
                        >
                          Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </article>
                )}

                {/* Ad band */}
                <div className="mt-8" data-testid="ad-dua-bottom">
                  <AdSlot slot="banner" className="w-full" label="story-bottom" />
                </div>

                {/* Related */}
                {dua && <RelatedDuas duaId={dua.id} />}
              </div>
            </main>

          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
