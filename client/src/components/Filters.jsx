import { GENRES } from '../genres.js';

function Filters({ filters, onChange }) {
  function update(name, value) {
    onChange({ ...filters, [name]: value });
  }

  return (
    <div className="filters">
      <label>
        Search
        <input
          type="search"
          value={filters.q}
          onChange={(event) => update('q', event.target.value)}
          placeholder="Title or author"
        />
      </label>

      <label>
        Genre
        <select value={filters.genre} onChange={(event) => update('genre', event.target.value)}>
          <option value="">All genres</option>
          {GENRES.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </label>

      <label>
        Status
        <select value={filters.read} onChange={(event) => update('read', event.target.value)}>
          <option value="">All books</option>
          <option value="true">Read</option>
          <option value="false">Unread</option>
        </select>
      </label>

      <label>
        Sort by
        <select value={filters.sort} onChange={(event) => update('sort', event.target.value)}>
          <option value="">Default (id)</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
          <option value="year">Year</option>
          <option value="rating">Rating</option>
        </select>
      </label>

      <label>
        Order
        <select value={filters.order} onChange={(event) => update('order', event.target.value)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>
    </div>
  );
}

export default Filters;