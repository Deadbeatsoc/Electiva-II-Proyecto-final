import React, { useState } from 'react';
import { X, Calendar, Play, Clock, Star, Plus, Check } from 'lucide-react';
import { MediaItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import StarRating from './StarRating';
import AuthModal from './AuthModal';

interface MediaModalProps {
  media: MediaItem;
  onClose: () => void;
}

const MediaModal: React.FC<MediaModalProps> = ({ media, onClose }) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [listStatus, setListStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isInList, setIsInList] = useState(false);

  const statusOptions = [
    { value: 'plan_to_watch', label: 'Plan to Watch' },
    { value: 'watching', label: 'Watching' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'dropped', label: 'Dropped' },
  ];

  const handleAddToList = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    // Here you would normally add to database
    setIsInList(true);
  };

  const handleRating = (rating: number) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setUserRating(rating);
    // Here you would normally save to database
  };

  const getProgressLabel = () => {
    if (media.type === 'manga') {
      return `Capítulo ${progress} de ${media.chapters || '?'}`;
    } else {
      return `Episodio ${progress} de ${media.episodes || '?'}`;
    }
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
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {media.type.charAt(0).toUpperCase() + media.type.slice(1)}
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
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Sinopsis</h2>
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
              </div>

              {/* Sidebar - User Actions */}
              <div className="space-y-6">
                {/* Add to List */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Mi Lista</h3>
                  {user ? (
                    <div className="space-y-3">
                      {!isInList ? (
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
                              onChange={(e) => setListStatus(e.target.value)}
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

                          {(media.episodes || media.chapters) && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Progreso
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={media.episodes || media.chapters}
                                value={progress}
                                onChange={(e) => setProgress(parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {getProgressLabel()}
                              </p>
                            </div>
                          )}
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

                {/* Rating */}
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