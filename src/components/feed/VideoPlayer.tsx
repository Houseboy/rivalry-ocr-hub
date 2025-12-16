import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export const VideoPlayer = ({ src, className }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
            // Video is fully visible - load if not loaded yet
            if (video.readyState === 0) {
              video.load();
            }
            if (!isManuallyPaused && isLoaded) {
              video.play().catch(() => {
                // Auto-play failed, keep muted
                video.muted = true;
                video.play();
              });
              video.muted = false;
            }
          } else {
            // Video is not fully visible
            video.pause();
            video.muted = true;
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
        rootMargin: "200px", // Preload when 200px away
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [isManuallyPaused, isLoaded]);

  const handleTap = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      setIsManuallyPaused(false);
      video.play();
      video.muted = false;
    } else {
      setIsManuallyPaused(true);
      video.pause();
    }
  };

  const handleTouchStart = () => {
    setIsPressing(true);
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
    }
  };

  const handleTouchEnd = () => {
    setIsPressing(false);
    const video = videoRef.current;
    if (video && !isManuallyPaused) {
      video.play();
    }
  };

  return (
    <div ref={containerRef} className="relative bg-black/5">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        className={className}
        controlsList="nodownload"
        playsInline
        preload="metadata"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={() => {
          if (isPressing) {
            handleTouchEnd();
          }
        }}
        onLoadedData={() => setIsLoaded(true)}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
