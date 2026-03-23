export function VideoPlayer({ url, wrapperClassName = "aspect-video rounded-xl overflow-hidden mb-8" }: { url: string; wrapperClassName?: string }) {
  if (!url) return null;

  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

  if (isYouTube) {
    let videoId = "";
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com")) {
        videoId = u.searchParams.get("v") || "";
      } else if (u.hostname.includes("youtu.be")) {
        videoId = u.pathname.slice(1);
      }
    } catch {
      return null;
    }
    if (!videoId) return null;
    return (
      <div className={wrapperClassName} data-testid="video-embed">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title="Video"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`${wrapperClassName} bg-black`} data-testid="video-embed">
      <video
        src={url}
        controls
        controlsList="nodownload"
        className="w-full h-full"
        preload="metadata"
        data-testid="video-local"
      />
    </div>
  );
}
