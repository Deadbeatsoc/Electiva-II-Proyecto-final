import React, { useMemo, useState } from 'react';
import { Plus, MessageCircle, ThumbsUp, Calendar, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../context/DataContext';
import AuthModal from './AuthModal';
import ForumPostModal from './ForumPostModal';
import CreatePostModal from './CreatePostModal';
import { ForumPost } from '../types';

const categories = [
  { value: 'all', label: 'Todas las Categorías' },
  { value: 'movies', label: 'Películas' },
  { value: 'series', label: 'Series' },
  { value: 'anime', label: 'Anime' },
  { value: 'manga', label: 'Manga' },
  { value: 'general', label: 'Discusión General' },
];

const Forum: React.FC = () => {
  const { user } = useAuth();
  const {
    forumPosts,
    togglePostLike,
    getCommentCount,
    createForumPost,
    mediaItems,
  } = useData();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const ensureAuth = () => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const filteredPosts = useMemo(() => {
    return forumPosts.filter(post => {
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(lowerQuery) ||
        post.content.toLowerCase().includes(lowerQuery) ||
        post.user?.username?.toLowerCase().includes(lowerQuery) ||
        post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
      return matchesCategory && matchesSearch;
    });
  }, [forumPosts, selectedCategory, searchQuery]);

  const trendingTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    forumPosts.forEach(post => {
      post.tags?.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [forumPosts]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.max(1, Math.floor(diffInMs / (1000 * 60)));
      return `hace ${diffInMinutes}m`;
    }
    if (diffInHours < 24) {
      return `hace ${diffInHours}h`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `hace ${diffInDays}d`;
  };

  const handleCreatePost = () => {
    if (!ensureAuth()) return;
    setShowCreateModal(true);
  };

  const handleLikePost = (postId: string) => {
    if (!ensureAuth()) return;
    togglePostLike(postId, user!.id);
  };

  const handleSubmitPost = (input: { title: string; content: string; category: ForumPost['category']; media_id?: string; tags?: string[] }) => {
    if (!user) return;
    createForumPost(user, input);
  };

  const resolveMediaTitle = (mediaId?: string) => {
    if (!mediaId) return undefined;
    return mediaItems.find(item => item.id === mediaId)?.title;
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Foro de Discusión</h1>
            <p className="text-gray-600">
              Comparte opiniones, haz preguntas y conecta con otros fanáticos
            </p>
          </div>
          <button
            onClick={handleCreatePost}
            className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} className="mr-2" />
            Crear Post
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar en el foro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-6">
          {filteredPosts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {post.user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{post.user?.username || 'Usuario'}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-1" />
                        {formatTimeAgo(post.created_at)}
                      </div>
                      {post.media_id && (
                        <p className="text-xs text-blue-600 mt-1">
                          Relacionado con: {resolveMediaTitle(post.media_id) || 'Contenido del catálogo'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <h2
                  className="text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 cursor-pointer"
                  onClick={() => setSelectedPostId(post.id)}
                >
                  {post.title}
                </h2>

                <p className="text-gray-700 mb-4 line-clamp-3">
                  {post.content}
                </p>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors ${post.liked_by.includes(user?.id || '') ? 'text-blue-600' : ''}`}
                    >
                      <ThumbsUp size={18} />
                      <span>{post.liked_by.length}</span>
                    </button>
                    <button
                      onClick={() => setSelectedPostId(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span>{getCommentCount(post.id)} comentarios</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedPostId(post.id)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Ver discusión completa →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron posts
            </h3>
            <p className="text-gray-600 mb-4">
              Ajusta los filtros o sé el primero en crear uno nuevo
            </p>
            <button
              onClick={handleCreatePost}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Crear el primer post
            </button>
          </div>
        )}

        <div className="mt-12">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Temas Populares
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingTags.length > 0 ? (
                trendingTags.map(topic => (
                  <span
                    key={topic}
                    onClick={() => setSearchQuery(topic)}
                    className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-colors"
                  >
                    #{topic}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">Todavía no hay etiquetas populares. ¡Crea un post para iniciar la conversación!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSubmitPost}
      />

      {selectedPostId && (
        <ForumPostModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </>
  );
};

export default Forum;
