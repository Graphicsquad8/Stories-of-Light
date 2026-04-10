import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Save, Loader2, Upload, Globe, Home,
  BookOpen, Mail, Info, Eye, EyeOff, AtSign, Megaphone,
  CheckCircle2, X, ChevronDown, Type, Minus, Plus,
  ToggleLeft, LogIn, Shield, KeyRound, Lock,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";

interface SettingField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "url" | "password";
  hint?: string;
}

interface AdField {
  key: string;
  label: string;
  hint: string;
  rows?: number;
}

const ADSENSE_FIELDS: AdField[] = [
  {
    key: "adSenseGlobalCode",
    label: "Global / Auto Ads Script",
    hint: "Paste the full <script> tag from your AdSense Auto Ads setup. Injected once into the <head> on every page.",
    rows: 4,
  },
  {
    key: "adSenseBannerCode",
    label: "Banner / Display Ad",
    hint: "Horizontal banner shown between page sections (home page, top & bottom). Paste the full AdSense ad unit code.",
    rows: 6,
  },
  {
    key: "adSenseInArticleCode",
    label: "In-Article Ad",
    hint: "Shown inside story content. Paste the full AdSense in-article ad unit code.",
    rows: 6,
  },
  {
    key: "adSenseInFeedCode",
    label: "In-Feed Ad",
    hint: "Shown between story listings (mid-content section). Paste the full AdSense in-feed ad unit code.",
    rows: 6,
  },
  {
    key: "adSenseSidebarSmallCode",
    label: "Sidebar Ad Code (300×250)",
    hint: "Top sidebar ad on article pages. Paste the full AdSense display ad unit code sized 300×250.",
    rows: 6,
  },
  {
    key: "adSenseSidebarLargeCode",
    label: "Sidebar Ad Code (300×600)",
    hint: "Bottom sidebar ad on article pages. Paste the full AdSense display ad unit code sized 300×600.",
    rows: 6,
  },
];

const ADSTERRA_FIELDS: AdField[] = [
  {
    key: "adsterraBannerCode",
    label: "Banner Ad",
    hint: "Standard banner ad code from Adsterra. Shown at top/bottom of pages and in listings.",
    rows: 4,
  },
  {
    key: "adsterraNativeBannerCode",
    label: "Native Banner",
    hint: "Native-style ad code (blends with content). Shown inside articles.",
    rows: 4,
  },
  {
    key: "adsterraSidebarSmallCode",
    label: "Sidebar Ad Code (300×250)",
    hint: "Top sidebar ad on article pages. Paste the Adsterra ad code sized 300×250.",
    rows: 4,
  },
  {
    key: "adsterraSidebarLargeCode",
    label: "Sidebar Ad Code (300×600)",
    hint: "Bottom sidebar ad on article pages. Paste the Adsterra ad code sized 300×600.",
    rows: 4,
  },
  {
    key: "adsterraSocialBarCode",
    label: "Social Bar",
    hint: "Sticky social bar injected once into the page body. Paste the full <script> tag from Adsterra.",
    rows: 4,
  },
  {
    key: "adsterraPopunderCode",
    label: "Popunder / Interstitial",
    hint: "Popunder or interstitial code injected once globally. Paste the full <script> tag from Adsterra.",
    rows: 4,
  },
];

