const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const { query, queryOne, execute } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 4000;
const API_PREFIX = '/api';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const parseJson = (value, fallback) => {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapMedia = row => ({
  id: row.id,
  title: row.title,
  type: row.type,
  description: row.description,
  image_url: row.image_url,
  release_date: row.release_date,
  rating: Number(row.rating) || 0,
  rating_count: Number(row.rating_count) || 0,
  genre: parseJson(row.genre_json, []),
  status: row.status,
  episodes: row.episodes !== null ? Number(row.episodes) : undefined,
  chapters: row.chapters !== null ? Number(row.chapters) : undefined,
  cast: parseJson(row.cast_json, undefined),
  created_at: row.created_at,
});

const mapListEntry = row => ({
  id: row.id,
  user_id: row.user_id,
  media_id: row.media_id,
  status: row.status,
  rating: row.rating !== null ? Number(row.rating) : undefined,
  progress: Number(row.progress) || 0,
  is_public: Boolean(row.is_public),
  notes: typeof row.notes === 'string' ? row.notes : undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const mapProfile = row => ({
  user_id: row.user_id,
  username: row.username || undefined,
  bio: row.bio || undefined,
  avatar_url: row.avatar_url || undefined,
  banner_color: row.banner_color || undefined,
  share_slug: row.share_slug || undefined,
});

const buildForumPosts = () => {
  const posts = query('SELECT * FROM forum_posts ORDER BY datetime(created_at) DESC;');
  const comments = query('SELECT * FROM comments ORDER BY datetime(created_at) ASC;').map(comment => ({
    id: comment.id,
    post_id: comment.post_id,
    user_id: comment.user_id,
    content: comment.content,
    likes_count: Number(comment.likes_count) || 0,
    liked_by: parseJson(comment.liked_by_json, []),
    parent_id: comment.parent_id || undefined,
    created_at: comment.created_at,
    user: parseJson(comment.user_json, undefined),
    replies: [],
  }));

  const commentsByPost = new Map();
  comments.forEach(comment => {
    if (!commentsByPost.has(comment.post_id)) {
      commentsByPost.set(comment.post_id, []);
    }
    commentsByPost.get(comment.post_id).push(comment);
  });

  const buildTree = (items = []) => {
    const map = new Map();
    const roots = [];
    items.forEach(item => {
      map.set(item.id, item);
      item.replies = [];
    });
    items.forEach(item => {
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id).replies.push(item);
      } else if (!item.parent_id) {
        roots.push(item);
      }
    });
    return roots;
  };

  return posts.map(post => ({
    id: post.id,
    user_id: post.user_id,
    title: post.title,
    content: post.content,
    media_id: post.media_id || undefined,
    category: post.category,
    tags: parseJson(post.tags_json, []),
    liked_by: parseJson(post.liked_by_json, []),
    created_at: post.created_at,
    updated_at: post.updated_at,
    comments: buildTree(commentsByPost.get(post.id) || []),
    user: parseJson(post.user_json, undefined),
  }));
};

const ensurePostExists = (postId) => {
  const post = queryOne('SELECT id FROM forum_posts WHERE id = ?;', [postId]);
  if (!post) {
    const error = new Error('Post not found');
    error.status = 404;
    throw error;
  }
  return post;
};

const ensureCommentExists = (commentId) => {
  const comment = queryOne('SELECT * FROM comments WHERE id = ?;', [commentId]);
  if (!comment) {
    const error = new Error('Comment not found');
    error.status = 404;
    throw error;
  }
  return comment;
};

const buildProfileSlug = (username = '', userId) => {
  const base = username
    ? username.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : `usuario-${userId.slice(0, 6)}`;
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
};

app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({ status: 'ok' });
});

app.get(`${API_PREFIX}/media`, (_req, res) => {
  const items = query('SELECT * FROM media_items ORDER BY datetime(created_at) DESC;').map(mapMedia);
  res.json(items);
});

