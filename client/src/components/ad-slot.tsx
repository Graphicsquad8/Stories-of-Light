import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { useLocation } from "wouter";

export type AdSlotType = "banner" | "display" | "in-article" | "in-feed" | "sidebar-small" | "sidebar-small-2" | "sidebar-large";

interface AdSlotProps {
  slot: AdSlotType;
  className?: string;
  label?: string;
  disabled?: boolean;
}

function injectHtml(container: HTMLElement, html: string) {
  container.innerHTML = "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  Array.from(temp.childNodes).forEach((node) => {
    if (node instanceof HTMLElement && node.tagName === "SCRIPT") {
      const script = document.createElement("script");
      Array.from(node.attributes).forEach((attr) => {
        script.setAttribute(attr.name, attr.value);
      });
      script.text = node.textContent || "";
      container.appendChild(script);
    } else {
      container.appendChild(node.cloneNode(true));
    }
  });
}

function injectOnce(html: string, marker: string, target: HTMLElement = document.body) {
  if (!html || document.querySelector(`[data-ad-inject="${marker}"]`)) return;
  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-ad-inject", marker);
  injectHtml(wrapper, html);
  target.appendChild(wrapper);
}

function getPageAdKey(path: string): string {
  if (path === "/") return "adHomePage";
  if (path.startsWith("/stories/")) return "adStoryPage";
  if (path.startsWith("/motivational-stories")) return "adMotivationalPage";
  if (path.startsWith("/books")) return "adBooksPage";
  if (path.startsWith("/duas")) return "adDuasPage";
  if (path.startsWith("/category/") || path.match(/^\/[^/]+$/) && path !== "/") return "adCategoryPage";
  return "";
}

function getPageShortKey(path: string): string {
  if (path === "/") return "home";
  if (path.startsWith("/stories/")) return "story";
  if (path.startsWith("/motivational-stories")) return "motivational";
  if (path.startsWith("/books")) return "books";
  if (path.startsWith("/duas")) return "duas";
  if (path.startsWith("/category/")) return "category";
  return "category";
}

export function AdSlot({ slot, className = "", label, disabled }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  const globalEnabled = settings?.adEnabled !== "false";
  const pageKey = getPageAdKey(location);
  const pageEnabled = !pageKey || settings?.[pageKey] !== "false";
  const pageShortKey = getPageShortKey(location);
  const slotSettingKey = `adPageSlot_${pageShortKey}_${slot}`;
  const slotEnabled = settings ? settings[slotSettingKey] !== "false" : true;

  const platform = settings?.adPlatform || "";

  const slotMap: Record<string, Record<AdSlotType, string>> = {
    adsense: {
      banner: settings?.adSenseBannerCode || "",
      display: settings?.adSenseDisplayCode || "",
      "in-article": settings?.adSenseInArticleCode || "",
      "in-feed": settings?.adSenseInFeedCode || "",
      "sidebar-small": settings?.adSenseSidebarSmallCode || "",
      "sidebar-small-2": settings?.adSenseSidebarSmall2Code || "",
      "sidebar-large": settings?.adSenseSidebarLargeCode || "",
    },
    adsterra: {
      banner: settings?.adsterraBannerCode || "",
      display: settings?.adsterraNativeBannerCode || "",
      "in-article": settings?.adsterraNativeBannerCode || "",
      "in-feed": settings?.adsterraBannerCode || "",
      "sidebar-small": settings?.adsterraSidebarSmallCode || "",
      "sidebar-small-2": settings?.adsterraSidebarSmall2Code || "",
      "sidebar-large": settings?.adsterraSidebarLargeCode || "",
    },
  };

  const code = platform ? (slotMap[platform]?.[slot] ?? "") : "";

  useEffect(() => {
    if (platform === "adsense" && settings?.adSenseGlobalCode) {
      injectOnce(settings.adSenseGlobalCode, "adsense-global", document.head);
    }
    if (platform === "adsterra" && settings?.adsterraPopunderCode) {
      injectOnce(settings.adsterraPopunderCode, "adsterra-popunder");
    }
  }, [platform, settings?.adSenseGlobalCode, settings?.adsterraPopunderCode]);

  useEffect(() => {
    if (containerRef.current && code) {
      injectHtml(containerRef.current, code);
    }
  }, [code]);

  if (!globalEnabled || !pageEnabled || !slotEnabled || disabled) return null;

  if (!platform || !code) {
    if (label !== undefined) {
      return (
        <div
          className={`bg-muted/50 rounded-md border border-dashed flex items-center justify-center py-6 text-xs text-muted-foreground ${className}`}
          data-ad-slot={slot}
          data-testid={`ad-placeholder-${label.replace(/\s+/g, "-").toLowerCase()}`}
        >
          {label}
        </div>
      );
    }
    return null;
  }

  return <div ref={containerRef} className={className} data-ad-slot={slot} />;
}

export function SocialBarAd() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  useEffect(() => {
    const platform = settings?.adPlatform;
    if (platform === "adsterra" && settings?.adsterraSocialBarCode) {
      injectOnce(settings.adsterraSocialBarCode, "adsterra-social-bar");
    }
  }, [settings?.adPlatform, settings?.adsterraSocialBarCode]);

  return null;
}
