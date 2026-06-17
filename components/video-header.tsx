"use client";

import { useState, useEffect, useRef } from "react";
import { VideoInfo } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Clock, User, Folder, Check, Plus, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { toggleFavorite } from "@/app/actions/toggle-favorite";
import { getFolders, createFolder, type FavoriteFolder } from "@/app/actions/folders";

interface VideoHeaderProps {
  videoInfo: VideoInfo;
  videoId: string;
  isFavorite?: boolean;
  folderId?: string | null;
  onFavoriteToggle?: (newStatus: boolean) => void;
}

export function VideoHeader({
  videoInfo,
  videoId,
  isFavorite = false,
  folderId: initialFolderId = null,
  onFavoriteToggle
}: VideoHeaderProps) {
  const { user } = useAuth();
  const [favoriteStatus, setFavoriteStatus] = useState(isFavorite);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowFolderPicker(false);
        setShowNewFolderInput(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load folders when user is logged in
  useEffect(() => {
    if (user) {
      getFolders().then(setFolders);
    }
  }, [user]);

  const handleToggleFavorite = async (folderId?: string) => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }

    const newStatus = !favoriteStatus;
    setFavoriteStatus(newStatus);
    if (newStatus) setCurrentFolderId(folderId || null);
    else setCurrentFolderId(null);
    onFavoriteToggle?.(newStatus);

    try {
      const response = await toggleFavorite(videoId, newStatus, folderId || null);
      if (!response.success) throw new Error("Failed to update favorite status");

      toast.success(
        response.isFavorite
          ? "Added to favorites"
          : "Removed from favorites"
      );
    } catch {
      setFavoriteStatus(!newStatus);
      setCurrentFolderId(newStatus ? null : (folderId || null));
      onFavoriteToggle?.(!newStatus);
      toast.error("Failed to update favorite status");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const { folder } = await createFolder(newFolderName.trim());
      setFolders(prev => [...prev, folder]);
      setNewFolderName("");
      setShowNewFolderInput(false);
      // Favorite to the new folder
      handleToggleFavorite(folder.id);
      setShowFolderPicker(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create folder';
      toast.error(msg);
    }
  };

  const currentFolder = folders.find(f => f.id === currentFolderId);

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
            {favoriteStatus && currentFolder && (
              <div className="flex items-center gap-1 text-primary">
                <Folder className="w-3 h-3" />
                <span>{currentFolder.name}</span>
              </div>
            )}
          </div>
        </div>

        {user && (
          <div className="relative flex-shrink-0 flex items-center gap-0" ref={pickerRef}>
            <Button
              variant={favoriteStatus ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggleFavorite(favoriteStatus ? undefined : currentFolderId || undefined)}
              className="rounded-r-none"
            >
              <Star className={`h-3.5 w-3.5 ${favoriteStatus ? 'fill-current' : ''}`} />
              <span className="ml-1.5">
                {favoriteStatus ? 'Favorited' : 'Favorite'}
              </span>
            </Button>
            <Button
              variant={favoriteStatus ? "default" : "outline"}
              size="sm"
              className="rounded-l-none border-l-0 px-1.5"
              onClick={() => setShowFolderPicker(!showFolderPicker)}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>

            {/* Folder picker dropdown */}
            {showFolderPicker && (
              <div className="absolute top-full right-0 mt-1 w-52 bg-popover border rounded-md shadow-lg z-50 py-1">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Choose folder</div>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent text-left"
                    onClick={() => {
                      handleToggleFavorite(folder.id);
                      setShowFolderPicker(false);
                    }}
                  >
                    {folder.id === currentFolderId && favoriteStatus ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate">{folder.name}</span>
                  </button>
                ))}
                <div className="border-t mt-1 pt-1">
                  {showNewFolderInput ? (
                    <div className="px-2 py-1 flex gap-1">
                      <input
                        autoFocus
                        className="flex-1 text-sm border rounded px-1.5 py-0.5 bg-background"
                        placeholder="Folder name"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleCreateFolder();
                          if (e.key === 'Escape') {
                            setShowNewFolderInput(false);
                            setNewFolderName("");
                          }
                        }}
                      />
                      <Button size="sm" className="h-6 text-xs px-2" onClick={handleCreateFolder}>
                        Add
                      </Button>
                    </div>
                  ) : (
                    <button
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent text-left text-muted-foreground"
                      onClick={() => setShowNewFolderInput(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New folder</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}