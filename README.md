# sashousing

Standalone housing review app.

## Structure

- `frontend`: Next.js app for housing buildings, rooms, and room reviews.
- `backend`: Express API packaged deployed on Render.
- Database: MongoDB Atlas via `MONGODB_URI`.

## Environment

Frontend:

```sh
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Backend:

```sh
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=replace-me
FRONTEND_URL=http://localhost:3000
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Local Development

```sh
npm install
cd backend
npm run dev

cd frontend
npm run dev
```
