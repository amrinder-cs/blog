const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const path = require('path');
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create.html'));
});

// Return HTML fragment for a new post
app.post('/posts', async (req, res) => {
  try {
    const { title, content } = req.body;
    // const sanitizedContent = sanitizeHtml(content);

    const post = await db.Post.create({ title, content: content });
    console.log(content)

    res.send(`
      <div class="card mb-3" id="post-${post.id}">
        <div class="card-body">
          <h5 class="card-title">${post.title}</h5>
          <p class="card-text">${post.content}</p>
          <button class="btn btn-secondary" hx-get="/posts/${post.id}/comments" hx-target="#comments-${post.id}">Show Comments</button>
        </div>
        <div class="card-footer">
          <form hx-post="/posts/${post.id}/comments" hx-target="#comments-${post.id}" hx-swap="beforeend">
            <div class="form-group">
              <input type="text" class="form-control" name="name" placeholder="Your name" required>
            </div>
            <div class="form-group">
              <textarea class="form-control" name="content" rows="2" placeholder="Your comment" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Submit</button>
          </form>
        </div>
        <div id="comments-${post.id}" class="mt-3">
          <!-- Comments will be loaded here dynamically -->
        </div>
      </div>
    `);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Return HTML fragment for all posts
app.get('/posts', async (req, res) => {
  try {
    // Fetch only id and title of the posts
    const posts = await db.Post.findAll({
      attributes: ['id', 'title']
    });

    const postsHtml = posts.map(post => `
      <div class="card mb-3" id="post-${post.id}">
        <div class="card-body">
          <a href="/posts/${post.id}" class="card-title"><h5>${post.title}</h5></a>
        </div>
      </div>
    `).join('');

    res.send(`
      <div class="container mt-5">
        <hr>
        ${postsHtml}
      </div>
    `);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to get a single post by id and its comments
app.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await db.Post.findByPk(postId);
    if (!post) {
      return res.status(404).send('Post not found');
    }

    const comments = await db.Comment.findAll({ where: { postId } });

    const commentsHtml = comments.map(comment => `
      <div class="card mb-2">
        <div class="card-body">
          <h5 class="card-title">${comment.name}</h5>
          <p class="card-text">${comment.content}</p>
        </div>
      </div>
    `).join('');

    res.send(`
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog</title>
    <script src="https://unpkg.com/htmx.org@1.7.0"></script>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
</head>
<body>
      <div class="container mt-5">
        <h1>${post.title}</h1>
        <p>${post.content}</p>
        <div id="comments-section" class="mt-3">
          ${commentsHtml}
        </div>

        <form hx-post="/posts/${postId}/comments" hx-target="#comments-section" hx-swap="beforeend">
          <div class="form-group">
            <input type="text" class="form-control" name="name" placeholder="Your name" required>
          </div>
          <div class="form-group">
            <textarea class="form-control" name="content" rows="2" placeholder="Your comment" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Submit</button>
        </form>

      </div>
    `);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Return HTML fragment for comments of a post
app.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await db.Comment.findAll({ where: { postId } });

    const commentsHtml = comments.map(comment => `
      <div class="card mb-2">
        <div class="card-body">
          <h5 class="card-title">${comment.name}</h5>
          <p class="card-text">${comment.content}</p>
        </div>
      </div>
    `).join('');

    res.send(commentsHtml);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return HTML fragment for a new comment
app.post('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { name, content } = req.body;
    const sanitizedContent = sanitizeHtml(content);

    const comment = await db.Comment.create({ name, content: sanitizedContent, postId });

    res.send(`
      <div class="card mb-2">
        <div class="card-body">
          <h5 class="card-title">${comment.name}</h5>
          <p class="card-text">${comment.content}</p>
        </div>
      </div>
    `);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Sync Database and Start Server
db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});
