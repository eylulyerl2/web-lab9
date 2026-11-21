import express from 'express';
import cors from 'cors';
import * as store from './booksStore.js';
import { parseId, pickBookFields, isJsonObject, validateBook, validateQuery } from './validate.js';

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

// Shared checks for routes with :id. Sends the error response and returns null when the id is bad.
async function findBookOrRespond(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'Book id must be a positive integer.' });
    return null;
  }
  const book = await store.getBookById(id);
  if (!book) {
    res.status(404).json({ error: `Book with id ${id} not found.` });
    return null;
  }
  return book;
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

app.get('/api/books/:id', async (req, res) => {
  const book = await findBookOrRespond(req, res);
  if (!book) return;
  res.json(book);
});

app.post('/api/books', async (req, res) => {
  const { value, error } = validateBook(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  if (await store.isDuplicate(value.title, value.author)) {
    return res.status(409).json({ error: 'A book with this title and author already exists.' });
  }

  const book = await store.createBook(value);
  res.status(201).location(`/api/books/${book.id}`).json(book);
});

app.put('/api/books/:id', async (req, res) => {
  const existing = await findBookOrRespond(req, res);
  if (!existing) return;

  const { value, error } = validateBook(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  if (await store.isDuplicate(value.title, value.author, existing.id)) {
    return res.status(409).json({ error: 'A book with this title and author already exists.' });
  }

  res.json(await store.replaceBook(existing.id, value));
});

app.patch('/api/books/:id', async (req, res) => {
  const existing = await findBookOrRespond(req, res);
  if (!existing) return;

  if (!isJsonObject(req.body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }

  const merged = { ...existing, ...pickBookFields(req.body) };
  const { value, error } = validateBook(merged);
  if (error) {
    return res.status(400).json({ error });
  }

  if (await store.isDuplicate(value.title, value.author, existing.id)) {
    return res.status(409).json({ error: 'A book with this title and author already exists.' });
  }

  res.json(await store.replaceBook(existing.id, value));
});

// 404 fallback for every path that matched no route.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Allowed client origin: ${CLIENT_ORIGIN}`);
});