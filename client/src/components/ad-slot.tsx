import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { useLocation } from "wouter";

export type AdSlotType = "banner" | "display" | "in-article" | "in-feed" | "story-bottom" | "sidebar-small" | "sidebar-small-2" | "sidebar-large";

interface AdSlotProps {
  slot: AdSlotType;
  className?: string;
  label?: string;
  disabled?: boolean;
  contentId?: string;
  contentType?: string;
  contentManualMode?: boolean;
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

interface ManualAdRecord {
  id: string;
  name: string;
  slot: string;
  type: string;
  fileUrl: string | null;
  htmlCode: string | null;
  linkUrl: string | null;
  altText: string | null;
  isActive: boolean;
}

function ManualAdRenderer({ ad, className }: { ad: ManualAdRecord; className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((ad.type === "html") && containerRef.current && ad.htmlCode) {
      injectHtml(containerRef.current, ad.htmlCode);
    }
  }, [ad.type, ad.htmlCode]);

  if (ad.type === "image" || ad.type === "gif") {
    const img = <img src={ad.fileUrl || ""} alt={ad.altText || ""} className="w-full h-auto block" />;
    return (
      <div className={className} data-ad-slot={ad.slot}>
        {ad.linkUrl ? <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer">{img}</a> : img}
      </div>
    );
  }
  if (ad.type === "video") {
    const videoEl = (
      <video
        src={ad.fileUrl || ""}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        onPause={(e) => { try { e.currentTarget.play(); } catch {} }}
        onContextMenu={(e) => e.preventDefault()}
        style={{ pointerEvents: "none", display: "block" }}
        className="w-full h-auto"
      />
    );
    return (
      <div className={className} data-ad-slot={ad.slot}>
        {ad.linkUrl ? (
          <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
            {videoEl}
          </a>
        ) : videoEl}
      </div>
    );
  }
  return <div ref={containerRef} className={className} data-ad-slot={ad.slot} />;
}

export function AdSlot({ slot, className = "", label, disabled, contentId, contentType, contentManualMode }: AdSlotProps) {
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

  const slotMode = settings ? (settings[`adSlotMode_${slot}`] || "auto") : "auto";
  const isGlobalManualMode = slotMode === "manual";

  const { data: globalManualAd } = useQuery<ManualAdRecord | null>({
    queryKey: ["/api/manual-ads/slot", slot],
    queryFn: () => fetch(`/api/manual-ads/slot/${slot}`).then(r => r.json()),
    enabled: isGlobalManualMode,
    staleTime: 30_000,
  });

  // Always fetch content-specific manual ad when content info is available.
  // This ensures the ad displays even if the parent's adSlotsMap is stale.
  const { data: contentManualAd, isLoading: contentAdLoading } = useQuery<ManualAdRecord | null>({
    queryKey: ["/api/manual-ads/content", contentType, contentId, slot],
    queryFn: () => fetch(`/api/manual-ads/content/${contentType}/${contentId}/slot/${slot}`).then(r => r.json()),
    enabled: !!(contentId && contentType),
    staleTime: 30_000,
  });

  // Priority: active content ad > content manual mode suppression > global manual > auto
  const hasActiveContentAd = !!(contentManualAd && contentManualAd.isActive);
  const isManualMode = hasActiveContentAd || contentManualMode || isGlobalManualMode;
  // If a content-specific ad exists and is active, it wins.
  // If slot is in manual mode (even with no ad yet), fall through to null.
  // Global manual ad only fires when there's no content override.
  const manualAd = hasActiveContentAd ? contentManualAd : (isGlobalManualMode ? globalManualAd : null);

  // While the content manual ad check is still in-flight, hold rendering to prevent
  // a flash where the auto ad briefly appears before the manual ad is confirmed.
  const contentAdPending = !!(contentId && contentType && contentAdLoading);

  const platform = settings?.adPlatform || "";

  const slotMap: Record<string, Record<AdSlotType, string>> = {
    adsense: {
      banner: settings?.adSenseBannerCode || "",
      display: settings?.adSenseDisplayCode || "",
      "in-article": settings?.adSenseInArticleCode || "",
      "in-feed": settings?.adSenseInFeedCode || "",
      "story-bottom": settings?.adSenseInArticleCode || "",
      "sidebar-small": settings?.adSenseSidebarSmallCode || "",
      "sidebar-small-2": settings?.adSenseSidebarSmall2Code || "",
      "sidebar-large": settings?.adSenseSidebarLargeCode || "",
    },
    adsterra: {
      banner: settings?.adsterraBannerCode || "",
      display: settings?.adsterraNativeBannerCode || "",
      "in-article": settings?.adsterraNativeBannerCode || "",
      "in-feed": settings?.adsterraBannerCode || "",
      "story-bottom": settings?.adsterraNativeBannerCode || "",
      "sidebar-small": settings?.adsterraSidebarSmallCode || "",
      "sidebar-small-2": settings?.adsterraSidebarSmall2Code || "",
      "sidebar-large": settings?.adsterraSidebarLargeCode || "",
    },
    custom: {
      banner: settings?.adCustomBannerCode || "",
      display: settings?.adCustomDisplayCode || "",
      "in-article": settings?.adCustomInArticleCode || "",
      "in-feed": settings?.adCustomInFeedCode || "",
      "story-bottom": settings?.adCustomInArticleCode || "",
      "sidebar-small": settings?.adCustomSidebarSmallCode || "",
      "sidebar-small-2": settings?.adCustomSidebarSmall2Code || "",
      "sidebar-large": settings?.adCustomSidebarLargeCode || "",
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
    if (platform === "custom" && settings?.adCustomGlobalCode) {
      injectOnce(settings.adCustomGlobalCode, "custom-global", document.head);
    }
  }, [platform, settings?.adSenseGlobalCode, settings?.adsterraPopunderCode, settings?.adCustomGlobalCode]);

  useEffect(() => {
    if (containerRef.current && code) {
      injectHtml(containerRef.current, code);
    }
  }, [code]);

  if (!globalEnabled || !pageEnabled || !slotEnabled || disabled) return null;

  // Hold rendering while the content manual ad check is still in-flight
  if (contentAdPending) return null;

  if (isManualMode) {
    if (!manualAd) return null;
    return <ManualAdRenderer ad={manualAd} className={className} />;
  }

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
