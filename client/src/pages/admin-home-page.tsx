import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home, Save, Loader2, ChevronUp, ChevronDown,
  Eye, EyeOff, Hash, Layout, Megaphone, Type,
  MousePointerClick, AlignLeft, ListOrdered,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const SECTION_DEFAULTS = [
  { id: "categories", title: "Explore by Category", description: "Category tiles shown on the home page", count: 6, countLabel: "Max categories shown" },
  { id: "featured", title: "Featured Stories", description: "Handpicked featured stories section", count: 6, countLabel: "Number of stories" },
  { id: "books", title: "Free Islamic Books", description: "Featured free books grid", count: 6, countLabel: "Number of books" },
  { id: "motivational", title: "Islamic Motivational Stories", description: "Popular motivational stories", count: 4, countLabel: "Number of stories" },
  { id: "duas", title: "Popular Duas", description: "Most-read supplications", count: 4, countLabel: "Number of duas" },
  { id: "latest", title: "Latest Stories", description: "Most recently published stories", count: 6, countLabel: "Number of stories" },
];

interface SectionConfig {
  id: string;
  visible: boolean;
  count: number;
}

function parseSectionsConfig(raw: string | undefined): SectionConfig[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return SECTION_DEFAULTS.map(s => ({ id: s.id, visible: true, count: s.count }));
}

