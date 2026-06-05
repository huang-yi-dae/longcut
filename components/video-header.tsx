"use client";

import { useState } from "react";
import { VideoInfo } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Clock, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { toggleFavorite } from "@/app/actions/toggle-favorite";

interface VideoHeaderProps {
  videoInfo: VideoInfo;
  videoId: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (newStatus: boolean) => void;
}

export function VideoHeader({
  videoInfo,
  videoId,
  isFavorite = false,
  onFavoriteToggle
}: VideoHeaderProps) {
  const { user } = useAuth();
  const [favoriteStatus, setFavoriteStatus] = useState(isFavorite);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }

    setFavoriteStatus(favoriteStatus => !favoriteStatus);
    onFavoriteToggle?.(!favoriteStatus);
    try {

      const response = await toggleFavorite(videoId, !favoriteStatus);     

      if (!response.success) {
        throw new Error("Failed to update favorite status");
      }

      toast.success(
        response.isFavorite
          ? "Added to favorites"
          : "Removed from favorites"
      );
    } catch {
      setFavoriteStatus(favoriteStatus => !favoriteStatus);
      onFavoriteToggle?.(!favoriteStatus);
      toast.error("Failed to update favorite status");
    } 
  };

  return (
    <Card className="p-3 mb-5">
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold line-clamp-2 mb-1.5">
            {videoInfo.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>{videoInfo.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{videoInfo.duration ? formatDuration(videoInfo.duration) : 'N/A'}</span>
            </div>
          </div>
        </div>

        {user && (
          <Button
            variant={favoriteStatus ? "default" : "outline"}
            size="sm"
            onClick={handleToggleFavorite}
            className="flex-shrink-0"
          >
          <Star className={`h-3.5 w-3.5 ${favoriteStatus ? 'fill-current' : ''}`} />

            <span className="ml-1.5">
              {favoriteStatus ? 'Favorited' : 'Favorite'}
            </span>
          </Button>
        )}
      </div>
    </Card>
  );
}