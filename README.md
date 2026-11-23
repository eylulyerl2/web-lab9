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

## CORS Preflight Evidence

Observed in Chrome DevTools → Network (filter: All) while adding a book from the React page at `http://localhost:5173`. Before the real `POST`, the browser sent an extra `OPTIONS` request to the same URL, shown with the type **preflight**:

| | Value |
|---|---|
| Request URL | `http://localhost:3000/api/books` |
| Request Method | `OPTIONS` |
| Status Code | `204 No Content` |

**Request headers (the browser asks):**

```
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
Sec-Fetch-Mode: cors
```

**Response headers (the server answers, set by the `cors` package):**

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
Vary: Origin, Access-Control-Request-Headers
```

The preflight happens because the page and the API have different origins (port 5173 vs. 3000) and the request sends a JSON body with `Content-Type: application/json`, which is not a "simple" request. The answer allowed the origin, the method and the header, so the browser then sent the real `POST`, which returned `201`. Plain `GET` requests (list and stats) did not need a preflight.

## Reasoning Questions

### 1. Parameters

The `id` identifies one specific resource, so it is part of the path: `/api/books/7` *is* book 7, and `GET`, `PUT`, `PATCH` and `DELETE` all act on that same address. `genre` and `sort` do not identify anything; they are optional ways to view the collection `/api/books`, they can be combined and left out, so they belong in the query string. If the id were a query parameter (`/api/books?id=7`), the same path would mean both "the list" and "one book", a missing id would look like an empty list instead of a clear `404`, and `PUT /api/books?id=7` or `DELETE /api/books?id=7` would look like operations on the whole collection.

### 2. Body parsing

**Experiment:** I moved `app.use(express.json())` below all the routes. Adding a book from the form and with curl both returned `400 Bad Request` with `{"error":"Request body must be a JSON object."}`, even though the JSON I sent was correct. The routes now ran *before* the body was parsed, so `req.body` was `undefined` and my validation rejected it. Middleware runs in the order it is registered, so the parser must come before the routes that read the body.

### 3. One response

**Experiment:** In `POST /api/books` I removed the `return` in front of the early `409` response. I added "Dune" twice: the first request returned `201`, the second returned `409 Conflict`, so the client was told the book was not added. But `GET /api/books?q=dune` then returned **two** Dunes (`id` 7 and 8), and the server printed `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client` at the line with `.location(...)`. Without `return`, the handler kept running after sending the `409`: it created the duplicate and then tried to send a second response. The client got a wrong answer and the data was corrupted.

### 4. PUT and PATCH

`PATCH` is the better choice for the read checkbox and the rating select: the client only sends what changed, for example `{ "rating": 3 }`, without having to send (or even know) the title, author, year and genre, and it cannot accidentally overwrite another field. `PUT` fits the edit form: the user sees and submits every field, and the whole book is replaced with exactly what is in the form. My curl evidence shows the difference: after the `PUT`, the `PATCH` with only `rating` kept every other value.

### 5. CORS

**Experiment:** I started the server with `$env:CLIENT_ORIGIN="http://localhost:9999"`. The page showed "Could not load books: Failed to fetch", the Network tab showed **CORS error**, and the console said: *"Access to fetch at 'http://localhost:3000/api/books?order=asc' from origin 'http://localhost:5173' has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:9999' that is not equal to the supplied origin"*, followed by `net::ERR_FAILED 200 (OK)`. The server **did** log every request (`GET /api/books?order=asc`, `GET /api/stats`) and answered them with `200`; it was the browser that refused to give the response to the page. `curl` still worked and showed `Access-Control-Allow-Origin: http://localhost:9999`, because CORS is enforced only by browsers, to protect their users. curl is not a browser and ignores that header.

### 6. Validation

Client-side checks only help an honest user of my page. Anyone can call the API directly with curl, DevTools or another program and send any body they like, so the server can never trust that the data passed through my form. Some rules can only be checked on the server anyway, such as a duplicate title and author, and the form's `required` and `maxLength` do not check the year range or that a rating needs `read: true`. The server is the single place that protects the stored data, so it must validate everything.

### 7. State

**Experiment:** With the app open, I added a book and marked another book as read; the statistics showed `Total: 7`. After restarting the server and reloading the page, the new book and the change were gone and the statistics were back to `Total: 6, Read: 4, Unread: 2, Average rating: 4`, exactly the seed data. The books only live in a variable inside `booksStore.js`, in the memory of the running Node process, so they disappear when the process stops. To keep them, the data must be stored outside the process, for example in a database or a file.

