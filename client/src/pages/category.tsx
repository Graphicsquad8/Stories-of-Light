import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles } from "lucide-react";
import type { StoryWithCategory, Category } from "@shared/schema";
import { format } from "date-fns";
import { AdSlot } from "@/components/ad-slot";

function AdBand({ slot, label, disabled, contentId, contentType, contentManualMode }: {
  slot: "banner" | "in-feed";
  label: string;
  disabled?: boolean;
  contentId?: string;
  contentType?: string;
  contentManualMode?: boolean;
}) {
  if (disabled) return null;
  return (
    <div className="py-4">
      <AdSlot
        slot={slot}
        label={`Ad Space - ${label}`}
        className="w-full"
        contentId={contentId}
        contentType={contentType}
        contentManualMode={contentManualMode}
      />
    </div>
  );
}

function StoryCard({ story }: { story: StoryWithCategory }) {
  return (
    <Link href={`/stories/${story.slug}`}>
      <Card className="group h-full overflow-hidden cursor-pointer hover-elevate" data-testid={`card-story-${story.slug}`}>
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={story.thumbnail || "/images/category-history.png"}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {story.category && (
              <Badge variant="secondary">{story.category.name}</Badge>
            )}
            {story.publishedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(story.publishedAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
          <h3 className="font-serif text-lg font-semibold mb-2 line-clamp-2 leading-snug">
            {story.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {story.excerpt}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  const pageEnabled = !slug || settings?.[`adCategoryPage_${slug}`] !== "false";
  const bannerEnabled = pageEnabled && settings?.[`adCategorySlot_${slug}_banner`] !== "false";
  const midEnabled = pageEnabled && settings?.[`adCategorySlot_${slug}_in-feed`] !== "false";

  const { data: category, isLoading: catLoading } = useQuery<Category>({
    queryKey: ["/api/categories", slug],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${slug}`);
      if (!res.ok) throw new Error("Category not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const adSlotsMap: Record<string, any> = (() => {
    try { return JSON.parse((category as any)?.adSlots || "{}"); } catch { return {}; }
  })();

  const { data: stories, isLoading: storiesLoading } = useQuery<StoryWithCategory[]>({
    queryKey: [`/api/stories?status=published&categoryId=${category?.id}`],
    enabled: !!category?.id,
  });

  const categoryImages: Record<string, string> = {
    sahaba: "/images/category-sahaba.png",
    awliya: "/images/category-awliya.png",
    karamat: "/images/category-karamat.png",
    history: "/images/category-history.png",
    "prophets-companions": "/images/category-prophets.png",
  };

  const isLoading = catLoading || storiesLoading;

  return (
    <PublicLayout>
      <section className="relative overflow-hidden" data-testid="section-category-hero">
        <div className="absolute inset-0">
          <img
            src={category?.image || categoryImages[slug || ""] || "/images/category-history.png"}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-2xl mx-auto text-center">
            {catLoading ? (
              <div className="space-y-3 flex flex-col items-center">
                <Skeleton className="h-6 w-32 bg-white/20" />
                <Skeleton className="h-10 w-64 bg-white/20" />
                <Skeleton className="h-5 w-96 bg-white/20" />
              </div>
            ) : category ? (
              <>
                <Badge variant="secondary" className="mb-4" data-testid="badge-category-hero">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Stories of Light
                </Badge>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4" data-testid="text-category-title">
                  {category.slug || category.name}
                </h1>
                {category.description && (
                  <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto" data-testid="text-category-description">
                    {category.description}
                  </p>
                )}
              </>
            ) : (
              <h1 className="font-serif text-3xl font-bold text-white">Category Not Found</h1>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdBand
          slot="banner"
          label="top-banner"
          disabled={!bannerEnabled}
          contentId={category?.id}
          contentType="category"
          contentManualMode={adSlotsMap["banner_mode"] === "manual"}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : stories && stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <h2 className="font-serif text-xl font-semibold mb-2">No Stories Yet</h2>
            <p className="text-muted-foreground mb-4">Stories in this category are coming soon.</p>
            <Link href="/">
              <Button data-testid="button-browse-all">Browse All Stories</Button>
            </Link>
          </Card>
        )}

        <AdBand
          slot="in-feed"
          label="mid-content"
          disabled={!midEnabled}
          contentId={category?.id}
          contentType="category"
          contentManualMode={adSlotsMap["in-feed_mode"] === "manual"}
        />
      </div>
    </PublicLayout>
  );
}
