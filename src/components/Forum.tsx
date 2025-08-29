import React, { useState } from 'react';
import { Plus, MessageCircle, ThumbsUp, Calendar, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ForumPost } from '../types';
import AuthModal from './AuthModal';

const Forum: React.FC = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sample forum posts - In a real app, this would come from your database
  const [posts] = useState<ForumPost[]>([
    {
      id: '1',
      user_id: '1',
      title: '¿Cuál es el mejor anime de 2024?',
      content: 'Quiero saber qué opinan sobre los animes que han salido este año. Para mí, Demon Slayer sigue siendo increíble, pero he visto cosas buenas sobre Jujutsu Kaisen también.',
      likes_count: 15,
      comments_count: 23,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
      user: {
        id: '1',
        email: 'user1@example.com',
        username: 'AnimeFan2024',
        created_at: '2023-01-01T00:00:00Z'
      }
    },
    {
      id: '2',
      user_id: '2',
      title: 'Recomendaciones de películas de ciencia ficción',
      content: 'Busco películas de sci-fi que realmente me vuelen la cabeza. He visto Blade Runner, Matrix, Interstellar... ¿qué más me recomiendan?',
      media_id: '2',
      likes_count: 8,
      comments_count: 12,
      created_at: '2024-01-14T15:20:00Z',
      updated_at: '2024-01-14T15:20:00Z',
      user: {
        id: '2',
        email: 'user2@example.com',
        username: 'SciFiLover',
        created_at: '2023-02-01T00:00:00Z'
      }
    },
    {
      id: '3',
      user_id: '3',
      title: 'One Piece vs Naruto - Debate eterno',
      content: 'Sé que es un tema controversial, pero me gustaría saber sus argumentos. ¿Cuál consideran mejor y por qué? Respeten las opiniones por favor 🙏',
      likes_count: 32,
      comments_count: 67,
      created_at: '2024-01-13T09:45:00Z',
      updated_at: '2024-01-13T09:45:00Z',
      user: {
        id: '3',
        email: 'user3@example.com',
        username: 'MangaExpert',
        created_at: '2023-03-01T00:00:00Z'
      }
    }
  ]);

  const categories = [
    { value: 'all', label: 'Todas las Categorías' },
    { value: 'movies', label: 'Películas' },
    { value: 'series', label: 'Series' },
    { value: 'anime', label: 'Anime' },
    { value: 'manga', label: 'Manga' },
    { value: 'general', label: 'Discusión General' }
  ];

  const handleCreatePost = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    // Here you would open a create post modal or navigate to create post page
    console.log('Create post clicked');
  };

  const handleLikePost = (postId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    console.log('Like post:', postId);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `hace ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `hace ${diffInDays}d`;
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
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

        {/* Search and Filters */}
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

        {/* Posts List */}
        <div className="space-y-6">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {post.user?.username?.[0] || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{post.user?.username}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-1" />
                        {formatTimeAgo(post.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 cursor-pointer">
                  {post.title}
                </h2>

                <p className="text-gray-700 mb-4 line-clamp-3">
                  {post.content}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <ThumbsUp size={18} />
                      <span>{post.likes_count}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <MessageCircle size={18} />
                      <span>{post.comments_count} comentarios</span>
                    </button>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Ver discusión completa →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay posts aún
            </h3>
            <p className="text-gray-600 mb-4">
              ¡Sé el primero en iniciar una conversación!
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

        {/* Popular Topics Sidebar */}
        <div className="mt-12">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Temas Populares
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Anime 2024', 'Mejores Películas', 'Recomendaciones', 'One Piece', 'Attack on Titan', 'Ciencia Ficción'].map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-colors"
                >
                  #{topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
};

export default Forum;