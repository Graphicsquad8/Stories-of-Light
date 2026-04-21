import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown, ChevronUp, ChevronRight,
  Save, Loader2, Megaphone, Type, MousePointerClick,
  Layout, Layers, Star, BookOpen, Lightbulb, Moon, Clock,
  AlignLeft, Hash,
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

const SECTION_META: Record<string, { label: string; icon: React.ReactNode; countLabel: string }> = {
  categories: { label: "Explore by Category", icon: <Layers className="w-4 h-4" />, countLabel: "Max categories shown" },
  featured: { label: "Featured Stories", icon: <Star className="w-4 h-4" />, countLabel: "Number of stories" },
  books: { label: "Islamic Books", icon: <BookOpen className="w-4 h-4" />, countLabel: "Number of books" },
  motivational: { label: "Islamic Motivational Stories", icon: <Lightbulb className="w-4 h-4" />, countLabel: "Number of stories" },
  duas: { label: "Popular Duas", icon: <Moon className="w-4 h-4" />, countLabel: "Number of duas" },
  latest: { label: "Latest Stories", icon: <Clock className="w-4 h-4" />, countLabel: "Number of stories" },
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

interface AdSlotRowProps {
  label: string;
  contentType: "home-top" | "home-mid" | "home-bottom";
  adSlotsRaw: string | null | undefined;
}

function AdSlotRow({ label, contentType, adSlotsRaw }: AdSlotRowProps) {
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
  onChange: (updated: Partial<SectionConfig>) => void;
  onSave: () => void;
  saving: boolean;
}

function SectionRow({ section, categories, onChange, onSave, saving }: SectionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = SECTION_META[section.id];

  return (
    <div className="border rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
        data-testid={`section-row-${section.id}`}
      >
        <div className="text-primary shrink-0">{meta?.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{section.title || meta?.label}</p>
          {section.desc && <p className="text-xs text-muted-foreground truncate">{section.desc}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
          <Switch
            checked={section.visible}
            onCheckedChange={checked => onChange({ visible: checked })}
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
              value={section.title}
              onChange={e => onChange({ title: e.target.value })}
              placeholder={meta?.label}
              data-testid={`input-title-${section.id}`}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <AlignLeft className="w-3 h-3" /> Description
            </Label>
            <Textarea
              value={section.desc}
              onChange={e => onChange({ desc: e.target.value })}
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
                onClick={() => onChange({ count: Math.max(1, section.count - 1) })}
                data-testid={`button-count-down-${section.id}`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
              <span className="w-10 text-center font-semibold text-sm">{section.count}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => onChange({ count: Math.min(20, section.count + 1) })}
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
              <div className="grid grid-cols-2 gap-1.5 border rounded-lg p-2.5 bg-background max-h-40 overflow-y-auto">
                {categories.filter(c => c.type === "story" || c.type === "book" || c.type === "motivational-story" || c.type === "dua").map(cat => {
                  const selected = !section.categoryIds || section.categoryIds.length === 0 || section.categoryIds.includes(cat.id);
                  const isChecked = section.categoryIds && section.categoryIds.length > 0 ? section.categoryIds.includes(cat.id) : true;
                  return (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 cursor-pointer text-xs hover:text-foreground text-muted-foreground py-0.5"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const currentIds = section.categoryIds && section.categoryIds.length > 0
                            ? section.categoryIds
                            : categories.map(c => c.id);
                          if (checked) {
                            onChange({ categoryIds: [...currentIds, cat.id] });
                          } else {
                            onChange({ categoryIds: currentIds.filter(id => id !== cat.id) });
                          }
                        }}
                        data-testid={`checkbox-cat-${cat.id}`}
                      />
                      {cat.name}
                    </label>
                  );
                })}
              </div>
              {section.categoryIds && section.categoryIds.length > 0 && (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  onClick={() => onChange({ categoryIds: [] })}
                >
                  Reset — show all categories
                </button>
              )}
            </div>
          )}

          <div className="pt-1">
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving}
              data-testid={`button-save-section-${section.id}`}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface HomePageManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HomePageManagementDialog({ open, onOpenChange }: HomePageManagementDialogProps) {
  const { toast } = useToast();
  const [expandedPanel, setExpandedPanel] = useState<"hero" | "page" | null>(null);

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
    enabled: open,
  });

  const { data: categories } = useQuery<CategoryWithCount[]>({
    queryKey: ["/api/categories?type=all"],
    enabled: open,
  });

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [btn1Text, setBtn1Text] = useState("");
  const [btn1Url, setBtn1Url] = useState("");
  const [btn2Text, setBtn2Text] = useState("");
  const [btn2Url, setBtn2Url] = useState("");
  const [sections, setSections] = useState<SectionConfig[]>(SECTION_DEFAULTS);
  const [savingSection, setSavingSection] = useState<string | null>(null);

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

  const saveSetting = async (key: string, value: string) => {
    await apiRequest("POST", "/api/admin/settings", { key, value });
    queryClient.invalidateQueries({ queryKey: ["/api/settings/public"] });
  };

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
    onSuccess: () => toast({ title: "Hero section saved" }),
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const saveSectionConfig = async (sectionId: string) => {
    setSavingSection(sectionId);
    try {
      await saveSetting("homeSectionsConfig", JSON.stringify(sections));
      toast({ title: "Section saved" });
    } catch (err: any) {
      toast({ title: "Error saving section", description: err.message, variant: "destructive" });
    } finally {
      setSavingSection(null);
    }
  };

  const updateSection = (id: string, patch: Partial<SectionConfig>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            Home Page Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* Two box-style option buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Hero Section Box */}
            <button
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-5 text-center transition-all cursor-pointer hover:border-primary/70 hover:bg-primary/5 ${
                expandedPanel === "hero"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/20"
              }`}
              onClick={() => setExpandedPanel(e => e === "hero" ? null : "hero")}
              data-testid="button-panel-hero"
            >
              <Type className={`w-8 h-8 ${expandedPanel === "hero" ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="font-semibold text-sm">Hero Section</p>
                <p className="text-xs text-muted-foreground">Title, subtitle & buttons</p>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${expandedPanel === "hero" ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
            </button>

            {/* Page Section Box */}
            <button
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-5 text-center transition-all cursor-pointer hover:border-primary/70 hover:bg-primary/5 ${
                expandedPanel === "page"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/20"
              }`}
              onClick={() => setExpandedPanel(e => e === "page" ? null : "page")}
              data-testid="button-panel-page"
            >
              <Layers className={`w-8 h-8 ${expandedPanel === "page" ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="font-semibold text-sm">Page Section</p>
                <p className="text-xs text-muted-foreground">Layout, ads & content</p>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${expandedPanel === "page" ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
            </button>
          </div>

          {/* ── Hero Section Panel ── */}
          {expandedPanel === "hero" && (
            <div className="border rounded-xl p-4 space-y-4 bg-muted/5 animate-in slide-in-from-top-2">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Type className="w-4 h-4 text-primary" /> Hero Section Settings
              </h3>

              <div className="space-y-1.5">
                <Label className="text-xs">Hero Title <span className="text-muted-foreground">(HTML supported)</span></Label>
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
                <Label className="text-xs">Hero Subtitle / Description</Label>
                <Textarea
                  value={heroSubtitle}
                  onChange={e => setHeroSubtitle(e.target.value)}
                  rows={3}
                  placeholder="Enter a short description for the hero section..."
                  data-testid="input-hero-subtitle"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 border rounded-lg p-3">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <MousePointerClick className="w-3.5 h-3.5 text-primary" /> Button 1 (Primary)
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Text</Label>
                    <Input value={btn1Text} onChange={e => setBtn1Text(e.target.value)} placeholder="Explore Stories" className="h-8 text-xs" data-testid="input-btn1-text" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">URL</Label>
                    <Input value={btn1Url} onChange={e => setBtn1Url(e.target.value)} placeholder="/motivational-stories" className="h-8 text-xs" data-testid="input-btn1-url" />
                  </div>
                </div>
                <div className="space-y-2 border rounded-lg p-3">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <MousePointerClick className="w-3.5 h-3.5 text-muted-foreground" /> Button 2 (Outline)
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Text</Label>
                    <Input value={btn2Text} onChange={e => setBtn2Text(e.target.value)} placeholder="Browse Categories" className="h-8 text-xs" data-testid="input-btn2-text" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">URL</Label>
                    <Input value={btn2Url} onChange={e => setBtn2Url(e.target.value)} placeholder="/awliya" className="h-8 text-xs" data-testid="input-btn2-url" />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => heroMutation.mutate()}
                disabled={heroMutation.isPending}
                data-testid="button-save-hero"
              >
                {heroMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Hero Section
              </Button>
            </div>
          )}

          {/* ── Page Section Panel ── */}
          {expandedPanel === "page" && (
            <div className="border rounded-xl p-4 space-y-2.5 bg-muted/5 animate-in slide-in-from-top-2">
              <h3 className="font-semibold flex items-center gap-2 text-sm mb-1">
                <Layers className="w-4 h-4 text-primary" /> Page Layout
                <span className="text-xs text-muted-foreground font-normal">(fixed order)</span>
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
                    onChange={(patch) => updateSection(item.id!, patch)}
                    onSave={() => saveSectionConfig(item.id!)}
                    saving={savingSection === item.id}
                  />
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
