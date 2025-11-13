import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MediaInput } from '../context/DataContext';

interface MediaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: MediaInput) => void;
}

const defaultForm: MediaInput = {
  title: '',
  type: 'movie',
  description: '',
  image_url: '',
  release_date: new Date().toISOString().slice(0, 10),
  rating: 0,
  rating_count: 0,
  genre: [],
  status: 'upcoming',
};

const MediaFormModal: React.FC<MediaFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [form, setForm] = useState<MediaInput>(defaultForm);
  const [genresInput, setGenresInput] = useState('');
  const [castInput, setCastInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm({ ...defaultForm, release_date: new Date().toISOString().slice(0, 10) });
      setGenresInput('');
      setCastInput('');
    }
  }, [isOpen]);

  const handleChange = (field: keyof MediaInput, value: string | number | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const parseCastInput = () => {
    if (!castInput.trim()) return undefined;
    return castInput
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [name, character] = line.split(' - ').map(part => part.trim());
        if (!name) {
          return null;
        }
        return {
          name,
          character: character || undefined,
        };
      })
      .filter(Boolean) as NonNullable<MediaInput['cast']>;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const parsedGenres = genresInput
      .split(',')
      .map(genre => genre.trim())
      .filter(Boolean);

    const payload: MediaInput = {
      ...form,
      genre: parsedGenres,
      cast: parseCastInput(),
      episodes: form.type === 'anime' || form.type === 'series' ? Number(form.episodes) || undefined : undefined,
      chapters: form.type === 'manga' ? Number(form.chapters) || undefined : undefined,
    };

    onSubmit(payload);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4 py-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Agregar nuevo contenido</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre del contenido"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="movie">Película</option>
                <option value="series">Serie</option>
                <option value="anime">Anime</option>
                <option value="manga">Manga</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Estreno</label>
              <input
                type="date"
                required
                value={form.release_date}
                onChange={(e) => handleChange('release_date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="completed">Completado</option>
                <option value="ongoing">En emisión</option>
                <option value="upcoming">Próximamente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen</label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => handleChange('image_url', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Géneros</label>
              <input
                type="text"
                value={genresInput}
                onChange={(e) => setGenresInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Acción, Drama, Fantasía"
              />
            </div>

            {(form.type === 'anime' || form.type === 'series') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Episodios</label>
                <input
                  type="number"
                  min={0}
                  value={form.episodes ?? ''}
                  onChange={(e) => handleChange('episodes', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {form.type === 'manga' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capítulos</label>
                <input
                  type="number"
                  min={0}
                  value={form.chapters ?? ''}
                  onChange={(e) => handleChange('chapters', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Describe de qué trata..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cast / Actores principales</label>
            <textarea
              value={castInput}
              onChange={(e) => setCastInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder={'Ejemplo:\nActor 1 - Personaje\nActor 2 - Personaje'}
            />
            <p className="mt-1 text-xs text-gray-500">Escribe cada actor en una línea nueva usando el formato "Nombre - Personaje"</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Agregar al catálogo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MediaFormModal;
