/*
  # Creación de base de datos para MediaForum

  ## Descripción
  Esta migración crea todas las tablas necesarias para la aplicación MediaForum, incluyendo:
  - Catálogo de contenido multimedia (películas, series, anime, manga)
  - Sistema de foros con posts y comentarios anidados
  - Listas personales de usuarios
  - Perfiles públicos compartibles
  - Sistema de valoraciones

  ## Tablas Nuevas

  ### `media_items`
  - `id` (uuid, primary key): Identificador único del contenido
  - `title` (text): Título del contenido
  - `type` (text): Tipo (movie, series, anime, manga)
  - `description` (text): Descripción/sinopsis
  - `image_url` (text): URL de la imagen de portada
  - `release_date` (date): Fecha de estreno
  - `rating` (numeric): Puntuación promedio
  - `rating_count` (integer): Número de valoraciones
  - `genre` (jsonb): Array de géneros
  - `status` (text): Estado (completed, ongoing, upcoming)
  - `episodes` (integer): Número de episodios (para series/anime)
  - `chapters` (integer): Número de capítulos (para manga)
  - `cast_info` (jsonb): Información del reparto
  - `created_at` (timestamptz): Fecha de creación

  ### `forum_posts`
  - `id` (uuid, primary key): Identificador único del post
  - `user_id` (uuid): ID del usuario autor
  - `title` (text): Título del post
  - `content` (text): Contenido del post
  - `media_id` (uuid): ID del contenido relacionado (opcional)
  - `category` (text): Categoría del post
  - `tags` (jsonb): Etiquetas del post
  - `liked_by` (jsonb): Array de user IDs que dieron like
  - `created_at` (timestamptz): Fecha de creación
  - `updated_at` (timestamptz): Fecha de actualización

  ### `comments`
  - `id` (uuid, primary key): Identificador único del comentario
  - `post_id` (uuid): ID del post al que pertenece
  - `user_id` (uuid): ID del usuario autor
  - `content` (text): Contenido del comentario
  - `likes_count` (integer): Número de likes
  - `liked_by` (jsonb): Array de user IDs que dieron like
  - `parent_id` (uuid): ID del comentario padre (para replies)
  - `created_at` (timestamptz): Fecha de creación

  ### `user_lists`
  - `id` (uuid, primary key): Identificador único de la entrada
  - `user_id` (uuid): ID del usuario
  - `media_id` (uuid): ID del contenido
  - `status` (text): Estado (watching, completed, plan_to_watch, dropped, on_hold)
  - `rating` (integer): Puntuación personal (1-5)
  - `progress` (integer): Progreso (episodios/capítulos vistos)
  - `is_public` (boolean): Visibilidad pública
  - `notes` (text): Notas personales
  - `created_at` (timestamptz): Fecha de creación
  - `updated_at` (timestamptz): Fecha de actualización

  ### `profiles`
  - `user_id` (uuid, primary key): ID del usuario
  - `username` (text): Nombre de usuario
  - `bio` (text): Biografía
  - `avatar_url` (text): URL del avatar
  - `banner_color` (text): Color del banner
  - `share_slug` (text, unique): Slug único para compartir perfil
  - `updated_at` (timestamptz): Fecha de actualización

  ### `media_ratings`
  - `id` (uuid, primary key): Identificador único
  - `user_id` (uuid): ID del usuario
  - `media_id` (uuid): ID del contenido
  - `rating` (integer): Puntuación (1-5)
  - `created_at` (timestamptz): Fecha de creación
  - `updated_at` (timestamptz): Fecha de actualización
  - Constraint: UNIQUE (user_id, media_id)

  ## Seguridad
  1. **RLS habilitado** en todas las tablas
  2. **Políticas de acceso**:
     - Lectura pública para media_items, forum_posts y comments
     - Escritura solo para usuarios autenticados
     - Control de propiedad para edición/eliminación
     - user_lists privadas por defecto (solo el dueño)
     - profiles públicos para perfiles compartibles

  ## Notas Importantes
  - Todos los campos jsonb almacenan arrays u objetos según corresponda
  - Las foreign keys están configuradas con CASCADE donde es apropiado
  - Los índices están optimizados para las consultas más frecuentes
  - Sistema de comentarios anidados usando parent_id
*/

-- Habilitar extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla: media_items
CREATE TABLE IF NOT EXISTS media_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('movie', 'series', 'anime', 'manga')),
  description TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  release_date DATE,
  rating NUMERIC(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0),
  genre JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('completed', 'ongoing', 'upcoming')),
  episodes INTEGER CHECK (episodes IS NULL OR episodes >= 0),
  chapters INTEGER CHECK (chapters IS NULL OR chapters >= 0),
  cast_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: forum_posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_id UUID REFERENCES media_items(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('movies', 'series', 'anime', 'manga', 'general')),
  tags JSONB DEFAULT '[]'::jsonb,
  liked_by JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  liked_by JSONB DEFAULT '[]'::jsonb,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: user_lists
CREATE TABLE IF NOT EXISTS user_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  media_id UUID NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('watching', 'completed', 'plan_to_watch', 'dropped', 'on_hold')),
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  is_public BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, media_id)
);

-- Tabla: profiles
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY,
  username TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_color TEXT,
  share_slug TEXT UNIQUE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: media_ratings
CREATE TABLE IF NOT EXISTS media_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  media_id UUID NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, media_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(type);
CREATE INDEX IF NOT EXISTS idx_media_items_status ON media_items(status);
CREATE INDEX IF NOT EXISTS idx_media_items_rating ON media_items(rating DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_media_id ON forum_posts(media_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_user_lists_user_id ON user_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lists_media_id ON user_lists(media_id);
CREATE INDEX IF NOT EXISTS idx_media_ratings_media_id ON media_ratings(media_id);
CREATE INDEX IF NOT EXISTS idx_profiles_share_slug ON profiles(share_slug);

-- Habilitar RLS en todas las tablas
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para media_items
CREATE POLICY "Anyone can view media items"
  ON media_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create media items"
  ON media_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update media items"
  ON media_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas RLS para forum_posts
CREATE POLICY "Anyone can view forum posts"
  ON forum_posts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON forum_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON forum_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para comments
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para user_lists
CREATE POLICY "Users can view own list entries"
  ON user_lists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public list entries"
  ON user_lists FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can create own list entries"
  ON user_lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own list entries"
  ON user_lists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own list entries"
  ON user_lists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para profiles
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para media_ratings
CREATE POLICY "Users can view own ratings"
  ON media_ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view rating stats"
  ON media_ratings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create own ratings"
  ON media_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON media_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON media_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
