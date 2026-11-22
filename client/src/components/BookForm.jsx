import { useState } from 'react';
import { GENRES } from '../genres.js';

const EMPTY_FORM = {
  title: '',
  author: '',
  year: '',
  genre: 'fiction',
  read: false,
  rating: '',
};

function toFormValues(book) {
  if (!book) return EMPTY_FORM;
  return {
    title: book.title,
    author: book.author,
    year: String(book.year),
    genre: book.genre,
    read: book.read,
    rating: book.rating === null ? '' : String(book.rating),
  };
}

function BookForm({ book, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toFormValues(book));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = Boolean(book);

  function update(name, value) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      return name === 'read' && !value ? { ...next, rating: '' } : next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      title: values.title,
      author: values.author,
      year: Number(values.year),
      genre: values.genre,
      read: values.read,
      rating: values.rating === '' ? null : Number(values.rating),
    };

    try {
      await onSubmit(payload);
      if (!isEditing) {
        setValues(EMPTY_FORM);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      <h2>{isEditing ? `Edit "${book.title}"` : 'Add a book'}</h2>

      <label>
        Title
        <input
          value={values.title}
          onChange={(event) => update('title', event.target.value)}
          required
          maxLength={100}
        />
      </label>

      <label>
        Author
        <input
          value={values.author}
          onChange={(event) => update('author', event.target.value)}
          required
          maxLength={100}
        />
      </label>

      <label>
        Year
        <input
          type="number"
          value={values.year}
          onChange={(event) => update('year', event.target.value)}
          required
        />
      </label>

      <label>
        Genre
        <select value={values.genre} onChange={(event) => update('genre', event.target.value)}>
          {GENRES.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={values.read}
          onChange={(event) => update('read', event.target.checked)}
        />
        Read
      </label>

      <label>
        Rating
        <select
          value={values.rating}
          disabled={!values.read}
          onChange={(event) => update('rating', event.target.value)}
        >
          <option value="">No rating</option>
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="error">{error}</p>}

      <div className="form-buttons">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Add book'}
        </button>
        {isEditing && (
          <button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default BookForm;