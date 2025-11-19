import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Comment, ForumPost, MediaItem, User, UserMediaList } from '../types';

interface CastMember {
  name: string;
  character?: string;
  role?: string;
  image_url?: string;
}

export type MediaInput = Omit<MediaItem, 'id' | 'created_at' | 'rating' | 'rating_count'> & {
  rating?: number;
  rating_count?: number;
  cast?: CastMember[];
};

export interface UserProfileSettings {
  username?: string;
  bio?: string;
  avatar_url?: string;
  banner_color?: string;
  share_slug?: string;
}

interface DataState {
  mediaItems: MediaItem[];
  forumPosts: ForumPost[];
  userLists: Record<string, UserMediaList[]>;
  profiles: Record<string, UserProfileSettings>;
}

interface DataContextValue {
  mediaItems: MediaItem[];
  addMediaItem: (input: MediaInput) => MediaItem;
  updateMediaItem: (mediaId: string, updates: Partial<MediaItem>) => void;
  getUserList: (userId: string) => (UserMediaList & { media: MediaItem })[];
  getUserMediaEntry: (userId: string, mediaId: string) => (UserMediaList & { media: MediaItem }) | undefined;
  addUserMediaEntry: (userId: string, mediaId: string, data?: Partial<UserMediaList>) => void;
  updateUserMediaEntry: (userId: string, mediaId: string, updates: Partial<UserMediaList>) => void;
  removeUserMediaEntry: (userId: string, mediaId: string) => void;
  setUserRatingForMedia: (userId: string, mediaId: string, rating: number) => void;
  getUserRatingForMedia: (userId: string, mediaId: string) => number;
  forumPosts: ForumPost[];
  createForumPost: (user: User, input: { title: string; content: string; category: ForumPost['category']; media_id?: string; tags?: string[] }) => ForumPost;
  togglePostLike: (postId: string, userId: string) => void;
  addPostComment: (postId: string, user: User, content: string) => void;
  addReplyToComment: (postId: string, commentId: string, user: User, content: string) => void;
  toggleCommentLike: (postId: string, commentId: string, userId: string) => void;
  getCommentCount: (postId: string) => number;
  getUserProfileSettings: (userId: string) => UserProfileSettings | undefined;
  updateUserProfileSettings: (userId: string, updates: UserProfileSettings) => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const API_BASE_URL = (() => {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
})();

const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

async function callApi<T = unknown>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const response = await fetch(buildApiUrl(path), {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`API request failed (${response.status}): ${errorText}`);
      return null;
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return null;
  } catch (error) {
    console.warn('API request error', error);
    return null;
  }
}

