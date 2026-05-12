import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, BookOpen, Sparkles, Clock, Star, Eye, Lightbulb, Moon } from "lucide-react";
import type { StoryWithCategory, Category, Book, MotivationalStory, Dua } from "@shared/schema";
import { format } from "date-fns";
import { AdSlot } from "@/components/ad-slot";
import type { AdSlotType } from "@/components/ad-slot";
import { cn } from "@/lib/utils";

function AdBand({ slot, label, heightClass = "min-h-[90px]" }: { slot: AdSlotType; label: string; heightClass?: string }) {
  return (
    <div className="w-full py-3 bg-muted/30 border-y border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdSlot
          slot={slot}
          label={label}
          className={`w-full ${heightClass}`}
        />
      </div>
    </div>
  );
}

const DEFAULT_HERO_TITLE = "Islamic Stories, Biographies &amp; Books —<br />Read, Listen and Learn";
const DEFAULT_HERO_SUBTITLE = "Explore biographies of the Sahaba, Awliya, and great figures of Islamic history — with audio narrations, free online books, and curated reading recommendations.";
const DEFAULT_BTN1_TEXT = "Explore Stories";
const DEFAULT_BTN1_URL = "/motivational-stories";
const DEFAULT_BTN2_TEXT = "Browse Books";
const DEFAULT_BTN2_URL = "/books";

interface SectionConfig {
  id: string;
  visible: boolean;
  count: number;
  title?: string;
  desc?: string;
  categoryIds?: string[];
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: "categories", visible: true, count: 6, title: "Explore by Category", desc: "Discover content that inspires, educates, and strengthens your faith.", categoryIds: [] },
  { id: "featured", visible: true, count: 6, title: "Featured Stories", desc: "Handpicked stories to inspire and enlighten" },
  { id: "books", visible: true, count: 6, title: "Islamic Books", desc: "Read online — no download required" },
  { id: "motivational", visible: true, count: 4, title: "Islamic Motivational Stories", desc: "Inspiring stories to guide your daily life and strengthen your faith" },
  { id: "duas", visible: true, count: 4, title: "Popular Duas", desc: "The most-read supplications to strengthen your connection with Allah" },
  { id: "latest", visible: true, count: 6, title: "Latest Stories", desc: "Recently published narratives from Islamic history" },
];

function parseSectionsConfig(raw: string | undefined): SectionConfig[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) {
      return DEFAULT_SECTIONS.map(def => {
        const saved = parsed.find((s: any) => s.id === def.id);
        return saved ? { ...def, ...saved } : def;
      });
    }
  } catch {}
  return DEFAULT_SECTIONS;
}

