export interface DeviceHistory {
  id: string;
  deviceName: string;
  ip: string;
  date: string;
  location: string;
  isActive: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl: string;
  followers: number;
  following: number;
  isPremium: boolean;
  achievements: string[];
  deviceHistory: DeviceHistory[];
  createdAt: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  coverUrl: string;
  audioUrl: string;
  lyrics: string;
  description: string;
  tags: string[];
  duration: number; // in seconds
  streams: number;
  downloads: number;
  likes: number;
  uploaderId?: string;
  isLicensed: boolean;
  youtubeId?: string;
  isYouTube: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  creatorId: string;
  creatorName: string;
  isPublic: boolean;
  followers: number;
  isCollaborative: boolean;
  collaborators: string[]; // usernames or userIds
}

export interface Comment {
  id: string;
  trackId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  date: string;
}

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'playlist' | 'upload' | 'security';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface CreatorStats {
  streams: number;
  downloads: number;
  likes: number;
  followers: number;
  revenue: number;
  streamsHistory: { month: string; count: number }[];
  revenueHistory: { month: string; amount: number }[];
  genreDistribution: { name: string; value: number }[];
}

export interface PlaybackState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  repeatMode: 'off' | 'all' | 'one';
  shuffle: boolean;
  crossfade: number; // in seconds
  sleepTimer: number | null; // in minutes remaining
  equalizer: {
    60: number;
    150: number;
    400: number;
    1000: number;
    3000: number;
    8000: number;
    15000: number;
  };
}