export default function AdminHomePagePage() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [btn1Text, setBtn1Text] = useState("");
  const [btn1Url, setBtn1Url] = useState("");
  const [btn2Text, setBtn2Text] = useState("");
  const [btn2Url, setBtn2Url] = useState("");
  const [sections, setSections] = useState<SectionConfig[]>([]);
  const [heroSaved, setHeroSaved] = useState(false);
  const [sectionsSaved, setSectionsSaved] = useState(false);

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
    onSuccess: () => {
      toast({ title: "Hero section saved" });
      setHeroSaved(true);
      setTimeout(() => setHeroSaved(false), 2000);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sectionsMutation = useMutation({
    mutationFn: async () => {
      await saveSetting("homeSectionsConfig", JSON.stringify(sections));
    },
    onSuccess: () => {
      toast({ title: "Sections layout saved" });
      setSectionsSaved(true);
      setTimeout(() => setSectionsSaved(false), 2000);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const moveSection = (idx: number, dir: -1 | 1) => {
    setSections(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const toggleSection = (idx: number) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, visible: !s.visible } : s));
  };

  const setCount = (idx: number, val: number) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, count: Math.max(1, Math.min(20, val)) } : s));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6 max-w-4xl">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Home className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Home Page Management</h1>
            <p className="text-sm text-muted-foreground">Control the layout, content and ads on the Home Page</p>
          </div>
        </div>

        <Card className="p-6 space-y-5" data-testid="card-hero-editor">
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Hero Section</h2>
          </div>

          <div className="space-y-1.5">
            <Label>Hero Title <span className="text-muted-foreground text-xs">(HTML supported)</span></Label>
            <Textarea
              value={heroTitle}
              onChange={e => setHeroTitle(e.target.value)}
              rows={2}
              placeholder="Islamic Stories, Biographies & Books"
              data-testid="input-hero-title"
            />
            <p className="text-xs text-muted-foreground">Use <code className="bg-muted px-1 rounded">&lt;br /&gt;</code> for line breaks, <code className="bg-muted px-1 rounded">&amp;amp;</code> for &amp;</p>
          </div>

          <div className="space-y-1.5">
            <Label>Hero Subtitle / Description</Label>
            <Textarea
              value={heroSubtitle}
              onChange={e => setHeroSubtitle(e.target.value)}
              rows={3}
              placeholder="Enter a short description for the hero section..."
              data-testid="input-hero-subtitle"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3 border rounded-lg p-4">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <MousePointerClick className="w-4 h-4 text-primary" /> Button 1 (Primary)
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">Button Text</Label>
                <Input
                  value={btn1Text}
                  onChange={e => setBtn1Text(e.target.value)}
                  placeholder="Explore Stories"
                  data-testid="input-btn1-text"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Button URL / Link</Label>
                <Input
                  value={btn1Url}
                  onChange={e => setBtn1Url(e.target.value)}
                  placeholder="/motivational-stories"
                  data-testid="input-btn1-url"
                />
              </div>
            </div>
            <div className="space-y-3 border rounded-lg p-4">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <MousePointerClick className="w-4 h-4 text-muted-foreground" /> Button 2 (Secondary)
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">Button Text</Label>
                <Input
                  value={btn2Text}
                  onChange={e => setBtn2Text(e.target.value)}
                  placeholder="Browse Categories"
                  data-testid="input-btn2-text"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Button URL / Link</Label>
                <Input
                  value={btn2Url}
                  onChange={e => setBtn2Url(e.target.value)}
                  placeholder="/awliya"
                  data-testid="input-btn2-url"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => heroMutation.mutate()}
              disabled={heroMutation.isPending}
              data-testid="button-save-hero"
            >
              {heroMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                : heroSaved
                ? <><Save className="w-4 h-4 mr-2" /> Saved!</>
                : <><Save className="w-4 h-4 mr-2" /> Save Hero Section</>}
            </Button>
          </div>
        </Card>

        <Card className="p-6" data-testid="card-sections-editor">
          <div className="flex items-center gap-2 mb-2">
            <ListOrdered className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Page Sections</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Control which sections appear on the home page, their order, and content count. Drag or use the arrows to reorder.
          </p>

          <div className="space-y-2" data-testid="sections-list">
            {sections.map((sec, idx) => {
              const def = SECTION_DEFAULTS.find(d => d.id === sec.id);
              if (!def) return null;
              return (
                <div
                  key={sec.id}
                  className={`border rounded-lg p-4 transition-all ${sec.visible ? "bg-background" : "bg-muted/40 opacity-70"}`}
                  data-testid={`section-row-${sec.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => moveSection(idx, -1)}
                        disabled={idx === 0}
                        className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                        data-testid={`button-up-${sec.id}`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveSection(idx, 1)}
                        disabled={idx === sections.length - 1}
                        className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                        data-testid={`button-down-${sec.id}`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                        <p className="font-medium text-sm">{def.title}</p>
                        {!sec.visible && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Hidden</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground ml-7 mt-0.5">{def.description}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                          <Hash className="w-3 h-3 inline mr-1" />Count
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={sec.count}
                          onChange={e => setCount(idx, Number(e.target.value))}
                          className="w-16 h-8 text-sm text-center"
                          disabled={!sec.visible}
                          data-testid={`input-count-${sec.id}`}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {sec.visible
                          ? <Eye className="w-4 h-4 text-primary" />
                          : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                        <Switch
                          checked={sec.visible}
                          onCheckedChange={() => toggleSection(idx)}
                          data-testid={`toggle-visible-${sec.id}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => sectionsMutation.mutate()}
              disabled={sectionsMutation.isPending}
              data-testid="button-save-sections"
            >
              {sectionsMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                : sectionsSaved
                ? <><Save className="w-4 h-4 mr-2" /> Saved!</>
                : <><Save className="w-4 h-4 mr-2" /> Save Section Layout</>}
            </Button>
          </div>
        </Card>

        <Card className="p-6" data-testid="card-ads-info">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Home Page Ad Slots</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            The home page has 3 ad slots. Manage them from the global Ad Management system in Settings, or enable/disable them here.
          </p>

          <div className="space-y-3">
            {[
              { slot: "banner (top)", location: "Below the Hero Section, top of page", key: "top" },
              { slot: "in-feed", location: "Between Popular Duas and Latest Stories sections", key: "mid" },
              { slot: "banner (bottom)", location: "Bottom of the page, above footer", key: "bottom" },
            ].map(ad => (
              <div key={ad.key} className="flex items-center gap-4 border rounded-lg p-4">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Layout className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{ad.slot}</p>
                  <p className="text-xs text-muted-foreground">{ad.location}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">Global Slot</Badge>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground flex items-start gap-2">
            <AlignLeft className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Ad slot content is managed globally in <strong className="text-foreground">Settings → Ad Management</strong>. 
              Each slot supports auto (AdSense/third-party) and manual (banner/motion/video) ads with the same controls as Category page ads.
            </span>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
