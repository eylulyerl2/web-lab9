import BookItem from './BookItem.jsx';

function BookList({ loading, error, books }) {
  if (loading) {
    return <p>Loading books...</p>;
  }

  if (error) {
    return <p className="error">Could not load books: {error}</p>;
  }

  if (books.length === 0) {
    return <p>No books found.</p>;
  }

  return (
    <ul className="book-list">
      {books.map((book) => (
        <BookItem key={book.id} book={book} />
      ))}
    </ul>
  );
}

export default BookList;