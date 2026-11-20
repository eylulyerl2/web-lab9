import express from 'express';
import cors from 'cors';
import * as store from './booksStore.js';
import { validateQuery } from './validate.js';

const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();

function logger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}

app.use(logger);
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

function compareBooks(field) {
  return (a, b) => {
    if (field === 'title' || field === 'author') {
      return a[field].localeCompare(b[field], undefined, { sensitivity: 'base' });
    }
    return a[field] - b[field];
  };
}

function sortBooks(books, sort, order) {
  const copy = [...books];
  if (!sort) return copy;

  const direction = order === 'desc' ? -1 : 1;
  const compare = compareBooks(sort);

  return copy.sort((a, b) => {
    if (sort === 'rating') {
      if (a.rating === null && b.rating === null) return a.id - b.id;
      if (a.rating === null) return 1;
      if (b.rating === null) return -1;
    }
    return direction * compare(a, b) || a.id - b.id;
  });
}

app.get('/api/books', async (req, res) => {
  const { value: options, error } = validateQuery(req.query);
  if (error) {
    return res.status(400).json({ error });
  }

  const allBooks = await store.getAllBooks();
  const filtered = allBooks.filter(
    (book) =>
      (options.genre === undefined || book.genre === options.genre) &&
      (options.read === undefined || book.read === options.read) &&
      (options.q === '' ||
        book.title.toLowerCase().includes(options.q) ||
        book.author.toLowerCase().includes(options.q))
  );

  const sorted = sortBooks(filtered, options.sort, options.order);
  const start = (options.page - 1) * options.limit;

  res.json({
    total: sorted.length,
    page: options.page,
    limit: options.limit,
    books: sorted.slice(start, start + options.limit),
  });
});

// 404 fallback for every path that matched no route.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Allowed client origin: ${CLIENT_ORIGIN}`);
});