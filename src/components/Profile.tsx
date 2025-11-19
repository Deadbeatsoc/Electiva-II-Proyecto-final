import React, { useEffect, useMemo, useState } from 'react';
import { Star, Edit, Share2, Filter, Grid, List, Eye, EyeOff, Trash2, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../context/DataContext';
import StarRating from './StarRating';
import { UserMediaList } from '../types';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const {
    getUserList,
    updateUserMediaEntry,
    removeUserMediaEntry,
    getUserProfileSettings,
    updateUserProfileSettings,
    setUserRatingForMedia,
  } = useData();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: '', bio: '', avatar_url: '' });

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'watching', label: 'Viendo' },
    { value: 'completed', label: 'Completados' },
    { value: 'plan_to_watch', label: 'Planear Ver' },
    { value: 'on_hold', label: 'En Pausa' },
    { value: 'dropped', label: 'Abandonados' },
  ];

  const sortOptions = [
    { value: 'rating', label: 'Mi Puntuación' },
    { value: 'title', label: 'Título A-Z' },
    { value: 'updated', label: 'Actualizado Recientemente' },
    { value: 'progress', label: 'Progreso' },
  ];

  const userList = user ? getUserList(user.id) : [];

  const profileSettings = user ? getUserProfileSettings(user.id) : undefined;

  useEffect(() => {
    if (profileSettings) {
      setProfileForm({
        username: profileSettings.username || '',
        bio: profileSettings.bio || '',
        avatar_url: profileSettings.avatar_url || '',
      });
    } else {
      setProfileForm({ username: '', bio: '', avatar_url: '' });
    }
  }, [profileSettings]);

  const filteredAndSortedList = useMemo(() => {
    const filtered = userList.filter(item => statusFilter === 'all' || item.status === statusFilter);

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'title':
          return a.media.title.localeCompare(b.media.title);
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        default:
          return 0;
      }
    });
  }, [userList, statusFilter, sortBy]);

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
    if (!user) return;
    const slug = profileSettings?.share_slug;
    if (!slug) {
      alert('Estamos generando tu enlace público, intenta nuevamente en unos segundos.');
      return;
    }
    const shareUrl = `${window.location.origin}/share/${slug}`;
    navigator.clipboard.writeText(shareUrl);
    alert('¡Enlace copiado al portapapeles!');
  };

  const handleProfileSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    updateUserProfileSettings(user.id, profileForm);
    setShowEditModal(false);
  };

  const handleListUpdate = (mediaId: string, updates: Partial<UserMediaList>) => {
    if (!user) return;

    if (typeof updates.rating === 'number') {
      setUserRatingForMedia(user.id, mediaId, updates.rating);
    } else {
      updateUserMediaEntry(user.id, mediaId, updates);
    }
  };

  const handleRemoveEntry = (mediaId: string) => {
    if (!user) return;
    removeUserMediaEntry(user.id, mediaId);
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

  const completedCount = userList.filter(item => item.status === 'completed').length;
  const displayName = profileSettings?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario';
  const avatarLetter = displayName[0]?.toUpperCase() || 'U';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
              {profileSettings?.avatar_url ? (
                <img
                  src={profileSettings.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                avatarLetter
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {displayName}
              </h1>
              <p className="text-blue-100">Mi Lista Personal</p>
              <div className="flex items-center mt-2 space-x-4 text-sm">
                <span>{filteredAndSortedList.length} elementos</span>
                <span>•</span>
                <span>{completedCount} completados</span>
              </div>
              {profileSettings?.bio && (
                <p className="mt-2 text-blue-100 max-w-xl">{profileSettings.bio}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            >
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
              <div className="p-4 flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{item.media.title}</h3>
                    <p className="text-xs text-gray-500 capitalize">{item.media.type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)} ml-2 whitespace-nowrap`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mi puntuación</span>
                    <StarRating
                      rating={item.rating || 0}
                      onRatingChange={(value) => handleListUpdate(item.media_id, { rating: value })}
                      size={16}
                    />
                  </div>

                  {(item.media.episodes || item.media.chapters) && (
                    <div className="text-sm text-gray-600 flex items-center justify-between">
                      <span>Progreso:</span>
                      <input
                        type="number"
                        min={0}
                        max={item.media.episodes || item.media.chapters}
                        value={item.progress}
                        onChange={(e) => handleListUpdate(item.media_id, { progress: parseInt(e.target.value, 10) || 0 })}
                        className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Actualizado: {new Date(item.updated_at).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleListUpdate(item.media_id, { is_public: !item.is_public })}
                        className={`inline-flex items-center px-2 py-1 rounded-md border transition-colors ${
                          item.is_public
                            ? 'border-green-200 bg-green-100 text-green-700 hover:bg-green-200'
                            : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {item.is_public ? <Eye size={14} className="mr-1" /> : <EyeOff size={14} className="mr-1" />}
                        {item.is_public ? 'Público' : 'Privado'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(item.media_id)}
                        className="inline-flex items-center px-2 py-1 text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Quitar
                      </button>
                    </div>
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

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Editar perfil</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleProfileSave} className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu nombre visible"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Cuenta algo sobre ti..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL del avatar</label>
                <input
                  type="url"
                  value={profileForm.avatar_url}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
