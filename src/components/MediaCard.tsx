import React from 'react';
import { Calendar, Play, Book, Tv, Film } from 'lucide-react';
import { MediaItem } from '../types';
import StarRating from './StarRating';

interface MediaCardProps {
  media: MediaItem;
  onClick: () => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ media, onClick }) => {
  const getTypeIcon = () => {
    switch (media.type) {
      case 'movie':
        return <Film size={16} className="text-purple-600" />;
      case 'series':
        return <Tv size={16} className="text-blue-600" />;
      case 'anime':
        return <Play size={16} className="text-red-600" />;
      case 'manga':
        return <Book size={16} className="text-green-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (media.type) {
      case 'movie':
        return 'Película';
      case 'series':
        return 'Serie';
      case 'anime':
        return 'Anime';
      case 'manga':
        return 'Manga';
    }
  };

  const getTypeBgColor = () => {
    switch (media.type) {
      case 'movie':
        return 'bg-purple-100 text-purple-800';
      case 'series':
        return 'bg-blue-100 text-blue-800';
      case 'anime':
        return 'bg-red-100 text-red-800';
      case 'manga':
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      <div className="relative">
        <img
          src={media.image_url || 'https://images.pexels.com/photos/274937/pexels-photo-274937.jpeg'}
          alt={media.title}
          className="w-full h-64 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBgColor()}`}>
            {getTypeIcon()}
            <span className="ml-1">{getTypeLabel()}</span>
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {media.title}
        </h3>
        
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <Calendar size={16} className="mr-1" />
          {new Date(media.release_date).getFullYear()}
        </div>

        <div className="flex items-center justify-between">
          <StarRating rating={media.rating} readonly size={16} />
          <span className="text-xs text-gray-500">
            ({media.rating_count} votos)
          </span>
        </div>

        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
          {media.description}
        </p>
      </div>
    </div>
  );
};

export default MediaCard;