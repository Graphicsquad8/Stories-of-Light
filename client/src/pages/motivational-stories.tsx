import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Sparkles, Eye, Star, Filter, BookOpen } from "lucide-react";
import type { MotivationalStory } from "@shared/schema";
import { useState } from "react";
import { AdSlot } from "@/components/ad-slot";

const LIMIT = 12;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`}
        />
      ))}
    </div>
  );
}

function StoryCard({ story }: { story: MotivationalStory }) {
  return (
    <Link href={`/motivational-stories/${story.slug}`}>
      <Card
        className="group hover-elevate cursor-pointer h-full flex flex-col"
        data-testid={`card-story-${story.id}`}
      >
        <div className="p-5 flex flex-col flex-1 gap-3">
          {story.category && (
            <Badge variant="secondary" className="self-start text-xs">
              {story.category}
            </Badge>
          )}
          <h3
            className="font-serif font-semibold line-clamp-2 leading-snug"
            data-testid={`text-story-title-${story.id}`}
            dangerouslySetInnerHTML={{ __html: story.title }}
          />
          {story.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1" dangerouslySetInnerHTML={{ __html: story.description }} />
          )}
          <div className="flex items-center justify-between gap-2 flex-wrap mt-auto pt-2">
            <StarRating rating={story.averageRating || 0} />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span data-testid={`text-views-${story.id}`}>{story.views || 0}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function MotivationalStoriesHero({ heroUrl, title, description }: { heroUrl?: string; title?: string; description?: string }) {
  return (
    <section className="relative overflow-hidden" data-testid="section-motivational-hero">
      <div className="absolute inset-0">
        <img
          src={heroUrl || "/images/motivational-hero.png"}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4" data-testid="badge-motivational-hero">
            <Sparkles className="w-3 h-3 mr-1" />
            Stories of Light
          </Badge>
          <h1
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4"
            data-testid="text-motivational-title"
          >
            {title || "Islamic Motivational Stories"}
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
            {description || "Motivational Islamic Tales – Inspire Your Faith, Life, and Success"}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function MotivationalStoriesPage() {
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const offset = (page - 1) * LIMIT;

  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set("search", searchQuery);
  if (category && category !== "all") queryParams.set("category", category);
  if (sort) queryParams.set("sort", sort);
  queryParams.set("limit", String(LIMIT));
  queryParams.set("offset", String(offset));

  const { data, isLoading } = useQuery<{ stories: MotivationalStory[]; total: number }>({
    queryKey: ["/api/motivational-stories", queryParams.toString()],
    queryFn: () =>
      fetch(`/api/motivational-stories?${queryParams.toString()}`).then((r) => r.json()),
  });

  const { data: storyCategories } = useQuery<string[]>({
    queryKey: ["/api/motivational-stories/categories"],
  });

  const { data: pageCategories } = useQuery<any[]>({
    queryKey: ["/api/categories?type=motivational-story"],
  });
  const pageInfo = pageCategories?.[0];

  const stories = data?.stories;
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(1);
  };

  const handleSortChange = (val: string) => {
    setSort(val);
    setPage(1);
  };

  return (
    <PublicLayout>
      <MotivationalStoriesHero
        heroUrl={pageInfo?.image}
        title={pageInfo?.slug || pageInfo?.name}
        description={pageInfo?.description}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <AdSlot slot="banner" label="Ad Space - stories-top-banner" className="w-full" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stories..."
                className="pl-9"
                data-testid="input-story-search"
              />
            </div>
            <Button type="submit" variant="secondary" data-testid="button-story-search">
              Search
            </Button>
          </form>
          <div className="flex gap-2">
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[160px]" data-testid="select-category-filter">
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {storyCategories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[150px]" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="most-viewed">Popular</SelectItem>
                <SelectItem value="highest-rated">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : stories && stories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-serif text-xl font-semibold mb-2">No Stories Found</h2>
            <p className="text-muted-foreground">
              Try adjusting your filters or search terms.
            </p>
          </Card>
        )}

        <div className="mt-8 py-4">
          <AdSlot slot="in-feed" label="Ad Space - stories-mid-content" className="w-full" />
        </div>

        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination data-testid="pagination-stories">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    data-testid="button-pagination-prev"
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    totalPages <= 7 ||
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - page) <= 1
                  ) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          isActive={pageNum === page}
                          onClick={() => setPage(pageNum)}
                          className="cursor-pointer"
                          data-testid={`button-page-${pageNum}`}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  if (pageNum === 2 && page > 3) {
                    return (
                      <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  if (pageNum === totalPages - 1 && page < totalPages - 2) {
                    return (
                      <PaginationItem key="ellipsis-end">
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    data-testid="button-pagination-next"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
