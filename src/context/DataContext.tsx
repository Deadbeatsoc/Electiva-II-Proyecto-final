import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Comment, ForumPost, MediaItem, Rating, User, UserMediaList } from '../types';

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
}

interface DataState {
  mediaItems: MediaItem[];
  forumPosts: ForumPost[];
  userLists: Record<string, UserMediaList[]>;
  ratings: Rating[];
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
  createForumPost: (user: User, input: { title: string; content: string; category: ForumPost['category']; media_id?: string; tags?: string[]; }) => ForumPost;
  togglePostLike: (postId: string, userId: string) => void;
  addPostComment: (postId: string, user: User, content: string) => void;
  addReplyToComment: (postId: string, commentId: string, user: User, content: string) => void;
  toggleCommentLike: (postId: string, commentId: string, userId: string) => void;
  getCommentCount: (postId: string) => number;
  getUserProfileSettings: (userId: string) => UserProfileSettings | undefined;
  updateUserProfileSettings: (userId: string, updates: UserProfileSettings) => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const STORAGE_KEY = 'media-forum-data-v1';

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

const initialData: DataState = {
  mediaItems: [
    {
      id: '1',
      title: 'Attack on Titan',
      type: 'anime',
      description: 'Una serie épica sobre la humanidad luchando contra gigantes.',
      image_url: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg',
      release_date: '2013-04-07',
      rating: 4.8,
      rating_count: 15420,
      genre: ['Acción', 'Drama', 'Fantasía'],
      status: 'completed',
      episodes: 87,
      created_at: '2023-01-01',
      cast: [
        { name: 'Yuki Kaji', character: 'Eren Yeager' },
        { name: 'Marina Inoue', character: 'Armin Arlert' },
        { name: 'Yui Ishikawa', character: 'Mikasa Ackerman' },
      ],
    },
    {
      id: '2',
      title: 'The Matrix',
      type: 'movie',
      description: 'Un programador descubre la verdad sobre la realidad.',
      image_url: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg',
      release_date: '1999-03-31',
      rating: 4.6,
      rating_count: 8930,
      genre: ['Ciencia Ficción', 'Acción'],
      status: 'completed',
      created_at: '2023-01-01',
      cast: [
        { name: 'Keanu Reeves', character: 'Neo' },
        { name: 'Laurence Fishburne', character: 'Morpheus' },
        { name: 'Carrie-Anne Moss', character: 'Trinity' },
      ],
    },
    {
      id: '3',
      title: 'Breaking Bad',
      type: 'series',
      description: 'Un profesor de química se convierte en fabricante de metanfetaminas.',
      image_url: 'https://images.pexels.com/photos/3137068/pexels-photo-3137068.jpeg',
      release_date: '2008-01-20',
      rating: 4.9,
      rating_count: 12750,
      genre: ['Drama', 'Thriller'],
      status: 'completed',
      episodes: 62,
      created_at: '2023-01-01',
      cast: [
        { name: 'Bryan Cranston', character: 'Walter White' },
        { name: 'Aaron Paul', character: 'Jesse Pinkman' },
        { name: 'Anna Gunn', character: 'Skyler White' },
      ],
    },
    {
      id: '4',
      title: 'One Piece',
      type: 'manga',
      description: 'Las aventuras de Monkey D. Luffy en busca del tesoro One Piece.',
      image_url: 'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg',
      release_date: '1997-07-22',
      rating: 4.7,
      rating_count: 18600,
      genre: ['Aventura', 'Comedia', 'Shonen'],
      status: 'ongoing',
      chapters: 1100,
      created_at: '2023-01-01',
      cast: [
        { name: 'Mayumi Tanaka', character: 'Monkey D. Luffy' },
        { name: 'Kazuya Nakai', character: 'Roronoa Zoro' },
        { name: 'Akemi Okamura', character: 'Nami' },
      ],
    },
    {
      id: '5',
      title: 'Interstellar',
      type: 'movie',
      description: 'Una misión espacial para salvar a la humanidad.',
      image_url: 'https://images.pexels.com/photos/73873/star-clusters-rosette-nebula-star-galaxies-73873.jpeg',
      release_date: '2014-11-07',
      rating: 4.5,
      rating_count: 9840,
      genre: ['Ciencia Ficción', 'Drama'],
      status: 'completed',
      created_at: '2023-01-01',
      cast: [
        { name: 'Matthew McConaughey', character: 'Cooper' },
        { name: 'Anne Hathaway', character: 'Amelia Brand' },
        { name: 'Jessica Chastain', character: 'Murph' },
      ],
    },
    {
      id: '6',
      title: 'Demon Slayer',
      type: 'anime',
      description: 'Tanjiro busca una cura para su hermana convertida en demonio.',
      image_url: 'https://images.pexels.com/photos/3137068/pexels-photo-3137068.jpeg',
      release_date: '2019-04-06',
      rating: 4.4,
      rating_count: 11200,
      genre: ['Acción', 'Sobrenatural'],
      status: 'ongoing',
      episodes: 44,
      created_at: '2023-01-01',
      cast: [
        { name: 'Natsuki Hanae', character: 'Tanjiro Kamado' },
        { name: 'Akari Kitō', character: 'Nezuko Kamado' },
        { name: 'Hiro Shimono', character: 'Zenitsu Agatsuma' },
      ],
    },
  ],
  forumPosts: [
    {
      id: 'post-1',
      user_id: '1',
      title: '¿Cuál es el mejor anime de 2024?',
      content:
        'Quiero saber qué opinan sobre los animes que han salido este año. Para mí, Demon Slayer sigue siendo increíble, pero he visto cosas buenas sobre Jujutsu Kaisen también.',
      category: 'anime',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      liked_by: ['2', '3'],
      tags: ['temporada-2024', 'recomendaciones'],
      comments: [
        {
          id: 'comment-1',
          post_id: 'post-1',
          user_id: '2',
          content: 'Jujutsu Kaisen está teniendo una animación brutal este año, pero también me gustó mucho Frieren.',
          created_at: '2024-01-15T12:00:00Z',
          likes_count: 4,
          liked_by: ['1', '3'],
          replies: [
            {
              id: 'comment-1-1',
              post_id: 'post-1',
              user_id: '3',
              content: 'Totalmente de acuerdo, Frieren sorprendió muchísimo en narrativa.',
              created_at: '2024-01-15T13:45:00Z',
              likes_count: 2,
              liked_by: ['2'],
              replies: [],
            },
          ],
        },
      ],
      user: {
        id: '1',
        email: 'user1@example.com',
        username: 'AnimeFan2024',
        created_at: '2023-01-01T00:00:00Z',
      },
    },
    {
      id: 'post-2',
      user_id: '2',
      title: 'Recomendaciones de películas de ciencia ficción',
      content:
        'Busco películas de sci-fi que realmente me vuelen la cabeza. He visto Blade Runner, Matrix, Interstellar... ¿qué más me recomiendan?',
      media_id: '2',
      category: 'movies',
      created_at: '2024-01-14T15:20:00Z',
      updated_at: '2024-01-14T15:20:00Z',
      liked_by: ['1'],
      tags: ['ciencia-ficcion', 'peliculas'],
      comments: [
        {
          id: 'comment-2',
          post_id: 'post-2',
          user_id: '1',
          content: '¿Ya viste Arrival? Tiene un enfoque súper interesante sobre el tiempo.',
          created_at: '2024-01-14T18:10:00Z',
          likes_count: 3,
          liked_by: ['2'],
          replies: [],
        },
      ],
      user: {
        id: '2',
        email: 'user2@example.com',
        username: 'SciFiLover',
        created_at: '2023-02-01T00:00:00Z',
      },
    },
    {
      id: 'post-3',
      user_id: '3',
      title: 'One Piece vs Naruto - Debate eterno',
      content:
        'Sé que es un tema controversial, pero me gustaría saber sus argumentos. ¿Cuál consideran mejor y por qué? Respeten las opiniones por favor 🙏',
      category: 'manga',
      created_at: '2024-01-13T09:45:00Z',
      updated_at: '2024-01-13T09:45:00Z',
      liked_by: ['1', '2', '4'],
      tags: ['shonen', 'debate'],
      comments: [],
      user: {
        id: '3',
        email: 'user3@example.com',
        username: 'MangaExpert',
        created_at: '2023-03-01T00:00:00Z',
      },
    },
  ],
  userLists: {},
  ratings: [],
  profiles: {},
};

interface PersistedStore {
  mediaItems: MediaItem[];
  forumPosts: ForumPost[];
  users: Record<
    string,
    {
      userLists: UserMediaList[];
      ratings: Rating[];
      profile?: UserProfileSettings;
    }
  >;
}

const loadPersistedStore = (): PersistedStore => {
  if (typeof window === 'undefined') {
    return {
      mediaItems: initialData.mediaItems,
      forumPosts: initialData.forumPosts,
      users: {},
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        mediaItems: initialData.mediaItems,
        forumPosts: initialData.forumPosts,
        users: {},
      };
    }

    const parsed = JSON.parse(raw) as any;

    // Support legacy shape saved before user-specific buckets
    if (parsed.userLists || parsed.ratings || parsed.profiles) {
      const users: PersistedStore['users'] = {};
      const legacyUserLists: Record<string, UserMediaList[]> = parsed.userLists || {};
      const legacyRatings: Rating[] = parsed.ratings || [];
      const legacyProfiles: Record<string, UserProfileSettings> = parsed.profiles || {};

      Object.keys(legacyUserLists).forEach(userId => {
        users[userId] = {
          userLists: legacyUserLists[userId] || [],
          ratings: legacyRatings.filter(rating => rating.user_id === userId),
          profile: legacyProfiles[userId],
        };
      });

      return {
        mediaItems: parsed.mediaItems || initialData.mediaItems,
        forumPosts: parsed.forumPosts || initialData.forumPosts,
        users,
      };
    }

    return {
      mediaItems: parsed.mediaItems || initialData.mediaItems,
      forumPosts: parsed.forumPosts || initialData.forumPosts,
      users: parsed.users || {},
    };
  } catch (error) {
    console.error('Error loading data from localStorage', error);
    return {
      mediaItems: initialData.mediaItems,
      forumPosts: initialData.forumPosts,
      users: {},
    };
  }
};

