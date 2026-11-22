import { useEffect, useState } from 'react';
import { getBooks } from './api/books.js';
import BookList from './components/BookList.jsx';

const INITIAL_FILTERS = { q: '', genre: '', read: '', sort: '', order: 'asc' };

function App() {
  const [filters] = useState(INITIAL_FILTERS);
  const [list, setList] = useState({ key: null, error: null, books: [] });

  // Identifies the request that matches the current filters.
  const requestKey = JSON.stringify(filters);
  const loading = list.key !== requestKey;

  useEffect(() => {
    const controller = new AbortController();

    getBooks(filters, controller.signal)
      .then((data) => setList({ key: requestKey, error: null, books: data.books }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setList({ key: requestKey, error: error.message, books: [] });
      });

    // Cancel the old request so a slow, stale response can never overwrite a newer one.
    return () => controller.abort();
  }, [filters, requestKey]);

  return (
    <div className="app">
      <h1>Reading List</h1>
      <BookList loading={loading} error={list.error} books={list.books} />
    </div>
  );
}

export default App;