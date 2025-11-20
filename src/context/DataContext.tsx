import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { api } from '../lib/api';
import type { Comment, ForumPost, MediaItem, User as AppUser, UserMediaList } from '../types';

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
  updated_at?: string;
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
  createForumPost: (
    user: SupabaseUser,
    input: { title: string; content: string; category: ForumPost['category']; media_id?: string; tags?: string[] }
  ) => ForumPost;
  togglePostLike: (postId: string, userId: string) => void;
  addPostComment: (postId: string, user: SupabaseUser, content: string) => void;
  addReplyToComment: (postId: string, commentId: string, user: SupabaseUser, content: string) => void;
  toggleCommentLike: (postId: string, commentId: string, userId: string) => void;
  getCommentCount: (postId: string) => number;
  getUserProfileSettings: (userId: string) => UserProfileSettings | undefined;
  updateUserProfileSettings: (userId: string, updates: UserProfileSettings) => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

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

const collectProfilesFromPosts = (posts: ForumPost[]): Record<string, UserProfileSettings> => {
  const profiles: Record<string, UserProfileSettings> = {};

  const visitComments = (comments?: Comment[]) => {
    comments?.forEach(comment => {
      if (comment.user) {
        profiles[comment.user.id] = {
          username: comment.user.username,
          avatar_url: comment.user.avatar_url,
          bio: comment.user.bio,
          updated_at: comment.user.created_at,
        };
      }
      if (comment.replies?.length) {
        visitComments(comment.replies);
      }
    });
  };

  posts.forEach(post => {
    if (post.user) {
      profiles[post.user.id] = {
        username: post.user.username,
        avatar_url: post.user.avatar_url,
        bio: post.user.bio,
        updated_at: post.user.created_at,
      };
    }
    visitComments(post.comments);
  });

  return profiles;
};

const mergeProfiles = (
  current: Record<string, UserProfileSettings>,
  next: Record<string, UserProfileSettings>
) => ({ ...current, ...next });

const metadataValue = (metadata: Record<string, unknown> | null | undefined, key: string) => {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : undefined;
};

const createSerializableUser = (
  user: SupabaseUser,
  profile?: UserProfileSettings
): AppUser => {
  const metadata = (user.user_metadata as Record<string, unknown> | null) || {};
  const username = profile?.username || metadataValue(metadata, 'username') || user.email?.split('@')[0] || 'Usuario';
  const avatar = profile?.avatar_url ?? metadataValue(metadata, 'avatar_url');

  return {
    id: user.id,
    email: user.email || '',
    username,
    avatar_url: avatar,
    bio: profile?.bio,
    created_at: profile?.updated_at || new Date().toISOString(),
  };
};