function AccordionSection({
  id, title, description, icon: Icon, defaultOpen = false, children,
}: {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} data-testid={`section-${id}`}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between px-5 py-4 rounded-xl border bg-card hover:bg-muted/40 transition-colors text-left group"
          data-testid={`toggle-section-${id}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">{title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-xl px-5 py-5 bg-card -mt-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SettingRow({
  field, value, onChange, onSave, saving,
}: {
  field: SettingField;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>{field.label}</Label>
      {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
      <div className="flex gap-2 items-start">
        {field.type === "textarea" ? (
          <Textarea
            id={field.key}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="flex-1 resize-none"
            rows={3}
            data-testid={`input-setting-${field.key}`}
          />
        ) : field.type === "password" ? (
          <div className="relative flex-1">
            <Input
              id={field.key}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder}
              type={showPwd ? "text" : "password"}
              className="pr-10"
              data-testid={`input-setting-${field.key}`}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowPwd(s => !s)}
            >
              {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
          </div>
        ) : (
          <Input
            id={field.key}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            type={field.type === "url" ? "url" : "text"}
            className="flex-1"
            data-testid={`input-setting-${field.key}`}
          />
        )}
        <Button
          size="icon"
          onClick={onSave}
          disabled={saving}
          title="Save"
          data-testid={`button-save-${field.key}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

function FieldsSection({
  fields, settings, onSave, saving,
}: {
  fields: SettingField[];
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  saving: string | null;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const init: Record<string, string> = {};
    fields.forEach(f => { init[f.key] = settings[f.key] || ""; });
    setValues(init);
  }, [settings, fields]);

  return (
    <div className="space-y-5">
      {fields.map((field, i) => (
        <div key={field.key}>
          {i > 0 && <Separator className="mb-5" />}
          <SettingRow
            field={field}
            value={values[field.key] ?? ""}
            onChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
            onSave={() => onSave(field.key, values[field.key] ?? "")}
            saving={saving === field.key}
          />
        </div>
      ))}
    </div>
  );
}

interface FontSizeControl {
  key: string;
  label: string;
  description: string;
  preview: string;
  previewClass: string;
  min: number;
  max: number;
  defaultValue: number;
  step: number;
}

const FONT_CONTROLS: FontSizeControl[] = [
  {
    key: "fontSizeTitle",
    label: "Page Titles",
    description: "Hero headings, story titles in the reader",
    preview: "The Story of Abu Bakr",
    previewClass: "font-serif font-bold",
    min: 20,
    max: 60,
    defaultValue: 36,
    step: 2,
  },
  {
    key: "fontSizeHeadline",
    label: "Section Headlines",
    description: "Article h2/h3 headings, section titles",
    preview: "Early Life & Legacy",
    previewClass: "font-serif font-semibold",
    min: 14,
    max: 40,
    defaultValue: 20,
    step: 1,
  },
  {
    key: "fontSizeBody",
    label: "Body / Paragraph Text",
    description: "Story content paragraphs and article body",
    preview: "He was known for his gentle wisdom and unwavering faith...",
    previewClass: "",
    min: 12,
    max: 24,
    defaultValue: 16,
    step: 1,
  },
  {
    key: "fontSizeSmall",
    label: "Small / Meta Text",
    description: "Captions, badges, timestamps, descriptions",
    preview: "Published March 2026 · 5 min read",
    previewClass: "text-muted-foreground",
    min: 10,
    max: 18,
    defaultValue: 14,
    step: 1,
  },
];

function TypographySection({
  settings, onSave, saving,
}: {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  saving: string | null;
}) {
  const [sizes, setSizes] = useState<Record<string, number>>({});

  useEffect(() => {
    const init: Record<string, number> = {};
    FONT_CONTROLS.forEach(c => {
      const stored = settings[c.key];
      init[c.key] = stored ? Number(stored) : c.defaultValue;
    });
    setSizes(init);
  }, [settings]);

  const adjust = (key: string, delta: number, min: number, max: number) => {
    setSizes(prev => {
      const next = Math.min(max, Math.max(min, (prev[key] ?? 16) + delta));
      return { ...prev, [key]: next };
    });
  };

  const reset = (control: FontSizeControl) => {
    setSizes(prev => ({ ...prev, [control.key]: control.defaultValue }));
    onSave(control.key, String(control.defaultValue));
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Control font sizes across the website. Changes apply immediately to article content and story reader text.
        Use the − and + buttons to adjust, then click Save to apply.
      </p>
      {FONT_CONTROLS.map((control, i) => {
        const size = sizes[control.key] ?? control.defaultValue;
        const isDefault = size === control.defaultValue;
        return (
          <div key={control.key}>
            {i > 0 && <Separator className="mb-6" />}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-sm">{control.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{control.description}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => adjust(control.key, -control.step, control.min, control.max)}
                    disabled={size <= control.min}
                    data-testid={`button-font-decrease-${control.key}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <div className="w-14 text-center tabular-nums font-mono text-sm font-medium border rounded-md py-1">
                    {size}px
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => adjust(control.key, control.step, control.min, control.max)}
                    disabled={size >= control.max}
                    data-testid={`button-font-increase-${control.key}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-7 w-7 ml-1"
                    onClick={() => onSave(control.key, String(size))}
                    disabled={saving === control.key}
                    title="Save"
                    data-testid={`button-font-save-${control.key}`}
                  >
                    {saving === control.key
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Save className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div
                className={`bg-muted/30 rounded-lg px-4 py-3 border line-clamp-1 overflow-hidden ${control.previewClass}`}
                style={{ fontSize: `${size}px` }}
                data-testid={`preview-font-${control.key}`}
              >
                {control.preview}
              </div>
              {!isDefault && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  onClick={() => reset(control)}
                  data-testid={`button-font-reset-${control.key}`}
                >
                  Reset to default ({control.defaultValue}px)
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const AD_PAGES = [
  { key: "adHomePage", label: "Home Page", description: "Hero, featured stories, books, duas sections" },
  { key: "adStoryPage", label: "Story Reader", description: "Article pages where stories are read" },
  { key: "adMotivationalPage", label: "Motivational Stories", description: "Islamic motivational stories section" },
  { key: "adBooksPage", label: "Books Page", description: "Islamic books listing and reader pages" },
  { key: "adDuasPage", label: "Duas Page", description: "Dua listing and detail pages" },
  { key: "adCategoryPage", label: "Category Pages", description: "Story category listing pages" },
];

function AdControlsSection({
  settings, onSave, saving,
}: {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  saving: string | null;
}) {
  const globalEnabled = settings.adEnabled !== "false";

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Control where ads appear across the site. The master switch overrides all page settings — turn it off to disable all ads globally.
      </p>

      <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center">
            <ToggleLeft className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm">Master Ad Switch</div>
            <div className="text-xs text-muted-foreground">Enable or disable all ads across the entire website</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${globalEnabled ? "text-emerald-600" : "text-muted-foreground"}`}>
            {globalEnabled ? "Ads ON" : "Ads OFF"}
          </span>
          <Switch
            checked={globalEnabled}
            onCheckedChange={(checked) => onSave("adEnabled", checked ? "true" : "false")}
            disabled={saving === "adEnabled"}
            data-testid="switch-global-ads"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground">Page-level controls</div>
        {AD_PAGES.map((page) => {
          const pageEnabled = settings[page.key] !== "false";
          return (
            <div
              key={page.key}
              className={`flex items-center justify-between p-3 rounded-lg border transition-opacity ${!globalEnabled ? "opacity-50" : ""}`}
            >
              <div>
                <div className="text-sm font-medium">{page.label}</div>
                <div className="text-xs text-muted-foreground">{page.description}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className={`text-xs ${pageEnabled ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {pageEnabled ? "On" : "Off"}
                </span>
                <Switch
                  checked={pageEnabled}
                  onCheckedChange={(checked) => onSave(page.key, checked ? "true" : "false")}
                  disabled={saving === page.key || !globalEnabled}
                  data-testid={`switch-page-${page.key}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoogleOAuthSection({
  settings, onSave, saving,
}: {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  saving: string | null;
}) {
  const enabled = settings.googleLoginEnabled !== "false";
  const [clientId, setClientId] = useState(settings.googleClientId || "");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUrl, setRedirectUrl] = useState(settings.googleRedirectUrl || "");
  const [showSecret, setShowSecret] = useState(false);
  const hasSecret = !!(settings.googleClientSecret && settings.googleClientSecret !== "");

  useEffect(() => {
    setClientId(settings.googleClientId || "");
    setRedirectUrl(settings.googleRedirectUrl || "");
  }, [settings]);

  const isConfigured = !!(settings.googleClientId && settings.googleClientSecret);

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Allow users to sign in with their Google account. After entering credentials below, enable the toggle to activate the button on login/signup pages.
      </p>

      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div className="flex items-center gap-3">
          <FcGoogle className="w-6 h-6 shrink-0" />
          <div>
            <div className="font-semibold text-sm">Google Login</div>
            <div className="text-xs text-muted-foreground">
              {isConfigured
                ? enabled ? "Active — button appears on login and signup pages" : "Credentials saved but feature is disabled"
                : "Enter credentials below to activate"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConfigured && enabled ? "default" : "secondary"} className="text-xs">
            {isConfigured && enabled ? "Active" : "Inactive"}
          </Badge>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => onSave("googleLoginEnabled", checked ? "true" : "false")}
            disabled={saving === "googleLoginEnabled" || !isConfigured}
            data-testid="switch-google-login"
          />
        </div>
      </div>

      <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">OAuth Credentials</span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="google-client-id">Google Client ID</Label>
          <div className="flex gap-2">
            <Input
              id="google-client-id"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="1234567890-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
              data-testid="input-google-client-id"
            />
            <Button
              size="icon"
              onClick={() => onSave("googleClientId", clientId)}
              disabled={saving === "googleClientId"}
              title="Save"
              data-testid="button-save-google-client-id"
            >
              {saving === "googleClientId" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="google-client-secret">
            Google Client Secret
            {hasSecret && (
              <Badge variant="outline" className="ml-2 text-xs font-normal">Saved & encrypted</Badge>
            )}
          </Label>
          <p className="text-xs text-muted-foreground">Enter a new value only if you want to update the secret. Leave blank to keep existing.</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="google-client-secret"
                type={showSecret ? "text" : "password"}
                value={clientSecret}
                onChange={e => setClientSecret(e.target.value)}
                placeholder={hasSecret ? "Enter new secret to update..." : "GOCSPX-xxxxxxxxxxxxxxxx"}
                className="pr-10"
                data-testid="input-google-client-secret"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowSecret(s => !s)}
                tabIndex={-1}
              >
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <Button
              size="icon"
              onClick={() => {
                if (clientSecret) onSave("googleClientSecret", clientSecret);
              }}
              disabled={saving === "googleClientSecret" || !clientSecret}
              title="Save"
              data-testid="button-save-google-client-secret"
            >
              {saving === "googleClientSecret" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="google-redirect-url">Authorized Redirect URL</Label>
          <p className="text-xs text-muted-foreground">
            Copy this exact URL and paste it in your Google Cloud Console → OAuth 2.0 → Authorized redirect URIs.
          </p>
          <div className="flex gap-2">
            <Input
              id="google-redirect-url"
              value={redirectUrl}
              onChange={e => setRedirectUrl(e.target.value)}
              placeholder="https://yourdomain.com/auth/google/callback"
              data-testid="input-google-redirect-url"
            />
            <Button
              size="icon"
              onClick={() => onSave("googleRedirectUrl", redirectUrl)}
              disabled={saving === "googleRedirectUrl"}
              title="Save"
              data-testid="button-save-google-redirect-url"
            >
              {saving === "googleRedirectUrl" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="mt-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <div className="font-semibold">Setup steps (Google Cloud Console):</div>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-600 dark:text-blue-400">
            <li>Go to console.cloud.google.com → APIs & Services → Credentials</li>
            <li>Create OAuth 2.0 Client ID (Web application type)</li>
            <li>Add your redirect URL to Authorized redirect URIs</li>
            <li>Copy Client ID and Client Secret into the fields above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function AdvertisementsContent({
  settings, onSave, saving,
}: {
  settings: Record<string, string>;
  onSave: (key: string, value: string) => void;
  saving: string | null;
}) {
  const [platform, setPlatform] = useState<"" | "adsense" | "adsterra">(
    (settings.adPlatform as "" | "adsense" | "adsterra") || ""
  );
  const [codes, setCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    const allFields = [...ADSENSE_FIELDS, ...ADSTERRA_FIELDS];
    const initial: Record<string, string> = {};
    allFields.forEach(f => { initial[f.key] = settings[f.key] || ""; });
    setCodes(initial);
    setPlatform((settings.adPlatform as "" | "adsense" | "adsterra") || "");
  }, [settings]);

  const handlePlatformChange = (newPlatform: "" | "adsense" | "adsterra") => {
    setPlatform(newPlatform);
    onSave("adPlatform", newPlatform);
  };

  const activeFields = platform === "adsense" ? ADSENSE_FIELDS : platform === "adsterra" ? ADSTERRA_FIELDS : [];

  const platformLabels = { "": "Disabled", adsense: "Google AdSense", adsterra: "Adsterra" };

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Choose one advertising platform and paste your ad codes. Only one platform can be active at a time.
      </p>

      <div className="space-y-2">
        <Label>Active Platform</Label>
        <div className="flex flex-wrap gap-2">
          {(["", "adsense", "adsterra"] as const).map(p => (
            <Button
              key={p}
              type="button"
              size="sm"
              variant={platform === p ? "default" : "outline"}
              onClick={() => handlePlatformChange(p)}
              disabled={saving === "adPlatform"}
              data-testid={`button-ad-platform-${p || "disabled"}`}
            >
              {platform === p && <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
              {p === "" && <X className="w-3.5 h-3.5 mr-1.5 opacity-60" />}
              {platformLabels[p]}
            </Button>
          ))}
          {platform && (
            <Badge variant="secondary" className="self-center ml-auto">
              {platformLabels[platform]} active
            </Badge>
          )}
        </div>
      </div>

      {platform && (
        <div className="space-y-5 border-t pt-5">
          {activeFields.map((field, i) => (
            <div key={field.key}>
              {i > 0 && <Separator className="mb-5" />}
              <div className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <p className="text-xs text-muted-foreground">{field.hint}</p>
                <div className="flex gap-2 items-start">
                  <Textarea
                    id={field.key}
                    value={codes[field.key] ?? ""}
                    onChange={e => setCodes(c => ({ ...c, [field.key]: e.target.value }))}
                    placeholder={`Paste your ${platform === "adsense" ? "AdSense" : "Adsterra"} code here...`}
                    rows={field.rows ?? 4}
                    className="flex-1 resize-none font-mono text-xs"
                    data-testid={`textarea-ad-${field.key}`}
                  />
                  <Button
                    size="icon"
                    className="shrink-0 mt-0.5"
                    onClick={() => onSave(field.key, codes[field.key] ?? "")}
                    disabled={saving === field.key}
                    title="Save"
                    data-testid={`button-save-ad-${field.key}`}
                  >
                    {saving === field.key
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Save className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!platform && (
        <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg">
          Select a platform above to configure your ad codes.
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { isSuperOwner } = useAuth();
  const [saving, setSaving] = useState<string | null>(null);
  const [booksHeroImage, setBooksHeroImage] = useState("");

  const [credCurrentEmail, setCredCurrentEmail] = useState("");
  const [credCurrentPassword, setCredCurrentPassword] = useState("");
  const [credNewEmail, setCredNewEmail] = useState("");
  const [credNewPassword, setCredNewPassword] = useState("");
  const [showCredCurrentPwd, setShowCredCurrentPwd] = useState(false);
  const [showCredNewPwd, setShowCredNewPwd] = useState(false);
  const [credVerified, setCredVerified] = useState(false);

  const verifyCredentialsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/owner/credentials", {
        currentEmail: credCurrentEmail,
        currentPassword: credCurrentPassword,
        newEmail: credNewEmail || undefined,
        newPassword: credNewPassword || undefined,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Credentials updated", description: data.message || "Your credentials have been changed successfully." });
      setCredCurrentEmail("");
      setCredCurrentPassword("");
      setCredNewEmail("");
      setCredNewPassword("");
      setCredVerified(false);
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    if (settings) {
      setBooksHeroImage(settings.booksHeroImage || "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      setSaving(key);
      const res = await apiRequest("PATCH", "/api/admin/settings", { key, value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/public"] });
      toast({ title: "Setting saved" });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
    onSettled: () => setSaving(null),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("cover", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      setBooksHeroImage(data.url);
      saveMutation.mutate({ key: "booksHeroImage", value: data.url });
    },
    onError: () => {
      toast({ title: "Upload failed", variant: "destructive" });
    },
  });

  const handleSave = (key: string, value: string) => {
    saveMutation.mutate({ key, value });
    if (key === "booksHeroImage") setBooksHeroImage(value);
  };

  if (isLoading || !settings) {
    return (
      <AdminLayout>
        <div className="space-y-3 max-w-3xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-3 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-settings-title">Site Settings</h1>
          <p className="text-sm text-muted-foreground">Configure and manage all aspects of your website</p>
        </div>

        {isSuperOwner && <AccordionSection
          id="account-security"
          title="Account Security"
          description="Change your login email and password (Super Owner only)"
          icon={KeyRound}
        >
          <div className="space-y-5">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>For security, you must verify your current credentials before making any changes.</span>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Step 1 — Verify Current Credentials</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cred-current-email">Current Email</Label>
                  <Input
                    id="cred-current-email"
                    type="email"
                    value={credCurrentEmail}
                    onChange={e => setCredCurrentEmail(e.target.value)}
                    placeholder="your@email.com"
                    data-testid="input-cred-current-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="cred-current-password"
                      type={showCredCurrentPwd ? "text" : "password"}
                      value={credCurrentPassword}
                      onChange={e => setCredCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10"
                      data-testid="input-cred-current-password"
                    />
                    <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCredCurrentPwd(s => !s)}>
                      {showCredCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Step 2 — Set New Credentials</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cred-new-email">New Email <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                  <Input
                    id="cred-new-email"
                    type="email"
                    value={credNewEmail}
                    onChange={e => setCredNewEmail(e.target.value)}
                    placeholder="new@email.com"
                    data-testid="input-cred-new-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cred-new-password">New Password <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                  <div className="relative">
                    <Input
                      id="cred-new-password"
                      type={showCredNewPwd ? "text" : "password"}
                      value={credNewPassword}
                      onChange={e => setCredNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="pr-10"
                      data-testid="input-cred-new-password"
                    />
                    <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCredNewPwd(s => !s)}>
                      {showCredNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => verifyCredentialsMutation.mutate()}
                disabled={verifyCredentialsMutation.isPending || !credCurrentEmail || !credCurrentPassword || (!credNewEmail && !credNewPassword)}
                data-testid="button-update-credentials"
              >
                {verifyCredentialsMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>
                ) : (
                  <><Shield className="w-4 h-4 mr-2" />Update Credentials</>
                )}
              </Button>
            </div>
          </div>
        </AccordionSection>}

        <AccordionSection
          id="general"
          title="General"
          description="Site name, tagline, and contact info"
          icon={Globe}
          defaultOpen
        >
          <FieldsSection
            settings={settings}
            saving={saving}
            onSave={handleSave}
            fields={[
              { key: "siteName", label: "Site Name", placeholder: "Stories of Light", hint: "The name displayed in the browser tab and site header." },
              { key: "tagline", label: "Site Tagline", placeholder: "Inspiring Islamic Stories for Western Audiences", hint: "A short description of what the site is about." },
              { key: "contactEmail", label: "Contact Email", placeholder: "contact@storiesoflight.com", type: "url", hint: "Displayed in the site footer for visitors to reach you." },
            ]}
          />
        </AccordionSection>

        <AccordionSection
          id="homepage"
          title="Homepage"
          description="Hero banner title and subtitle text"
          icon={Home}
        >
          <FieldsSection
            settings={settings}
            saving={saving}
            onSave={handleSave}
            fields={[
              { key: "homeHeroTitle", label: "Hero Banner Title", placeholder: "Islamic Stories, Biographies & Books", type: "textarea", hint: "HTML is supported. Use <br /> for line breaks. Example: First line<br />Second line" },
              { key: "homeHeroSubtitle", label: "Hero Banner Subtitle", placeholder: "Discover inspiring Islamic stories...", type: "textarea", hint: "HTML is supported. Use <br /> for line breaks and <strong> for bold text." },
            ]}
          />
        </AccordionSection>

        <AccordionSection
          id="typography"
          title="Typography & Font Sizes"
          description="Control text size for titles, headlines, body, and small text"
          icon={Type}
        >
          <TypographySection settings={settings} onSave={handleSave} saving={saving} />
        </AccordionSection>

        <AccordionSection
          id="books"
          title="Books Page"
          description="Hero banner image for the books section"
          icon={BookOpen}
        >
          <div className="space-y-2">
            <Label>Hero Banner Image</Label>
            <p className="text-xs text-muted-foreground">
              Upload or paste a URL for the background image at the top of the Books page.
            </p>
            <div className="flex gap-2 mt-3">
              <Input
                value={booksHeroImage}
                onChange={e => setBooksHeroImage(e.target.value)}
                placeholder="https://example.com/hero-image.jpg"
                data-testid="input-hero-url"
              />
              <Button
                onClick={() => handleSave("booksHeroImage", booksHeroImage)}
                disabled={saving === "booksHeroImage"}
                data-testid="button-save-hero-url"
              >
                {saving === "booksHeroImage" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </div>
            <div className="relative mt-3">
              <div className="text-center text-xs text-muted-foreground mb-2">— or upload an image —</div>
              <label
                htmlFor="hero-upload"
                className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
                data-testid="label-hero-upload"
              >
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploadMutation.isPending ? "Uploading..." : "Click to upload hero image"}
                </span>
                <input
                  id="hero-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) uploadMutation.mutate(file);
                  }}
                  data-testid="input-hero-upload"
                />
              </label>
            </div>
            {booksHeroImage && (
              <div className="mt-4">
                <Label className="mb-2 block">Preview</Label>
                <div className="relative rounded-lg overflow-hidden aspect-[21/9]" data-testid="preview-hero-image">
                  <img src={booksHeroImage} alt="Hero preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="font-serif text-2xl font-bold text-white">Discover Islamic Books</h3>
                      <p className="text-white/80 mt-2">Preview of how the hero will look</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AccordionSection>

        <AccordionSection
          id="footer"
          title="About & Footer"
          description="Footer description and contact email"
          icon={Info}
        >
          <FieldsSection
            settings={settings}
            saving={saving}
            onSave={handleSave}
            fields={[
              { key: "footerText", label: "Footer Description", placeholder: "A platform dedicated to sharing the light of Islamic wisdom...", type: "textarea", hint: "Short text shown in the site footer." },
              { key: "footerEmail", label: "Footer Contact Email", placeholder: "contact@storiesoflight.com", hint: "Email address shown in the footer contact section." },
            ]}
          />
        </AccordionSection>

        <AccordionSection
          id="email"
          title="Email Configuration"
          description="Forgot password OTP email sender settings"
          icon={AtSign}
        >
          <FieldsSection
            settings={settings}
            saving={saving}
            onSave={handleSave}
            fields={[
              { key: "emailSenderAddress", label: "Sender Email Address", placeholder: "yourapp@gmail.com", hint: "The Gmail address that sends OTP verification codes for password resets. Must be a Gmail account with App Passwords enabled." },
              { key: "emailSenderPassword", label: "App Password / Access Token", placeholder: "xxxx xxxx xxxx xxxx", type: "password", hint: "Use a Gmail App Password (not your main password). Go to Google Account → Security → 2-Step Verification → App Passwords to generate one." },
            ]}
          />
        </AccordionSection>

        <AccordionSection
          id="ad-controls"
          title="Ad Controls"
          description="Master toggle and per-page ad visibility controls"
          icon={ToggleLeft}
        >
          <AdControlsSection settings={settings} onSave={handleSave} saving={saving} />
        </AccordionSection>

        <AccordionSection
          id="ads"
          title="Advertisements"
          description="Google AdSense or Adsterra ad code configuration"
          icon={Megaphone}
        >
          <AdvertisementsContent settings={settings} onSave={handleSave} saving={saving} />
        </AccordionSection>

        <AccordionSection
          id="google-oauth"
          title="Google Login"
          description="Allow users to sign in with their Google account"
          icon={LogIn}
        >
          <GoogleOAuthSection settings={settings} onSave={handleSave} saving={saving} />
        </AccordionSection>

        <AccordionSection
          id="mail"
          title="SMTP / Transactional Email"
          description="Advanced email server configuration"
          icon={Mail}
        >
          <FieldsSection
            settings={settings}
            saving={saving}
            onSave={handleSave}
            fields={[
              { key: "smtpHost", label: "SMTP Host", placeholder: "smtp.gmail.com", hint: "The hostname of your mail server." },
              { key: "smtpPort", label: "SMTP Port", placeholder: "587", hint: "Common ports: 587 (TLS), 465 (SSL), 25." },
              { key: "smtpUser", label: "SMTP Username", placeholder: "user@example.com", hint: "The login username for your SMTP server." },
              { key: "smtpPass", label: "SMTP Password", placeholder: "••••••••", type: "password", hint: "The password or app token for your SMTP server." },
            ]}
          />
        </AccordionSection>
      </div>
    </AdminLayout>
  );
}
