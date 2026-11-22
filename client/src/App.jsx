import { useEffect, useState } from 'react';
import { createBook, deleteBook, getBooks, getStats, replaceBook, updateBook } from './api/books.js';
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
  const [editingBook, setEditingBook] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

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

  async function handleReplace(book) {
    await replaceBook(editingBook.id, book);
    setEditingBook(null);
    refresh();
  }

  async function runAction(book, action) {
    setBusyId(book.id);
    setActionError(null);
    try {
      await action();
      refresh();
    } catch (error) {
      setActionError(`"${book.title}": ${error.message}`);
    } finally {
      setBusyId(null);
    }
  }

  function handleToggleRead(book) {
    const changes = book.read ? { read: false, rating: null } : { read: true };
    runAction(book, () => updateBook(book.id, changes));
  }

  function handleRate(book, value) {
    const rating = value === '' ? null : Number(value);
    runAction(book, () => updateBook(book.id, { rating }));
  }

  function handleDelete(book) {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    runAction(book, async () => {
      await deleteBook(book.id);
      if (editingBook?.id === book.id) {
        setEditingBook(null);
      }
    });
  }

  return (
    <div className="app">
      <h1>Reading List</h1>
      <StatsPanel stats={stats.data} error={stats.error} />

      <main className="layout">
        <section className="books">
          <Filters filters={filters} onChange={setFilters} />
          {actionError && <p className="error">{actionError}</p>}
          <BookList
            loading={loading}
            error={list.error}
            books={list.books}
            busyId={busyId}
            onToggleRead={handleToggleRead}
            onRate={handleRate}
            onEdit={setEditingBook}
            onDelete={handleDelete}
          />
        </section>

        <aside>
          {editingBook ? (
            <BookForm
              key={editingBook.id}
              book={editingBook}
              onSubmit={handleReplace}
              onCancel={() => setEditingBook(null)}
            />
          ) : (
            <BookForm key="new" onSubmit={handleCreate} />
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;