app.post(`${API_PREFIX}/media`, (req, res) => {
  const {
    id = uuid(),
    title,
    type,
    description,
    image_url = '',
    release_date = null,
    rating = 0,
    rating_count = 0,
    genre = [],
    status,
    episodes = null,
    chapters = null,
    cast = undefined,
  } = req.body || {};

  if (!title || !type || !description || !status) {
    return res.status(400).json({ message: 'title, type, status y description son obligatorios.' });
  }

  execute(
    'INSERT INTO media_items (id, title, type, description, image_url, release_date, rating, rating_count, genre_json, status, episodes, chapters, cast_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);',
    [
      id,
      title,
      type,
      description,
      image_url,
      release_date,
      rating,
      rating_count,
      JSON.stringify(genre || []),
      status,
      typeof episodes === 'number' ? episodes : null,
      typeof chapters === 'number' ? chapters : null,
      cast ? JSON.stringify(cast) : null,
    ]
  );

  const saved = queryOne('SELECT * FROM media_items WHERE id = ?;', [id]);
  res.status(201).json(mapMedia(saved));
});

app.post(`${API_PREFIX}/media/:mediaId/ratings`, (req, res) => {
  const { mediaId } = req.params;
  const { userId, rating } = req.body || {};

  if (!userId || typeof rating !== 'number') {
    return res.status(400).json({ message: 'userId y rating son obligatorios.' });
  }

  const value = Math.max(1, Math.min(5, rating));
  const existing = queryOne('SELECT id FROM media_ratings WHERE user_id = ? AND media_id = ?;', [userId, mediaId]);
  if (existing) {
    execute('UPDATE media_ratings SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;', [value, existing.id]);
  } else {
    execute('INSERT INTO media_ratings (id, user_id, media_id, rating) VALUES (?, ?, ?, ?);', [uuid(), userId, mediaId, value]);
  }

  const stats = queryOne('SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM media_ratings WHERE media_id = ?;', [mediaId]);
  const average = stats?.avg_rating ? Number(stats.avg_rating).toFixed(1) : '0';
  const count = stats?.count ? Number(stats.count) : 0;
  execute('UPDATE media_items SET rating = ?, rating_count = ? WHERE id = ?;', [Number(average), count, mediaId]);

  res.json({ rating: Number(average), rating_count: count });
});

app.get(`${API_PREFIX}/forum/posts`, (_req, res) => {
  res.json(buildForumPosts());
});

app.post(`${API_PREFIX}/forum/posts`, (req, res) => {
  const { title, content, category, media_id = null, tags = [], user, id = uuid() } = req.body || {};

  if (!user || !user.id) {
    return res.status(400).json({ message: 'La información del usuario es obligatoria.' });
  }

  if (!title || !content || !category) {
    return res.status(400).json({ message: 'title, content y category son obligatorios.' });
  }

  execute(
    'INSERT INTO forum_posts (id, user_id, title, content, media_id, category, tags_json, liked_by_json, user_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);',
    [id, user.id, title, content, media_id, category, JSON.stringify(tags || []), JSON.stringify([]), JSON.stringify(user)]
  );

  const posts = buildForumPosts();
  const savedPost = posts.find(post => post.id === id);
  res.status(201).json(savedPost || {
    id,
    user_id: user.id,
    title,
    content,
    media_id,
    category,
    tags,
    liked_by: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    comments: [],
    user,
  });
});

app.post(`${API_PREFIX}/forum/posts/:postId/comments`, (req, res) => {
  const { postId } = req.params;
  const { user, content, id = uuid() } = req.body || {};

  if (!user || !user.id) {
    return res.status(400).json({ message: 'La información del usuario es obligatoria.' });
  }

  if (!content) {
    return res.status(400).json({ message: 'El contenido es obligatorio.' });
  }

  ensurePostExists(postId);

  execute(
    'INSERT INTO comments (id, post_id, user_id, content, likes_count, liked_by_json, parent_id, user_json, created_at) VALUES (?, ?, ?, ?, 0, ?, NULL, ?, CURRENT_TIMESTAMP);',
    [id, postId, user.id, content, JSON.stringify([]), JSON.stringify(user)]
  );

  const comment = {
    id,
    post_id: postId,
    user_id: user.id,
    content,
    likes_count: 0,
    liked_by: [],
    created_at: new Date().toISOString(),
    user,
    replies: [],
  };

  res.status(201).json(comment);
});

