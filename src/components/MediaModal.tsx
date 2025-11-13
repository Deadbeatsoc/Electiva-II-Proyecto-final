import React, { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  Play,
  Clock,
  Star,
  Plus,
  Check,
  Book,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { MediaItem, UserMediaList } from '../types';
import { useAuth } from '../hooks/useAuth';
import StarRating from './StarRating';
import AuthModal from './AuthModal';
import { useData } from '../context/DataContext';

interface MediaModalProps {
  media: MediaItem;
  onClose: () => void;
}

const MediaModal: React.FC<MediaModalProps> = ({ media, onClose }) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const {
    addUserMediaEntry,
    getUserMediaEntry,
    updateUserMediaEntry,
    removeUserMediaEntry,
    setUserRatingForMedia,
    getUserRatingForMedia,
  } = useData();

  const entry = user ? getUserMediaEntry(user.id, media.id) : undefined;
  const ratingFromContext = user ? getUserRatingForMedia(user.id, media.id) : 0;

  const [userRating, setUserRating] = useState(ratingFromContext);
  const [listStatus, setListStatus] = useState<string>(entry?.status || '');
  const [progress, setProgress] = useState(entry?.progress || 0);
  const [isPublic, setIsPublic] = useState(entry?.is_public ?? true);

  useEffect(() => {
    setListStatus(entry?.status || '');
    setProgress(entry?.progress || 0);
    setIsPublic(entry?.is_public ?? true);
  }, [entry?.status, entry?.progress, entry?.is_public]);

  useEffect(() => {
    setUserRating(ratingFromContext);
  }, [ratingFromContext]);

  const statusOptions: { value: UserMediaList['status']; label: string }[] = [
    { value: 'plan_to_watch', label: 'Plan to Watch' },
    { value: 'watching', label: 'Watching' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'dropped', label: 'Dropped' },
  ];

  const ensureAuth = () => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const handleAddToList = () => {
    if (!ensureAuth()) return;
    addUserMediaEntry(user!.id, media.id, {
      status: 'plan_to_watch',
      progress: 0,
      is_public: true,
    });
  };

  const handleStatusChange = (status: UserMediaList['status']) => {
    if (!ensureAuth()) return;
    setListStatus(status);
    updateUserMediaEntry(user!.id, media.id, { status });
  };

  const handleProgressChange = (value: number) => {
    if (!ensureAuth()) return;
    const normalized = Number.isNaN(value) ? 0 : Math.max(0, value);
    setProgress(normalized);
    updateUserMediaEntry(user!.id, media.id, { progress: normalized });
  };

  const handleVisibilityToggle = () => {
    if (!ensureAuth() || !entry) return;
    const nextVisibility = !isPublic;
    setIsPublic(nextVisibility);
    updateUserMediaEntry(user!.id, media.id, { is_public: nextVisibility });
  };

  const handleRemoveFromList = () => {
    if (!ensureAuth() || !entry) return;
    removeUserMediaEntry(user!.id, media.id);
  };

  const handleRating = (rating: number) => {
    if (!ensureAuth()) return;
    setUserRating(rating);
    setUserRatingForMedia(user!.id, media.id, rating);
  };

  const getProgressLabel = () => {
    if (media.type === 'manga') {
      return `Capítulo ${progress} de ${media.chapters || '?'}`;
    }
    if (media.type === 'anime' || media.type === 'series') {
      return `Episodio ${progress} de ${media.episodes || '?'}`;
    }
    return `Veces visto: ${progress}`;
  };

  const renderTypeSpecific = () => {
    if (media.type === 'anime') {
      return (
        <div className="flex items-center text-gray-600 text-sm">
          <Play size={16} className="mr-2 text-red-500" />
          {media.episodes ? `${media.episodes} episodios` : 'Anime'}
        </div>
      );
    }

    if (media.type === 'series') {
      return (
        <div className="flex items-center text-gray-600 text-sm">
          <Clock size={16} className="mr-2 text-blue-500" />
          {media.episodes ? `${media.episodes} episodios` : 'Serie'}
        </div>
      );
    }

    if (media.type === 'manga') {
      return (
        <div className="flex items-center text-gray-600 text-sm">
          <Book size={16} className="mr-2 text-green-500" />
          {media.chapters ? `${media.chapters} capítulos` : 'Manga'}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="relative">
            <img
              src={media.image_url || 'https://images.pexels.com/photos/274937/pexels-photo-274937.jpeg'}
              alt={media.title}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-3xl font-bold mb-2">{media.title}</h1>
              <div className="flex items-center space-x-4 text-sm">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full capitalize">
                  {media.type}
                </span>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  {new Date(media.release_date).getFullYear()}
                </div>
                <div className="flex items-center">
                  <Star size={16} className="mr-1 text-yellow-400" />
                  {media.rating}/5
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-16rem)]">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="md:col-span-2">
                <div className="mb-6 space-y-3">
                  {renderTypeSpecific()}
                  <h2 className="text-xl font-semibold">Sinopsis</h2>
                  <p className="text-gray-700 leading-relaxed">{media.description}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Géneros</h3>
                  <div className="flex flex-wrap gap-2">
                    {media.genre.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-700">Estado</h4>
                    <p className="text-gray-600 capitalize">{media.status}</p>
                  </div>
                  {media.episodes && (
                    <div>
                      <h4 className="font-semibold text-gray-700">Episodios</h4>
                      <p className="text-gray-600">{media.episodes}</p>
                    </div>
                  )}
                  {media.chapters && (
                    <div>
                      <h4 className="font-semibold text-gray-700">Capítulos</h4>
                      <p className="text-gray-600">{media.chapters}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-700">Puntuación</h4>
                    <div className="flex items-center">
                      <StarRating rating={media.rating} readonly size={16} />
                      <span className="ml-2 text-sm text-gray-500">
                        ({media.rating_count} votos)
                      </span>
                    </div>
                  </div>
                </div>

                {media.cast && media.cast.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Reparto destacado</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {media.cast.map((member, index) => (
                        <div
                          key={`${member.name}-${index}`}
                          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-semibold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            {member.character && (
                              <p className="text-sm text-gray-600">Como {member.character}</p>
                            )}
                            {member.role && (
                              <p className="text-sm text-gray-500">{member.role}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - User Actions */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Mi Lista</h3>
                  {user ? (
                    <div className="space-y-3">
                      {!entry ? (
                        <button
                          onClick={handleAddToList}
                          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus size={16} className="mr-2" />
                          Agregar a Mi Lista
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center text-green-600 font-medium">
                            <Check size={16} className="mr-2" />
                            En tu lista
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Estado
                            </label>
                            <select
                              value={listStatus}
                              onChange={(e) => handleStatusChange(e.target.value as UserMediaList['status'])}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Seleccionar estado</option>
                              {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {(media.episodes || media.chapters || media.type === 'movie') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Progreso
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={media.episodes || media.chapters}
                                value={progress}
                                onChange={(e) => handleProgressChange(parseInt(e.target.value, 10))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {getProgressLabel()}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
                            <span className="text-gray-600">Visibilidad</span>
                            <button
                              type="button"
                              onClick={handleVisibilityToggle}
                              className={`inline-flex items-center px-3 py-1 rounded-md border transition-colors ${
                                isPublic
                                  ? 'border-green-200 bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {isPublic ? <Eye size={16} className="mr-1" /> : <EyeOff size={16} className="mr-1" />}
                              {isPublic ? 'Pública' : 'Privada'}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleRemoveFromList}
                            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Quitar de mi lista
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-300 text-gray-600 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Inicia sesión para agregar
                    </button>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Tu Puntuación</h3>
                  {user ? (
                    <div>
                      <StarRating
                        rating={userRating}
                        onRatingChange={handleRating}
                        size={24}
                      />
                      {userRating > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          Has calificado: {userRating}/5 estrellas
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Inicia sesión para calificar
                    </button>
                  )}
                </div>
              </div>
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

export default MediaModal;
