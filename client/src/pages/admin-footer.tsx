import { AdminLayout } from "@/components/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import type { Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, Globe, FileText, Type, LayoutTemplate, Link as LinkIcon, Pencil, List } from "lucide-react";
import type { FooterPage } from "@shared/schema";
import { FaFacebook, FaXTwitter, FaInstagram, FaYoutube, FaTiktok, FaLinkedin, FaPinterest, FaTelegram, FaWhatsapp, FaSnapchat } from "react-icons/fa6";

const PLATFORMS = [
  { value: "facebook", label: "Facebook", Icon: FaFacebook },
  { value: "twitter", label: "X / Twitter", Icon: FaXTwitter },
  { value: "instagram", label: "Instagram", Icon: FaInstagram },
  { value: "youtube", label: "YouTube", Icon: FaYoutube },
  { value: "tiktok", label: "TikTok", Icon: FaTiktok },
  { value: "linkedin", label: "LinkedIn", Icon: FaLinkedin },
  { value: "pinterest", label: "Pinterest", Icon: FaPinterest },
  { value: "telegram", label: "Telegram", Icon: FaTelegram },
  { value: "whatsapp", label: "WhatsApp", Icon: FaWhatsapp },
  { value: "snapchat", label: "Snapchat", Icon: FaSnapchat },
];

type SocialLink = { platform: string; url: string };

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const invalidateSettings = () => {
  queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
  queryClient.invalidateQueries({ queryKey: ["/api/settings/public"] });
};