app.post(`${API_PREFIX}/forum/posts/:postId/comments/:commentId/replies`, (req, res) => {
  const { postId, commentId } = req.params;
  const { user, content, id = uuid() } = req.body || {};

  if (!user || !user.id) {
    return res.status(400).json({ message: 'La información del usuario es obligatoria.' });
  }

  if (!content) {
    return res.status(400).json({ message: 'El contenido es obligatorio.' });
  }

  ensurePostExists(postId);
  ensureCommentExists(commentId);

  execute(
    'INSERT INTO comments (id, post_id, user_id, content, likes_count, liked_by_json, parent_id, user_json, created_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?, CURRENT_TIMESTAMP);',
    [id, postId, user.id, content, JSON.stringify([]), commentId, JSON.stringify(user)]
  );

  const reply = {
    id,
    post_id: postId,
    user_id: user.id,
    content,
    likes_count: 0,
    liked_by: [],
    created_at: new Date().toISOString(),
    user,
    replies: [],
  };

  res.status(201).json(reply);
});

app.post(`${API_PREFIX}/forum/posts/:postId/likes`, (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body || {};

  if (!userId) {
    return res.status(400).json({ message: 'userId es obligatorio.' });
  }

  const post = queryOne('SELECT liked_by_json FROM forum_posts WHERE id = ?;', [postId]);
  if (!post) {
    return res.status(404).json({ message: 'Post no encontrado.' });
  }

  const likedBy = parseJson(post.liked_by_json, []);
  const hasLiked = likedBy.includes(userId);
  const next = hasLiked ? likedBy.filter(id => id !== userId) : [...likedBy, userId];
  execute('UPDATE forum_posts SET liked_by_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;', [JSON.stringify(next), postId]);

  res.json({ liked: !hasLiked, liked_by: next });
});

app.post(`${API_PREFIX}/forum/posts/:postId/comments/:commentId/likes`, (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.body || {};

  if (!userId) {
    return res.status(400).json({ message: 'userId es obligatorio.' });
  }

  const comment = ensureCommentExists(commentId);
  const likedBy = parseJson(comment.liked_by_json, []);
  const hasLiked = likedBy.includes(userId);
  const next = hasLiked ? likedBy.filter(id => id !== userId) : [...likedBy, userId];
  execute('UPDATE comments SET liked_by_json = ?, likes_count = ?, created_at = created_at WHERE id = ?;', [
    JSON.stringify(next),
    next.length,
    commentId,
  ]);

  res.json({ liked: !hasLiked, liked_by: next, likes_count: next.length });
});

app.get(`${API_PREFIX}/users/:userId/list`, (req, res) => {
  const { userId } = req.params;
  const rows = query('SELECT * FROM user_lists WHERE user_id = ? ORDER BY datetime(updated_at) DESC;', [userId]).map(mapListEntry);
  res.json(rows);
});

app.post(`${API_PREFIX}/users/:userId/list`, (req, res) => {
  const { userId } = req.params;
  const { media_id, status = 'plan_to_watch', progress = 0, is_public = true, notes = '', rating = null, id = uuid() } = req.body || {};

  if (!media_id) {
    return res.status(400).json({ message: 'media_id es obligatorio.' });
  }

  const existing = queryOne('SELECT id FROM user_lists WHERE user_id = ? AND media_id = ?;', [userId, media_id]);
  if (existing) {
    return res.status(409).json({ message: 'El contenido ya está en la lista.' });
  }

  execute(
    'INSERT INTO user_lists (id, user_id, media_id, status, rating, progress, is_public, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);',
    [id, userId, media_id, status, rating, progress, is_public ? 1 : 0, notes || '']
  );

  const saved = queryOne('SELECT * FROM user_lists WHERE id = ?;', [id]);
  res.status(201).json(mapListEntry(saved));
});

