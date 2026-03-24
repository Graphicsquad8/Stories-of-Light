import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, BookOpen, ArrowLeft, BookmarkIcon, Moon } from "lucide-react";
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

export default function DuaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
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
      queryClient.invalidateQueries({ queryKey: ["/api/profile/dashboard"] });
    },
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
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
  const isFirst = selectedPartIndex === 0;
  const isLast = selectedPartIndex === parts.length - 1;

  const goToPrev = () => { if (!isFirst) { setSelectedPartIndex(i => i - 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  const goToNext = () => { if (!isLast) { setSelectedPartIndex(i => i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };

  return (
    <PublicLayout>
      {/* ── Page Header ── */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/duas">
            <Button variant="ghost" size="sm" className="mb-4 -ml-1" data-testid="link-back-duas">
              <ArrowLeft className="w-4 h-4 mr-2" />All Duas
            </Button>
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              {dua.category && (
                <Badge variant="secondary" className="mb-3" data-testid="badge-dua-category">
                  <Moon className="w-3 h-3 mr-1" />
                  {dua.category}
                </Badge>
              )}
              <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight mb-3" data-testid="text-dua-title">
                {dua.title}
              </h1>
              {dua.description && (
                <p className="text-muted-foreground leading-relaxed max-w-2xl text-lg" data-testid="text-dua-description">
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
                className="shrink-0 mt-1"
                data-testid="button-dua-bookmark"
              >
                <BookmarkIcon className={`w-4 h-4 mr-1.5 ${bookmarkStatus?.bookmarked ? "fill-current" : ""}`} />
                {bookmarkStatus?.bookmarked ? "Saved" : "Save"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Banner Ad ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b py-4">
          <AdSlot slot="banner" className="w-full" />
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {parts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border rounded-xl">
            <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-40" />
            <p className="font-medium">No duas have been added to this collection yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

            {/* ── Sidebar ── */}
            <aside className="lg:sticky lg:top-20 lg:self-start" data-testid="sidebar-duas">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
                Duas in this collection
              </p>
              <nav className="space-y-1">
                {parts.map((part, idx) => (
                  <button
                    key={part.id}
                    onClick={() => { setSelectedPartIndex(idx); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors leading-snug ${
                      selectedPartIndex === idx
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                    data-testid={`button-dua-part-${idx}`}
                  >
                    <span className="text-xs opacity-60 mr-1.5">{idx + 1}.</span>
                    {part.title}
                  </button>
                ))}
              </nav>
            </aside>

            {/* ── Dua Content ── */}
            <main data-testid="dua-main-content">
              {currentPart && (
                <article>
                  <h2 className="font-serif text-2xl font-bold mb-6" data-testid="text-part-title">
                    {currentPart.title}
                  </h2>

                  <div className="space-y-5">
                    {/* Arabic Text */}
                    {currentPart.arabicText && (
                      <div className="border rounded-xl p-8 bg-card shadow-sm" data-testid="box-arabic">
                        <p
                          className="text-3xl leading-[3.5rem] text-right"
                          dir="rtl"
                          lang="ar"
                          data-testid="text-arabic"
                          style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}
                        >
                          {currentPart.arabicText}
                        </p>
                      </div>
                    )}

                    {/* Transliteration */}
                    {currentPart.transliteration && (
                      <div className="border rounded-xl px-6 py-5 bg-muted/30" data-testid="box-transliteration">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Transliteration</p>
                        <p className="text-base leading-relaxed text-foreground/80 italic font-medium tracking-wide" data-testid="text-transliteration">
                          {currentPart.transliteration}
                        </p>
                      </div>
                    )}

                    {/* Translation */}
                    {currentPart.translation && (
                      <div className="border rounded-xl px-6 py-5 bg-card" data-testid="box-translation">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Translation</p>
                        <p className="text-base leading-relaxed text-foreground/80 italic" data-testid="text-translation">
                          {currentPart.translation}
                        </p>
                      </div>
                    )}

                    {/* Explanation */}
                    {currentPart.explanation && (
                      <div className="border rounded-xl px-6 py-6 bg-card" data-testid="box-explanation">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Explanation & Virtues</p>
                        <div className="prose prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-foreground/90" data-testid="text-explanation">
                          {currentPart.explanation.split("\n").filter(Boolean).map((para, i) => (
                            <p key={i} className="mb-4">{para}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Navigation ── */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t" data-testid="dua-navigation">
                    <Button variant="outline" onClick={goToPrev} disabled={isFirst} data-testid="button-prev-dua">
                      <ChevronLeft className="w-4 h-4 mr-1" />Previous
                    </Button>
                    <span className="text-sm text-muted-foreground" data-testid="text-dua-progress">
                      {selectedPartIndex + 1} / {parts.length}
                    </span>
                    <Button variant="outline" onClick={goToNext} disabled={isLast} data-testid="button-next-dua">
                      Next<ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  {/* ── Bottom Ad ── */}
                  <div className="border-y py-4 mt-8">
                    <AdSlot slot="banner" className="w-full" label="story-bottom" />
                  </div>

                  {/* ── Related Duas ── */}
                  <RelatedDuas duaId={dua.id} />
                </article>
              )}
            </main>

          </div>
        )}
      </div>
    </PublicLayout>
  );
}