const DataProvider: React.FC<{ children: React.ReactNode; currentUserId?: string | null }> = ({
  children,
  currentUserId = null,
}) => {
  const [state, setState] = useState<DataState>({
    mediaItems: [],
    forumPosts: [],
    userLists: {},
    profiles: {},
  });

  useEffect(() => {
    let cancelled = false;

    const loadBootstrapData = async () => {
      try {
        const [mediaItems, forumPosts] = await Promise.all([
          api.get<MediaItem[]>('/media'),
          api.get<ForumPost[]>(
            '/forum/posts'
          ),
        ]);

        if (cancelled) return;

        setState(prev => ({
          ...prev,
          mediaItems,
          forumPosts,
          profiles: mergeProfiles(prev.profiles, collectProfilesFromPosts(forumPosts)),
        }));
      } catch (error) {
        console.error('No se pudo cargar la data inicial', error);
      }
    };

    void loadBootstrapData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    let cancelled = false;

    const loadUserData = async () => {
      try {
        const [listEntries, profile] = await Promise.all([
          api.get<UserMediaList[]>(`/users/${currentUserId}/list`),
          api.get<UserProfileSettings | null>(`/users/${currentUserId}/profile`),
        ]);

        let resolvedProfile = profile;

        if (!resolvedProfile) {
          try {
            resolvedProfile = await api.put<UserProfileSettings>(`/users/${currentUserId}/profile`, {});
          } catch (profileError) {
            console.error('No se pudo crear el perfil del usuario', profileError);
          }
        }

        if (cancelled) return;

        setState(prev => ({
          ...prev,
          userLists: { ...prev.userLists, [currentUserId]: listEntries },
          profiles: resolvedProfile ? { ...prev.profiles, [currentUserId]: resolvedProfile } : prev.profiles,
        }));
      } catch (error) {
        console.error('No se pudo cargar la información del usuario', error);
      }
    };

    void loadUserData();

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

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

  const addMediaItem = (input: MediaInput): MediaItem => {
    const id = generateId();
    const optimistic: MediaItem = {
      ...input,
      id,
      created_at: new Date().toISOString(),
      rating: typeof input.rating === 'number' ? input.rating : 0,
      rating_count: typeof input.rating_count === 'number' ? input.rating_count : 0,
    };

    setState(prev => ({
      ...prev,
      mediaItems: [optimistic, ...prev.mediaItems],
    }));

    const payload = {
      ...input,
      id,
      genre: input.genre ?? [],
      cast: input.cast ?? [],
    };

    void api
      .post<MediaItem>('/media', payload)
      .then(saved => {
        setState(prev => ({
          ...prev,
          mediaItems: [saved, ...prev.mediaItems.filter(item => item.id !== saved.id)],
        }));
      })
      .catch(error => {
        console.error('No se pudo guardar el contenido', error);
        setState(prev => ({
          ...prev,
          mediaItems: prev.mediaItems.filter(item => item.id !== id),
        }));
      });

    return optimistic;
  };

  const updateMediaItem = (mediaId: string, updates: Partial<MediaItem>) => {
    setState(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.map(item => (item.id === mediaId ? { ...item, ...updates } : item)),
    }));

    // No hay endpoint de actualización aún. Se deja registro para futuras mejoras.
    console.warn('updateMediaItem aún no sincroniza con la API.');
  };

  const addUserMediaEntry = (userId: string, mediaId: string, data?: Partial<UserMediaList>) => {
    const optimistic: UserMediaList = {
      id: generateId(),
      user_id: userId,
      media_id: mediaId,
      status: data?.status ?? 'plan_to_watch',
      rating: data?.rating ?? undefined,
      progress: data?.progress ?? 0,
      is_public: data?.is_public ?? true,
      notes: data?.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      userLists: {
        ...prev.userLists,
        [userId]: [...(prev.userLists[userId] || []), optimistic],
      },
    }));

    void api
      .post<UserMediaList>(`/users/${userId}/list`, {
        id: optimistic.id,
        media_id: mediaId,
        status: optimistic.status,
        rating: data?.rating ?? null,
        progress: optimistic.progress,
        is_public: optimistic.is_public,
        notes: optimistic.notes ?? '',
      })
      .then(saved => {
        setState(prev => ({
          ...prev,
          userLists: {
            ...prev.userLists,
            [userId]: (prev.userLists[userId] || []).map(entry => (entry.id === optimistic.id ? saved : entry)),
          },
        }));
      })
      .catch(error => {
        console.error('No se pudo agregar a la lista', error);
        setState(prev => ({
          ...prev,
          userLists: {
            ...prev.userLists,
            [userId]: (prev.userLists[userId] || []).filter(entry => entry.id !== optimistic.id),
          },
        }));
      });
  };

  const updateUserMediaEntry = (userId: string, mediaId: string, updates: Partial<UserMediaList>) => {
    setState(prev => ({
      ...prev,
      userLists: {
        ...prev.userLists,
        [userId]: (prev.userLists[userId] || []).map(entry =>
          entry.media_id === mediaId
            ? { ...entry, ...updates, updated_at: new Date().toISOString() }
            : entry
        ),
      },
    }));

    void api
      .put<UserMediaList>(`/users/${userId}/list/${mediaId}`, updates)
      .catch(error => {
        console.error('No se pudo actualizar la entrada', error);
      });
  };

  const removeUserMediaEntry = (userId: string, mediaId: string) => {
    const snapshot = state.userLists[userId] || [];
    setState(prev => ({
      ...prev,
      userLists: {
        ...prev.userLists,
        [userId]: snapshot.filter(entry => entry.media_id !== mediaId),
      },
    }));

    void api.delete(`/users/${userId}/list/${mediaId}`).catch(error => {
      console.error('No se pudo eliminar la entrada', error);
      setState(prev => ({
        ...prev,
        userLists: { ...prev.userLists, [userId]: snapshot },
      }));
    });
  };

  const syncRatingStats = (mediaId: string, rating: number, rating_count: number) => {
    setState(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.map(item =>
        item.id === mediaId ? { ...item, rating, rating_count } : item
      ),
    }));
  };

  const setUserRatingForMedia = (userId: string, mediaId: string, rating: number) => {
    updateUserMediaEntry(userId, mediaId, { rating });

    void api
      .post<{ rating: number; rating_count: number }>(`/media/${mediaId}/ratings`, { userId, rating })
      .then(stats => {
        syncRatingStats(mediaId, stats.rating, stats.rating_count);
      })
      .catch(error => {
        console.error('No se pudo registrar la calificación', error);
      });
  };

  const getUserRatingForMedia = (userId: string, mediaId: string) => {
    return state.userLists[userId]?.find(entry => entry.media_id === mediaId)?.rating || 0;
  };

  const refreshForumPosts = (postId: string, updater: (post: ForumPost) => ForumPost) => {
    setState(prev => ({
      ...prev,
      forumPosts: prev.forumPosts.map(post => (post.id === postId ? updater(post) : post)),
    }));
  };

  const createForumPost = (
    user: SupabaseUser,
    input: { title: string; content: string; category: ForumPost['category']; media_id?: string; tags?: string[] }
  ): ForumPost => {
    const author = createSerializableUser(user, state.profiles[user.id]);
    const optimistic: ForumPost = {
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
      user: author,
    };

    setState(prev => ({
      ...prev,
      forumPosts: [optimistic, ...prev.forumPosts],
    }));

    void api
      .post<ForumPost>('/forum/posts', { ...input, user: author, id: optimistic.id })
      .then(saved => {
        setState(prev => ({
          ...prev,
          forumPosts: prev.forumPosts.map(post => (post.id === optimistic.id ? saved : post)),
          profiles: mergeProfiles(prev.profiles, collectProfilesFromPosts([saved])),
        }));
      })
      .catch(error => {
        console.error('No se pudo crear el post', error);
        setState(prev => ({
          ...prev,
          forumPosts: prev.forumPosts.filter(post => post.id !== optimistic.id),
        }));
      });

    return optimistic;
  };

  const togglePostLike = (postId: string, userId: string) => {
    void api
      .post<{ liked_by: string[] }>(`/forum/posts/${postId}/likes`, { userId })
      .then(result => {
        refreshForumPosts(postId, post => ({ ...post, liked_by: result.liked_by }));
      })
      .catch(error => console.error('No se pudo actualizar el like', error));
  };

  const addPostComment = (postId: string, user: SupabaseUser, content: string) => {
    const author = createSerializableUser(user, state.profiles[user.id]);
    const optimistic: Comment = {
      id: generateId(),
      post_id: postId,
      user_id: user.id,
      content,
      likes_count: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
      user: author,
      replies: [],
    };

    refreshForumPosts(postId, post => ({
      ...post,
      comments: [...post.comments, optimistic],
    }));

    void api
      .post<Comment>(`/forum/posts/${postId}/comments`, { user: author, content, id: optimistic.id })
      .then(saved => {
        refreshForumPosts(postId, post => ({
          ...post,
          comments: post.comments.map(comment => (comment.id === optimistic.id ? saved : comment)),
        }));
      })
      .catch(error => {
        console.error('No se pudo crear el comentario', error);
        refreshForumPosts(postId, post => ({
          ...post,
          comments: post.comments.filter(comment => comment.id !== optimistic.id),
        }));
      });
  };

  const addReplyToComment = (postId: string, commentId: string, user: SupabaseUser, content: string) => {
    const author = createSerializableUser(user, state.profiles[user.id]);
    const optimistic: Comment = {
      id: generateId(),
      post_id: postId,
      user_id: user.id,
      content,
      likes_count: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
      user: author,
      replies: [],
    };

    const insertReply = (comments: Comment[]): Comment[] =>
      comments.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, replies: [...(comment.replies || []), optimistic] };
        }
        if (comment.replies?.length) {
          return { ...comment, replies: insertReply(comment.replies) };
        }
        return comment;
      });

    refreshForumPosts(postId, post => ({ ...post, comments: insertReply(post.comments) }));

    void api
      .post<Comment>(`/forum/posts/${postId}/comments/${commentId}/replies`, {
        user: author,
        content,
        id: optimistic.id,
      })
      .then(saved => {
        const replaceReply = (comments: Comment[]): Comment[] =>
          comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: (comment.replies || []).map(reply => (reply.id === optimistic.id ? saved : reply)),
              };
            }
            if (comment.replies?.length) {
              return { ...comment, replies: replaceReply(comment.replies) };
            }
            return comment;
          });

        refreshForumPosts(postId, post => ({ ...post, comments: replaceReply(post.comments) }));
      })
      .catch(error => {
        console.error('No se pudo responder el comentario', error);
        const removeReply = (comments: Comment[]): Comment[] =>
          comments.map(comment => ({
            ...comment,
            replies: comment.replies?.filter(reply => reply.id !== optimistic.id) || [],
          }));
        refreshForumPosts(postId, post => ({ ...post, comments: removeReply(post.comments) }));
      });
  };

  const toggleCommentLike = (postId: string, commentId: string, userId: string) => {
    void api
      .post<{ liked_by: string[]; likes_count: number }>(`/forum/posts/${postId}/comments/${commentId}/likes`, { userId })
      .then(result => {
        const updateComments = (comments: Comment[]): Comment[] =>
          comments.map(comment => {
            if (comment.id === commentId) {
              return { ...comment, liked_by: result.liked_by, likes_count: result.likes_count };
            }
            if (comment.replies?.length) {
              return { ...comment, replies: updateComments(comment.replies) };
            }
            return comment;
          });

        refreshForumPosts(postId, post => ({ ...post, comments: updateComments(post.comments) }));
      })
      .catch(error => console.error('No se pudo actualizar el like del comentario', error));
  };

  const getCommentCount = (postId: string) => {
    const post = state.forumPosts.find(item => item.id === postId);
    if (!post) return 0;
    return flattenComments(post.comments).length;
  };

  const getUserProfileSettings = (userId: string) => state.profiles[userId];

  const updateUserProfileSettings = async (userId: string, updates: UserProfileSettings) => {
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

    try {
      const saved = await api.put<UserProfileSettings>(`/users/${userId}/profile`, updates);
      setState(prev => ({
        ...prev,
        profiles: { ...prev.profiles, [userId]: saved },
      }));
    } catch (error) {
      console.error('No se pudo actualizar el perfil', error);
    }
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