## Self-Study Notes

### Building a query string safely with `URLSearchParams`
In `client/src/api/books.js`, `getBooks()` creates a `URLSearchParams`, adds only the filters that are not empty with `params.set(name, value)` and uses `params.toString()`. It encodes special characters for me: typing `a&b` in the search box sent `q=a%26b` (checked in the Network tab), so the `&` could not break the URL into two parameters. Ids in paths are encoded with `encodeURIComponent()`.

### Comparing strings with `localeCompare`
Sorting with `<` or `-` does not work for text. On the server, `a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })` returns a negative, zero or positive number, as `Array.prototype.sort` expects, and `sensitivity: 'base'` ignores upper/lower case. I always sort a copy (`[...books].sort(...)`), because `sort` changes the array it is called on, and books with `rating: null` are handled first so they always end up last.

### `import.meta.env` and the `VITE_` prefix
Vite puts environment variables from `client/.env` into `import.meta.env`, but only the ones whose name starts with `VITE_`. Everything in the client ends up in the JavaScript that the browser downloads, so the prefix prevents other variables (for example secrets on the developer's machine) from being exposed by accident. The values are read when the dev server starts or when building, so after changing `.env` the dev server has to be restarted. `.env` stays out of Git; `.env.example` documents the variable.

### Sending an empty `204` response in Express 5
`DELETE` uses `res.status(204).end()`. `204 No Content` must not have a body, so I don't use `res.json()` or `res.send()` with data; the curl output shows no `Content-Type` and no body. On the client, the `request()` helper checks `response.status === 204` and returns `null` before trying `response.json()`, which would fail on an empty body.

### Cancelling a `fetch` and recognising `AbortError`
Each effect that loads data creates an `AbortController`, passes `controller.signal` to `fetch`, and calls `controller.abort()` in its cleanup. An aborted `fetch` rejects with an error whose `name` is `"AbortError"`; I return early for it instead of showing it as a failure. In the Network tab the first requests after a page load appear as **(canceled)**: React's StrictMode runs effects twice in development, and the first run is cleaned up. The same cleanup makes sure that when filters change quickly, an old, slow response can never overwrite a newer list.

### Errors in async handlers in Express 5
Express 5 catches errors thrown (or rejected promises) inside `async` route handlers and passes them to the error-handling middleware, so no `try/catch` is needed around every handler. `GET /api/crash` proves it. Malformed JSON is reported by `express.json()` with `err.type === 'entity.parse.failed'`, which my error middleware turns into a JSON `400` instead of Express's HTML error page.

## Challenges

**1. `npm install` failed with `ERESOLVE` in the client.**
Right after creating the Vite project, `npm install` stopped with `ERESOLVE unable to resolve dependency tree` and `Found: vite@undefined`. The message suggested `--force` or `--legacy-peer-deps`, but I did not use them because they only hide the problem. Running `npm install` again worked (24 packages, 0 vulnerabilities), so it was a temporary download problem.

**2. My first push failed.**
`git push -u origin main` answered `src refspec main does not match any`, because the first commit had been created on a branch called `master`. `git branch -M main` renamed it, and the push worked.

**3. The server restarted in the middle of my tests.**
While collecting curl evidence, `POST` created Dune with `201`, but the next `GET /api/stats` still said `total: 6`. The server log showed `Restarting 'server.js'` between the two requests: `node --watch` had restarted it because a server file was saved, and the in-memory data went back to the seed. For the evidence I ran the server with `npm start` (no watch mode). This also showed in practice that the data only lives in memory (Reasoning Question 7).

**4. Sending JSON from PowerShell.**
Writing JSON directly inside a curl command in PowerShell breaks the quotes, so I piped the body into curl: `'{"title":"Dune",...}' | curl.exe ... --data-binary "@-"`. I also had to use `curl.exe` instead of `curl` (an alias for a different command in PowerShell) and put URLs with `&` in quotes.

**5. Working with two projects in one repository.**
VS Code opens new terminals in the repository root, so `npm run dev` failed with `ENOENT: Could not read package.json`. I learned to `cd server` or `cd client` first and to keep three terminals: one for the server, one for the client and one for Git. I also once created `README.md` inside `client/src` by mistake and moved it back to the root.

**6. The checkbox did not change immediately.**
When I clicked "Read", the checkbox only changed after a short moment. This is on purpose: the screen is only updated after the server confirms the `PATCH`. When I stopped the server and clicked it, the page showed `"Sapiens": Failed to fetch` and the checkbox stayed unchecked.