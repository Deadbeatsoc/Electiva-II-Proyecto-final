import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Comment, ForumPost, MediaItem, User as AppUser, UserMediaList } from '../types';

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
  updateUserProfileSettings: (userId: string, updates: UserProfileSettings) => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const parseArray = <T,>(value: unknown, fallback: T[] = []): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
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

interface MediaRow {
  id: string;
  title: string;
  type: string;
  description: string;
  image_url: string | null;
  release_date: string | null;
  rating: number | null;
  rating_count: number | null;
  genre: unknown;
  status: string;
  episodes: number | null;
  chapters: number | null;
  cast_info: unknown;
  created_at: string;
}

interface ForumPostRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  media_id: string | null;
  category: ForumPost['category'];
  tags: unknown;
  liked_by: unknown;
  created_at: string;
  updated_at: string | null;
}

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number | null;
  liked_by: unknown;
  parent_id: string | null;
  created_at: string;
}

interface ProfileRow {
  user_id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_color: string | null;
  share_slug: string | null;
  updated_at: string | null;
}

interface UserListRow {
  id: string;
  user_id: string;
  media_id: string;
  status: UserMediaList['status'];
  rating: number | null;
  progress: number | null;
  is_public: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const mapMediaRow = (row: MediaRow): MediaItem => ({
  id: row.id,
  title: row.title,
  type: row.type as MediaItem['type'],
  description: row.description,
  image_url: row.image_url || '',
  release_date: row.release_date || new Date().toISOString(),
  rating: row.rating ? Number(row.rating) : 0,
  rating_count: row.rating_count ?? 0,
  genre: parseArray<string>(row.genre, []),
  status: row.status as MediaItem['status'],
  episodes: row.episodes ?? undefined,
  chapters: row.chapters ?? undefined,
  cast: parseArray<CastMember>(row.cast_info, []),
  created_at: row.created_at,
});

const mapProfileRow = (row: ProfileRow): UserProfileSettings => ({
  username: row.username ?? undefined,
  bio: row.bio ?? undefined,
  avatar_url: row.avatar_url ?? undefined,
  banner_color: row.banner_color ?? undefined,
  share_slug: row.share_slug ?? undefined,
  updated_at: row.updated_at ?? undefined,
});

const mapUserListRow = (row: UserListRow): UserMediaList => ({
  id: row.id,
  user_id: row.user_id,
  media_id: row.media_id,
  status: row.status,
  rating: row.rating ?? undefined,
  progress: row.progress ?? 0,
  is_public: row.is_public ?? true,
  notes: row.notes ?? undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const mapCommentRow = (row: CommentRow, profiles: Record<string, UserProfileSettings>): Comment => ({
  id: row.id,
  post_id: row.post_id,
  user_id: row.user_id,
  content: row.content,
  likes_count: row.likes_count ?? 0,
  liked_by: parseArray<string>(row.liked_by, []),
  parent_id: row.parent_id ?? undefined,
  created_at: row.created_at,
  user: buildAppUser(row.user_id, profiles),
  replies: [],
});

const buildAppUser = (userId: string, profiles: Record<string, UserProfileSettings>): AppUser | undefined => {
  const profile = profiles[userId];
  if (!profile) {
    return undefined;
  }
  return {
    id: userId,
    email: '',
    username: profile.username || 'Usuario',
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    created_at: profile.updated_at || new Date().toISOString(),
  };
};

const buildCommentTree = (rows: CommentRow[], profiles: Record<string, UserProfileSettings>): Comment[] => {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  rows.forEach(row => {
    const comment = mapCommentRow(row, profiles);
    comment.replies = [];
    map.set(comment.id, comment);
  });

  rows.forEach(row => {
    const comment = map.get(row.id);
    if (!comment) return;

    if (row.parent_id) {
      const parent = map.get(row.parent_id);
      if (parent) {
        parent.replies = [...(parent.replies || []), comment];
      }
    } else {
      roots.push(comment);
    }
  });

  return roots;
};

const mapForumPostRow = (
  row: ForumPostRow,
  comments: CommentRow[],
  profiles: Record<string, UserProfileSettings>
): ForumPost => ({
  id: row.id,
  user_id: row.user_id,
  title: row.title,
  content: row.content,
  media_id: row.media_id || undefined,
  category: row.category,
  tags: parseArray<string>(row.tags, []),
  liked_by: parseArray<string>(row.liked_by, []),
  comments: buildCommentTree(
    comments.filter(comment => comment.post_id === row.id),
    profiles
  ),
  created_at: row.created_at,
  updated_at: row.updated_at || row.created_at,
  user: buildAppUser(row.user_id, profiles),
});

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
      const [{ data: mediaData }, { data: postData }, { data: commentData }, { data: profileData }] = await Promise.all([
        supabase.from('media_items').select('*').order('created_at', { ascending: false }),
        supabase.from('forum_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
        supabase.from('profiles').select('*'),
      ]);

      if (ignore) return;

      const profilesMap = (profileData || []).reduce<Record<string, UserProfileSettings>>((acc, profile) => {
        acc[profile.user_id] = mapProfileRow(profile as ProfileRow);
        return acc;
      }, {});

      setState(prev => ({
        ...prev,
        mediaItems: Array.isArray(mediaData) ? mediaData.map(row => mapMediaRow(row as MediaRow)) : prev.mediaItems,
        forumPosts:
          Array.isArray(postData) && Array.isArray(commentData)
            ? postData.map(row =>
                mapForumPostRow(
                  row as ForumPostRow,
                  commentData as CommentRow[],
                  { ...prev.profiles, ...profilesMap }
                )
              )
            : prev.forumPosts,
        profiles: { ...prev.profiles, ...profilesMap },
      }));
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
      const [{ data: entries }, { data: profile }] = await Promise.all([
        supabase.from('user_lists').select('*').eq('user_id', currentUserId),
        supabase.from('profiles').select('*').eq('user_id', currentUserId).maybeSingle(),
      ]);

      if (ignore) return;

      setState(prev => ({
        ...prev,
        userLists: {
          ...prev.userLists,
          [currentUserId]: Array.isArray(entries) ? (entries as UserListRow[]).map(mapUserListRow) : prev.userLists[currentUserId] || [],
        },
        profiles: profile
          ? {
              ...prev.profiles,
              [currentUserId]: mapProfileRow(profile as ProfileRow),
            }
          : prev.profiles,
      }));

      if (!profile) {
        const { data: createdProfile } = await supabase
          .from('profiles')
          .insert({ user_id: currentUserId })
          .select('*')
          .maybeSingle();

        if (!ignore && createdProfile) {
          setState(prev => ({
            ...prev,
            profiles: {
              ...prev.profiles,
              [currentUserId]: mapProfileRow(createdProfile as ProfileRow),
            },
          }));
        }
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

    supabase
      .from('media_items')
      .insert({
        id: newItem.id,
        title: newItem.title,
        type: newItem.type,
        description: newItem.description,
        image_url: newItem.image_url,
        release_date: newItem.release_date,
        rating: newItem.rating,
        rating_count: newItem.rating_count,
        genre: newItem.genre,
        status: newItem.status,
        episodes: newItem.episodes ?? null,
        chapters: newItem.chapters ?? null,
        cast_info: newItem.cast ?? [],
      })
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setState(prev => ({
            ...prev,
            mediaItems: [mapMediaRow(data as MediaRow), ...prev.mediaItems.filter(item => item.id !== newItem.id)],
          }));
        }
      });

    return newItem;
  };

