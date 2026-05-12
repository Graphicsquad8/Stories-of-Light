import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trash2, RotateCcw, FolderOpen, FileText, Book, Lightbulb,
  Calendar, Tag, ImageOff, Eye, Volume2, Youtube, Star,
  ChevronLeft, ChevronRight, Clock,
} from "lucide-react";
import type { StoryPartWithPages } from "@shared/schema";

interface TrashCategory {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  deletedAt?: string;
}

interface TrashStory {
  id: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  thumbnail?: string;
  status?: string;
  tags?: string[];
  audioUrl?: string;
  youtubeUrl?: string;
  featured?: boolean;
  deletedAt?: string;
  category?: { id?: string; name?: string; slug?: string } | null;
}

interface TrashBook {
  id: string;
  title?: string;
  slug?: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  category?: string;
  type?: string;
  price?: string;
  affiliateLink?: string;
  amazonAffiliateLink?: string;
  averageRating?: number;
  totalRatings?: number;
  views?: number;
  deletedAt?: string;
}

interface TrashMotivationalStory {
  id: string;
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  category?: string;
  thumbnail?: string;
  videoUrl?: string;
  audioUrl?: string;
  published?: boolean;
  deletedAt?: string;
}

interface TrashData {
  categories: TrashCategory[];
  stories: TrashStory[];
  books: TrashBook[];
  motivationalStories: TrashMotivationalStory[];
}

type ItemType = "category" | "story" | "book" | "motivational-story";

