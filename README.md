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

## Testing Evidence

All requests were sent with `curl.exe --include` in PowerShell against the running server. JSON bodies are piped into curl (`--data-binary "@-"`), because PowerShell breaks the quotes when JSON is written directly in the command. Requests 1–5 were made in one server session in the morning; the server was then restarted, `Dune` was created again (it got the same `id: 7`), and requests 6–13 were made in a second session.

### 1. `GET /api/stats` – before a change (200)

```
> curl.exe --include http://localhost:3000/api/stats
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 125
ETag: W/"7d-uhtOPibLlihOwBwtw67aZxfUEx0"
Date: Mon, 23 Nov 2026 06:45:13 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":6,"read":4,"unread":2,"averageRating":4,"byGenre":{"fantasy":2,"fiction":1,"science":1,"history":1,"non-fiction":1}}
```

### 2. List with three query parameters (200)

```
> curl.exe --include "http://localhost:3000/api/books?genre=fantasy&sort=year&order=desc"
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 291
ETag: W/"123-J6IFxt5hPleyresxUj9jY5RUXJI"
Date: Mon, 23 Nov 2026 06:45:24 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":2,"page":1,"limit":50,"books":[{"id":5,"title":"Harry Potter and the Philosopher's Stone","author":"J.K. Rowling","year":1997,"genre":"fantasy","read":false,"rating":null},{"id":1,"title":"The Hobbit","author":"J.R.R. Tolkien","year":1937,"genre":"fantasy","read":true,"rating":5}]}
```

### 3. One book (200)

```
> curl.exe --include http://localhost:3000/api/books/2
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 101
ETag: W/"65-sJIR+FkFOOo7HskNYhvHmhbuIqo"
Date: Mon, 23 Nov 2026 06:45:32 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":2,"title":"1984","author":"George Orwell","year":1949,"genre":"fiction","read":true,"rating":4}
```

### 4. Create a book (201 with `Location`)

```
> '{"title":"Dune","author":"Frank Herbert","year":1965,"genre":"fiction"}' | curl.exe --include -X POST http://localhost:3000/api/books -H "Content-Type: application/json" --data-binary "@-"
HTTP/1.1 201 Created
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Location: /api/books/7
Content-Type: application/json; charset=utf-8
Content-Length: 105
ETag: W/"69-tBoRwMOlhgKVHHUJF7u7rGrfAM0"
Date: Mon, 23 Nov 2026 06:47:45 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":7,"title":"Dune","author":"Frank Herbert","year":1965,"genre":"fiction","read":false,"rating":null}
```

### 5. `GET /api/stats` – after the change (200)

`total` went from 6 to 7, `unread` from 2 to 3 and `fiction` from 1 to 2.

```
> curl.exe --include http://localhost:3000/api/stats
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 125
ETag: W/"7d-oYmkwPtjsTiW/lkj86R5YQKFkKo"
Date: Mon, 23 Nov 2026 06:47:57 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":7,"read":4,"unread":3,"averageRating":4,"byGenre":{"fantasy":2,"fiction":2,"science":1,"history":1,"non-fiction":1}}
```

### 6. Invalid body (400)

```
> '{"title":"Future Book","author":"Someone","year":3000,"genre":"fiction"}' | curl.exe --include -X POST http://localhost:3000/api/books -H "Content-Type: application/json" --data-binary "@-"
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 58
ETag: W/"3a-Gxl8+ZuhTU63tEMQRliympgkbUA"
Date: Mon, 23 Nov 2026 15:37:05 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"year must be an integer between 1000 and 2026."}
```

### 7. Repeated query parameter (400)

```
> curl.exe --include "http://localhost:3000/api/books?genre=fiction&genre=history"
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 59
ETag: W/"3b-A+62jjNt7tbVrdUVsBJeHd6cu0A"
Date: Mon, 23 Nov 2026 15:37:11 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Query parameter \"genre\" must not be repeated."}
```

### 8. Missing book (404)

```
> curl.exe --include http://localhost:3000/api/books/999
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 39
ETag: W/"27-pJYxKO1yKJlFqOB1b4/3bf8hp5Q"
Date: Mon, 23 Nov 2026 15:37:18 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book with id 999 not found."}
```

### 9. Duplicate (409)

Same title and author as book 7, only in lower case.

```
> '{"title":"dune","author":"frank herbert","year":1965,"genre":"fiction"}' | curl.exe --include -X POST http://localhost:3000/api/books -H "Content-Type: application/json" --data-binary "@-"
HTTP/1.1 409 Conflict
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 61
ETag: W/"3d-GBnKybuWIP+OinY/nj2iyiSjGGI"
Date: Mon, 23 Nov 2026 15:37:24 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"A book with this title and author already exists."}
```

### 10. `PUT` – replace the whole book (200)

Every field is sent; `genre`, `read` and `rating` all change.

```
> '{"title":"Dune","author":"Frank Herbert","year":1965,"genre":"science","read":true,"rating":5}' | curl.exe --include -X PUT http://localhost:3000/api/books/7 -H "Content-Type: application/json" --data-binary "@-"
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 101
ETag: W/"65-J1i6YqPq80W1qM/XDxFUXef/SP8"
Date: Mon, 23 Nov 2026 15:39:19 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":7,"title":"Dune","author":"Frank Herbert","year":1965,"genre":"science","read":true,"rating":5}
```

### 11. `PATCH` – change only the rating of the same book (200)

Only `rating` is sent; every other field keeps the value from the `PUT` above.

```
> '{"rating":3}' | curl.exe --include -X PATCH http://localhost:3000/api/books/7 -H "Content-Type: application/json" --data-binary "@-"
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 101
ETag: W/"65-lLo6I4/Ss1oFJ+niVHi0fGYsAss"
Date: Mon, 23 Nov 2026 15:39:26 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":7,"title":"Dune","author":"Frank Herbert","year":1965,"genre":"science","read":true,"rating":3}
```

### 12. Delete (204, no body)

```
> curl.exe --include -X DELETE http://localhost:3000/api/books/7
HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Date: Mon, 23 Nov 2026 15:39:32 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

### 13. The same delete repeated (404)

```
> curl.exe --include -X DELETE http://localhost:3000/api/books/7
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 37
ETag: W/"25-rlftHWE4u5eM6EZ44xwc/8PsCqA"
Date: Mon, 23 Nov 2026 15:39:37 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book with id 7 not found."}
```