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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, ImageIcon } from "lucide-react";
import type { Dua } from "@shared/schema";

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminDuaEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: dua, isLoading } = useQuery<Dua & { parts?: any[] }>({
    queryKey: ["/api/admin/duas", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/duas/${id}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!id,
  });

  const { data: categoriesData } = useQuery<string[]>({
    queryKey: ["/api/admin/duas/categories"],
    queryFn: () => fetch("/api/admin/duas/categories", { credentials: "include" }).then(r => r.json()),
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [published, setPublished] = useState(false);
  const [ratingEnabled, setRatingEnabled] = useState(true);
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    if (dua) {
      setTitle(dua.title);
      setSlug(dua.slug);
      setCategory(dua.category || "");
      setDescription(dua.description || "");
      setThumbnail(dua.thumbnail || "");
      setPublished(dua.published ?? false);
      setRatingEnabled(dua.ratingEnabled ?? true);
      setSlugManual(true);
    }
  }, [dua]);

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/duas/${id}`, {
      title, slug, category: category || null, description,
      thumbnail: thumbnail || null, published, ratingEnabled,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duas", id] });
      toast({ title: "Dua updated" });
      navigate("/image/duas");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/image/duas">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            {isLoading ? <Skeleton className="h-7 w-48" /> : (
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold truncate" data-testid="text-edit-dua-title">
                  {dua?.title}
                </h1>
                {dua && (
                  <Badge variant={dua.published ? "default" : "secondary"}>
                    {dua.published ? "Published" : "Draft"}
                  </Badge>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">Edit dua collection details.</p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title || !slug || isLoading}
            data-testid="button-save-dua"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6">
            <Card className="p-6 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </Card>
          </div>
        ) : (
          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Collection Details</h2>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); if (!slugManual) setSlug(slugify(e.target.value)); }}
                    placeholder="Morning Duas"
                    data-testid="input-dua-title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>URL Slug</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground shrink-0">/duas/</span>
                      <Input
                        value={slug}
                        onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                        placeholder="morning-duas"
                        data-testid="input-dua-slug"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Morning, Evening, Protection..."
                      list="dua-category-suggestions"
                      data-testid="input-dua-category"
                    />
                    <datalist id="dua-category-suggestions">
                      {(categoriesData || []).map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Short Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Brief description shown on the card..."
                    data-testid="input-dua-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    Thumbnail URL <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="https://..."
                    data-testid="input-dua-thumbnail"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold mb-4">Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch checked={published} onCheckedChange={setPublished} id="dua-published" data-testid="switch-dua-published" />
                  <Label htmlFor="dua-published" className="cursor-pointer">Published (visible to visitors)</Label>
                </div>

                <div className="flex items-center gap-3">
                  <Switch checked={ratingEnabled} onCheckedChange={setRatingEnabled} id="dua-rating-enabled" data-testid="switch-dua-rating-enabled" />
                  <Label htmlFor="dua-rating-enabled" className="cursor-pointer">Enable Ratings (allow users to rate this dua)</Label>
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-3">
              <Link href="/image/duas">
                <Button variant="outline" data-testid="button-cancel">Cancel</Button>
              </Link>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !title || !slug}
                data-testid="button-save-dua-bottom"
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
