import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown, ChevronUp, ChevronRight,
  Save, Loader2, Megaphone, Type, MousePointerClick,
  Layers, Star, BookOpen, Lightbulb, Moon, Clock,
  AlignLeft, Hash, LayoutDashboard, CheckCircle2,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdManagementDialog } from "@/components/ad-management-dialog";
import type { Category } from "@shared/schema";

type CategoryWithCount = Category & { contentCount?: number };

interface SectionConfig {
  id: string;
  visible: boolean;
  count: number;
  title: string;
  desc: string;
  categoryIds?: string[];
}

const SECTION_DEFAULTS: SectionConfig[] = [
  { id: "categories", visible: true, count: 6, title: "Explore by Category", desc: "Dive into different aspects of Islamic heritage, each offering unique lessons and inspiration.", categoryIds: [] },
  { id: "featured", visible: true, count: 6, title: "Featured Stories", desc: "Handpicked stories from the lives of the Sahaba, Awliya, and Islamic history." },
  { id: "books", visible: true, count: 6, title: "Islamic Books", desc: "Read online — no download required." },
  { id: "motivational", visible: true, count: 4, title: "Islamic Motivational Stories", desc: "Inspiring stories to guide your daily life and strengthen your faith." },
  { id: "duas", visible: true, count: 4, title: "Popular Duas", desc: "The most-read supplications to strengthen your connection with Allah." },
  { id: "latest", visible: true, count: 6, title: "Latest Stories", desc: "Recently published narratives from Islamic history." },
];

const SECTION_META: Record<string, { icon: React.ReactNode; countLabel: string }> = {
  categories: { icon: <Layers className="w-4 h-4 text-primary" />, countLabel: "Max categories shown" },
  featured: { icon: <Star className="w-4 h-4 text-primary" />, countLabel: "Number of stories" },
  books: { icon: <BookOpen className="w-4 h-4 text-primary" />, countLabel: "Number of books" },
  motivational: { icon: <Lightbulb className="w-4 h-4 text-primary" />, countLabel: "Number of stories" },
  duas: { icon: <Moon className="w-4 h-4 text-primary" />, countLabel: "Number of duas" },
  latest: { icon: <Clock className="w-4 h-4 text-primary" />, countLabel: "Number of stories" },
};

function parseSectionsConfig(raw: string | undefined): SectionConfig[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) {
      return SECTION_DEFAULTS.map(def => {
        const saved = parsed.find((s: any) => s.id === def.id);
        return saved ? { ...def, ...saved } : def;
      });
    }
  } catch {}
  return SECTION_DEFAULTS;
}

function AdSlotRow({ label, contentType, adSlotsRaw }: {
  label: string;
  contentType: "home-top" | "home-mid" | "home-bottom";
  adSlotsRaw: string | null | undefined;
}) {
  const [adOpen, setAdOpen] = useState(false);
  return (
    <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">{label}</span>
        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">Ad Space</Badge>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
        onClick={() => setAdOpen(true)}
        data-testid={`button-admanage-${contentType}`}
      >
        <Megaphone className="w-3.5 h-3.5 mr-1.5" />
        Ad Management
      </Button>
      <AdManagementDialog
        open={adOpen}
        onOpenChange={setAdOpen}
        contentType={contentType}
        contentId="homepage"
        contentName={label}
        adSlotsRaw={adSlotsRaw}
        invalidateKey={["/api/settings/public"]}
      />
    </div>
  );
}

interface SectionRowProps {
  section: SectionConfig;
  categories?: CategoryWithCount[];
  onToggle: (id: string, visible: boolean) => void;
  onSave: (id: string, patch: Partial<SectionConfig>) => void;
  savingId: string | null;
}

