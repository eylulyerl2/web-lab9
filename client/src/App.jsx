import { useEffect, useState } from 'react';
import { createBook, getBooks, getStats } from './api/books.js';
import Filters from './components/Filters.jsx';
import BookList from './components/BookList.jsx';
import BookForm from './components/BookForm.jsx';
import StatsPanel from './components/StatsPanel.jsx';

const INITIAL_FILTERS = { q: '', genre: '', read: '', sort: '', order: 'asc' };

function App() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [list, setList] = useState({ key: null, error: null, books: [] });
  const [stats, setStats] = useState({ data: null, error: null });
  const [refreshKey, setRefreshKey] = useState(0);

  // Identifies the request that matches the current filters and refresh count.
  const requestKey = `${JSON.stringify(filters)}#${refreshKey}`;
  const loading = list.key !== requestKey;

  // Load the list whenever the filters change or after a successful change.
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
  }, [filters, refreshKey, requestKey]);

  // Load the statistics on start and after every successful change.
  useEffect(() => {
    const controller = new AbortController();

    getStats(controller.signal)
      .then((data) => setStats({ data, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setStats({ data: null, error: error.message });
      });

    return () => controller.abort();
  }, [refreshKey]);

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  async function handleCreate(book) {
    await createBook(book);
    refresh();
  }

  return (
    <div className="app">
      <h1>Reading List</h1>
      <StatsPanel stats={stats.data} error={stats.error} />

      <main className="layout">
        <section className="books">
          <Filters filters={filters} onChange={setFilters} />
          <BookList loading={loading} error={list.error} books={list.books} />
        </section>

        <aside>
          <BookForm key="new" onSubmit={handleCreate} />
        </aside>
      </main>
    </div>
  );
}

export default App;