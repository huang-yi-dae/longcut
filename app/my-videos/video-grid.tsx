'use client'

import { useState, useEffect, useRef } from 'react';
import { buildVideoSlug, formatDuration } from '@/lib/utils';
import { Calendar, Play, Star, Search, Loader2, Folder, FolderOpen, Plus, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { getFolders, createFolder, type FavoriteFolder } from '@/app/actions/folders';

interface VideoAnalysis {
  id: string;
  youtube_id: string;
  title: string;
  author: string;
  duration: number;
  thumbnail_url: string;
  topics: any;
  created_at: string;
  slug: string | null;
}

interface UserVideo {
  id: string;
  user_id: string;
  video_id: string;
  accessed_at: string;
  is_favorite: boolean;
  folder_id: string | null;
  notes: string | null;
  video: VideoAnalysis;
}

interface VideoGridProps {
  videos: UserVideo[];
  folders: FavoriteFolder[];
}

const buildCanonicalSlug = (video: VideoAnalysis): string | null => {
  const existingSlug = video.slug?.trim();
  const slugId = existingSlug?.slice(-11);

  if (existingSlug && slugId === video.youtube_id) {
    return existingSlug;
  }

  if (!video.youtube_id) {
    return null;
  }

  return buildVideoSlug(video.title, video.youtube_id);
};

export function VideoGrid({ videos, folders: initialFolders }: VideoGridProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [favoriteStatuses, setFavoriteStatuses] = useState<Record<string, boolean>>(
    videos.reduce((acc, video) => ({ ...acc, [video.id]: video.is_favorite }), {})
  );
  const [updatingFavorites, setUpdatingFavorites] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState<FavoriteFolder[]>(initialFolders);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const newFolderRef = useRef<HTMLDivElement>(null);

  // Refresh folders when component mounts (client-side)
  useEffect(() => {
    if (user && initialFolders.length === 0) {
      getFolders().then(setFolders);
    }
  }, [user, initialFolders.length]);

  // Close new folder input on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (newFolderRef.current && !newFolderRef.current.contains(e.target as Node)) {
        setShowNewFolder(false);
        setNewFolderName('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVideos = videos.filter(userVideo => {
    const matchesSearch = userVideo.video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          userVideo.video.author?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by folder
    let matchesFolder = true;
    if (selectedFolderId === null) {
      matchesFolder = true; // Show all
    } else if (selectedFolderId === '__favorites__') {
      matchesFolder = favoriteStatuses[userVideo.id];
    } else if (selectedFolderId === '__unfiled__') {
      matchesFolder = !userVideo.folder_id;
    } else {
      matchesFolder = userVideo.folder_id === selectedFolderId;
    }
    
    return matchesSearch && matchesFolder;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInHours * 60);
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
      }
      const hours = Math.floor(diffInHours);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, userVideoId: string, videoYoutubeId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }

    setUpdatingFavorites(prev => new Set(prev).add(userVideoId));
    const currentStatus = favoriteStatuses[userVideoId];
    const newStatus = !currentStatus;

    try {
      const response = await fetch('/api/toggle-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoYoutubeId,
          isFavorite: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }

      const data = await response.json();
      setFavoriteStatuses(prev => ({ ...prev, [userVideoId]: data.isFavorite }));

      toast.success(
        data.isFavorite
          ? 'Added to favorites'
          : 'Removed from favorites'
      );
    } catch {
      toast.error('Failed to update favorite status');
    } finally {
      setUpdatingFavorites(prev => {
        const next = new Set(prev);
        next.delete(userVideoId);
        return next;
      });
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const { folder } = await createFolder(newFolderName.trim());
      setFolders(prev => [...prev, folder]);
      setNewFolderName('');
      setShowNewFolder(false);
      setSelectedFolderId(folder.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create folder';
      toast.error(msg);
    }
  };

  // Count videos per folder
  const folderCounts = folders.reduce((acc, f) => {
    acc[f.id] = videos.filter(v => v.folder_id === f.id).length;
    return acc;
  }, {} as Record<string, number>);
  const unfiledCount = videos.filter(v => !v.folder_id).length;
  const favoritesCount = videos.filter(v => favoriteStatuses[v.id]).length;

  return (
    <>
      {/* Folder tabs */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        <Button
          variant={selectedFolderId === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFolderId(null)}
          className="text-xs whitespace-nowrap"
        >
          <FolderOpen className="h-3 w-3 mr-1" />
          All ({videos.length})
        </Button>
        <Button
          variant={selectedFolderId === '__favorites__' ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFolderId('__favorites__')}
          className="text-xs whitespace-nowrap"
        >
          <Star className={`h-3 w-3 mr-1 ${selectedFolderId === '__favorites__' ? 'fill-current' : ''}`} />
          Favorites ({favoritesCount})
        </Button>
        {folders.map(folder => (
          <Button
            key={folder.id}
            variant={selectedFolderId === folder.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFolderId(folder.id)}
            className="text-xs whitespace-nowrap"
          >
            <Folder className="h-3 w-3 mr-1" />
            {folder.name} ({folderCounts[folder.id] || 0})
          </Button>
        ))}
        {unfiledCount > 0 && (
          <Button
            variant={selectedFolderId === '__unfiled__' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFolderId('__unfiled__')}
            className="text-xs whitespace-nowrap"
          >
            Unfiled ({unfiledCount})
          </Button>
        )}
        
        {/* New folder button / input */}
        <div ref={newFolderRef} className="flex-shrink-0">
          {showNewFolder ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                className="h-7 w-28 text-xs"
                placeholder="Folder name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateFolder();
                  if (e.key === 'Escape') {
                    setShowNewFolder(false);
                    setNewFolderName('');
                  }
                }}
              />
              <Button size="sm" className="h-7 text-xs px-2" onClick={handleCreateFolder}>
                <Check className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewFolder(true)}
              className="text-xs text-muted-foreground whitespace-nowrap"
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
        <Input
          type="text"
          placeholder="Search your videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVideos.map((userVideo) => {
          const slug = buildCanonicalSlug(userVideo.video);
          const href = slug
            ? `/v/${slug}`
            : `/analyze/${userVideo.video.youtube_id}?cached=true`;

          const folder = folders.find(f => f.id === userVideo.folder_id);

          return (
            <Link
              key={userVideo.id}
              href={href}
              className="group cursor-pointer"
            >
              <div className="rounded-lg overflow-hidden border bg-card hover:shadow-lg transition-shadow duration-200">
                <div className="relative aspect-video bg-muted">
                  {userVideo.video.thumbnail_url && (
                  <Image
                    src={userVideo.video.thumbnail_url}
                    alt={userVideo.video.title}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-2.5">
                    <Play className="h-7 w-7 text-black fill-black" />
                  </div>
                </div>
                <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white px-1.5 py-0.5 rounded text-[11px]">
                  {formatDuration(userVideo.video.duration)}
                </div>
                {user && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleToggleFavorite(e, userVideo.id, userVideo.video.youtube_id)}
                    disabled={updatingFavorites.has(userVideo.id)}
                    className="absolute top-1.5 right-1.5 h-7 w-7 bg-black/60 hover:bg-black/80 border-0 transition-all"
                    aria-label={favoriteStatuses[userVideo.id] ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {updatingFavorites.has(userVideo.id) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    ) : (
                      <Star
                        className={`h-3.5 w-3.5 transition-all ${
                          favoriteStatuses[userVideo.id]
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-white hover:text-yellow-400'
                        }`}
                      />
                    )}
                  </Button>
                )}
                {/* Folder badge */}
                {folder && (
                  <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Folder className="h-2.5 w-2.5" />
                    {folder.name}
                  </div>
                )}
              </div>

              <div className="p-3.5">
                <h3 className="text-sm font-semibold line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
                  {userVideo.video.title}
                </h3>

                <p className="text-xs text-muted-foreground mb-2.5 line-clamp-1">
                  {userVideo.video.author}
                </p>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    <span>{formatDate(userVideo.accessed_at)}</span>
                  </div>

                  {userVideo.video.topics && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{userVideo.video.topics.length}</span>
                      <span>highlights</span>
                    </div>
                  )}
                </div>

              </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-11">
          <p className="text-xs text-muted-foreground">
            {searchQuery
              ? `No videos found matching "${searchQuery}"`
              : selectedFolderId === '__favorites__'
                ? "You haven't marked any videos as favorites yet"
                : selectedFolderId
                  ? "This folder is empty"
                  : "No videos found"}
          </p>
        </div>
      )}
    </>
  );
}
