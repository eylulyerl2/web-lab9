function BookItem({ book, onEdit }) {
  return (
    <li className="book">
      <div className="book-info">
        <strong>{book.title}</strong>
        <span>
          {book.author} · {book.year} · {book.genre}
        </span>
      </div>
      <div className="book-actions">
        <span>{book.read ? 'Read' : 'Unread'}</span>
        <span>{book.rating ? '★'.repeat(book.rating) : 'No rating'}</span>
        <button type="button" onClick={() => onEdit(book)}>
          Edit
        </button>
      </div>
    </li>
  );
}

export default BookItem;