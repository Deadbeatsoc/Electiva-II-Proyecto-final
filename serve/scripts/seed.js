const { DB_PATH } = require('../db/database');
const { spawnSync } = require('node:child_process');
const { mediaItems, forumPosts } = require('../db/seedData');

const run = (sql) => {
  const result = spawnSync('sqlite3', [DB_PATH], {
    encoding: 'utf-8',
    input: sql,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || 'SQLite seed error');
  }
};

const queryValue = (sql) => {
  const result = spawnSync('sqlite3', ['-json', DB_PATH, sql], { encoding: 'utf-8' });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || 'SQLite seed query error');
  }
  const output = result.stdout?.trim();
  if (!output) {
    return null;
  }
  const rows = JSON.parse(output);
  return rows[0];
};

const seedMedia = () => {
  const countRow = queryValue('SELECT COUNT(*) as count FROM media_items;');
  if (countRow && countRow.count > 0) {
    console.log('Media items already seeded');
    return;
  }

  mediaItems.forEach(item => {
    run(`INSERT INTO media_items (id, title, type, description, image_url, release_date, rating, rating_count, genre_json, status, episodes, chapters, cast_json, created_at)
      VALUES ('${item.id}', '${item.title.replace(/'/g, "''")}', '${item.type}', '${item.description.replace(/'/g, "''")}', '${item.image_url}', '${item.release_date}', ${item.rating}, ${item.rating_count}, '${JSON.stringify(item.genre)}', '${item.status}', ${item.episodes || 'NULL'}, ${item.chapters || 'NULL'}, '${item.cast ? JSON.stringify(item.cast) : '[]'}', '${item.created_at || new Date().toISOString()}');`);
  });
  console.log('Seeded media items');
};

const seedForum = () => {
  const countRow = queryValue('SELECT COUNT(*) as count FROM forum_posts;');
  if (countRow && countRow.count > 0) {
    console.log('Forum posts already seeded');
    return;
  }

  forumPosts.forEach(post => {
    run(`INSERT INTO forum_posts (id, user_id, title, content, media_id, category, tags_json, liked_by_json, user_json, created_at, updated_at)
      VALUES ('${post.id}', '${post.user_id}', '${post.title.replace(/'/g, "''")}', '${post.content.replace(/'/g, "''")}', ${post.media_id ? `'${post.media_id}'` : 'NULL'}, '${post.category}', '${JSON.stringify(post.tags || [])}', '${JSON.stringify(post.liked_by || [])}', '${JSON.stringify(post.user)}', '${post.created_at}', '${post.updated_at}');`);

    const flatten = (comments, parentId = null) => {
      comments.forEach(comment => {
        run(`INSERT INTO comments (id, post_id, user_id, content, likes_count, liked_by_json, parent_id, user_json, created_at)
          VALUES ('${comment.id}', '${post.id}', '${comment.user_id}', '${comment.content.replace(/'/g, "''")}', ${comment.likes_count || 0}, '${JSON.stringify(comment.liked_by || [])}', ${parentId ? `'${parentId}'` : 'NULL'}, '${JSON.stringify(comment.user)}', '${comment.created_at}');`);
        if (comment.replies?.length) {
          flatten(comment.replies, comment.id);
        }
      });
    };

    flatten(post.comments || []);
  });

  console.log('Seeded forum posts and comments');
};

const main = () => {
  seedMedia();
  seedForum();
};

main();
