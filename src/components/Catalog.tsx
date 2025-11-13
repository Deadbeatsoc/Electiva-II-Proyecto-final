import React, { useState, useEffect } from 'react';
import { Filter, Grid, List, Plus } from 'lucide-react';
import MediaCard from './MediaCard';
import MediaModal from './MediaModal';
import MediaFormModal from './MediaFormModal';
import { MediaItem } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../hooks/useAuth';

interface CatalogProps {
  searchQuery: string;
}

const Catalog: React.FC<CatalogProps> = ({ searchQuery }) => {
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  const { user } = useAuth();
  const { mediaItems, addMediaItem } = useData();

  // Filter and search logic
  useEffect(() => {
    let filtered = [...mediaItems];

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.cast?.some(castMember =>
          castMember.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          castMember.character?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'date':
          return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredMedia(filtered);
  }, [mediaItems, typeFilter, searchQuery, sortBy]);

  const handleAddMedia = (input: Parameters<typeof addMediaItem>[0]) => {
    addMediaItem(input);
  };

  const typeOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'movie', label: 'Películas' },
    { value: 'series', label: 'Series' },
    { value: 'anime', label: 'Anime' },
    { value: 'manga', label: 'Manga' }
  ];

  const sortOptions = [
    { value: 'rating', label: 'Mejor Valorado' },
    { value: 'date', label: 'Más Reciente' },
    { value: 'title', label: 'Título A-Z' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo</h1>
        <p className="text-gray-600">
          Descubre y explora miles de películas, series, anime y manga
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <Filter size={20} className="text-gray-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {typeOptions.map(option => (
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
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
          >
            <List size={20} />
          </button>
        </div>

        {user && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Agregar contenido
          </button>
        )}
      </div>

      {/* Results Info */}
      <div className="mb-6">
        <p className="text-gray-600">
          Mostrando {filteredMedia.length} resultados
          {searchQuery && ` para "${searchQuery}"`}
        </p>
      </div>

      {/* Media Grid/List */}
      <div className={`${
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
          : 'space-y-4'
      }`}>
        {filteredMedia.map(item => (
          <MediaCard
            key={item.id}
            media={item}
            onClick={() => setSelectedMedia(item)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredMedia.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Filter size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron resultados
          </h3>
          <p className="text-gray-600">
            Prueba ajustando los filtros o términos de búsqueda
          </p>
        </div>
      )}

      {/* Media Modal */}
      {selectedMedia && (
        <MediaModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      <MediaFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMedia}
      />
    </div>
  );
};

export default Catalog;