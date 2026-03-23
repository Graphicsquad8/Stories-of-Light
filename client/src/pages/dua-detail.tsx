import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, BookOpen, ArrowLeft, BookmarkIcon } from "lucide-react";
import { AdSlot } from "@/components/ad-slot";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { DuaWithParts, DuaPart, Dua } from "@shared/schema";

type Page = { label: string };

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
      <h2 className="font-serif text-xl font-bold mb-4">Related Duas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {related.map((d) => (
          <Link key={d.id} href={`/duas/${d.slug}`}>
            <Card className="group overflow-hidden cursor-pointer hover-elevate p-4" data-testid={`card-related-dua-${d.id}`}>
              {d.category && (
                <Badge variant="secondary" className="mb-2">{d.category}</Badge>
              )}
              <h3 className="font-serif font-semibold line-clamp-2">{d.title}</h3>
              {d.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.description}</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function getPages(part: DuaPart): Page[] {
  const pages: Page[] = [];
  if (part.arabicText || part.transliteration || part.translation) {
    pages.push({ label: "Dua & Translation" });
  }
  if (part.explanation) {
    pages.push({ label: "Explanation & Virtues" });
  }
  return pages.length > 0 ? pages : [{ label: "Content" }];
}

export default function DuaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const { user } = useAuth();

  const { data: dua, isLoading, isError } = useQuery<DuaWithParts>({
    queryKey: ["/api/duas", slug],
    queryFn: async () => {
      const res = await fetch(`/api/duas/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!slug,
  });

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
    },
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
            <Skeleton className="h-48 lg:col-span-1" />
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (isError || !dua) {
    return (
      <PublicLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold mb-2">Dua Not Found</h1>
          <p className="text-muted-foreground mb-6">This dua doesn't exist or has been removed.</p>
          <Link href="/duas">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Duas</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const parts = dua.parts ?? [];
  const currentPart = parts[selectedPartIndex];
  const pages = currentPart ? getPages(currentPart) : [];

  const goToPrevPage = () => {
    if (selectedPageIndex > 0) {
      setSelectedPageIndex(i => i - 1);
    } else if (selectedPartIndex > 0) {
      const prevPages = getPages(parts[selectedPartIndex - 1]);
      setSelectedPartIndex(i => i - 1);
      setSelectedPageIndex(prevPages.length - 1);
    }
  };

  const goToNextPage = () => {
    if (selectedPageIndex < pages.length - 1) {
      setSelectedPageIndex(i => i + 1);
    } else if (selectedPartIndex < parts.length - 1) {
      setSelectedPartIndex(i => i + 1);
      setSelectedPageIndex(0);
    }
  };

  const isFirst = selectedPartIndex === 0 && selectedPageIndex === 0;
  const isLast = selectedPartIndex === parts.length - 1 && selectedPageIndex === pages.length - 1;

  return (
    <PublicLayout>
      {/* ── Header / Hero Section ── */}
      <div className="border-b bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/duas">
            <Button variant="ghost" size="sm" className="mb-5 -ml-1" data-testid="link-back-duas">
              <ArrowLeft className="w-4 h-4 mr-2" />All Duas
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-serif font-bold mb-2" data-testid="text-dua-title">{dua.title}</h1>
              {dua.description && (
                <p className="text-muted-foreground leading-relaxed max-w-2xl" data-testid="text-dua-description">
                  {dua.description}
                </p>
              )}
            </div>
            {user && (
              <Button
                variant={bookmarkStatus?.bookmarked ? "default" : "outline"}
                size="sm"
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
                className="shrink-0"
                data-testid="button-dua-bookmark"
              >
                <BookmarkIcon className={`w-4 h-4 mr-1.5 ${bookmarkStatus?.bookmarked ? "fill-current" : ""}`} />
                {bookmarkStatus?.bookmarked ? "Saved" : "Save"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Top Banner Ad Band ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b py-4">
          <AdSlot slot="banner" className="w-full" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {parts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground border rounded-xl">
            <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-40" />
            <p className="font-medium">No duas have been added to this collection yet.</p>
          </div>
        )}

        {parts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Duas in this collection
              </h2>
              <div className="space-y-1">
                {parts.map((part, idx) => (
                  <button
                    key={part.id}
                    onClick={() => { setSelectedPartIndex(idx); setSelectedPageIndex(0); }}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors leading-snug ${
                      selectedPartIndex === idx
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                    data-testid={`button-dua-part-${idx}`}
                  >
                    {part.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-3">
              {currentPart && (
                <>
                  {/* Part title + page tabs */}
                  <div className="mb-5">
                    <h2 className="text-xl font-serif font-semibold mb-3">{currentPart.title}</h2>
                    <div className="flex gap-2 flex-wrap">
                      {pages.map((page, idx) => (
                        <Button
                          key={idx}
                          size="sm"
                          variant={selectedPageIndex === idx ? "default" : "outline"}
                          onClick={() => setSelectedPageIndex(idx)}
                          data-testid={`button-dua-page-${idx}`}
                        >
                          {page.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Content boxes */}
                  {selectedPageIndex === 0 ? (
                    <div className="space-y-4">
                      {currentPart.arabicText && (
                        <div className="border rounded-xl p-8 bg-card" data-testid="box-arabic">
                          <p
                            className="text-3xl text-right leading-loose"
                            dir="rtl"
                            lang="ar"
                            data-testid="text-arabic"
                            style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif", lineHeight: "3.2" }}
                          >
                            {currentPart.arabicText}
                          </p>
                        </div>
                      )}
                      {currentPart.transliteration && (
                        <div className="border rounded-xl px-6 py-5 bg-muted/30" data-testid="box-transliteration">
                          <p className="text-base leading-relaxed text-foreground/80 italic font-medium tracking-wide" data-testid="text-transliteration">
                            {currentPart.transliteration}
                          </p>
                        </div>
                      )}
                      {currentPart.translation && (
                        <div className="border rounded-xl px-6 py-5 bg-card" data-testid="box-translation">
                          <p className="text-base leading-relaxed text-muted-foreground italic" data-testid="text-translation">
                            {currentPart.translation}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-xl p-6 bg-card min-h-[200px]">
                      <div className="prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed" data-testid="text-explanation">
                        {(currentPart.explanation ?? "").split("\n").filter(Boolean).map((para, i) => (
                          <p key={i} className="mb-4">{para}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-6">
                    <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={isFirst} data-testid="button-prev-page">
                      <ChevronLeft className="w-4 h-4 mr-1" />Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Dua {selectedPartIndex + 1} of {parts.length} · Page {selectedPageIndex + 1} of {pages.length}
                    </span>
                    <Button variant="outline" size="sm" onClick={goToNextPage} disabled={isLast} data-testid="button-next-page">
                      Next<ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Bottom Banner Ad Band ── */}
        {parts.length > 0 && (
          <div className="border-t py-4 mt-8">
            <AdSlot slot="banner" className="w-full" />
          </div>
        )}

        {/* ── Related Duas ── */}
        <RelatedDuas duaId={dua.id} />
      </div>
    </PublicLayout>
  );
}
