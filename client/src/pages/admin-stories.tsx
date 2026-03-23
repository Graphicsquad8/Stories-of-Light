import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useRoute } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Trash2, Eye, Edit, Clock, Copy } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { StoryWithCategory, Category } from "@shared/schema";
import { format } from "date-fns";

export default function AdminStoriesPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [matchCat, catParams] = useRoute("/image/stories/category/:slug");
  const categorySlug = matchCat ? catParams?.slug : null;

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const activeCategory = categories?.find((c) => c.slug === categorySlug);

  const queryParams = new URLSearchParams();
  if (search) queryParams.set("search", search);
  if (statusFilter && statusFilter !== "all") queryParams.set("status", statusFilter);
  if (activeCategory?.id) queryParams.set("categoryId", activeCategory.id);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const { data: stories, isLoading } = useQuery<StoryWithCategory[]>({
    queryKey: [`/api/stories${queryString}`],
    enabled: !categorySlug || !!activeCategory,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/stories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story deleted" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest("POST", "/api/stories/bulk-delete", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      setSelectedIds(new Set());
      toast({ title: "Stories deleted" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/stories/${id}/duplicate`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story duplicated", description: `"${data.title}" created as draft` });
      navigate(`/image/stories/${data.id}/edit`);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (!stories) return;
    if (selectedIds.size === stories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(stories.map((s) => s.id)));
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget);
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const pageTitle = activeCategory ? activeCategory.name : "All Articles";
  const pageDescription = activeCategory
    ? `Manage articles in ${activeCategory.name}`
    : "Manage all your stories and articles";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-stories-title">{pageTitle}</h1>
          <p className="text-muted-foreground mt-1">{pageDescription}</p>
        </div>
        <Link href="/image/stories/new">
          <Button data-testid="button-new-story">
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>

      <Card>
        <div className="flex items-center gap-3 p-4 border-b flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-stories"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36" data-testid="select-status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-bulk-delete"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete ({selectedIds.size})
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-stories">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-3 w-10">
                  <Checkbox
                    checked={stories && stories.length > 0 && selectedIds.size === stories.length}
                    onCheckedChange={toggleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                </th>
                <th className="text-left p-3 font-medium">Title</th>
                {!activeCategory && (
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Category</th>
                )}
                <th className="text-left p-3 font-medium hidden md:table-cell">Status</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-3"><Skeleton className="h-4 w-4" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-48" /></td>
                    {!activeCategory && <td className="p-3 hidden sm:table-cell"><Skeleton className="h-4 w-24" /></td>}
                    <td className="p-3 hidden md:table-cell"><Skeleton className="h-5 w-16" /></td>
                    <td className="p-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : stories && stories.length > 0 ? (
                stories.map((story) => (
                  <tr key={story.id} className="border-b" data-testid={`row-story-${story.id}`}>
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.has(story.id)}
                        onCheckedChange={() => toggleSelect(story.id)}
                        data-testid={`checkbox-story-${story.id}`}
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="font-medium line-clamp-1">{story.title}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">/{story.slug}</span>
                      </div>
                    </td>
                    {!activeCategory && (
                      <td className="p-3 hidden sm:table-cell">
                        {story.category ? (
                          <Badge variant="secondary">{story.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    )}
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant={story.status === "published" ? "default" : "secondary"}>
                        {story.status}
                      </Badge>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {story.createdAt ? format(new Date(story.createdAt), "MMM d, yyyy") : "-"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/stories/${story.slug}`}>
                          <Button size="icon" variant="ghost" data-testid={`button-view-${story.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/image/stories/${story.id}/edit`}>
                          <Button size="icon" variant="ghost" data-testid={`button-edit-${story.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => duplicateMutation.mutate(story.id)}
                          disabled={duplicateMutation.isPending}
                          title="Duplicate"
                          data-testid={`button-duplicate-${story.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(story.id)}
                          data-testid={`button-delete-${story.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    {categorySlug && !activeCategory
                      ? "Loading category..."
                      : `No articles found${activeCategory ? ` in ${activeCategory.name}` : ""}. Create your first article to get started.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the article.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
