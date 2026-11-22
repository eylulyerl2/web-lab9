function BookItem({ book, busy, onToggleRead, onRate, onEdit, onDelete }) {
  return (
    <li className="book">
      <div className="book-info">
        <strong>{book.title}</strong>
        <span>
          {book.author} · {book.year} · {book.genre}
        </span>
      </div>

      <div className="book-actions">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={book.read}
            disabled={busy}
            onChange={() => onToggleRead(book)}
          />
          Read
        </label>

        <select
          value={book.rating ?? ''}
          disabled={busy || !book.read}
          onChange={(event) => onRate(book, event.target.value)}
          aria-label={`Rating for ${book.title}`}
        >
          <option value="">No rating</option>
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {'★'.repeat(value)}
            </option>
          ))}
        </select>

        <button type="button" disabled={busy} onClick={() => onEdit(book)}>
          Edit
        </button>
        <button type="button" disabled={busy} onClick={() => onDelete(book)}>
          Delete
        </button>
      </div>
    </li>
  );
}

export default BookItem;