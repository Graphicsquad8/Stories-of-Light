import { useQuery } from "@tanstack/react-query";
import { useSearch, Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, Clock } from "lucide-react";
import type { StoryWithCategory } from "@shared/schema";
import { format } from "date-fns";

export default function SearchPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const query = params.get("q") || "";

  const { data: stories, isLoading } = useQuery<StoryWithCategory[]>({
    queryKey: [`/api/stories?status=published&search=${encodeURIComponent(query)}`],
    enabled: !!query,
  });

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-6 h-6 text-muted-foreground" />
            <h1 className="font-serif text-3xl font-bold" data-testid="text-search-title">
              Search Results
            </h1>
          </div>
          {query && (
            <p className="text-muted-foreground" data-testid="text-search-query">
              Showing results for "{query}"
            </p>
          )}
        </div>

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
              <Link key={story.id} href={`/stories/${story.slug}`}>
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
                      {story.category && <Badge variant="secondary">{story.category.name}</Badge>}
                      {story.publishedAt && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(story.publishedAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-semibold mb-2 line-clamp-2">{story.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">{story.excerpt}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-serif text-xl font-semibold mb-2">No Stories Found</h2>
            <p className="text-muted-foreground mb-4">
              {query ? `No results for "${query}". Try a different search term.` : "Enter a search term to find stories."}
            </p>
            <Link href="/">
              <Button data-testid="button-go-home">Browse All Stories</Button>
            </Link>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}