  const updateMediaItem = (mediaId: string, updates: Partial<MediaItem>) => {
    setState(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.map(item => (item.id === mediaId ? { ...item, ...updates } : item)),
    }));

    const payload: Record<string, unknown> = {};
    if (typeof updates.title !== 'undefined') payload.title = updates.title;
    if (typeof updates.description !== 'undefined') payload.description = updates.description;
    if (typeof updates.image_url !== 'undefined') payload.image_url = updates.image_url;
    if (typeof updates.release_date !== 'undefined') payload.release_date = updates.release_date;
    if (typeof updates.rating !== 'undefined') payload.rating = updates.rating;
    if (typeof updates.rating_count !== 'undefined') payload.rating_count = updates.rating_count;
    if (typeof updates.genre !== 'undefined') payload.genre = updates.genre;
    if (typeof updates.status !== 'undefined') payload.status = updates.status;
    if (typeof updates.episodes !== 'undefined') payload.episodes = updates.episodes;
    if (typeof updates.chapters !== 'undefined') payload.chapters = updates.chapters;
    if (typeof updates.cast !== 'undefined') payload.cast_info = updates.cast;

    if (Object.keys(payload).length > 0) {
      supabase.from('media_items').update(payload).eq('id', mediaId);
    }
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

  const syncMediaRating = async (mediaId: string) => {
    const { data } = await supabase.from('media_ratings').select('rating').eq('media_id', mediaId);
    if (!data) return;

    const ratings = data as { rating: number }[];
    const rating_count = ratings.length;
    const rating = rating_count ? ratings.reduce((sum, entry) => sum + entry.rating, 0) / rating_count : 0;

    await supabase.from('media_items').update({ rating, rating_count }).eq('id', mediaId);

    setState(prev => ({
      ...prev,
      mediaItems: prev.mediaItems.map(item =>
        item.id === mediaId
          ? { ...item, rating, rating_count }
          : item
      ),
    }));
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

      supabase.from('user_lists').insert({
        id: newEntry.id,
        user_id: newEntry.user_id,
        media_id: newEntry.media_id,
        status: newEntry.status,
        rating: newEntry.rating,
        progress: newEntry.progress,
        is_public: newEntry.is_public,
        notes: newEntry.notes ?? null,
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

    supabase
      .from('user_lists')
      .update({
        status: updates.status,
        rating: updates.rating,
        progress: updates.progress,
        is_public: updates.is_public,
        notes: updates.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('media_id', mediaId);

    if (typeof updates.rating === 'number') {
      supabase
        .from('media_ratings')
        .upsert(
          {
            user_id: userId,
            media_id: mediaId,
            rating: updates.rating,
          },
          { onConflict: 'user_id,media_id' }
        )
        .then(() => {
          void syncMediaRating(mediaId);
        });
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

    supabase
      .from('user_lists')
      .delete()
      .eq('user_id', userId)
      .eq('media_id', mediaId);
  };

  const setUserRatingForMedia = (userId: string, mediaId: string, rating: number) => {
    updateUserMediaEntry(userId, mediaId, { rating });
  };

  const getUserRatingForMedia = (userId: string, mediaId: string) => {
    return state.userLists[userId]?.find(entry => entry.media_id === mediaId)?.rating || 0;
  };

  const createForumPost = (
    user: SupabaseUser,
    input: { title: string; content: string; category: ForumPost['category']; media_id?: string; tags?: string[] }
  ): ForumPost => {
    const profileUser = buildAppUser(user.id, state.profiles);
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
      user: profileUser,
    };

    setState(prev => ({
      ...prev,
      forumPosts: [newPost, ...prev.forumPosts],
    }));

    supabase
      .from('forum_posts')
      .insert({
        id: newPost.id,
        user_id: newPost.user_id,
        title: newPost.title,
        content: newPost.content,
        media_id: newPost.media_id ?? null,
        category: newPost.category,
        tags: newPost.tags,
        liked_by: newPost.liked_by,
      })
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setState(prev => ({
            ...prev,
            forumPosts: prev.forumPosts.map(post =>
              post.id === newPost.id
                ? mapForumPostRow(data as ForumPostRow, [], prev.profiles)
                : post
            ),
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

    const post = state.forumPosts.find(item => item.id === postId);
    const likedBy = post ? [...post.liked_by] : [];
    const hasLiked = likedBy.includes(userId);
    const nextLikedBy = hasLiked ? likedBy.filter(id => id !== userId) : [...likedBy, userId];

    supabase
      .from('forum_posts')
      .update({ liked_by: nextLikedBy })
      .eq('id', postId)
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setState(prev => ({
            ...prev,
            forumPosts: prev.forumPosts.map(item =>
              item.id === postId
                ? { ...item, liked_by: parseArray<string>((data as ForumPostRow).liked_by, []) }
                : item
            ),
          }));
        }
      });
  };

  const addPostComment = (postId: string, user: SupabaseUser, content: string) => {
    const profileUser = buildAppUser(user.id, state.profiles);
    const newComment: Comment = {
      id: generateId(),
      post_id: postId,
      user_id: user.id,
      content,
      likes_count: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
      user: profileUser,
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

    supabase
      .from('comments')
      .insert({
        id: newComment.id,
        post_id: newComment.post_id,
        user_id: newComment.user_id,
        content: newComment.content,
        likes_count: 0,
        liked_by: [],
      })
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setState(prev => ({
            ...prev,
            forumPosts: prev.forumPosts.map(post =>
              post.id === postId
                ? {
                    ...post,
                    comments: post.comments.map(comment =>
                      comment.id === newComment.id
                        ? mapCommentRow(data as CommentRow, prev.profiles)
                        : comment
                    ),
                  }
                : post
            ),
          }));
        }
      });
  };

  const addReplyToComment = (postId: string, commentId: string, user: SupabaseUser, content: string) => {
    const reply: Comment = {
      id: generateId(),
      post_id: postId,
      user_id: user.id,
      content,
      likes_count: 0,
      liked_by: [],
      created_at: new Date().toISOString(),
      user: buildAppUser(user.id, state.profiles),
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

    supabase
      .from('comments')
      .insert({
        id: reply.id,
        post_id: postId,
        user_id: user.id,
        content,
        parent_id: commentId,
        likes_count: 0,
        liked_by: [],
      })
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
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
                    replies: [...(comment.replies || []), mapCommentRow(data as CommentRow, prev.profiles)],
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

  const toggleCommentLike = (postId: string, commentId: string, userId: string) => {
    const toggle = (comments: Comment[]): Comment[] =>
      comments.map(comment => {
        if (comment.id === commentId) {
          const liked = comment.liked_by?.includes(userId);
          const liked_by = liked
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

    supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .maybeSingle()
      .then(({ data }) => {
        const comment = data as CommentRow | null;
        const currentLikes = comment ? parseArray<string>(comment.liked_by, []) : [];
        const hasLiked = currentLikes.includes(userId);
        const nextLikes = hasLiked ? currentLikes.filter(id => id !== userId) : [...currentLikes, userId];

        supabase
          .from('comments')
          .update({ liked_by: nextLikes, likes_count: nextLikes.length })
          .eq('id', commentId)
          .select('*')
          .maybeSingle()
          .then(({ data: updated }) => {
            if (!updated) {
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
                        liked_by: parseArray<string>((updated as CommentRow).liked_by, []),
                        likes_count: (updated as CommentRow).likes_count ?? 0,
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

    supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        ...updates,
      })
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setState(prev => ({
            ...prev,
            profiles: {
              ...prev.profiles,
              [userId]: mapProfileRow(data as ProfileRow),
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
