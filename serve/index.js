const express = require('express');
const cors = require('cors');
const { v4: uuid } = require('uuid');
const { readData, writeData } = require('./dataStore');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function getData() {
  return readData();
}

function saveData(data) {
  writeData(data);
}

function findComment(comments = [], commentId) {
  for (const comment of comments) {
    if (comment.id === commentId) {
      return comment;
    }
    const nested = findComment(comment.replies || [], commentId);
    if (nested) {
      return nested;
    }
  }
  return null;
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/forum/posts', (_req, res) => {
  const data = getData();
  res.json(data.forumPosts || []);
});

app.post('/api/forum/posts', (req, res) => {
  const data = getData();
  const { title, content, category, media_id, tags = [], user, id } = req.body;

  if (!user || !user.id) {
    return res.status(400).json({ message: 'User information is required to create a post.' });
  }
  if (!title || !content || !category) {
    return res.status(400).json({ message: 'Title, content, and category are required.' });
  }

  const timestamp = new Date().toISOString();
  const post = {
    id: id || uuid(),
    user_id: user.id,
    title,
    content,
    media_id: media_id || null,
    category,
    tags,
    liked_by: [],
    comments: [],
    created_at: timestamp,
    updated_at: timestamp,
    user,
  };

  data.forumPosts = [post, ...(data.forumPosts || [])];
  saveData(data);

  res.status(201).json(post);
});

app.post('/api/forum/posts/:postId/comments', (req, res) => {
  const data = getData();
  const { postId } = req.params;
  const { user, content, id } = req.body;

  if (!user || !user.id) {
    return res.status(400).json({ message: 'User information is required to comment.' });
  }
  if (!content) {
    return res.status(400).json({ message: 'Comment content is required.' });
  }

  const post = (data.forumPosts || []).find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found.' });
  }

  const timestamp = new Date().toISOString();
  const comment = {
    id: id || uuid(),
    post_id: postId,
    user_id: user.id,
    content,
    likes_count: 0,
    liked_by: [],
    created_at: timestamp,
    replies: [],
    user,
  };

  post.comments = [...(post.comments || []), comment];
  post.updated_at = timestamp;
  saveData(data);

  res.status(201).json(comment);
});

app.post('/api/forum/posts/:postId/comments/:commentId/replies', (req, res) => {
  const data = getData();
  const { postId, commentId } = req.params;
  const { user, content, id } = req.body;

  if (!user || !user.id) {
    return res.status(400).json({ message: 'User information is required to reply.' });
  }
  if (!content) {
    return res.status(400).json({ message: 'Reply content is required.' });
  }

  const post = (data.forumPosts || []).find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found.' });
  }

  const parentComment = findComment(post.comments, commentId);
  if (!parentComment) {
    return res.status(404).json({ message: 'Comment not found.' });
  }

  const timestamp = new Date().toISOString();
  const reply = {
    id: id || uuid(),
    post_id: postId,
    user_id: user.id,
    content,
    likes_count: 0,
    liked_by: [],
    created_at: timestamp,
    replies: [],
    user,
  };

  parentComment.replies = [...(parentComment.replies || []), reply];
  post.updated_at = timestamp;
  saveData(data);

  res.status(201).json(reply);
});

app.post('/api/forum/posts/:postId/likes', (req, res) => {
  const data = getData();
  const { postId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User id is required.' });
  }

  const post = (data.forumPosts || []).find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found.' });
  }

  const hasLiked = (post.liked_by || []).includes(userId);
  post.liked_by = hasLiked ? post.liked_by.filter(id => id !== userId) : [...post.liked_by, userId];
  post.updated_at = new Date().toISOString();
  saveData(data);

  res.json({ liked: !hasLiked, liked_by: post.liked_by });
});

app.post('/api/forum/posts/:postId/comments/:commentId/likes', (req, res) => {
  const data = getData();
  const { postId, commentId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User id is required.' });
  }

  const post = (data.forumPosts || []).find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found.' });
  }

  const comment = findComment(post.comments, commentId);
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found.' });
  }

  const hasLiked = (comment.liked_by || []).includes(userId);
  comment.liked_by = hasLiked
    ? comment.liked_by.filter(id => id !== userId)
    : [...(comment.liked_by || []), userId];
  comment.likes_count = comment.liked_by.length;
  post.updated_at = new Date().toISOString();
  saveData(data);

  res.json({ liked: !hasLiked, liked_by: comment.liked_by, likes_count: comment.likes_count });
});

app.get('/api/users/:userId/list', (req, res) => {
  const data = getData();
  const { userId } = req.params;
  const lists = data.userLists || {};
  res.json(lists[userId] || []);
});

app.post('/api/users/:userId/list', (req, res) => {
  const data = getData();
  const { userId } = req.params;
  const { media_id, status = 'plan_to_watch', progress = 0, is_public = true, notes = '', rating = 0, id } = req.body;

  if (!media_id) {
    return res.status(400).json({ message: 'media_id is required.' });
  }

  data.userLists = data.userLists || {};
  const existingList = data.userLists[userId] || [];
  if (existingList.some(entry => entry.media_id === media_id)) {
    return res.status(409).json({ message: 'Media already exists in user list.' });
  }

  const timestamp = new Date().toISOString();
  const entry = {
    id: id || uuid(),
    user_id: userId,
    media_id,
    status,
    rating,
    progress,
    is_public,
    notes,
    created_at: timestamp,
    updated_at: timestamp,
  };

  data.userLists[userId] = [...existingList, entry];
  saveData(data);

  res.status(201).json(entry);
});

app.put('/api/users/:userId/list/:mediaId', (req, res) => {
  const data = getData();
  const { userId, mediaId } = req.params;
  const updates = req.body || {};

  data.userLists = data.userLists || {};
  const existingList = data.userLists[userId] || [];
  const index = existingList.findIndex(entry => entry.media_id === mediaId);

  if (index === -1) {
    return res.status(404).json({ message: 'List entry not found.' });
  }

  const entry = {
    ...existingList[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  existingList[index] = entry;
  data.userLists[userId] = existingList;
  saveData(data);

  res.json(entry);
});

app.delete('/api/users/:userId/list/:mediaId', (req, res) => {
  const data = getData();
  const { userId, mediaId } = req.params;

  data.userLists = data.userLists || {};
  const existingList = data.userLists[userId] || [];
  const nextList = existingList.filter(entry => entry.media_id !== mediaId);

  if (nextList.length === existingList.length) {
    return res.status(404).json({ message: 'List entry not found.' });
  }

  data.userLists[userId] = nextList;
  saveData(data);

  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
