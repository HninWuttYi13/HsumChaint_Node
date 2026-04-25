# Donor API Endpoints

Base path: **`/api/v1/donors`**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/donors` | List donors (supports filters and pagination) |
| `GET` | `/api/v1/donors/:id` | Get donor by ID |
| `POST` | `/api/v1/donors/create` | Create a donor |
| `PUT` | `/api/v1/donors/:id` | Update a donor |
| `DELETE` | `/api/v1/donors/:id` | Delete a donor |
| `GET` | `/api/v1/donors/donation-lists` | List donation lists (supports filters and pagination) |
| `GET` | `/api/v1/donors/donation-lists/:id` | Get donation list by ID |
| `POST` | `/api/v1/donors/donation-lists/create` | Create a donation list |
| `PUT` | `/api/v1/donors/donation-lists/:id` | Update a donation list |
| `DELETE` | `/api/v1/donors/donation-lists/:id` | Delete a donation list |

## Query / body details

| Endpoint | Params / query / body |
|----------|------------------------|
| **GET** `/api/v1/donors` | Query: `name`, `email`, `phoneNo` (optional filters), `page`, `limit` (pagination) |
| **GET** `/api/v1/donors/:id` | Params: `id` (number) |
| **POST** `/api/v1/donors/create` | Body: `name`, `email`, `phoneNo` (all required) |
| **PUT** `/api/v1/donors/:id` | Params: `id` (number). Body: at least one of `name`, `email`, `phoneNo` |
| **DELETE** `/api/v1/donors/:id` | Params: `id` (number) |
| **GET** `/api/v1/donors/donation-lists` | Query: `title`, `status`, `monasteryId` (optional filters), `page`, `limit` (pagination) |
| **GET** `/api/v1/donors/donation-lists/:id` | Params: `id` (number) |
| **POST** `/api/v1/donors/donation-lists/create` | Body: `title`, `description`, `address`, `donationDate`, `recurrence`, `addReminder`, `monasteryId`, `reviewerId`, `donationTypeId`, `donorIds` (array) |
| **PUT** `/api/v1/donors/donation-lists/:id` | Params: `id` (number). Body: at least one field |
| **DELETE** `/api/v1/donors/donation-lists/:id` | Params: `id` (number) |
