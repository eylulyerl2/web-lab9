# Assignment 9 – Reading List (Full-Stack)

A full-stack Reading List application: a REST API written with Node.js and Express 5, and a React client built with Vite that uses it. The server keeps the books in memory, so the data returns to its initial seed of 6 books every time the server restarts.

## How to Install and Run

Requirements: Node.js (LTS) and npm. The server and the client run at the same time, so use two terminals.

### 1. Server (port 3000)

```bash
cd server
npm install
npm run dev
```

- `npm start` runs `node server.js`; `npm run dev` runs `node --watch server.js` and restarts on every change.
- Environment variables (both optional):

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | Port the API listens on |
| `CLIENT_ORIGIN` | `http://localhost:5173` | The only origin allowed by CORS |

Example in PowerShell: `$env:PORT=4000; $env:CLIENT_ORIGIN="http://localhost:5174"; npm start`

### 2. Client (port 5173)

```bash
cd client
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
npm run dev
```

Then open <http://localhost:5173>.

| Variable | Example | Meaning |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Base URL of the API, read with `import.meta.env.VITE_API_URL` |

`client/.env` is not committed (it is in `.gitignore`); `client/.env.example` documents the variable. No Vite proxy is used: the browser calls the API directly and the server answers with CORS headers.

## File Organization

```
/assignment9
├── server/
│   ├── server.js          # Express app: middleware, routes, 404 fallback, error handler
│   ├── booksStore.js      # In-memory data, async functions, immutable updates
│   ├── validate.js        # Hand-written validation for books, ids and query parameters
│   ├── package.json       # "type": "module", start/dev scripts, express + cors
│   └── package-lock.json
├── client/
│   ├── src/
│   │   ├── api/books.js   # The only place that calls fetch (shared request helper)
│   │   ├── components/
│   │   │   ├── Filters.jsx     # Search, genre, read, sort and order controls
│   │   │   ├── BookList.jsx    # Loading, error and empty states
│   │   │   ├── BookItem.jsx    # One book: read toggle, rating, edit, delete
│   │   │   ├── BookForm.jsx    # Add (POST) and edit (PUT) form
│   │   │   └── StatsPanel.jsx  # Statistics from GET /api/stats
│   │   ├── genres.js      # List of allowed genres for the selects
│   │   ├── App.jsx        # State, data loading with AbortController, handlers
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── .gitignore             # node_modules/, .env, dist/
└── README.md
```

## API Overview

| Method and path | Success | Errors |
|---|---|---|
| `GET /api/books` | `200` `{ total, page, limit, books }` | `400` |
| `GET /api/books/:id` | `200` the book | `400`, `404` |
| `POST /api/books` | `201` the book + `Location` header | `400`, `409` |
| `PUT /api/books/:id` | `200` the replaced book | `400`, `404`, `409` |
| `PATCH /api/books/:id` | `200` the updated book | `400`, `404`, `409` |
| `DELETE /api/books/:id` | `204` with no body | `400`, `404` |
| `GET /api/stats` | `200` `{ total, read, unread, averageRating, byGenre }` | – |
| any other path | – | `404` `{ "error": "Not found" }` |

All errors have the shape `{ "error": "message" }`. Malformed JSON returns `400`, and unexpected errors return `500` with `{ "error": "Something went wrong" }`.

**Query options for `GET /api/books`:** `genre`, `read` (`true`/`false`), `q` (text in title or author), `sort` (`title`, `author`, `year`, `rating`), `order` (`asc`/`desc`), `limit` (1–50, default 50) and `page` (default 1). They can be combined; an invalid or repeated parameter returns `400`. Books without a rating always sort last.

**`GET /api/crash`:** This route is kept on purpose. It throws an error inside an `async` handler to prove that Express 5 passes the error to the error-handling middleware, which logs it on the server and answers `500` with `{ "error": "Something went wrong" }` without exposing the stack trace.