/* ── Shared Section Header ── */
function SectionHeader({ title, desc, viewAllHref, viewAllLabel = "View All" }: {
  title: string; desc?: string; viewAllHref?: string; viewAllLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-1.5 text-foreground">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
      {viewAllHref && (
        <Link href={viewAllHref}>
          <span className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0">
            {viewAllLabel} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}
    </div>
  );
}

/* ── Hero ── */
function HeroSection({ settings }: { settings: Record<string, string> }) {
  const heroTitle = settings["homeHeroTitle"] || DEFAULT_HERO_TITLE;
  const heroSubtitle = settings["homeHeroSubtitle"] || DEFAULT_HERO_SUBTITLE;
  const siteName = settings["siteName"] || "Stories of Light";
  const btn1Text = settings["homeHeroBtn1Text"] || DEFAULT_BTN1_TEXT;
  const btn1Url = settings["homeHeroBtn1Url"] || DEFAULT_BTN1_URL;
  const btn2Text = settings["homeHeroBtn2Text"] || DEFAULT_BTN2_TEXT;
  const btn2Url = settings["homeHeroBtn2Url"] || DEFAULT_BTN2_URL;
  const heroBg = settings["homeHeroBgImage"] || "/images/hero-bg.png";

  return (
    <section className="relative overflow-hidden" data-testid="section-hero">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/30 dark:from-black/85 dark:via-black/60 dark:to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-xl">
          <Badge
            variant="secondary"
            className="mb-5 bg-white/15 text-white border-white/20 backdrop-blur-sm"
            data-testid="badge-hero"
          >
            <Sparkles className="w-3 h-3 mr-1.5" />
            {siteName}
          </Badge>
          <h1
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.15] mb-5 tracking-tight"
            data-testid="text-hero-title"
            dangerouslySetInnerHTML={{ __html: heroTitle }}
          />
          <p
            className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-md"
            data-testid="text-hero-subtitle"
            dangerouslySetInnerHTML={{ __html: heroSubtitle }}
          />
          <div className="flex flex-wrap gap-3">
            <Link href={btn1Url}>
              <Button size="lg" className="shadow-lg" data-testid="button-hero-btn1">
                {btn1Text}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href={btn2Url}>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 backdrop-blur-sm border-white/25 text-white hover:bg-white/20"
                data-testid="button-hero-btn2"
              >
                {btn2Text}
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8">
            {[
              { label: "Authentic Content" },
              { label: "Verified Sources" },
              { label: "New Stories Weekly" },
              { label: "For All Ages" },
            ].map(badge => (
              <div key={badge.label} className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-primary/80 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs text-white/75 font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Category Tiles ── */
function CategoryTiles({ categories, count, title, desc, categoryIds }: {
  categories: (Category & { storyCount: number })[];
  count: number; title?: string; desc?: string; categoryIds?: string[];
}) {
  const fallbackImage = "/images/category-history.png";
  const filtered = categoryIds && categoryIds.length > 0
    ? categories.filter(c => categoryIds.includes(c.id))
    : categories;
  const visible = filtered.slice(0, count);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="section-categories">
      <div className="text-center mb-10">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-2">{title || "Explore by Category"}</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {desc || "Discover content that inspires, educates, and strengthens your faith."}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {visible.map((cat) => (
          <Link key={cat.id} href={`/${(cat as any).urlSlug || cat.slug}`}>
            <div
              className="group overflow-hidden rounded-xl cursor-pointer border border-card-border bg-card shadow-sm hover:shadow-md transition-shadow"
              data-testid={`card-category-${(cat as any).urlSlug || cat.slug}`}
            >
              {/* Image — top section */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={cat.image || fallbackImage}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {/* Text — bottom section */}
              <div className="px-3 py-2.5">
                <h3 className="font-serif text-sm font-bold leading-snug text-foreground">{cat.name}</h3>
                {(cat as any).description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                    {(cat as any).description}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Story Card ── */
function StoryCard({ story }: { story: StoryWithCategory }) {
  return (
    <Link href={`/stories/${story.slug}`}>
      <Card className="group h-full overflow-hidden cursor-pointer hover-elevate border border-card-border shadow-sm hover:shadow-md transition-shadow" data-testid={`card-story-${story.slug}`}>
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={story.thumbnail || "/images/category-history.png"}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {story.category && (
              <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${story.slug}`}>
                {story.category.name}
              </Badge>
            )}
            {story.publishedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(story.publishedAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
          <h3
            className="font-serif text-base sm:text-lg font-semibold mb-2 line-clamp-2 leading-snug"
            data-testid={`text-title-${story.slug}`}
            dangerouslySetInnerHTML={{ __html: story.title }}
          />
          <p
            className="text-sm text-muted-foreground line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: story.excerpt || "" }}
          />
        </div>
      </Card>
    </Link>
  );
}

/* ── Featured Stories ── */
function FeaturedStories({ stories, count, title, desc }: { stories: StoryWithCategory[]; count: number; title?: string; desc?: string }) {
  const visible = stories.slice(0, count);
  if (visible.length === 0) return null;

  return (
    <section className="py-14" data-testid="section-featured">
      <SectionHeader
        title={title || "Featured Stories"}
        desc={desc || "Handpicked stories to inspire and enlighten"}
        viewAllHref="/stories"
        viewAllLabel="View All Stories"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}

/* ── Latest Stories ── */
function LatestStories({ stories, count, title, desc }: { stories: StoryWithCategory[]; count: number; title?: string; desc?: string }) {
  const visible = stories.slice(0, count);
  if (visible.length === 0) return null;

  return (
    <section className="py-14" data-testid="section-latest">
      <SectionHeader
        title={title || "Latest Stories"}
        desc={desc || "Recently published narratives from Islamic history"}
        viewAllHref="/stories"
        viewAllLabel="View All Stories"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}

/* ── Skeleton ── */
function StoriesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden border border-card-border">
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── Featured Free Books ── */
function FeaturedFreeBooks({ books, count, title, desc }: { books: Book[]; count: number; title?: string; desc?: string }) {
  const visible = books.slice(0, count);
  if (visible.length === 0) return null;

  return (
    <section className="py-14" data-testid="section-featured-books">
      <SectionHeader
        title={title || "Islamic Books"}
        desc={desc || "Read online — no download required"}
        viewAllHref="/books"
        viewAllLabel="View All Books"
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {visible.map((book) => (
          <Link key={book.id} href={`/books/${book.slug}`}>
            <Card
              className="overflow-hidden group cursor-pointer hover-elevate border border-card-border shadow-sm hover:shadow-md transition-shadow"
              data-testid={`featured-book-${book.id}`}
            >
              <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-1.5">Free</Badge>
              </div>
              <div className="p-3">
                <h3
                  className="font-serif font-semibold text-xs sm:text-sm line-clamp-2 leading-snug"
                  dangerouslySetInnerHTML={{ __html: book.title }}
                />
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{book.author}</p>
                {(book.averageRating || 0) > 0 && (
                  <div className="flex items-center gap-0.5 mt-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn("w-2.5 h-2.5", s <= Math.round(book.averageRating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")}
                      />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-0.5">{(book.averageRating || 0).toFixed(1)}</span>
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Popular Motivational Stories ── */
function PopularMotivational({ stories, count, title, desc }: { stories: MotivationalStory[]; count: number; title?: string; desc?: string }) {
  const visible = stories.slice(0, count);
  if (visible.length === 0) return null;

  return (
    <section className="py-7" data-testid="section-popular-motivational">
      <Card className="h-full border border-card-border shadow-sm p-5 sm:p-6">
        {/* Card header */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-serif text-lg sm:text-xl font-bold leading-snug">
            {title || "Islamic Motivational Stories"}
          </h2>
          <Link href="/motivational-stories">
            <span className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0 mt-0.5">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {desc || "Uplifting stories that inspire faith and strengthen your Imaan."}
        </p>
        {/* Items list */}
        <ul className="divide-y divide-border/50">
          {visible.map((story) => (
            <li key={story.id}>
              <Link href={`/motivational-stories/${story.slug}`}>
                <div
                  className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                  data-testid={`card-motivational-${story.slug}`}
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-medium line-clamp-1 leading-snug text-foreground"
                      dangerouslySetInnerHTML={{ __html: story.title }}
                    />
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-muted-foreground ml-1">
                      {(story.averageRating || 0) > 0 ? (story.averageRating || 0).toFixed(1) : "4.8"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

/* ── Popular Duas ── */
function PopularDuas({ duas, count, title, desc }: { duas: Dua[]; count: number; title?: string; desc?: string }) {
  const visible = duas.slice(0, count);
  if (visible.length === 0) return null;

  return (
    <section className="py-7" data-testid="section-popular-duas">
      <Card className="h-full border border-card-border shadow-sm p-5 sm:p-6">
        {/* Card header */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-serif text-lg sm:text-xl font-bold leading-snug">
            {title || "Popular Duas"}
          </h2>
          <Link href="/duas">
            <span className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0 mt-0.5">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {desc || "Powerful duas for everyday life and spiritual growth."}
        </p>
        {/* Items list */}
        <ul className="divide-y divide-border/50">
          {visible.map((dua) => (
            <li key={dua.id}>
              <Link href={`/duas/${dua.slug}`}>
                <div
                  className="flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                  data-testid={`card-dua-${dua.slug}`}
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Moon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-medium line-clamp-1 leading-snug text-foreground"
                      dangerouslySetInnerHTML={{ __html: dua.title }}
                    />
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-muted-foreground ml-1">
                      {(dua as any).averageRating > 0 ? ((dua as any).averageRating).toFixed(1) : "4.9"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

/* ── Main Page ── */
export default function HomePage() {
  const { data: publicSettings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
    staleTime: 0,
  });

  const sections = parseSectionsConfig(publicSettings["homeSectionsConfig"]);

  const { data: featuredStories, isLoading: featuredLoading } = useQuery<StoryWithCategory[]>({
    queryKey: ["/api/stories?status=published&featured=true"],
  });

  const { data: latestStories, isLoading: latestLoading } = useQuery<StoryWithCategory[]>({
    queryKey: ["/api/stories?status=published&limit=20"],
  });

  const { data: categories, isLoading: catsLoading } = useQuery<(Category & { storyCount: number })[]>({
    queryKey: ["/api/categories?type=all"],
  });

  const { data: freeBooks } = useQuery<Book[]>({
    queryKey: ["/api/books/featured-free"],
  });

  const { data: motivationalStories } = useQuery<MotivationalStory[]>({
    queryKey: ["/api/motivational-stories/popular"],
  });

  const { data: popularDuas } = useQuery<Dua[]>({
    queryKey: ["/api/duas/popular"],
  });

  const getSection = (id: string): SectionConfig =>
    sections.find(s => s.id === id) ?? DEFAULT_SECTIONS.find(s => s.id === id) ?? { id, visible: true, count: 6 };

  const catSec = getSection("categories");
  const featSec = getSection("featured");
  const booksSec = getSection("books");
  const motivSec = getSection("motivational");
  const duasSec = getSection("duas");
  const latestSec = getSection("latest");

  const siteName = publicSettings["siteName"] || "Stories of Light";

  return (
    <PublicLayout>
      <HeroSection settings={publicSettings} />

      {/* Ad Top Banner */}
      <AdBand slot="banner" label="Ad Space — Top Banner" heightClass="min-h-[90px]" />

      {/* Categories */}
      {catSec.visible && (
        catsLoading ? (
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-40 sm:h-48 rounded-xl" />)}
            </div>
          </div>
        ) : categories && categories.length > 0 ? (
          <CategoryTiles
            categories={categories}
            count={catSec.count}
            title={catSec.title}
            desc={catSec.desc}
            categoryIds={catSec.categoryIds}
          />
        ) : null
      )}

      {/* Featured Stories */}
      {featSec.visible && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {featuredLoading ? (
            <div className="py-14">
              <Skeleton className="h-8 w-48 mb-8" />
              <StoriesLoadingSkeleton />
            </div>
          ) : (
            <FeaturedStories stories={featuredStories || []} count={featSec.count} title={featSec.title} desc={featSec.desc} />
          )}
        </div>
      )}

      {/* Islamic Books */}
      {booksSec.visible && freeBooks && freeBooks.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturedFreeBooks books={freeBooks} count={booksSec.count} title={booksSec.title} desc={booksSec.desc} />
        </div>
      )}

      {/* Ad Mid Content Banner */}
      <AdBand slot="in-feed" label="Ad Space — Mid Content Banner" heightClass="min-h-[120px]" />

      {/* Motivational + Duas side by side on large screens */}
      {(motivSec.visible && motivationalStories && motivationalStories.length > 0) ||
       (duasSec.visible && popularDuas && popularDuas.length > 0) ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
            {motivSec.visible && motivationalStories && motivationalStories.length > 0 && (
              <PopularMotivational stories={motivationalStories} count={motivSec.count} title={motivSec.title} desc={motivSec.desc} />
            )}
            {duasSec.visible && popularDuas && popularDuas.length > 0 && (
              <PopularDuas duas={popularDuas} count={duasSec.count} title={duasSec.title} desc={duasSec.desc} />
            )}
          </div>
        </div>
      ) : null}

      {/* Latest Stories */}
      {latestSec.visible && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {latestLoading ? (
            <div className="py-14">
              <Skeleton className="h-8 w-48 mb-8" />
              <StoriesLoadingSkeleton />
            </div>
          ) : (
            <LatestStories stories={latestStories || []} count={latestSec.count} title={latestSec.title} desc={latestSec.desc} />
          )}
        </div>
      )}

      {/* Ad Bottom Banner */}
      <AdBand slot="banner" label="Ad Space — Bottom Banner" heightClass="min-h-[90px]" />

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="section-newsletter">
        <div className="relative overflow-hidden rounded-2xl bg-primary/8 border border-primary/15 p-8 sm:p-12">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px"
          }} />
          <div className="relative text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-2">Be Part of Our Growing Community</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Join our community and become new stories, books, and lessons delivered to your inbox.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-2.5 max-w-sm mx-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="input-newsletter-email"
              />
              <Button type="submit" className="shrink-0" data-testid="button-newsletter-subscribe">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
