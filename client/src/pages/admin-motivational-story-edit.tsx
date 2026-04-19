import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import type { MotivationalStory } from "@shared/schema";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminMotivationalStoryEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: story, isLoading } = useQuery<MotivationalStory>({
    queryKey: ["/api/admin/motivational-stories", id, "meta"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/motivational-stories/${id}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!id,
  });

  const { data: categoriesData } = useQuery<string[]>({
    queryKey: ["/api/admin/motivational-stories/categories"],
    queryFn: () => fetch("/api/admin/motivational-stories/categories", { credentials: "include" }).then(r => r.json()),
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [ratingEnabled, setRatingEnabled] = useState(true);

  useEffect(() => {
    if (story) {
      setTitle(story.title);
      setSlug(story.slug);
      setCategory(story.category || "");
      setDescription(story.description || "");
      setContent(story.content || "");
      setPublished(story.published ?? false);
      setRatingEnabled(story.ratingEnabled ?? true);
    }
  }, [story]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/motivational-stories/${id}`, {
      title, slug, category: category || null, description, content, published, ratingEnabled,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories"] });
      toast({ title: "Story updated" });
      navigate("/image/motivational-stories");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/image/motivational-stories">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            {isLoading ? <Skeleton className="h-7 w-48" /> : (
              <h1 className="text-xl font-bold" data-testid="text-edit-story-title">Edit Story</h1>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">Update story metadata and settings.</p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title || !slug || isLoading}
            data-testid="button-save-story"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6">
            <Card className="p-6 space-y-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </Card>
          </div>
        ) : (
          <div className="grid gap-6">
            <Card className="p-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Story title"
                    data-testid="input-story-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="story-slug"
                    data-testid="input-story-slug"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Patience, Gratitude, Faith..."
                    list="motiv-category-suggestions"
                    data-testid="input-story-category"
                  />
                  <datalist id="motiv-category-suggestions">
                    {(categoriesData || []).map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description..."
                    rows={3}
                    data-testid="input-story-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content (HTML)</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Full story content..."
                    rows={10}
                    className="font-mono text-sm"
                    data-testid="input-story-content"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold mb-4">Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch checked={published} onCheckedChange={setPublished} id="story-published" data-testid="switch-story-published" />
                  <Label htmlFor="story-published" className="cursor-pointer">Published (visible to visitors)</Label>
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={ratingEnabled} onCheckedChange={setRatingEnabled} id="story-rating" data-testid="switch-story-rating" />
                  <Label htmlFor="story-rating" className="cursor-pointer">Enable Ratings (allow users to rate this story)</Label>
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-3">
              <Link href="/image/motivational-stories">
                <Button variant="outline" data-testid="button-cancel">Cancel</Button>
              </Link>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !title || !slug}
                data-testid="button-save-story-bottom"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
