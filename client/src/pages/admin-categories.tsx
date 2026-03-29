import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Upload,
  X,
  ChevronUp,
  ChevronDown,
  ImageIcon,
  BookOpen,
  Sparkles,
  Moon,
  Layers,
  Copy,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useState, useRef } from "react";
import type { Category } from "@shared/schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

type CategoryType = "story" | "book" | "motivational-story" | "dua";

type CategoryWithCount = Category & { contentCount?: number; storyCount?: number };

const TYPE_META: Record<CategoryType, { label: string; color: string; icon: React.ReactNode; contentLabel: string }> = {
  story: {
    label: "Story Category",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    icon: <Sparkles className="w-3 h-3" />,
    contentLabel: "stories",
  },
  book: {
    label: "Books Page",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    icon: <BookOpen className="w-3 h-3" />,
    contentLabel: "books",
  },
  "motivational-story": {
    label: "Motivational Stories Page",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: <Layers className="w-3 h-3" />,
    contentLabel: "stories",
  },
  dua: {
    label: "Duas Page",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    icon: <Moon className="w-3 h-3" />,
    contentLabel: "duas",
  },
};

const QUERY_KEY = "/api/categories?type=all";

function getCategoryPublicUrl(cat: CategoryWithCount): string {
  if (cat.type === "story") return `/${cat.urlSlug || ""}`;
  if (cat.type === "book") return "/books";
  if (cat.type === "motivational-story") return "/motivational-stories";
  if (cat.type === "dua") return "/duas";
  return "/";
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryWithCount | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [catType, setCatType] = useState<CategoryType>("story");
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const isContributor = !isAdmin;

  const { data: categories, isLoading } = useQuery<CategoryWithCount[]>({
    queryKey: [QUERY_KEY],
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = { name, slug: slug || name, description, image, type: catType };
      if (editingCat) {
        await apiRequest("PATCH", `/api/categories/${editingCat.id}`, data);
      } else {
        const maxOrder = categories?.reduce((m, c) => Math.max(m, c.orderIndex ?? 0), -1) ?? -1;
        await apiRequest("POST", "/api/categories", { ...data, orderIndex: maxOrder + 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: editingCat ? "Updated successfully" : "Created successfully" });
      closeDialog();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: "Category deleted" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (cat: CategoryWithCount) => {
      const maxOrder = categories?.reduce((m, c) => Math.max(m, c.orderIndex ?? 0), -1) ?? -1;
      await apiRequest("POST", "/api/categories", {
        name: `${cat.name} (Copy)`,
        slug: cat.slug ? `${cat.slug}-copy` : `${cat.name.toLowerCase().replace(/\s+/g, "-")}-copy`,
        description: cat.description,
        image: cat.image,
        type: cat.type,
        orderIndex: maxOrder + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({ title: "Category duplicated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newIndex }: { id: string; newIndex: number }) => {
      await apiRequest("PATCH", `/api/categories/${id}`, { orderIndex: newIndex });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (err: any) => {
      toast({ title: "Error reordering", description: err.message, variant: "destructive" });
    },
  });

  const handleMoveUp = (cat: CategoryWithCount, idx: number) => {
    if (!categories || idx === 0) return;
    const prev = categories[idx - 1];
    reorderMutation.mutate({ id: cat.id, newIndex: prev.orderIndex ?? idx - 1 });
    reorderMutation.mutate({ id: prev.id, newIndex: cat.orderIndex ?? idx });
  };

  const handleMoveDown = (cat: CategoryWithCount, idx: number) => {
    if (!categories || idx === categories.length - 1) return;
    const next = categories[idx + 1];
    reorderMutation.mutate({ id: cat.id, newIndex: next.orderIndex ?? idx + 1 });
    reorderMutation.mutate({ id: next.id, newIndex: cat.orderIndex ?? idx });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("cover", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImage(data.url);
      toast({ title: "Image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
      if (imageFileRef.current) imageFileRef.current.value = "";
    }
  };

  const openCreate = () => {
    setEditingCat(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setCatType("story");
    setDialogOpen(true);
  };

  const openEdit = (cat: CategoryWithCount) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setCatType((cat.type as CategoryType) || "story");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCat(null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
  };

  const getCount = (cat: CategoryWithCount) => {
    if (cat.type === "story") return cat.storyCount ?? cat.contentCount ?? 0;
    return cat.contentCount ?? 0;
  };

  const getContentLabel = (cat: CategoryWithCount) => {
    const meta = TYPE_META[(cat.type as CategoryType) || "story"];
    const count = getCount(cat);
    return `${count} ${count === 1 ? meta.contentLabel.slice(0, -1) : meta.contentLabel}`;
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-categories-title">Categories</h1>
          <p className="text-muted-foreground mt-1">
            {isContributor ? "Browse categories and view published content" : "Manage page names, descriptions, and cover images for all sections"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} data-testid="button-new-category">
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))
        ) : categories && categories.length > 0 ? (
          categories.map((cat, idx) => {
            const meta = TYPE_META[(cat.type as CategoryType) || "story"];
            const cardContent = (
              <Card key={isContributor ? undefined : cat.id} className={`p-4${isContributor ? " hover:shadow-md hover:border-primary/40 transition-all cursor-pointer" : ""}`} data-testid={`card-category-${cat.slug}`}>
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <div className="flex flex-col gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleMoveUp(cat, idx)}
                        disabled={idx === 0 || reorderMutation.isPending}
                        title="Move up"
                        data-testid={`button-move-up-${cat.slug}`}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleMoveDown(cat, idx)}
                        disabled={idx === (categories.length - 1) || reorderMutation.isPending}
                        title="Move down"
                        data-testid={`button-move-down-${cat.slug}`}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="h-14 w-20 rounded object-cover shrink-0 border" />
                  ) : (
                    <div className="h-14 w-20 rounded bg-muted flex items-center justify-center shrink-0 border">
                      <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{cat.name}</h3>
                      <span className="text-xs text-muted-foreground">/{cat.slug}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {getContentLabel(cat)}
                      </Badge>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{cat.description}</p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(cat)} data-testid={`button-edit-cat-${cat.slug}`}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => duplicateMutation.mutate(cat)}
                        disabled={duplicateMutation.isPending}
                        data-testid={`button-duplicate-cat-${cat.slug}`}
                        title="Duplicate category"
                      >
                        {duplicateMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1" />
                        )}
                        Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeleteTarget(cat.id);
                          setDeleteDialogOpen(true);
                        }}
                        data-testid={`button-delete-cat-${cat.slug}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
            return isContributor ? (
              <a key={cat.id} href={getCategoryPublicUrl(cat)}>{cardContent}</a>
            ) : cardContent;
          })
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No categories yet. Create your first one.</p>
          </Card>
        )}
      </div>

      {isAdmin && <>
        <input ref={imageFileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCat ? "Edit Category / Page" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editingCat && (
              <div className="space-y-2">
                <Label htmlFor="cat-type">Type</Label>
                <Select value={catType} onValueChange={(v) => setCatType(v as CategoryType)}>
                  <SelectTrigger id="cat-type" data-testid="select-cat-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="story">Story Category</SelectItem>
                    <SelectItem value="book">Books Page</SelectItem>
                    <SelectItem value="motivational-story">Motivational Stories Page</SelectItem>
                    <SelectItem value="dua">Duas Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Category name"
                data-testid="input-cat-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Hero Title</Label>
              <Input
                id="cat-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. Stories of the Companions..."
                data-testid="input-cat-slug"
              />
              <p className="text-xs text-muted-foreground">Displayed as the H1 heading on the page hero section. Defaults to Name if left blank.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={3}
                data-testid="input-cat-description"
              />
            </div>

            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Cover Image
              </Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageFileRef.current?.click()}
                  disabled={uploadingImage}
                  data-testid="button-upload-cat-image"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {uploadingImage ? "Uploading…" : "Upload Image"}
                </Button>
                <span className="text-xs text-muted-foreground">JPG, PNG, WebP (recommended: 800×500)</span>
              </div>
              {image && (
                <div className="flex items-center gap-2 mt-2">
                  <img src={image} alt="Preview" className="h-16 w-28 rounded object-cover border" />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setImage("")}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <Input
                id="cat-image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/uploads/covers/..."
                data-testid="input-cat-image"
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cat-cancel">
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !name || uploadingImage}
              data-testid="button-cat-save"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCat ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the category. For section pages (Books, Motivational Stories, Duas), the public page will fall back to default content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-cat-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteTarget) deleteMutation.mutate(deleteTarget);
                  setDeleteDialogOpen(false);
                }}
                data-testid="button-confirm-cat-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>}
    </AdminLayout>
  );
}
