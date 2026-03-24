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

function AdBand({ slot, label }: { slot: AdSlotType; label: string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <AdSlot slot={slot} label={`Ad Space - ${label}`} className="w-full" />
    </div>
  );
}

const DEFAULT_HERO_TITLE = "Islamic Stories, Biographies &amp; Books —<br />Read, Listen and Learn";
const DEFAULT_HERO_SUBTITLE = "Explore biographies of the Sahaba, Awliya, and great figures of Islamic history — with audio narrations, free online books, and curated reading recommendations.";

function HeroSection() {
  const { data: publicSettings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  const heroTitle = publicSettings["homeHeroTitle"] || DEFAULT_HERO_TITLE;
  const heroSubtitle = publicSettings["homeHeroSubtitle"] || DEFAULT_HERO_SUBTITLE;
  const siteName = publicSettings["siteName"] || "Stories of Light";

  return (
    <section className="relative overflow-hidden" data-testid="section-hero">
      <div className="absolute inset-0">
        <img src="/images/hero-bg.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4" data-testid="badge-hero">
            <Sparkles className="w-3 h-3 mr-1" />
            {siteName}
          </Badge>
          <h1
            className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-tight mb-4"
            data-testid="text-hero-title"
            dangerouslySetInnerHTML={{ __html: heroTitle }}
          />
          <p
            className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto mb-6"
            data-testid="text-hero-subtitle"
            dangerouslySetInnerHTML={{ __html: heroSubtitle }}
          />
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/motivational-stories">
              <Button size="lg" data-testid="button-explore-stories">
                Explore Stories
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/category/awliya">
              <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur border-white/20 text-white" data-testid="button-browse-categories">
                Browse Categories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryTiles({ categories }: { categories: (Category & { storyCount: number })[] }) {
  const fallbackImage = "/images/category-history.png";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="section-categories">
      <div className="text-center mb-10">
        <h2 className="font-serif text-3xl font-bold mb-3">Explore by Category</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Dive into different aspects of Islamic heritage, each offering unique lessons and inspiration.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/category/${cat.urlSlug || cat.slug}`}>
            <Card className="group relative h-48 overflow-hidden cursor-pointer" data-testid={`card-category-${cat.urlSlug || cat.slug}`}>
              <img
                src={cat.image || fallbackImage}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <h3 className="font-serif text-xl font-semibold text-white mb-1">{cat.name}</h3>
                <p className="text-sm text-white/70">
                  {cat.storyCount} {cat.storyCount === 1 ? "story" : "stories"}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
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
              <Badge variant="secondary" data-testid={`badge-category-${story.slug}`}>
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
          <h3 className="font-serif text-lg font-semibold mb-2 line-clamp-2 leading-snug" data-testid={`text-title-${story.slug}`}>
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

function FeaturedStories({ stories }: { stories: StoryWithCategory[] }) {
  if (stories.length === 0) return null;

  return (
    <section className="py-16" data-testid="section-featured">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold mb-2">Featured Stories</h2>
          <p className="text-muted-foreground">Handpicked stories to inspire and enlighten</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}

function LatestStories({ stories }: { stories: StoryWithCategory[] }) {
  if (stories.length === 0) return null;

  return (
    <section className="py-16" data-testid="section-latest">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl font-bold mb-2">Latest Stories</h2>
          <p className="text-muted-foreground">Recently published narratives from Islamic history</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}


function StoriesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
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

function FeaturedFreeBooks({ books }: { books: Book[] }) {
  if (books.length === 0) return null;
  return (
    <section className="py-16" data-testid="section-featured-books">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold">Free Islamic Books</h2>
          <p className="text-muted-foreground mt-1">Read online — no download required</p>
        </div>
        <Link href="/books">
          <Button variant="ghost" size="sm" data-testid="link-all-books">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {books.map((book) => (
          <Link key={book.id} href={`/books/${book.slug}`}>
            <Card className="overflow-hidden group cursor-pointer hover-elevate" data-testid={`featured-book-${book.id}`}>
              <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-600 text-xs">Free</Badge>
              </div>
              <div className="p-3">
                <h3 className="font-serif font-semibold text-sm line-clamp-2">{book.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
                {(book.averageRating || 0) > 0 && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= Math.round(book.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                    ))}
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

function PopularMotivational({ stories }: { stories: MotivationalStory[] }) {
  if (stories.length === 0) return null;
  return (
    <section className="py-16" data-testid="section-popular-motivational">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold">Islamic Motivational Stories</h2>
          </div>
          <p className="text-muted-foreground">Inspiring stories to guide your daily life and strengthen your faith</p>
        </div>
        <Link href="/motivational-stories">
          <Button variant="ghost" size="sm" data-testid="link-all-motivational">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stories.map((story) => (
          <Link key={story.id} href={`/motivational-stories/${story.slug}`}>
            <Card className="group h-full p-5 cursor-pointer hover-elevate" data-testid={`card-motivational-${story.slug}`}>
              <Badge variant="secondary" className="mb-3 text-xs">{story.category}</Badge>
              <h3 className="font-serif text-base font-semibold mb-2 line-clamp-2 leading-snug">
                {story.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                {story.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {story.views || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {(story.averageRating || 0).toFixed(1)}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PopularDuas({ duas }: { duas: Dua[] }) {
  if (duas.length === 0) return null;
  return (
    <section className="py-16" data-testid="section-popular-duas">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold">Popular Duas</h2>
          </div>
          <p className="text-muted-foreground">The most-read supplications to strengthen your connection with Allah</p>
        </div>
        <Link href="/duas">
          <Button variant="ghost" size="sm" data-testid="link-all-duas">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {duas.map((dua) => (
          <Link key={dua.id} href={`/duas/${dua.slug}`}>
            <Card className="group h-full p-5 cursor-pointer hover-elevate" data-testid={`card-dua-${dua.slug}`}>
              {dua.thumbnail && (
                <div className="w-full h-32 rounded-md overflow-hidden mb-4">
                  <img src={dua.thumbnail} alt={dua.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              {dua.category && (
                <Badge variant="secondary" className="mb-3 text-xs">{dua.category}</Badge>
              )}
              <h3 className="font-serif text-base font-semibold mb-2 line-clamp-2 leading-snug">
                {dua.title}
              </h3>
              {dua.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                  {dua.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {dua.views || 0}
                </span>
                <span className="flex items-center gap-1 text-primary">
                  <Moon className="w-3 h-3" />
                  Dua
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: featuredStories, isLoading: featuredLoading } = useQuery<StoryWithCategory[]>({
    queryKey: ["/api/stories?status=published&featured=true"],
  });

  const { data: latestStories, isLoading: latestLoading } = useQuery<StoryWithCategory[]>({
    queryKey: ["/api/stories?status=published&limit=6"],
  });

  const { data: categories, isLoading: catsLoading } = useQuery<(Category & { storyCount: number })[]>({
    queryKey: ["/api/categories"],
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

  return (
    <PublicLayout>
      <HeroSection />
      <AdBand slot="banner" label="top-banner" />

      {catsLoading ? (
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-md" />)}
          </div>
        </div>
      ) : categories && categories.length > 0 ? (
        <CategoryTiles categories={categories} />
      ) : null}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {featuredLoading ? (
          <div className="py-16">
            <Skeleton className="h-8 w-48 mb-8" />
            <StoriesLoadingSkeleton />
          </div>
        ) : (
          <FeaturedStories stories={featuredStories || []} />
        )}
      </div>

      {freeBooks && freeBooks.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturedFreeBooks books={freeBooks} />
        </div>
      )}

      {motivationalStories && motivationalStories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PopularMotivational stories={motivationalStories} />
        </div>
      )}

      <AdBand slot="in-feed" label="mid-content" />

      {popularDuas && popularDuas.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PopularDuas duas={popularDuas} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {latestLoading ? (
          <div className="py-16">
            <Skeleton className="h-8 w-48 mb-8" />
            <StoriesLoadingSkeleton />
          </div>
        ) : (
          <LatestStories stories={latestStories || []} />
        )}
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="section-newsletter">
        <Card className="p-8 sm:p-12 text-center bg-primary/5">
          <BookOpen className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-3">Stay Inspired</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join our community and receive new stories of faith, courage, and wisdom directly to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-md border bg-background px-4 py-2 text-sm"
              data-testid="input-newsletter-email"
            />
            <Button type="submit" data-testid="button-newsletter-subscribe">
              Subscribe
            </Button>
          </form>
        </Card>
      </section>

      <AdBand slot="banner" label="bottom-banner" />
    </PublicLayout>
  );
}
