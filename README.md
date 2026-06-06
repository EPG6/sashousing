# sashousing

Standalone housing review app extracted from `aspc-website-v2`.

## Structure

- `frontend`: Next.js app for housing buildings, rooms, and room reviews.
- `backend`: Express API packaged for Vercel serverless functions.
- Database: MongoDB Atlas via `MONGODB_URI`.

## Environment

Frontend:

```sh
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
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

For Vercel, deploy `frontend` and `backend` as separate projects. Set `NEXT_PUBLIC_BACKEND_URL` in the frontend to the deployed backend URL, and set `FRONTEND_URL` in the backend to the deployed frontend URL.

## Local Development

```sh
npm install
npm run dev --workspace backend
npm run dev --workspace frontend
```

The backend includes a small email-based session login endpoint so the feature can run without the original ASPC SAML stack:

- `POST /api/auth/login` with `{ "email": "you@example.com" }`
- `GET /api/auth/current_user`
- `POST /api/auth/logout`

## Data Collections

The extracted API expects the same MongoDB collection shape as the original housing feature:

- `housingbuildings`
- `housingrooms`
- `housingreviews`
- GridFS bucket `housingreviewpictures`