const persistState = (state: DataState, activeUserId: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  const store = loadPersistedStore();

  store.mediaItems = state.mediaItems;
  store.forumPosts = state.forumPosts;

  if (activeUserId) {
    store.users[activeUserId] = {
      userLists: state.userLists[activeUserId] || [],
      ratings: state.ratings.filter(rating => rating.user_id === activeUserId),
      profile: state.profiles[activeUserId],
    };
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const loadState = (userId: string | null): DataState => {
  const store = loadPersistedStore();
  const userData = userId ? store.users[userId] : undefined;
  const allRatings = Object.values(store.users).flatMap(user => user.ratings || []);

  return {
    mediaItems: store.mediaItems?.length ? store.mediaItems : initialData.mediaItems,
    forumPosts: store.forumPosts?.length ? store.forumPosts : initialData.forumPosts,
    userLists: userId
      ? {
          ...(userData?.userLists ? { [userId]: userData.userLists } : { [userId]: [] }),
        }
      : {},
    ratings: allRatings,
    profiles: userId && userData?.profile ? { [userId]: userData.profile } : {},
  };
};

export const DataProvider: React.FC<{ children: React.ReactNode; currentUserId?: string | null }> = ({
  children,
  currentUserId = null,
}) => {
  const [state, setState] = useState<DataState>(() => loadState(currentUserId ?? null));
  const lastUserIdRef = useRef<string | null>(currentUserId ?? null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    persistState(state, lastUserIdRef.current);
  }, [state]);

  useEffect(() => {
    const nextUserId = currentUserId ?? null;
    const previousUserId = lastUserIdRef.current;

    if (previousUserId === nextUserId) {
      return;
    }

    if (previousUserId) {
      persistState(stateRef.current, previousUserId);
    }

    const nextState = loadState(nextUserId);

    setState(nextState);

    lastUserIdRef.current = nextUserId;
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
      mediaItems: [...prev.mediaItems, newItem],
    }));

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
        status: 'plan_to_watch',
        rating: data?.rating ?? 0,
        progress: data?.progress ?? 0,
        is_public: data?.is_public ?? true,
        notes: data?.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

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
      return {
        ...prev,
        userLists: {
          ...prev.userLists,
          [userId]: existing.map(entry =>
            entry.media_id === mediaId
              ? {
                  ...entry,
                  ...updates,
                  updated_at: new Date().toISOString(),
                }
              : entry,
          ),
        },
      };
    });
  };

  const removeUserMediaEntry = (userId: string, mediaId: string) => {
    setState(prev => {
      const existing = prev.userLists[userId] || [];
      return {
        ...prev,
        userLists: {
          ...prev.userLists,
          [userId]: existing.filter(entry => entry.media_id !== mediaId),
        },
      };
    });
  };

  const recalculateMediaRating = (mediaId: string, ratings: Rating[]) => {
    const mediaRatings = ratings.filter(rating => rating.media_id === mediaId);
    if (!mediaRatings.length) {
      return { rating: 0, rating_count: 0 };
    }

    const total = mediaRatings.reduce((sum, rating) => sum + rating.rating, 0);
    const average = total / mediaRatings.length;

    return {
      rating: parseFloat(average.toFixed(1)),
      rating_count: mediaRatings.length,
    };
  };

  const setUserRatingForMedia = (userId: string, mediaId: string, ratingValue: number) => {
    setState(prev => {
      let updatedRatings = [...prev.ratings];
      const existingIndex = updatedRatings.findIndex(rating => rating.user_id === userId && rating.media_id === mediaId);

      if (existingIndex >= 0) {
        updatedRatings[existingIndex] = {
          ...updatedRatings[existingIndex],
          rating: ratingValue,
          updated_at: new Date().toISOString(),
        };
      } else {
        updatedRatings.push({
          id: generateId(),
          user_id: userId,
          media_id: mediaId,
          rating: ratingValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      const { rating, rating_count } = recalculateMediaRating(mediaId, updatedRatings);

      const updatedUserLists = {
        ...prev.userLists,
        [userId]: (prev.userLists[userId] || []).map(entry =>
          entry.media_id === mediaId
            ? {
                ...entry,
                rating: ratingValue,
                updated_at: new Date().toISOString(),
              }
            : entry,
        ),
      };

      return {
        ...prev,
        ratings: updatedRatings,
        mediaItems: prev.mediaItems.map(item =>
          item.id === mediaId ? { ...item, rating, rating_count } : item,
        ),
        userLists: updatedUserLists,
      };
    });
  };

  const getUserRatingForMedia = (userId: string, mediaId: string) => {
    const rating = state.ratings.find(r => r.user_id === userId && r.media_id === mediaId);
    return rating?.rating ?? 0;
  };

  const createForumPost = (
    user: User,
    input: { title: string; content: string; category: ForumPost['category']; media_id?: string; tags?: string[] },
  ) => {
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
      user: {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario',
        created_at: user.created_at || new Date().toISOString(),
        avatar_url: user.user_metadata?.avatar_url,
      },
    };

    setState(prev => ({
      ...prev,
      forumPosts: [newPost, ...prev.forumPosts],
    }));

    return newPost;
  };

  const togglePostLike = (postId: string, userId: string) => {
    setState(prev => ({
      ...prev,
      forumPosts: prev.forumPosts.map(post => {
        if (post.id !== postId) return post;
        const hasLiked = post.liked_by.includes(userId);
        return {
          ...post,
          liked_by: hasLiked ? post.liked_by.filter(id => id !== userId) : [...post.liked_by, userId],
        };
      }),
    }));
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
      replies: [],
      user: {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario',
        created_at: user.created_at || new Date().toISOString(),
        avatar_url: user.user_metadata?.avatar_url,
      },
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
          : post,
      ),
    }));
  };

  const addReplyToComment = (postId: string, commentId: string, user: User, content: string) => {
    const addReply = (comments: Comment[]): Comment[] =>
      comments.map(comment => {
        if (comment.id === commentId) {
          const reply: Comment = {
            id: generateId(),
            post_id: postId,
            user_id: user.id,
            content,
            likes_count: 0,
            liked_by: [],
            created_at: new Date().toISOString(),
            replies: [],
            user: {
              id: user.id,
              email: user.email || '',
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario',
              created_at: user.created_at || new Date().toISOString(),
              avatar_url: user.user_metadata?.avatar_url,
            },
          };

          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          };
        }

        if (comment.replies?.length) {
          return {
            ...comment,
            replies: addReply(comment.replies),
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
              comments: addReply(post.comments),
              updated_at: new Date().toISOString(),
            }
          : post,
      ),
    }));
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
          : post,
      ),
    }));
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

