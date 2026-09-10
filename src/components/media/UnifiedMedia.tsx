"use client";

import Image from "next/image";
import MuxPlayer from "@mux/mux-player-react";
import { useState, useEffect } from "react";

interface UnifiedMediaProps {
  media: {
    type: "image" | "video";
    url?: string;
    playbackId?: string;
    status?: string;
    alt?: string;
    posterUrl?: string;
  };
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
  width?: number;
  height?: number;
  autoPlay?: boolean | "muted" | "any";
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
}

export function UnifiedMedia({ 
  media, fill, className, sizes, priority, unoptimized, width, height,
  autoPlay, muted, loop, playsInline = true
}: UnifiedMediaProps) {
  const [runtimeError, setRuntimeError] = useState(false);

  useEffect(() => {
    setRuntimeError(false);
  }, [media.playbackId, media.url]);

  if (media.type === "video") {
    if (!media.playbackId) return null;
    
    const muxThumbnailUrl = `https://image.mux.com/${media.playbackId}/thumbnail.jpg?time=0`;
    const posterUrl = media.posterUrl || muxThumbnailUrl;

    // Handle processing/errored states safely without mounting broken player
    // Also handle runtime playback errors by swapping to image fallback
    if (runtimeError || (media.status && media.status !== "ready")) {
      return (
        <Image
          src={posterUrl}
          alt={media.alt || "Video preparing"}
          fill={fill}
          width={fill ? undefined : (width || 800)}
          height={fill ? undefined : (height || 600)}
          sizes={sizes}
          className={className}
          priority={priority}
          unoptimized={unoptimized}
        />
      );
    }

    return (
      <MuxPlayer
        playbackId={media.playbackId}
        metadata={{ video_title: media.alt || "Video" }}
        streamType="on-demand"
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        poster={posterUrl}
        onError={() => setRuntimeError(true)}
        style={fill ? { 
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%", 
          height: "100%", 
          objectFit: className?.includes("object-contain") ? "contain" : "cover" 
        } : undefined}
        className={className}
      />
    );
  }

  if (media.type === "image" && media.url) {
    if (fill) {
      return (
        <Image
          src={media.url}
          alt={media.alt || "Media"}
          fill={fill}
          sizes={sizes}
          className={className}
          priority={priority}
          unoptimized={unoptimized}
        />
      );
    }
    
    return (
      <Image
        src={media.url}
        alt={media.alt || "Media"}
        width={width || 800}
        height={height || 600}
        sizes={sizes}
        className={className}
        priority={priority}
        unoptimized={unoptimized}
      />
    );
  }

  return null;
}
