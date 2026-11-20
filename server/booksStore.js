const DELAY_MS = 50;

const SEED_BOOKS = [
  { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien', year: 1937, genre: 'fantasy', read: true, rating: 5 },
  { id: 2, title: '1984', author: 'George Orwell', year: 1949, genre: 'fiction', read: true, rating: 4 },
  { id: 3, title: 'A Brief History of Time', author: 'Stephen Hawking', year: 1988, genre: 'science', read: false, rating: null },
  { id: 4, title: 'Sapiens', author: 'Yuval Noah Harari', year: 2011, genre: 'history', read: true, rating: null },
  { id: 5, title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', year: 1997, genre: 'fantasy', read: false, rating: null },
  { id: 6, title: 'Atomic Habits', author: 'James Clear', year: 2018, genre: 'non-fiction', read: true, rating: 3 },
];

// The array and every book are frozen, so any accidental in-place change throws an error.
let books = Object.freeze(SEED_BOOKS.map((book) => Object.freeze({ ...book })));
let nextId = books.length + 1;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sameText(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function getAllBooks() {
  await wait(DELAY_MS);
  return books;
}

export async function getBookById(id) {
  await wait(DELAY_MS);
  return books.find((book) => book.id === id) ?? null;
}

export async function isDuplicate(title, author, ignoreId = null) {
  await wait(DELAY_MS);
  return books.some(
    (book) => book.id !== ignoreId && sameText(book.title, title) && sameText(book.author, author)
  );
}

export async function createBook(data) {
  await wait(DELAY_MS);
  const book = Object.freeze({ id: nextId, ...data });
  nextId += 1;
  books = Object.freeze([...books, book]);
  return book;
}

export async function replaceBook(id, data) {
  await wait(DELAY_MS);
  const updated = Object.freeze({ id, ...data });
  books = Object.freeze(books.map((book) => (book.id === id ? updated : book)));
  return updated;
}

export async function deleteBook(id) {
  await wait(DELAY_MS);
  const exists = books.some((book) => book.id === id);
  if (exists) {
    books = Object.freeze(books.filter((book) => book.id !== id));
  }
  return exists;
}