type PreviewItem =
  | { type: "story"; data: TrashStory }
  | { type: "book"; data: TrashBook }
  | { type: "category"; data: TrashCategory }
  | { type: "motivational-story"; data: TrashMotivationalStory };

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function StoryPreview({ item }: { item: TrashStory }) {
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const { data: parts, isLoading: partsLoading } = useQuery<StoryPartWithPages[]>({
    queryKey: ["/api/admin/stories", item.id, "parts"],
    queryFn: () => fetch(`/api/admin/stories/${item.id}/parts`, { credentials: "include" }).then(r => r.json()),
  });

  const hasParts = parts && parts.length > 0;
  const activePart = hasParts ? parts[activePartIndex] : null;
  const activePage = activePart?.pages?.[activePageIndex];
  const totalPages = activePart?.pages?.length || 0;

  const isVeryFirst = activePartIndex === 0 && activePageIndex === 0;
  const isVeryLast = hasParts && activePartIndex === parts.length - 1 && activePageIndex === totalPages - 1;

  const goToPrev = () => {
    if (activePageIndex > 0) { setActivePageIndex(p => p - 1); }
    else if (activePartIndex > 0) {
      const prevPart = parts![activePartIndex - 1];
      setActivePartIndex(i => i - 1);
      setActivePageIndex((prevPart.pages?.length || 1) - 1);
    }
  };
  const goToNext = () => {
    if (activePageIndex < totalPages - 1) { setActivePageIndex(p => p + 1); }
    else if (hasParts && activePartIndex < parts.length - 1) {
      setActivePartIndex(i => i + 1);
      setActivePageIndex(0);
    }
  };

  const navigateToPart = (i: number) => { setActivePartIndex(i); setActivePageIndex(0); };

  if (partsLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Loading article…
      </div>
    );
  }

  if (hasParts) {
    return (
      <div className="flex gap-0 -mx-6 -mb-6 h-[calc(80vh-80px)] overflow-hidden">
        {parts.length > 1 && (
          <aside className="w-44 shrink-0 border-r bg-muted/30 overflow-y-auto">
            <div className="p-2 border-b">
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide px-1">Parts</p>
            </div>
            <div className="p-1.5 space-y-0.5">
              {parts.map((part, i) => (
                <button
                  key={part.id}
                  onClick={() => navigateToPart(i)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    activePartIndex === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <span className="text-xs opacity-60 mr-1.5">{i + 1}.</span>
                  {part.title}
                </button>
              ))}
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="px-6 py-5 max-w-2xl mx-auto">
            {activePageIndex === 0 && activePart && (
              <div className="mb-6">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-3 text-center">{activePart.title}</h2>
                {activePart.summary && (
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm text-center">{activePart.summary}</p>
                )}
                {activePart.coverImage && (
                  <div className="my-4 rounded-xl overflow-hidden">
                    <img src={activePart.coverImage} alt={activePart.title} className="w-full h-auto max-h-64 object-cover block" />
                  </div>
                )}
              </div>
            )}

            {activePage?.content ? (
              <div
                className="prose prose-base dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-foreground/90"
                dangerouslySetInnerHTML={{ __html: activePage.content }}
              />
            ) : (
              <div className="text-center py-10 text-muted-foreground/60 italic text-sm border rounded-lg bg-muted/30">
                No content for this page.
              </div>
            )}

            <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t">
              <Button variant="outline" size="sm" disabled={isVeryFirst} onClick={goToPrev}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Part {activePartIndex + 1}{parts.length > 1 ? `/${parts.length}` : ""} — Page {activePageIndex + 1}/{totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={!!isVeryLast} onClick={goToNext}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t">
                <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[75vh] pr-4">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {item.category?.name && (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Tag className="w-3 h-3" />{item.category.name}
          </Badge>
        )}
        {item.status && (
          <Badge variant={item.status === "published" ? "default" : "secondary"} className="text-xs capitalize">
            {item.status}
          </Badge>
        )}
        {item.audioUrl && (
          <Badge variant="outline" className="text-xs flex items-center gap-1 text-emerald-600 border-emerald-200">
            <Volume2 className="w-3 h-3" /> Audio
          </Badge>
        )}
        {item.youtubeUrl && (
          <Badge variant="outline" className="text-xs flex items-center gap-1 text-red-600 border-red-200">
            <Youtube className="w-3 h-3" /> Video
          </Badge>
        )}
        {item.deletedAt && (
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" /> Deleted {formatDate(item.deletedAt)}
          </span>
        )}
      </div>

      {item.thumbnail && (
        <div className="aspect-video rounded-md overflow-hidden mb-6">
          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}

      {item.excerpt && (
        <p className="text-base text-muted-foreground leading-relaxed mb-6">{item.excerpt}</p>
      )}

      {item.content ? (
        <div
          className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-foreground/90"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      ) : (
        <div className="text-sm text-muted-foreground/60 italic text-center py-8 border rounded-lg bg-muted/30">
          No article content saved.
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t">
          <Tag className="w-4 h-4 text-muted-foreground" />
          {item.tags.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}

function BookPreview({ item }: { item: TrashBook }) {
  return (
    <ScrollArea className="max-h-[70vh] pr-4">
      <div className="flex gap-5 mb-5">
        <div className="w-24 h-36 rounded-lg overflow-hidden shrink-0 bg-muted shadow-md">
          {item.coverUrl ? (
            <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Book className="w-8 h-8 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-xl leading-snug mb-1">{item.title}</h2>
          {item.author && <p className="text-sm text-muted-foreground mb-2">by {item.author}</p>}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {item.category && <Badge variant="outline" className="text-xs">{item.category}</Badge>}
            {item.type && (
              <Badge variant={item.type === "free" ? "default" : "secondary"} className="text-xs capitalize">{item.type}</Badge>
            )}
            {item.price && <Badge variant="outline" className="text-xs text-emerald-600">{item.price}</Badge>}
          </div>
          {typeof item.averageRating === "number" && item.totalRatings !== undefined && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              {item.averageRating.toFixed(1)}
              <span className="text-xs">({item.totalRatings} rating{item.totalRatings !== 1 ? "s" : ""})</span>
            </div>
          )}
        </div>
      </div>

      {item.description && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">Description</h3>
          <p className="text-sm leading-relaxed">{item.description}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2 pt-4 border-t">
        {item.views !== undefined && (
          <span>{item.views} views</span>
        )}
        {item.affiliateLink && (
          <span className="text-emerald-600">Has affiliate link</span>
        )}
        {item.amazonAffiliateLink && (
          <span className="text-amber-600">Has Amazon link</span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Calendar className="w-3 h-3" /> Deleted {formatDate(item.deletedAt)}
        </span>
      </div>
    </ScrollArea>
  );
}

function CategoryPreview({ item }: { item: TrashCategory }) {
  return (
    <ScrollArea className="max-h-[70vh] pr-4">
      <div className="relative h-44 rounded-xl overflow-hidden mb-5 bg-muted">
        {item.image ? (
          <>
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className={`font-bold text-2xl ${item.image ? "text-white drop-shadow" : ""}`}>{item.name}</h2>
          {item.slug && (
            <p className={`text-xs font-mono mt-0.5 ${item.image ? "text-white/70" : "text-muted-foreground"}`}>
              /{item.slug}
            </p>
          )}
        </div>
      </div>

      {item.description ? (
        <p className="text-sm leading-relaxed mb-4">{item.description}</p>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic mb-4">No description provided.</p>
      )}

      <div className="text-xs text-muted-foreground flex items-center gap-1 pt-3 border-t">
        <Calendar className="w-3 h-3" /> Deleted {formatDate(item.deletedAt)}
      </div>
    </ScrollArea>
  );
}

function MotivationalPreview({ item }: { item: TrashMotivationalStory }) {
  return (
    <ScrollArea className="max-h-[70vh] pr-4">
      {item.thumbnail && (
        <div className="relative h-48 rounded-xl overflow-hidden mb-5">
          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h2 className="text-white font-bold text-xl leading-snug drop-shadow">{item.title}</h2>
          </div>
        </div>
      )}
      {!item.thumbnail && (
        <h2 className="font-bold text-xl mb-4">{item.title}</h2>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {item.category && (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Tag className="w-3 h-3" />{item.category}
          </Badge>
        )}
        <Badge variant={item.published ? "default" : "secondary"} className="text-xs">
          {item.published ? "Published" : "Draft"}
        </Badge>
        {item.videoUrl && (
          <Badge variant="outline" className="text-xs flex items-center gap-1 text-red-600 border-red-200">
            <Youtube className="w-3 h-3" /> Video
          </Badge>
        )}
        {item.audioUrl && (
          <Badge variant="outline" className="text-xs flex items-center gap-1 text-emerald-600 border-emerald-200">
            <Volume2 className="w-3 h-3" /> Audio
          </Badge>
        )}
        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
          <Calendar className="w-3 h-3" /> Deleted {formatDate(item.deletedAt)}
        </span>
      </div>

      {item.description ? (
        <p className="text-sm leading-relaxed">{item.description}</p>
      ) : (
        <div className="text-sm text-muted-foreground/60 italic text-center py-6 border rounded-lg bg-muted/30">
          No description saved.
        </div>
      )}

      {item.content && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed mt-4 [&_p]:mb-3"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      )}
    </ScrollArea>
  );
}

function PreviewDialog({ item, onClose }: { item: PreviewItem | null; onClose: () => void }) {
  if (!item) return null;

  const isStory = item.type === "story";
  const title =
    isStory ? (item.data.title || "Article Preview") :
    item.type === "book" ? (item.data.title || "Book Preview") :
    item.type === "category" ? (item.data.name || "Topic Preview") :
    (item.data.title || "Motivational Story Preview");

  const typeLabel =
    isStory ? "Article" :
    item.type === "book" ? "Book" :
    item.type === "category" ? "Topic / Category" :
    "Motivational Story";

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={isStory ? "max-w-5xl p-0 gap-0 overflow-hidden" : "max-w-2xl"}
        data-testid="dialog-trash-preview"
      >
        <DialogHeader className={`px-6 pt-5 pb-4 border-b ${isStory ? "bg-background" : ""}`}>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-normal">{typeLabel}</Badge>
            <Badge variant="outline" className="text-xs font-normal text-destructive border-destructive/30">
              <Trash2 className="w-2.5 h-2.5 mr-1" /> Deleted Preview
            </Badge>
            {isStory && (item.data as TrashStory).category?.name && (
              <Badge variant="outline" className="text-xs font-normal ml-auto">
                <Tag className="w-2.5 h-2.5 mr-1" />
                {(item.data as TrashStory).category?.name}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-base mt-1 font-serif">{title}</DialogTitle>
        </DialogHeader>
        <div className={isStory ? "px-6 pb-6" : "pt-2"}>
          {isStory && <StoryPreview item={item.data as TrashStory} />}
          {item.type === "book" && <BookPreview item={item.data as TrashBook} />}
          {item.type === "category" && <CategoryPreview item={item.data as TrashCategory} />}
          {item.type === "motivational-story" && <MotivationalPreview item={item.data as TrashMotivationalStory} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminTrashPage() {
  const { toast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<{ type: ItemType; id: string; label: string } | null>(null);
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null);

  const { data, isLoading } = useQuery<TrashData>({
    queryKey: ["/api/admin/trash"],
  });

  const restoreMutation = useMutation({
    mutationFn: ({ type, id }: { type: ItemType; id: string }) =>
      apiRequest("POST", `/api/admin/trash/restore/${type}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trash"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/motivational-stories"] });
      setPreviewItem(null);
      toast({ title: "Restored", description: "Item restored successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to restore item.", variant: "destructive" }),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: ItemType; id: string }) =>
      apiRequest("DELETE", `/api/admin/trash/permanent/${type}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trash"] });
      toast({ title: "Deleted", description: "Item permanently deleted." });
      setPendingDelete(null);
      setPreviewItem(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" }),
  });

  const totalCount = data
    ? data.categories.length + data.stories.length + data.books.length + data.motivationalStories.length
    : 0;

  function ActionButtons({ type, id, label, onPreview }: {
    type: ItemType; id: string; label: string; onPreview: () => void;
  }) {
    return (
      <div className="flex gap-1.5 ml-3 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={(e) => { e.stopPropagation(); onPreview(); }}
          title="Preview"
          data-testid={`button-preview-${type}-${id}`}
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => { e.stopPropagation(); restoreMutation.mutate({ type, id }); }}
          disabled={restoreMutation.isPending}
          data-testid={`button-restore-${type}-${id}`}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Restore
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={(e) => { e.stopPropagation(); setPendingDelete({ type, id, label }); }}
          data-testid={`button-permanent-delete-${type}-${id}`}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Delete
        </Button>
      </div>
    );
  }

  function EmptyTrash({ label }: { label: string }) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>No deleted {label}</p>
      </div>
    );
  }

  function StoryList({ items }: { items: TrashStory[] }) {
    if (!items.length) return <EmptyTrash label="articles" />;
    return (
      <div className="space-y-3">
        {items.map((item) => {
          const label = item.title || item.slug || item.id;
          return (
            <div
              key={item.id}
              className="flex gap-3 border rounded-lg p-3 bg-card hover:border-primary/40 hover:bg-accent/30 cursor-pointer transition-colors"
              onClick={() => setPreviewItem({ type: "story", data: item })}
              data-testid={`trash-item-story-${item.id}`}
            >
              <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={label} className="w-full h-full object-cover" data-testid={`img-trash-story-${item.id}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" data-testid={`text-trash-title-${item.id}`}>{label}</p>
                {item.category?.name && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{item.category.name}</span>
                  </div>
                )}
                {item.excerpt && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.excerpt}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {item.status && (
                    <Badge variant={item.status === "published" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                      {item.status}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Deleted {formatDate(item.deletedAt)}
                  </span>
                  <span className="text-[10px] text-primary/60 ml-auto flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5" /> Click to preview
                  </span>
                </div>
              </div>
              <ActionButtons
                type="story" id={item.id} label={label}
                onPreview={() => setPreviewItem({ type: "story", data: item })}
              />
            </div>
          );
        })}
      </div>
    );
  }

  function BookList({ items }: { items: TrashBook[] }) {
    if (!items.length) return <EmptyTrash label="books" />;
    return (
      <div className="space-y-3">
        {items.map((item) => {
          const label = item.title || item.slug || item.id;
          return (
            <div
              key={item.id}
              className="flex gap-3 border rounded-lg p-3 bg-card hover:border-primary/40 hover:bg-accent/30 cursor-pointer transition-colors"
              onClick={() => setPreviewItem({ type: "book", data: item })}
              data-testid={`trash-item-book-${item.id}`}
            >
              <div className="w-12 h-16 rounded-md overflow-hidden shrink-0 bg-muted">
                {item.coverUrl ? (
                  <img src={item.coverUrl} alt={label} className="w-full h-full object-cover" data-testid={`img-trash-book-${item.id}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Book className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" data-testid={`text-trash-title-${item.id}`}>{label}</p>
                {item.author && <p className="text-xs text-muted-foreground">{item.author}</p>}
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  {item.category && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">{item.category}</Badge>
                  )}
                  {item.type && (
                    <Badge variant={item.type === "free" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5 capitalize">
                      {item.type}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Deleted {formatDate(item.deletedAt)}
                  </span>
                  <span className="text-[10px] text-primary/60 ml-auto flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5" /> Click to preview
                  </span>
                </div>
              </div>
              <ActionButtons
                type="book" id={item.id} label={label}
                onPreview={() => setPreviewItem({ type: "book", data: item })}
              />
            </div>
          );
        })}
      </div>
    );
  }

  function MotivationalList({ items }: { items: TrashMotivationalStory[] }) {
    if (!items.length) return <EmptyTrash label="motivational stories" />;
    return (
      <div className="space-y-3">
        {items.map((item) => {
          const label = item.title || item.slug || item.id;
          return (
            <div
              key={item.id}
              className="flex gap-3 border rounded-lg p-3 bg-card hover:border-primary/40 hover:bg-accent/30 cursor-pointer transition-colors"
              onClick={() => setPreviewItem({ type: "motivational-story", data: item })}
              data-testid={`trash-item-motivational-story-${item.id}`}
            >
              <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={label} className="w-full h-full object-cover" data-testid={`img-trash-motivational-${item.id}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" data-testid={`text-trash-title-${item.id}`}>{label}</p>
                {item.category && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                  </div>
                )}
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Deleted {formatDate(item.deletedAt)}
                  </span>
                  <span className="text-[10px] text-primary/60 ml-auto flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5" /> Click to preview
                  </span>
                </div>
              </div>
              <ActionButtons
                type="motivational-story" id={item.id} label={label}
                onPreview={() => setPreviewItem({ type: "motivational-story", data: item })}
              />
            </div>
          );
        })}
      </div>
    );
  }

  function CategoryList({ items }: { items: TrashCategory[] }) {
    if (!items.length) return <EmptyTrash label="categories" />;
    return (
      <div className="space-y-3">
        {items.map((item) => {
          const label = item.name || item.slug || item.id;
          return (
            <div
              key={item.id}
              className="flex gap-3 border rounded-lg p-3 bg-card hover:border-primary/40 hover:bg-accent/30 cursor-pointer transition-colors"
              onClick={() => setPreviewItem({ type: "category", data: item })}
              data-testid={`trash-item-category-${item.id}`}
            >
              <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-muted">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={label}
                    className="w-full h-full object-cover"
                    data-testid={`img-trash-category-${item.id}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${item.image ? "hidden" : ""}`}>
                  <ImageOff className="w-5 h-5 text-muted-foreground/50" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" data-testid={`text-trash-title-${item.id}`}>{label}</p>
                {item.slug && item.slug !== label && (
                  <p className="text-xs text-muted-foreground font-mono">{item.slug}</p>
                )}
                {item.description ? (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/40 mt-1 italic">No description</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Deleted {formatDate(item.deletedAt)}
                  </span>
                  <span className="text-[10px] text-primary/60 ml-auto flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5" /> Click to preview
                  </span>
                </div>
              </div>
              <ActionButtons
                type="category" id={item.id} label={label}
                onPreview={() => setPreviewItem({ type: "category", data: item })}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold">Trash</h1>
            <p className="text-sm text-muted-foreground">
              Click any item to preview — restore or permanently remove them
            </p>
          </div>
          {totalCount > 0 && (
            <Badge variant="secondary" className="ml-auto" data-testid="badge-trash-count">
              {totalCount} item{totalCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading…</div>
        ) : (
          <Tabs defaultValue="stories" data-testid="tabs-trash">
            <TabsList className="mb-5">
              <TabsTrigger value="stories" data-testid="tab-trash-stories">
                <FileText className="w-4 h-4 mr-1" />
                Articles
                {data && data.stories.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs">{data.stories.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="books" data-testid="tab-trash-books">
                <Book className="w-4 h-4 mr-1" />
                Books
                {data && data.books.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs">{data.books.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="motivational" data-testid="tab-trash-motivational">
                <Lightbulb className="w-4 h-4 mr-1" />
                Motivational
                {data && data.motivationalStories.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs">{data.motivationalStories.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="categories" data-testid="tab-trash-categories">
                <FolderOpen className="w-4 h-4 mr-1" />
                Categories
                {data && data.categories.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs">{data.categories.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stories">
              <StoryList items={data?.stories ?? []} />
            </TabsContent>
            <TabsContent value="books">
              <BookList items={data?.books ?? []} />
            </TabsContent>
            <TabsContent value="motivational">
              <MotivationalList items={data?.motivationalStories ?? []} />
            </TabsContent>
            <TabsContent value="categories">
              <CategoryList items={data?.categories ?? []} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <PreviewDialog item={previewItem} onClose={() => setPreviewItem(null)} />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.label}" will be permanently removed and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-permanent-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingDelete && permanentDeleteMutation.mutate({ type: pendingDelete.type, id: pendingDelete.id })}
              disabled={permanentDeleteMutation.isPending}
              data-testid="button-confirm-permanent-delete"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
