import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { AdSlot } from "@/components/ad-slot";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, BookOpen, Search, Star, Eye, Filter, Sparkles } from "lucide-react";
import type { Book } from "@shared/schema";
import { useState } from "react";

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${cls} ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
      ))}
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.slug}`}>
      <Card className="overflow-hidden group hover-elevate cursor-pointer h-full" data-testid={`card-book-${book.id}`}>
        <div className="aspect-[3/4] overflow-hidden bg-muted relative">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          <Badge className={`absolute top-2 right-2 ${book.type === "free" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}`}>
            {book.type === "free" ? "Free" : "Paid"}
          </Badge>
        </div>
        <div className="p-4 space-y-2">
          {book.category && <Badge variant="secondary" className="text-xs">{book.category}</Badge>}
          <h3 className="font-serif font-semibold line-clamp-2" data-testid={`text-book-title-${book.id}`}>{book.title}</h3>
          <p className="text-sm text-muted-foreground">{book.author}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <StarRating rating={book.averageRating || 0} />
              <span className="text-xs text-muted-foreground ml-1">({book.totalRatings || 0})</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              {book.views || 0}
            </div>
          </div>
          {book.type === "free" ? (
            <Button className="w-full mt-2" size="sm" data-testid={`button-read-${book.id}`}>
              <BookOpen className="w-3.5 h-3.5 mr-2" />
              Read Online
            </Button>
          ) : (book.affiliateLink || book.amazonAffiliateLink) ? (
            <Button className="w-full mt-2" size="sm" data-testid={`button-buy-${book.id}`}
              onClick={(e) => { e.preventDefault(); window.open(book.amazonAffiliateLink || book.affiliateLink || "", "_blank"); }}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              Buy on Amazon
            </Button>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}

function BooksHero({ heroUrl, title, description }: { heroUrl?: string; title?: string; description?: string }) {
  const bgImage = heroUrl || "/images/books-hero.png";
  return (
    <section className="relative overflow-hidden" data-testid="section-books-hero">
      <div className="absolute inset-0">
        <img
          src={bgImage}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4" data-testid="badge-books-hero">
            <Sparkles className="w-3 h-3 mr-1" />
            Islamic Library
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4" data-testid="text-books-title">
            {title || "Discover Islamic Books"}
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
            {description || "Explore free books to read online and curated recommendations for your Islamic learning journey."}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function BooksPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [minRating, setMinRating] = useState("0");

  const queryParams = new URLSearchParams();
  if (activeTab !== "all") queryParams.set("type", activeTab);
  if (searchQuery) queryParams.set("search", searchQuery);
  if (category && category !== "all") queryParams.set("category", category);
  if (sort) queryParams.set("sort", sort);
  if (minRating && minRating !== "0") queryParams.set("minRating", minRating);

  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books", queryParams.toString()],
    queryFn: () => fetch(`/api/books?${queryParams.toString()}`).then(r => r.json()),
  });

  const { data: bookCategories } = useQuery<string[]>({
    queryKey: ["/api/books/categories"],
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  const { data: pageCategories } = useQuery<any[]>({
    queryKey: ["/api/categories?type=book"],
  });
  const pageInfo = pageCategories?.[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
  };

  const renderGrid = (filteredBooks: Book[] | undefined) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[3/4] w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (!filteredBooks || filteredBooks.length === 0) {
      return (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="font-serif text-xl font-semibold mb-2">No Books Found</h2>
          <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBooks.map((book) => <BookCard key={book.id} book={book} />)}
      </div>
    );
  };

  return (
    <PublicLayout>
      <BooksHero
        heroUrl={pageInfo?.image || settings?.booksHeroImage}
        title={pageInfo?.slug || pageInfo?.name}
        description={pageInfo?.description}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <AdSlot slot="banner" label="Ad Space - Books Page Top" className="w-full" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search books..."
                className="pl-9"
                data-testid="input-book-search"
              />
            </div>
            <Button type="submit" variant="secondary" data-testid="button-book-search">Search</Button>
          </form>
          <div className="flex gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px]" data-testid="select-category-filter">
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {bookCategories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[140px]" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="most-viewed">Most Viewed</SelectItem>
                <SelectItem value="highest-rated">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger className="w-[120px]" data-testid="select-rating-filter">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any Rating</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6" data-testid="tabs-books">
            <TabsTrigger value="all" data-testid="tab-all-books">All Books</TabsTrigger>
            <TabsTrigger value="free" data-testid="tab-free-books">Free Books</TabsTrigger>
            <TabsTrigger value="paid" data-testid="tab-paid-books">Paid Books</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderGrid(books)}</TabsContent>
          <TabsContent value="free">{renderGrid(books)}</TabsContent>
          <TabsContent value="paid">{renderGrid(books)}</TabsContent>
        </Tabs>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <AdSlot slot="in-feed" label="Ad Space - Books Page Bottom" className="w-full" />
        </div>
      </div>
    </PublicLayout>
  );
}