function SectionRow({ section, categories, onToggle, onSave, savingId }: SectionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [localTitle, setLocalTitle] = useState(section.title);
  const [localDesc, setLocalDesc] = useState(section.desc);
  const [localCount, setLocalCount] = useState(section.count);
  const [localCategoryIds, setLocalCategoryIds] = useState<string[]>(section.categoryIds || []);
  const meta = SECTION_META[section.id];
  const isSaving = savingId === section.id;

  useEffect(() => {
    setLocalTitle(section.title);
    setLocalDesc(section.desc);
    setLocalCount(section.count);
    setLocalCategoryIds(section.categoryIds || []);
  }, [section]);

  return (
    <div className="border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
        data-testid={`section-row-${section.id}`}
      >
        <div className="shrink-0">{meta?.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{section.title}</p>
          {section.desc && <p className="text-xs text-muted-foreground truncate">{section.desc}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
          <Switch
            checked={section.visible}
            onCheckedChange={checked => onToggle(section.id, checked)}
            data-testid={`switch-visible-${section.id}`}
          />
          <span className="text-xs text-muted-foreground w-14 text-center">
            {section.visible ? "Visible" : "Hidden"}
          </span>
        </div>
        <div className="shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3 bg-muted/5">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Type className="w-3 h-3" /> Section Title
            </Label>
            <Input
              value={localTitle}
              onChange={e => setLocalTitle(e.target.value)}
              placeholder={section.title}
              data-testid={`input-title-${section.id}`}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <AlignLeft className="w-3 h-3" /> Description
            </Label>
            <Textarea
              value={localDesc}
              onChange={e => setLocalDesc(e.target.value)}
              placeholder="Short description shown below the section title..."
              rows={2}
              data-testid={`input-desc-${section.id}`}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> {meta?.countLabel || "Count"}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setLocalCount(c => Math.max(1, c - 1))}
                data-testid={`button-count-down-${section.id}`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
              <span className="w-10 text-center font-semibold text-sm">{localCount}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => setLocalCount(c => Math.min(20, c + 1))}
                data-testid={`button-count-up-${section.id}`}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground ml-1">max 20</span>
            </div>
          </div>

          {section.id === "categories" && categories && categories.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Categories to Display
                <span className="text-muted-foreground">(empty = show all)</span>
              </Label>
              <div className="grid grid-cols-2 gap-1.5 border rounded-lg p-2.5 bg-background max-h-44 overflow-y-auto">
                {categories
                  .filter(c => ["story", "book", "motivational-story", "dua"].includes(c.type || ""))
                  .map(cat => {
                    const isChecked = localCategoryIds.length === 0 || localCategoryIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2 cursor-pointer text-xs hover:text-foreground text-muted-foreground py-0.5"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setLocalCategoryIds(prev => {
                              const base = prev.length > 0 ? prev : categories.map(c => c.id);
                              return checked
                                ? [...base.filter(id => id !== cat.id), cat.id]
                                : base.filter(id => id !== cat.id);
                            });
                          }}
                          data-testid={`checkbox-cat-${cat.id}`}
                        />
                        {cat.name}
                      </label>
                    );
                  })}
              </div>
              {localCategoryIds.length > 0 && (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  onClick={() => setLocalCategoryIds([])}
                >
                  Reset — show all categories
                </button>
              )}
            </div>
          )}

          <div className="pt-1">
            <Button
              size="sm"
              onClick={() => onSave(section.id, {
                title: localTitle,
                desc: localDesc,
                count: localCount,
                ...(section.id === "categories" ? { categoryIds: localCategoryIds } : {}),
              })}
              disabled={isSaving}
              data-testid={`button-save-section-${section.id}`}
            >
              {isSaving
                ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                : <Save className="w-3.5 h-3.5 mr-1.5" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminHomeManagementPage() {
  const { toast } = useToast();
  const [expandedPanel, setExpandedPanel] = useState<"hero" | "page" | null>(null);

  const { data: settings, isLoading: settingsLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  const { data: categories } = useQuery<CategoryWithCount[]>({
    queryKey: ["/api/categories?type=all"],
  });

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [btn1Text, setBtn1Text] = useState("");
  const [btn1Url, setBtn1Url] = useState("");
  const [btn2Text, setBtn2Text] = useState("");
  const [btn2Url, setBtn2Url] = useState("");
  const [sections, setSections] = useState<SectionConfig[]>(SECTION_DEFAULTS);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [heroSaved, setHeroSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setHeroTitle(settings["homeHeroTitle"] || "Islamic Stories, Biographies &amp; Books —<br />Read, Listen and Learn");
    setHeroSubtitle(settings["homeHeroSubtitle"] || "Explore biographies of the Sahaba, Awliya, and great figures of Islamic history — with audio narrations, free online books, and curated reading recommendations.");
    setBtn1Text(settings["homeHeroBtn1Text"] || "Explore Stories");
    setBtn1Url(settings["homeHeroBtn1Url"] || "/motivational-stories");
    setBtn2Text(settings["homeHeroBtn2Text"] || "Browse Categories");
    setBtn2Url(settings["homeHeroBtn2Url"] || "/awliya");
    setSections(parseSectionsConfig(settings["homeSectionsConfig"]));
  }, [settings]);

  const saveSetting = useCallback(async (key: string, value: string) => {
    await apiRequest("PATCH", "/api/admin/settings", { key, value });
    queryClient.invalidateQueries({ queryKey: ["/api/settings/public"] });
  }, []);

  const heroMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        saveSetting("homeHeroTitle", heroTitle),
        saveSetting("homeHeroSubtitle", heroSubtitle),
        saveSetting("homeHeroBtn1Text", btn1Text),
        saveSetting("homeHeroBtn1Url", btn1Url),
        saveSetting("homeHeroBtn2Text", btn2Text),
        saveSetting("homeHeroBtn2Url", btn2Url),
      ]);
    },
    onSuccess: () => {
      toast({ title: "Hero section saved successfully" });
      setHeroSaved(true);
      setTimeout(() => setHeroSaved(false), 2500);
    },
    onError: (err: any) => toast({ title: "Error saving hero", description: err.message, variant: "destructive" }),
  });

  const saveAllSections = useCallback(async (updatedSections: SectionConfig[]) => {
    await apiRequest("PATCH", "/api/admin/settings", {
      key: "homeSectionsConfig",
      value: JSON.stringify(updatedSections),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/settings/public"] });
  }, []);

  const handleToggle = useCallback(async (id: string, visible: boolean) => {
    const updatedSections = sections.map(s => s.id === id ? { ...s, visible } : s);
    setSections(updatedSections);
    try {
      await saveAllSections(updatedSections);
      toast({ title: `${visible ? "Shown" : "Hidden"} on home page`, description: `Section visibility updated.` });
    } catch (err: any) {
      toast({ title: "Failed to update visibility", description: err.message, variant: "destructive" });
    }
  }, [sections, saveAllSections, toast]);

  const handleSaveSection = useCallback(async (id: string, patch: Partial<SectionConfig>) => {
    const updatedSections = sections.map(s => s.id === id ? { ...s, ...patch } : s);
    setSections(updatedSections);
    setSavingSection(id);
    try {
      await saveAllSections(updatedSections);
      toast({ title: "Section saved successfully" });
    } catch (err: any) {
      toast({ title: "Error saving section", description: err.message, variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  }, [sections, saveAllSections, toast]);

  const topAdSlots = settings?.["homeAdSlot_top"] ?? null;
  const midAdSlots = settings?.["homeAdSlot_mid"] ?? null;
  const bottomAdSlots = settings?.["homeAdSlot_bottom"] ?? null;

  const PAGE_LAYOUT = [
    { type: "ad", id: "top", label: "Ad Space – Top Banner", contentType: "home-top" as const, adSlotsRaw: topAdSlots },
    { type: "section", id: "categories" },
    { type: "section", id: "featured" },
    { type: "section", id: "books" },
    { type: "ad", id: "mid", label: "Ad Space – Mid Content", contentType: "home-mid" as const, adSlotsRaw: midAdSlots },
    { type: "section", id: "motivational" },
    { type: "section", id: "duas" },
    { type: "section", id: "latest" },
    { type: "ad", id: "bottom", label: "Ad Space – Bottom Banner", contentType: "home-bottom" as const, adSlotsRaw: bottomAdSlots },
  ];

  if (settingsLoading) {
    return (
      <AdminLayout>
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-home-mgmt-title">Home Page Management</h1>
              <p className="text-muted-foreground text-sm">Control the hero, layout, content and ads on the home page</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Two box-style option buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-6 text-center transition-all cursor-pointer hover:border-primary/70 hover:bg-primary/5 ${
                expandedPanel === "hero" ? "border-primary bg-primary/5" : "border-border bg-muted/20"
              }`}
              onClick={() => setExpandedPanel(e => e === "hero" ? null : "hero")}
              data-testid="button-panel-hero"
            >
              <Type className={`w-9 h-9 ${expandedPanel === "hero" ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="font-semibold">Hero Section</p>
                <p className="text-xs text-muted-foreground">Title, subtitle &amp; buttons</p>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${expandedPanel === "hero" ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
            </button>

            <button
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-6 text-center transition-all cursor-pointer hover:border-primary/70 hover:bg-primary/5 ${
                expandedPanel === "page" ? "border-primary bg-primary/5" : "border-border bg-muted/20"
              }`}
              onClick={() => setExpandedPanel(e => e === "page" ? null : "page")}
              data-testid="button-panel-page"
            >
              <Layers className={`w-9 h-9 ${expandedPanel === "page" ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="font-semibold">Page Section</p>
                <p className="text-xs text-muted-foreground">Layout, ads &amp; content</p>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${expandedPanel === "page" ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
            </button>
          </div>

          {/* ── Hero Section Panel ── */}
          {expandedPanel === "hero" && (
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" /> Hero Section Settings
              </h3>

              <div className="space-y-1.5">
                <Label>Hero Title <span className="text-muted-foreground text-xs">(HTML supported)</span></Label>
                <Textarea
                  value={heroTitle}
                  onChange={e => setHeroTitle(e.target.value)}
                  rows={2}
                  placeholder="Islamic Stories, Biographies & Books"
                  data-testid="input-hero-title"
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">&lt;br /&gt;</code> for line breaks, <code className="bg-muted px-1 rounded">&amp;amp;</code> for &amp;
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Hero Subtitle / Description</Label>
                <Textarea
                  value={heroSubtitle}
                  onChange={e => setHeroSubtitle(e.target.value)}
                  rows={3}
                  placeholder="Enter a short description..."
                  data-testid="input-hero-subtitle"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 border rounded-lg p-3">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <MousePointerClick className="w-3.5 h-3.5 text-primary" /> Button 1 (Primary)
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Button Text</Label>
                    <Input value={btn1Text} onChange={e => setBtn1Text(e.target.value)} placeholder="Explore Stories" data-testid="input-btn1-text" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Button URL</Label>
                    <Input value={btn1Url} onChange={e => setBtn1Url(e.target.value)} placeholder="/motivational-stories" data-testid="input-btn1-url" />
                  </div>
                </div>
                <div className="space-y-2 border rounded-lg p-3">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <MousePointerClick className="w-3.5 h-3.5 text-muted-foreground" /> Button 2 (Outline)
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Button Text</Label>
                    <Input value={btn2Text} onChange={e => setBtn2Text(e.target.value)} placeholder="Browse Categories" data-testid="input-btn2-text" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Button URL</Label>
                    <Input value={btn2Url} onChange={e => setBtn2Url(e.target.value)} placeholder="/awliya" data-testid="input-btn2-url" />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => heroMutation.mutate()}
                disabled={heroMutation.isPending}
                data-testid="button-save-hero"
                className="w-full sm:w-auto"
              >
                {heroMutation.isPending
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : heroSaved
                  ? <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                  : <Save className="w-4 h-4 mr-2" />}
                {heroSaved ? "Saved!" : "Save Hero Section"}
              </Button>
            </Card>
          )}

          {/* ── Page Section Panel ── */}
          {expandedPanel === "page" && (
            <Card className="p-5 space-y-2.5">
              <h3 className="font-semibold flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-primary" /> Page Layout
                <span className="text-xs text-muted-foreground font-normal">(fixed order — toggles auto-save)</span>
              </h3>

              {PAGE_LAYOUT.map(item => {
                if (item.type === "ad") {
                  return (
                    <AdSlotRow
                      key={item.id}
                      label={item.label!}
                      contentType={item.contentType!}
                      adSlotsRaw={item.adSlotsRaw}
                    />
                  );
                }
                const sectionCfg = sections.find(s => s.id === item.id);
                if (!sectionCfg) return null;
                return (
                  <SectionRow
                    key={item.id}
                    section={sectionCfg}
                    categories={categories}
                    onToggle={handleToggle}
                    onSave={handleSaveSection}
                    savingId={savingSection}
                  />
                );
              })}
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
