import React, { useState, useEffect } from 'react';
import { Filter, Grid, List } from 'lucide-react';
import MediaCard from './MediaCard';
import MediaModal from './MediaModal';
import { MediaItem } from '../types';

interface CatalogProps {
  searchQuery: string;
}

const Catalog: React.FC<CatalogProps> = ({ searchQuery }) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sample data - In a real app, this would come from your database
  useEffect(() => {
    const sampleMedia: MediaItem[] = [
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
        created_at: '2023-01-01'
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
        created_at: '2023-01-01'
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
        created_at: '2023-01-01'
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
        chapters: 1000,
        created_at: '2023-01-01'
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
        created_at: '2023-01-01'
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
        created_at: '2023-01-01'
      }
    ];
    setMedia(sampleMedia);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = media;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
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
  }, [media, typeFilter, searchQuery, sortBy]);

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
    </div>
  );
};

export default Catalog;