export default function AdminFooterPage() {
  const { toast } = useToast();

  const { data: settings = {}, isSuccess: settingsLoaded } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: allCategories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const [siteName, setSiteName] = useState("Stories of Light");
  const [footerDesc, setFooterDesc] = useState("Sharing authentic, inspiring stories from Islamic history. Our mission is to make the rich heritage of Islamic civilization accessible and engaging for English-speaking audiences worldwide.");

  useEffect(() => {
    if (settingsLoaded) {
      setSiteName(settings["siteName"] ?? "Stories of Light");
      setFooterDesc(settings["footerDescription"] ?? "Sharing authentic, inspiring stories from Islamic history. Our mission is to make the rich heritage of Islamic civilization accessible and engaging for English-speaking audiences worldwide.");
    }
  }, [settingsLoaded]);

  const saveSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiRequest("PATCH", "/api/admin/settings", { key, value }),
    onSuccess: invalidateSettings,
  });

  const handleSaveSiteName = async () => {
    await saveSetting.mutateAsync({ key: "siteName", value: siteName });
    toast({ title: "Saved", description: "Site name updated." });
  };

  const handleSaveFooterDesc = async () => {
    await saveSetting.mutateAsync({ key: "footerDescription", value: footerDesc });
    toast({ title: "Saved", description: "Footer description updated." });
  };

  // --- Footer Categories ---
  let footerCategoryIds: string[] = [];
  try { footerCategoryIds = JSON.parse(settings["footerCategoryIds"] ?? "[]"); } catch { footerCategoryIds = []; }

  const toggleFooterCategory = async (id: string, checked: boolean) => {
    const updated = checked
      ? [...footerCategoryIds, id]
      : footerCategoryIds.filter(cid => cid !== id);
    await saveSetting.mutateAsync({ key: "footerCategoryIds", value: JSON.stringify(updated) });
    const cat = allCategories.find(c => c.id === id);
    toast({ title: checked ? "Added" : "Removed", description: `${cat?.name ?? "Category"} ${checked ? "will now appear" : "removed from"} footer.` });
  };

  // --- Social Links ---
  let socialLinks: SocialLink[] = [];
  try { socialLinks = JSON.parse(settings["socialLinks"] ?? "[]"); } catch { socialLinks = []; }

  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addingLink, setAddingLink] = useState(false);

  const saveSocialLinks = async (links: SocialLink[]) => {
    await saveSetting.mutateAsync({ key: "socialLinks", value: JSON.stringify(links) });
  };

  const handleAddLink = async () => {
    if (!newPlatform || !newUrl) return;
    const existing = socialLinks.find(l => l.platform === newPlatform);
    if (existing) {
      toast({ title: "Already added", description: `${newPlatform} is already in the list. Remove it first to change the URL.`, variant: "destructive" });
      return;
    }
    const updated = [...socialLinks, { platform: newPlatform, url: newUrl }];
    await saveSocialLinks(updated);
    setNewPlatform("");
    setNewUrl("");
    setAddingLink(false);
    toast({ title: "Saved", description: "Social link added. It will now appear in the footer." });
  };

  const handleDeleteLink = async (platform: string) => {
    const updated = socialLinks.filter(l => l.platform !== platform);
    await saveSocialLinks(updated);
    toast({ title: "Removed", description: "Social link removed from footer." });
  };

  // --- Footer Pages ---
  const { data: footerPagesData = [] } = useQuery<FooterPage[]>({ queryKey: ["/api/admin/footer-pages"] });

  const [pageDialog, setPageDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<FooterPage | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [pagePublished, setPagePublished] = useState(true);
  const [slugManual, setSlugManual] = useState(false);

  const openCreateDialog = () => {
    setEditingPage(null);
    setPageTitle("");
    setPageSlug("");
    setPageContent("");
    setPagePublished(true);
    setSlugManual(false);
    setPageDialog(true);
  };

  const openEditDialog = (page: FooterPage) => {
    setEditingPage(page);
    setPageTitle(page.title);
    setPageSlug(page.slug);
    setPageContent(page.content ?? "");
    setPagePublished(page.published ?? true);
    setSlugManual(true);
    setPageDialog(true);
  };

  const createPage = useMutation({
    mutationFn: (data: { title: string; slug: string; content: string; published: boolean; orderIndex: number }) =>
      apiRequest("POST", "/api/admin/footer-pages", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/footer-pages"] }),
  });

  const updatePage = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ title: string; slug: string; content: string; published: boolean }> }) =>
      apiRequest("PATCH", `/api/admin/footer-pages/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/footer-pages"] }),
  });

  const deletePage = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/footer-pages/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/footer-pages"] }),
  });

  const handleSavePage = async () => {
    if (!pageTitle || !pageSlug) {
      toast({ title: "Required", description: "Title and slug are required.", variant: "destructive" });
      return;
    }
    try {
      if (editingPage) {
        await updatePage.mutateAsync({ id: editingPage.id, data: { title: pageTitle, slug: pageSlug, content: pageContent, published: pagePublished } });
        toast({ title: "Saved", description: "Page updated." });
      } else {
        await createPage.mutateAsync({ title: pageTitle, slug: pageSlug, content: pageContent, published: pagePublished, orderIndex: footerPagesData.length });
        toast({ title: "Created", description: "Page created." });
      }
      setPageDialog(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to save page.", variant: "destructive" });
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("Delete this page permanently?")) return;
    await deletePage.mutateAsync(id);
    toast({ title: "Deleted", description: "Page deleted." });
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-2xl font-semibold">Footer Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your website footer content, social links, and about pages.</p>
        </div>

        {/* Website Name */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Type className="w-4 h-4" />Website Name</CardTitle>
            <CardDescription>The name displayed in the header and footer of the site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="site-name">Site Name</Label>
              <Input id="site-name" value={siteName} onChange={e => setSiteName(e.target.value)} data-testid="input-site-name" className="mt-1" />
            </div>
            <Button onClick={handleSaveSiteName} disabled={saveSetting.isPending} size="sm" data-testid="button-save-site-name">
              <Save className="w-4 h-4 mr-2" />Save Name
            </Button>
          </CardContent>
        </Card>

        {/* Footer Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><LayoutTemplate className="w-4 h-4" />Footer Description</CardTitle>
            <CardDescription>Short description shown under the site name in the footer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="footer-desc">Description</Label>
              <Textarea id="footer-desc" value={footerDesc} onChange={e => setFooterDesc(e.target.value)} rows={3} data-testid="input-footer-desc" className="mt-1" />
            </div>
            <Button onClick={handleSaveFooterDesc} disabled={saveSetting.isPending} size="sm" data-testid="button-save-footer-desc">
              <Save className="w-4 h-4 mr-2" />Save Description
            </Button>
          </CardContent>
        </Card>

        {/* Footer Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><List className="w-4 h-4" />Footer Categories</CardTitle>
            <CardDescription>Select which categories appear in the footer. If none selected, all categories are shown.</CardDescription>
          </CardHeader>
          <CardContent>
            {allCategories.length === 0 && (
              <p className="text-sm text-muted-foreground">No categories found.</p>
            )}
            <div className="space-y-3">
              {allCategories.map(cat => (
                <div key={cat.id} className="flex items-center gap-3" data-testid={`footer-cat-${cat.id}`}>
                  <Checkbox
                    id={`cat-${cat.id}`}
                    checked={footerCategoryIds.includes(cat.id)}
                    onCheckedChange={(checked) => toggleFooterCategory(cat.id, !!checked)}
                    disabled={saveSetting.isPending}
                    data-testid={`checkbox-footer-cat-${cat.id}`}
                  />
                  <label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer select-none">{cat.name}</label>
                </div>
              ))}
            </div>
            {footerCategoryIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-muted-foreground"
                onClick={async () => {
                  await saveSetting.mutateAsync({ key: "footerCategoryIds", value: "[]" });
                  toast({ title: "Reset", description: "All categories will now appear in the footer." });
                }}
                disabled={saveSetting.isPending}
                data-testid="button-reset-footer-categories"
              >
                Show all categories
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Social Media Links */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><LinkIcon className="w-4 h-4" />Social Media Links</CardTitle>
                <CardDescription className="mt-1">Icons appear horizontally below the site name in the footer.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setAddingLink(v => !v)} data-testid="button-add-social-link">
                <Plus className="w-4 h-4 mr-2" />Add Link
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {addingLink && (
              <div className="border rounded-md p-4 bg-muted/30 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Platform</Label>
                    <Select value={newPlatform} onValueChange={setNewPlatform}>
                      <SelectTrigger className="mt-1" data-testid="select-social-platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            <span className="flex items-center gap-2"><p.Icon className="w-4 h-4" />{p.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Profile URL</Label>
                    <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." className="mt-1" data-testid="input-social-url" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddLink} disabled={!newPlatform || !newUrl || saveSetting.isPending} data-testid="button-save-social-link">
                    {saveSetting.isPending ? "Saving..." : "Save Link"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setAddingLink(false); setNewPlatform(""); setNewUrl(""); }}>Cancel</Button>
                </div>
              </div>
            )}

            {socialLinks.length === 0 && !addingLink && (
              <p className="text-sm text-muted-foreground text-center py-4">No social links added yet. Click "Add Link" to get started.</p>
            )}

            <div className="space-y-2">
              {socialLinks.map(link => {
                const platform = PLATFORMS.find(p => p.value === link.platform);
                const Icon = platform?.Icon ?? Globe;
                return (
                  <div key={link.platform} className="flex items-center gap-3 p-3 border rounded-md bg-card" data-testid={`social-link-${link.platform}`}>
                    <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{platform?.label ?? link.platform}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleDeleteLink(link.platform)}
                      disabled={saveSetting.isPending}
                      data-testid={`button-delete-social-${link.platform}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* About Pages */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><FileText className="w-4 h-4" />About Pages</CardTitle>
                <CardDescription className="mt-1">Pages shown in the About section of the footer (e.g. About Us, Privacy Policy).</CardDescription>
              </div>
              <Button size="sm" onClick={openCreateDialog} data-testid="button-create-footer-page">
                <Plus className="w-4 h-4 mr-2" />New Page
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {footerPagesData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No pages yet. Create your first About page.</p>
            )}
            <div className="space-y-2">
              {footerPagesData.map(page => (
                <div key={page.id} className="flex items-center gap-3 p-3 border rounded-md bg-card" data-testid={`footer-page-${page.id}`}>
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{page.title}</p>
                    <p className="text-xs text-muted-foreground">/page/{page.slug}</p>
                  </div>
                  {page.published ? (
                    <Badge variant="secondary" className="text-xs">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(page)} data-testid={`button-edit-page-${page.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeletePage(page.id)} data-testid={`button-delete-page-${page.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Page Dialog */}
      <Dialog open={pageDialog} onOpenChange={setPageDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? "Edit Page" : "Create Page"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="page-title">Title</Label>
              <Input
                id="page-title"
                value={pageTitle}
                onChange={e => {
                  setPageTitle(e.target.value);
                  if (!slugManual) setPageSlug(slugify(e.target.value));
                }}
                placeholder="About Us"
                className="mt-1"
                data-testid="input-page-title"
              />
            </div>
            <div>
              <Label htmlFor="page-slug">URL Slug</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap">/page/</span>
                <Input
                  id="page-slug"
                  value={pageSlug}
                  onChange={e => { setPageSlug(e.target.value); setSlugManual(true); }}
                  placeholder="about-us"
                  data-testid="input-page-slug"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="page-content">Content</Label>
              <Textarea
                id="page-content"
                value={pageContent}
                onChange={e => setPageContent(e.target.value)}
                rows={12}
                placeholder="Write the page content here..."
                className="mt-1 font-mono text-sm"
                data-testid="input-page-content"
              />
              <p className="text-xs text-muted-foreground mt-1">Each line break creates a new paragraph on the public page.</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={pagePublished} onCheckedChange={setPagePublished} id="page-published" data-testid="switch-page-published" />
              <Label htmlFor="page-published">Published (visible in footer)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPageDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePage} disabled={createPage.isPending || updatePage.isPending} data-testid="button-save-page">
              <Save className="w-4 h-4 mr-2" />
              {editingPage ? "Save Changes" : "Create Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
