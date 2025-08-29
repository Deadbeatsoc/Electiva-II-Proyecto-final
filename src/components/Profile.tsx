import React, { useState } from 'react';
import { Star, Edit, Share2, Filter, Grid, List } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserMediaList, MediaItem } from '../types';
import StarRating from './StarRating';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');

  // Sample user list data - In a real app, this would come from your database
  const [userList] = useState<(UserMediaList & { media: MediaItem })[]>([
    {
      id: '1',
      user_id: user?.id || '1',
      media_id: '1',
      status: 'completed',
      rating: 5,
      progress: 87,
      is_public: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
      media: {
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
        created_at: '2023-01-01T00:00:00Z'
      }
    },
    {
      id: '2',
      user_id: user?.id || '1',
      media_id: '2',
      status: 'completed',
      rating: 4,
      progress: 1,
      is_public: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
      media: {
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
        created_at: '2023-01-01T00:00:00Z'
      }
    },
    {
      id: '3',
      user_id: user?.id || '1',
      media_id: '6',
      status: 'watching',
      rating: 0,
      progress: 25,
      is_public: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-16T00:00:00Z',
      media: {
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
        created_at: '2023-01-01T00:00:00Z'
      }
    }
  ]);

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'watching', label: 'Viendo' },
    { value: 'completed', label: 'Completados' },
    { value: 'plan_to_watch', label: 'Planear Ver' },
    { value: 'on_hold', label: 'En Pausa' },
    { value: 'dropped', label: 'Abandonados' }
  ];

  const sortOptions = [
    { value: 'rating', label: 'Mi Puntuación' },
    { value: 'title', label: 'Título A-Z' },
    { value: 'updated', label: 'Actualizado Recientemente' },
    { value: 'progress', label: 'Progreso' }
  ];

  const filteredAndSortedList = userList
    .filter(item => statusFilter === 'all' || item.status === statusFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'title':
          return a.media.title.localeCompare(b.media.title);
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'watching':
        return 'bg-blue-100 text-blue-800';
      case 'plan_to_watch':
        return 'bg-yellow-100 text-yellow-800';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800';
      case 'dropped':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/user/${user?.id}/list`;
    navigator.clipboard.writeText(shareUrl);
    alert('¡Enlace copiado al portapapeles!');
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <Star size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Requerido
          </h2>
          <p className="text-gray-600">
            Inicia sesión para ver y gestionar tu lista personal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
              {user.user_metadata?.username?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario'}
              </h1>
              <p className="text-blue-100">Mi Lista Personal</p>
              <div className="flex items-center mt-2 space-x-4 text-sm">
                <span>{filteredAndSortedList.length} elementos</span>
                <span>•</span>
                <span>
                  {filteredAndSortedList.filter(item => item.status === 'completed').length} completados
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors">
              <Edit size={16} className="mr-2" />
              Editar Perfil
            </button>
            <button
              onClick={handleShare}
              className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <Share2 size={16} className="mr-2" />
              Compartir Lista
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statusOptions.slice(1).map(status => {
          const count = userList.filter(item => item.status === status.value).length;
          return (
            <div key={status.value} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{status.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <Filter size={20} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
          >
            <Grid size={20} />
          </button>
        </div>
      </div>

      {/* List Content */}
      {filteredAndSortedList.length > 0 ? (
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }`}>
          {filteredAndSortedList.map(item => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'flex' : ''
              }`}
            >
              <img
                src={item.media.image_url || 'https://images.pexels.com/photos/274937/pexels-photo-274937.jpeg'}
                alt={item.media.title}
                className={`${
                  viewMode === 'list' 
                    ? 'w-24 h-32 flex-shrink-0' 
                    : 'w-full h-48'
                } object-cover`}
              />
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {item.media.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)} ml-2 whitespace-nowrap`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                <div className="space-y-2">
                  {item.rating > 0 && (
                    <StarRating rating={item.rating} readonly size={16} />
                  )}
                  
                  {(item.media.episodes || item.media.chapters) && (
                    <div className="text-sm text-gray-600">
                      Progreso: {item.progress}/{item.media.episodes || item.media.chapters}
                      {item.media.type === 'manga' ? ' capítulos' : ' episodios'}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Actualizado: {new Date(item.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Star size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tu lista está vacía
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza agregando contenido desde el catálogo
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Explorar Catálogo
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;