app.put(`${API_PREFIX}/users/:userId/list/:mediaId`, (req, res) => {
  const { userId, mediaId } = req.params;
  const updates = req.body || {};

  const existing = queryOne('SELECT * FROM user_lists WHERE user_id = ? AND media_id = ?;', [userId, mediaId]);
  if (!existing) {
    return res.status(404).json({ message: 'Entrada no encontrada.' });
  }

  const fields = [];
  const values = [];
  ['status', 'rating', 'progress', 'is_public', 'notes'].forEach(field => {
    if (typeof updates[field] !== 'undefined') {
      if (field === 'is_public') {
        fields.push(`${field} = ?`);
        values.push(updates[field] ? 1 : 0);
      } else {
        fields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }
  });

  if (fields.length === 0) {
    return res.json(mapListEntry(existing));
  }

  values.push(userId, mediaId);
  execute(`UPDATE user_lists SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND media_id = ?;`, values);

  const saved = queryOne('SELECT * FROM user_lists WHERE user_id = ? AND media_id = ?;', [userId, mediaId]);
  res.json(mapListEntry(saved));
});

app.delete(`${API_PREFIX}/users/:userId/list/:mediaId`, (req, res) => {
  const { userId, mediaId } = req.params;
  const existing = queryOne('SELECT id FROM user_lists WHERE user_id = ? AND media_id = ?;', [userId, mediaId]);
  if (!existing) {
    return res.status(404).json({ message: 'Entrada no encontrada.' });
  }
  execute('DELETE FROM user_lists WHERE user_id = ? AND media_id = ?;', [userId, mediaId]);
  res.status(204).end();
});

app.get(`${API_PREFIX}/users/:userId/profile`, (req, res) => {
  const { userId } = req.params;
  const profile = queryOne('SELECT * FROM profiles WHERE user_id = ?;', [userId]);
  if (!profile) {
    return res.json(null);
  }
  res.json(mapProfile(profile));
});

app.put(`${API_PREFIX}/users/:userId/profile`, (req, res) => {
  const { userId } = req.params;
  const { username = null, bio = null, avatar_url = null, banner_color = null } = req.body || {};

  let existing = queryOne('SELECT * FROM profiles WHERE user_id = ?;', [userId]);
  let shareSlug = existing?.share_slug;

  if (!shareSlug) {
    let candidate = buildProfileSlug(username || undefined, userId);
    while (queryOne('SELECT user_id FROM profiles WHERE share_slug = ?;', [candidate])) {
      candidate = buildProfileSlug(username || undefined, userId);
    }
    shareSlug = candidate;
  }

  execute(
    'INSERT INTO profiles (user_id, username, bio, avatar_url, banner_color, share_slug, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET username=excluded.username, bio=excluded.bio, avatar_url=excluded.avatar_url, banner_color=excluded.banner_color, share_slug=excluded.share_slug, updated_at=CURRENT_TIMESTAMP;',
    [userId, username, bio, avatar_url, banner_color, shareSlug]
  );

  const saved = queryOne('SELECT * FROM profiles WHERE user_id = ?;', [userId]);
  res.json(mapProfile(saved));
});

app.get(`${API_PREFIX}/public-profiles/:slug`, (req, res) => {
  const { slug } = req.params;
  const profile = queryOne('SELECT * FROM profiles WHERE share_slug = ?;', [slug]);
  if (!profile) {
    return res.status(404).json({ message: 'Perfil no encontrado.' });
  }

  const entries = query(
    `SELECT ul.*, mi.title AS media_title, mi.image_url AS media_image_url, mi.type AS media_type, mi.rating AS media_rating, mi.rating_count AS media_rating_count
     FROM user_lists ul
     JOIN media_items mi ON mi.id = ul.media_id
     WHERE ul.user_id = ? AND ul.is_public = 1
     ORDER BY datetime(ul.updated_at) DESC;`,
    [profile.user_id]
  );

  const formattedEntries = entries.map(entry => ({
    entry: mapListEntry(entry),
    media: {
      id: entry.media_id,
      title: entry.media_title,
      image_url: entry.media_image_url,
      type: entry.media_type,
      rating: Number(entry.media_rating) || 0,
      rating_count: Number(entry.media_rating_count) || 0,
    },
  }));

  res.json({ profile: mapProfile(profile), entries: formattedEntries });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