const fireAndForget = (path: string, options: RequestInit = {}) => {
  void callApi(path, options);
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const flattenComments = (comments: Comment[]): Comment[] => {
  return comments.reduce<Comment[]>((acc, comment) => {
    acc.push(comment);
    if (comment.replies?.length) {
      acc.push(...flattenComments(comment.replies));
    }
    return acc;
  }, []);
};

const DataProvider: React.FC<{ children: React.ReactNode; currentUserId?: string | null }> = ({ children, currentUserId = null }) => {
  const [state, setState] = useState<DataState>({
    mediaItems: [],
    forumPosts: [],
    userLists: currentUserId ? { [currentUserId]: [] } : {},
    profiles: {},
  });

  useEffect(() => {
    let ignore = false;

    const loadBootstrapData = async () => {
      const [media, posts] = await Promise.all([
        callApi<MediaItem[]>('/media', { method: 'GET' }),
        callApi<ForumPost[]>('/forum/posts', { method: 'GET' }),
      ]);

      if (!ignore) {
        setState(prev => ({
          ...prev,
          mediaItems: Array.isArray(media) ? media : prev.mediaItems,
          forumPosts: Array.isArray(posts) ? posts : prev.forumPosts,
        }));
      }
    };

    loadBootstrapData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    let ignore = false;

    const loadUserData = async () => {
      const [entries, profile] = await Promise.all([
        callApi<UserMediaList[]>(`/users/${currentUserId}/list`, { method: 'GET' }),
        callApi<UserProfileSettings | null>(`/users/${currentUserId}/profile`, { method: 'GET' }),
      ]);

      if (!ignore) {
        setState(prev => ({
          ...prev,
          userLists: {
            ...prev.userLists,
            [currentUserId]: Array.isArray(entries) ? entries : prev.userLists[currentUserId] || [],
          },
          profiles: profile
            ? {
                ...prev.profiles,
                [currentUserId]: profile,
              }
            : prev.profiles,
        }));
      }

      if (!profile) {
        callApi<UserProfileSettings>(`/users/${currentUserId}/profile`, {
          method: 'PUT',
          body: JSON.stringify({}),
        }).then(created => {
          if (!ignore && created) {
            setState(prev => ({
              ...prev,
              profiles: {
                ...prev.profiles,
                [currentUserId]: created,
              },
            }));
          }
        });
      }
    };

    loadUserData();

    return () => {
      ignore = true;
    };
  }, [currentUserId]);

  const addMediaItem = (input: MediaInput): MediaItem => {
    const newItem: MediaItem = {
      ...input,
      id: generateId(),
      created_at: new Date().toISOString(),
      rating: typeof input.rating === 'number' ? input.rating : 0,
      rating_count: typeof input.rating_count === 'number' ? input.rating_count : 0,
    };

    setState(prev => ({
      ...prev,
      mediaItems: [newItem, ...prev.mediaItems],
    }));

    fireAndForget('/media', {
      method: 'POST',
      body: JSON.stringify(newItem),
    });

    return newItem;
  };

  const updateMediaItem = (mediaId: string, updates: Partial<MediaItem>) => {
    setState(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.map(item => (item.id === mediaId ? { ...item, ...updates } : item)),
    }));
  };

  const getUserList = (userId: string) => {
    const entries = state.userLists[userId] || [];
    return entries
      .map(entry => {
        const media = state.mediaItems.find(item => item.id === entry.media_id);
        if (!media) return null;
        return { ...entry, media };
      })
      .filter((entry): entry is UserMediaList & { media: MediaItem } => Boolean(entry));
  };

  const getUserMediaEntry = (userId: string, mediaId: string) => {
    return getUserList(userId).find(entry => entry.media_id === mediaId);
  };

  const syncMediaRating = (mediaId: string, userId: string, rating?: number) => {
    if (typeof rating !== 'number') {
      return;
    }

    callApi<{ rating: number; rating_count: number }>(`/media/${mediaId}/ratings`, {
      method: 'POST',
      body: JSON.stringify({ userId, rating }),
    }).then(response => {
      if (response) {
        setState(prev => ({
          ...prev,
          mediaItems: prev.mediaItems.map(item =>
            item.id === mediaId
              ? { ...item, rating: response.rating, rating_count: response.rating_count }
              : item
          ),
        }));
      }
    });
  };

  const addUserMediaEntry = (userId: string, mediaId: string, data?: Partial<UserMediaList>) => {
    setState(prev => {
      const existing = prev.userLists[userId] || [];
      if (existing.some(entry => entry.media_id === mediaId)) {
        return prev;
      }

      const newEntry: UserMediaList = {
        id: generateId(),
        user_id: userId,
        media_id: mediaId,
        status: data?.status ?? 'plan_to_watch',
        rating: data?.rating ?? 0,
        progress: data?.progress ?? 0,
        is_public: data?.is_public ?? true,
        notes: data?.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      fireAndForget(`/users/${userId}/list`, {
        method: 'POST',
        body: JSON.stringify(newEntry),
      });

      return {
        ...prev,
        userLists: {
          ...prev.userLists,
          [userId]: [...existing, newEntry],
        },
      };
    });
  };

  const updateUserMediaEntry = (userId: string, mediaId: string, updates: Partial<UserMediaList>) => {
    setState(prev => {
      const existing = prev.userLists[userId] || [];
      const nextList = existing.map(entry => {
        if (entry.media_id !== mediaId) {
          return entry;
        }
        return {
          ...entry,
          ...updates,
          updated_at: new Date().toISOString(),
        };
      });

      return {
        ...prev,
        userLists: {
          ...prev.userLists,
          [userId]: nextList,
        },
      };
    });

    fireAndForget(`/users/${userId}/list/${mediaId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (typeof updates.rating === 'number') {
      syncMediaRating(mediaId, userId, updates.rating);
    }
  };

  const removeUserMediaEntry = (userId: string, mediaId: string) => {
    setState(prev => {
      const existing = prev.userLists[userId] || [];
      const nextList = existing.filter(entry => entry.media_id !== mediaId);

      return {
        ...prev,
        userLists: {
          ...prev.userLists,
          [userId]: nextList,
        },
      };
    });

    fireAndForget(`/users/${userId}/list/${mediaId}`, {
      method: 'DELETE',
    });
  };

  const setUserRatingForMedia = (userId: string, mediaId: string, rating: number) => {
    updateUserMediaEntry(userId, mediaId, { rating });
  };

  const getUserRatingForMedia = (userId: string, mediaId: string) => {
    return state.userLists[userId]?.find(entry => entry.media_id === mediaId)?.rating || 0;
  };

  const createForumPost = (
    user: User,
    input: { title: string; content: string; category: ForumPost['category']; media_id?: string; tags?: string[] }
  ): ForumPost => {
    const newPost: ForumPost = {
      id: generateId(),
      user_id: user.id,
      title: input.title,
      content: input.content,
      media_id: input.media_id,
      category: input.category,
      tags: input.tags || [],
      liked_by: [],
      comments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user,
    };

    setState(prev => ({
      ...prev,
      forumPosts: [newPost, ...prev.forumPosts],
    }));

    callApi<ForumPost>('/forum/posts', {
      method: 'POST',
      body: JSON.stringify({ ...input, user, id: newPost.id }),
    }).then(response => {
      if (response) {
        setState(prev => ({
          ...prev,
          forumPosts: prev.forumPosts.map(post => (post.id === newPost.id ? response : post)),
        }));
      }
    });

    return newPost;
  };

  const togglePostLike = (postId: string, userId: string) => {
    setState(prev => ({
      ...prev,
      forumPosts: prev.forumPosts.map(post => {
        if (post.id !== postId) {
          return post;
        }
        const hasLiked = post.liked_by.includes(userId);
        const liked_by = hasLiked ? post.liked_by.filter(id => id !== userId) : [...post.liked_by, userId];
        return {
          ...post,
          liked_by,
          updated_at: new Date().toISOString(),
        };
      }),
    }));

    callApi<{ liked_by: string[] }>(`/forum/posts/${postId}/likes`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }).then(response => {
      if (response) {
        setState(prev => ({
          ...prev,
          forumPosts: prev.forumPosts.map(post => (post.id === postId ? { ...post, liked_by: response.liked_by } : post)),
        }));
      }
    });
  };

  const addPostComment = (postId: string, user: User, content: string) => {
    const newComment: Comment = {
      id: generateId(),
      post_id: postId,
      user_id: user.id,
      content,
      likes_count: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
      user,
      replies: [],
    };

    setState(prev => ({
      ...prev,
      forumPosts: prev.forumPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, newComment],
              updated_at: new Date().toISOString(),
            }
          : post
      ),
    }));

    callApi<Comment>(`/forum/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ user, content, id: newComment.id }),
    }).then(response => {
      if (response) {
        setState(prev => ({
          ...prev,
          forumPosts: prev.forumPosts.map(post =>
            post.id === postId
              ? {
                  ...post,
                  comments: post.comments.map(comment => (comment.id === newComment.id ? { ...response, replies: response.replies || [] } : comment)),
                }
              : post
          ),
        }));
      }
    });
  };

  const addReplyToComment = (postId: string, commentId: string, user: User, content: string) => {
    const reply: Comment = {
      id: generateId(),
      post_id: postId,
      user_id: user.id,
      content,
      likes_count: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
      user,
      replies: [],
    };

    const insertReply = (comments: Comment[]): Comment[] =>
      comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          };
        }
        if (comment.replies?.length) {
          return {
            ...comment,
            replies: insertReply(comment.replies),
          };
        }
        return comment;
      });

    setState(prev => ({
      ...prev,
      forumPosts: prev.forumPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: insertReply(post.comments),
              updated_at: new Date().toISOString(),
            }
          : post
      ),
    }));

    callApi<Comment>(`/forum/posts/${postId}/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ user, content, id: reply.id }),
    }).then(response => {
      if (!response) {
        return;
      }
      setState(prev => ({
        ...prev,
        forumPosts: prev.forumPosts.map(post => {
          if (post.id !== postId) {
            return post;
          }

          const replace = (comments: Comment[]): Comment[] =>
            comments.map(comment => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  replies: comment.replies?.map(r => (r.id === reply.id ? response : r)) || comment.replies,
                };
              }
              if (comment.replies?.length) {
                return {
                  ...comment,
                  replies: replace(comment.replies),
                };
              }
              return comment;
            });

          return {
            ...post,
            comments: replace(post.comments),
          };
        }),
      }));
    });
  };

  const toggleCommentLike = (postId: string, commentId: string, userId: string) => {
    const toggle = (comments: Comment[]): Comment[] =>
      comments.map(comment => {
        if (comment.id === commentId) {
          const hasLiked = comment.liked_by?.includes(userId);
          const liked_by = hasLiked
            ? comment.liked_by?.filter(id => id !== userId) || []
            : [...(comment.liked_by || []), userId];
          return {
            ...comment,
            liked_by,
            likes_count: liked_by.length,
          };
        }

        if (comment.replies?.length) {
          return {
            ...comment,
            replies: toggle(comment.replies),
          };
        }

        return comment;
      });

    setState(prev => ({
      ...prev,
      forumPosts: prev.forumPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: toggle(post.comments),
            }
          : post
      ),
    }));

    callApi<{ liked_by: string[]; likes_count: number }>(`/forum/posts/${postId}/comments/${commentId}/likes`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }).then(response => {
      if (!response) {
        return;
      }
      setState(prev => ({
        ...prev,
        forumPosts: prev.forumPosts.map(post => {
          if (post.id !== postId) {
            return post;
          }

          const apply = (comments: Comment[]): Comment[] =>
            comments.map(comment => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  liked_by: response.liked_by,
                  likes_count: response.likes_count,
                };
              }
              if (comment.replies?.length) {
                return {
                  ...comment,
                  replies: apply(comment.replies),
                };
              }
              return comment;
            });

          return {
            ...post,
            comments: apply(post.comments),
          };
        }),
      }));
    });
  };

  const getCommentCount = (postId: string) => {
    const post = state.forumPosts.find(item => item.id === postId);
    if (!post) return 0;
    return flattenComments(post.comments).length;
  };

  const getUserProfileSettings = (userId: string) => state.profiles[userId];

  const updateUserProfileSettings = (userId: string, updates: UserProfileSettings) => {
    setState(prev => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        [userId]: {
          ...prev.profiles[userId],
          ...updates,
        },
      },
    }));

    callApi<UserProfileSettings>(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }).then(response => {
      if (response) {
        setState(prev => ({
          ...prev,
          profiles: {
            ...prev.profiles,
            [userId]: response,
          },
        }));
      }
    });
  };

  const value = useMemo<DataContextValue>(() => ({
    mediaItems: state.mediaItems,
    addMediaItem,
    updateMediaItem,
    getUserList,
    getUserMediaEntry,
    addUserMediaEntry,
    updateUserMediaEntry,
    removeUserMediaEntry,
    setUserRatingForMedia,
    getUserRatingForMedia,
    forumPosts: state.forumPosts,
    createForumPost,
    togglePostLike,
    addPostComment,
    addReplyToComment,
    toggleCommentLike,
    getCommentCount,
    getUserProfileSettings,
    updateUserProfileSettings,
  }), [state]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export { DataProvider };
