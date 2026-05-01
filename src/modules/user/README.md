## User Module Documentation

This module handles **User Management** for the Hsum Chaint application, including:

- Profile retrieval
- Advanced filtering
- Secure profile updates
- Avatar upload using Cloudflare R2

---

## Features

- User CRUD operations
- Authentication-protected routes
- Nested Monk profile management
- Secure password update (with verification)
- Avatar upload to Cloudflare R2
- Pagination and filtering
- Soft delete system
- Full test coverage

---

## API Routes

| Method | Endpoint   | Description                             | Middleware                |
|--------|-----------|-----------------------------------------|---------------------------|
| GET    | /users     | Get all users with filters & pagination | auth + validator          |
| GET    | /users/me  | Get current logged-in user              | auth                      |
| GET    | /users/:id | Get user by ID                          | auth + validator          |
| PUT    | /users/:id | Update user + upload avatar             | auth + multer + validator |
| DELETE | /users/:id | Soft delete user                        | auth + validator          |

---

## Core Functionality

### User Update System

- Supports partial updates
- Uses conditional field updates
- Handles nested relations (Monk Profile)

---

### Password Update Logic

- Requires `oldPassword`
- Verifies password securely
- Stores new password as hashed value

---

### Monk Profile Rules

Only users with `userType = Monk` can update:

- monasteryName  
- monasteryAddress  

---

## File Upload (Cloudflare R2)

### Upload Flow


Client uploads image
→ Multer stores file in memory (Buffer)
→ Controller receives req.file
→ uploadToR2()
→ File stored in Cloudflare R2
→ URL returned
→ Saved in database


---

### Storage Path


profiles/{timestamp}-{filename}


---

### Security

- File type validation (JPG, JPEG, PNG, WEBP)
- File size limit: 2MB
- MIME type and extension validation

---

## Validation (Zod)

- Strong schema validation
- Type-safe request handling
- Password rules enforced
- ID transformation (string → number)

---

## Testing

This module includes comprehensive testing using Bun Test.

### Service Tests

- User update logic
- Nested profile updates
- Password validation
- Error handling

---

### Controller Tests

- Request/response handling
- Middleware integration
- File upload flow (mocked R2)

---

### Middleware Tests

- Input validation
- File validation
- Error handling

---

## Soft Delete Strategy

Instead of deleting records:


isDeleted = true


### Benefits

- Data integrity
- Audit capability
- Safe recovery

---

## Architecture Principles

- Separation of concerns
- Scalable service layer
- Middleware-driven validation
- External service abstraction (R2)
- Testable components

---

## Getting Started

### 1. Install dependencies


bun install


---

### 2. Setup environment variables

Create a `.env` file:


DATABASE_URL= \
R2_ENDPOINT= \
R2_ACCESS_KEY_ID= \
R2_SECRET_ACCESS_KEY= \
R2_BUCKET_NAME= \
R2_PUBLIC_URL= 


---

## Why This Module Matters

This module demonstrates real-world backend engineering skills:

- API design and architecture
- Secure authentication patterns
- Cloud storage integration (R2)
- Database modeling and querying
- Production-level testing strategy