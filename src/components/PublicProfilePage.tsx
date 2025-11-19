import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Share2, Star } from 'lucide-react';
import { UserMediaList } from '../types';
import { UserProfileSettings } from '../context/DataContext';
import { supabase } from '../lib/supabase';

interface PublicProfileEntry {
  entry: UserMediaList;
  media: {
    id: string;
    title: string;
    image_url?: string | null;
    type: string;
    rating: number;
    rating_count: number;
  };
}

interface PublicProfileResponse {
  profile: UserProfileSettings & { user_id: string };
  entries: PublicProfileEntry[];
}

interface ProfileRow {
  user_id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_color: string | null;
  share_slug: string | null;
  updated_at: string | null;
}

interface UserListRow {
  id: string;
  user_id: string;
  media_id: string;
  status: UserMediaList['status'];
  rating: number | null;
  progress: number | null;
  is_public: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface MediaSummaryRow {
  id: string;
  title: string;
  image_url: string | null;
  type: string;
  rating: number | null;
  rating_count: number | null;
}

const mapProfileRow = (row: ProfileRow): UserProfileSettings => ({
  username: row.username ?? undefined,
  bio: row.bio ?? undefined,
  avatar_url: row.avatar_url ?? undefined,
  banner_color: row.banner_color ?? undefined,
  share_slug: row.share_slug ?? undefined,
  updated_at: row.updated_at ?? undefined,
});

const mapListRow = (row: UserListRow): UserMediaList => ({
  id: row.id,
  user_id: row.user_id,
  media_id: row.media_id,
  status: row.status,
  rating: row.rating ?? undefined,
  progress: row.progress ?? 0,
  is_public: row.is_public ?? true,
  notes: row.notes ?? undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

interface PublicProfilePageProps {
  slug: string;
}

const PublicProfilePage: React.FC<PublicProfilePageProps> = ({ slug }) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [data, setData] = useState<PublicProfileResponse | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      setStatus('loading');

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('share_slug', slug)
        .maybeSingle();

      if (profileError || !profileRow) {
        if (!ignore) {
          setStatus('error');
        }
        return;
      }

      const profileSettings = mapProfileRow(profileRow as ProfileRow);
      const userId = (profileRow as ProfileRow).user_id;

      const { data: entriesRows, error: entriesError } = await supabase
        .from('user_lists')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (entriesError) {
        if (!ignore) {
          setStatus('error');
        }
        return;
      }

      const normalizedEntries = (entriesRows as UserListRow[] | null)?.map(mapListRow) || [];
      const mediaIds = Array.from(new Set(normalizedEntries.map(entry => entry.media_id)));

      const { data: mediaRows } = mediaIds.length
        ? await supabase
            .from('media_items')
            .select('id,title,image_url,type,rating,rating_count')
            .in('id', mediaIds)
        : { data: [] };

      const mediaMap = new Map<string, MediaSummaryRow>();
      (mediaRows as MediaSummaryRow[] | null)?.forEach(row => {
        mediaMap.set(row.id, row);
      });

      if (!ignore) {
        setData({
          profile: { ...profileSettings, user_id: userId },
          entries: normalizedEntries.map(entry => ({
            entry,
            media:
              mediaMap.get(entry.media_id) ||
              {
                id: entry.media_id,
                title: 'Contenido del catálogo',
                image_url: null,
                type: 'media',
                rating: 0,
                rating_count: 0,
              },
          })),
        });
        setStatus('ready');
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [slug]);

  const handleCopy = () => {
    if (!data?.profile?.share_slug) return;
    const shareUrl = `${window.location.origin}/share/${data.profile.share_slug}`;
    navigator.clipboard.writeText(shareUrl);
    alert('¡Enlace copiado al portapapeles!');
  };

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Cargando perfil público...</p>
        </div>
      );
    }

    if (status === 'error' || !data) {
      return (
        <div className="text-center py-20">
          <p className="text-lg text-gray-600 mb-4">No pudimos encontrar este perfil.</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            Volver al inicio
          </button>
        </div>
      );
    }

    const displayName = data.profile.username || 'Usuario de la comunidad';

    return (
      <>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
              {data.profile.bio && <p className="text-blue-100 max-w-2xl">{data.profile.bio}</p>}
              <p className="mt-2 text-sm text-blue-100">Compartiendo su lista con el enlace: /share/{data.profile.share_slug}</p>
            </div>
            <div className="flex space-x-3 mt-6 md:mt-0">
              <button
                onClick={() => (window.location.href = '/')}
                className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
              >
                <ArrowLeft size={16} className="mr-2" />
                Ir al home
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
              >
                <Share2 size={16} className="mr-2" />
                Copiar enlace
              </button>
            </div>
          </div>
        </div>

        {data.entries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-600">Esta lista aún no tiene elementos públicos.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {data.entries.map(({ entry, media }) => (
              <div key={entry.id} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row gap-4">
                <img
                  src={media.image_url || 'https://images.pexels.com/photos/274937/pexels-photo-274937.jpeg'}
                  alt={media.title}
                  className="w-full sm:w-40 h-52 object-cover rounded-xl"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{media.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">{media.type}</p>
                    </div>
                    <div className="flex items-center text-yellow-500">
                      <Star size={18} className="mr-1" />
                      <span className="font-semibold">{(media.rating || 0).toFixed(1)}</span>
                      <span className="text-gray-500 text-sm ml-1">({media.rating_count || 0})</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">Estado: {entry.status}</span>
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full">Progreso: {entry.progress}</span>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
                      Valoración del usuario: {entry.rating ?? 0}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="mt-4 text-gray-700">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default PublicProfilePage;
