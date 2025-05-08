# Blog Backend

A fully functional blog backend built with Node.js, Express, and MongoDB, featuring authentication and image upload capabilities.

## Features

- Admin-only authentication using JWT
- Blog CRUD operations
- Image upload using Cloudinary
- MongoDB database integration
- Input validation
- Error handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Cloudinary account

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/blog
   JWT_SECRET=your_jwt_secret_key_here
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register`

  - Body:
    ```json
    {
      "name": "Admin User",
      "email": "admin@example.com",
      "password": "your_password"
    }
    ```
  - Returns:
    ```json
    {
      "token": "jwt_token",
      "user": {
        "id": "user_id",
        "name": "Admin User",
        "email": "admin@example.com",
        "isAdmin": true
      },
      "redirectTo": "/dashboard"
    }
    ```

- `POST /api/auth/login`
  - Body:
    ```json
    {
      "email": "admin@example.com",
      "password": "your_password"
    }
    ```
  - Returns:
    ```json
    {
      "token": "jwt_token",
      "user": {
        "id": "user_id",
        "name": "Admin User",
        "email": "admin@example.com",
        "isAdmin": true
      },
      "redirectTo": "/dashboard"
    }
    ```

### Blog Posts

- `GET /api/blog`

  - Returns: List of all blog posts

- `GET /api/blog/:id`

  - Returns: Single blog post

- `GET /api/blog/slug/:slug`

  - Returns: Blog post by slug

- `POST /api/blog`

  - Headers: `Authorization: Bearer <token>`
  - Body: FormData with:
    - title
    - subtitle
    - description
    - subdescription
    - category
    - tags (array)
    - seoMetaTitle
    - seoMetaDescription
    - mainImage
    - sections (array of objects with title, description)
    - sectionImages (array of images)
  - Returns: Created blog post

- `PUT /api/blog/:id`

  - Headers: `Authorization: Bearer <token>`
  - Body: FormData with same fields as POST
  - Returns: Updated blog post

- `DELETE /api/blog/:id`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Success message

## Blog Structure

Each blog post contains:

- Title
- Subtitle
- Description
- Subdescription
- Main image
- Category
- Tags
- SEO metadata
- Sections (with title, description, and image)
- Author information
- Creation and update timestamps
- Auto-generated slug

## Security

- All routes except login and blog listing require authentication
- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Input validation on all routes
- Admin-only access for blog management
