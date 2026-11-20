export const GENRES = ['fiction', 'non-fiction', 'science', 'history', 'fantasy', 'other'];
export const SORT_FIELDS = ['title', 'author', 'year', 'rating'];

const BOOK_FIELDS = ['title', 'author', 'year', 'genre', 'read', 'rating'];
const QUERY_PARAMS = ['genre', 'read', 'q', 'sort', 'order', 'limit', 'page'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkText(value, field) {
  if (typeof value !== 'string') {
    return `${field} must be a string.`;
  }
  const length = value.trim().length;
  if (length < 1 || length > 100) {
    return `${field} must be 1 to 100 characters long after trimming.`;
  }
  return null;
}

// Returns a positive integer id, or null when the value is not one.
export function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

// Copies only the known book fields; unknown fields and "id" are ignored.
export function pickBookFields(body) {
  const picked = {};
  for (const field of BOOK_FIELDS) {
    if (Object.hasOwn(body, field)) {
      picked[field] = body[field];
    }
  }
  return picked;
}

export function isJsonObject(value) {
  return isPlainObject(value);
}

// Validates a complete book. Returns { error } or { value } with a clean book (no id).
export function validateBook(input) {
  if (!isPlainObject(input)) {
    return { error: 'Request body must be a JSON object.' };
  }

  const titleError = checkText(input.title, 'title');
  if (titleError) return { error: titleError };

  const authorError = checkText(input.author, 'author');
  if (authorError) return { error: authorError };

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(input.year) || input.year < 1000 || input.year > currentYear) {
    return { error: `year must be an integer between 1000 and ${currentYear}.` };
  }

  if (!GENRES.includes(input.genre)) {
    return { error: `genre must be one of: ${GENRES.join(', ')}.` };
  }

  const read = input.read ?? false;
  if (typeof read !== 'boolean') {
    return { error: 'read must be true or false.' };
  }

  const rating = input.rating ?? null;
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return { error: 'rating must be an integer from 1 to 5, or null.' };
  }
  if (rating !== null && !read) {
    return { error: 'rating is only allowed when read is true.' };
  }

  return {
    value: {
      title: input.title.trim(),
      author: input.author.trim(),
      year: input.year,
      genre: input.genre,
      read,
      rating,
    },
  };
}

function parsePositiveInt(value) {
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

// Validates the query string of GET /api/books. Returns { error } or { value } with the options.
export function validateQuery(query) {
  for (const name of QUERY_PARAMS) {
    if (Array.isArray(query[name])) {
      return { error: `Query parameter "${name}" must not be repeated.` };
    }
  }

  const { genre, read, q, sort, order = 'asc', limit = '50', page = '1' } = query;

  if (genre !== undefined && !GENRES.includes(genre)) {
    return { error: `genre must be one of: ${GENRES.join(', ')}.` };
  }
  if (read !== undefined && read !== 'true' && read !== 'false') {
    return { error: 'read must be "true" or "false".' };
  }
  if (sort !== undefined && !SORT_FIELDS.includes(sort)) {
    return { error: `sort must be one of: ${SORT_FIELDS.join(', ')}.` };
  }
  if (order !== 'asc' && order !== 'desc') {
    return { error: 'order must be "asc" or "desc".' };
  }

  const limitNumber = parsePositiveInt(limit);
  if (limitNumber === null || limitNumber > 50) {
    return { error: 'limit must be an integer from 1 to 50.' };
  }
  const pageNumber = parsePositiveInt(page);
  if (pageNumber === null) {
    return { error: 'page must be a positive integer.' };
  }

  return {
    value: {
      genre,
      read: read === undefined ? undefined : read === 'true',
      q: q === undefined ? '' : String(q).trim().toLowerCase(),
      sort,
      order,
      limit: limitNumber,
      page: pageNumber,
    },
  };
}