import { useEffect, useState } from 'react';
import { getBooks, getStats } from './api/books.js';
import Filters from './components/Filters.jsx';
import BookList from './components/BookList.jsx';
import StatsPanel from './components/StatsPanel.jsx';

const INITIAL_FILTERS = { q: '', genre: '', read: '', sort: '', order: 'asc' };

function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [list, setList] = useState({ key: null, error: null, books: [] });
  const [stats, setStats] = useState({ data: null, error: null });

  // Identifies the request that matches the current filters.
  const requestKey = JSON.stringify(filters);
  const loading = list.key !== requestKey;

  // Load the list from the server whenever a control changes.
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

  // Load the statistics once when the page opens.
  useEffect(() => {
    const controller = new AbortController();

    getStats(controller.signal)
      .then((data) => setStats({ data, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setStats({ data: null, error: error.message });
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="app">
      <h1>Reading List</h1>
      <StatsPanel stats={stats.data} error={stats.error} />
      <Filters filters={filters} onChange={setFilters} />
      <BookList loading={loading} error={list.error} books={list.books} />
    </div>
  );
}

export default App;