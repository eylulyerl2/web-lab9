const API_URL = import.meta.env.VITE_API_URL;

// Shared helper for every request to the API.
async function request(path, { method = 'GET', body, signal } = {}) {
  const options = { method, signal };

  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, options);

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with status ${response.status}`);
  }

  return data;
}

function bookPath(id) {
  return `/api/books/${encodeURIComponent(id)}`;
}

export function getBooks(filters, signal) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value !== '' && value !== undefined && value !== null) {
      params.set(name, value);
    }
  }
  const query = params.toString();
  return request(`/api/books${query ? `?${query}` : ''}`, { signal });
}

export function getStats(signal) {
  return request('/api/stats', { signal });
}

export function createBook(book) {
  return request('/api/books', { method: 'POST', body: book });
}

export function replaceBook(id, book) {
  return request(bookPath(id), { method: 'PUT', body: book });
}

export function updateBook(id, changes) {
  return request(bookPath(id), { method: 'PATCH', body: changes });
}

export function deleteBook(id) {
  return request(bookPath(id), { method: 'DELETE' });
}