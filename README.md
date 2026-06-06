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
```

Backend:

```sh
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=replace-me
FRONTEND_ORIGIN=http://localhost:3000
```

For Vercel, deploy `frontend` and `backend` as separate projects. Set `NEXT_PUBLIC_BACKEND_URL` in the frontend to the deployed backend URL, and set `FRONTEND_ORIGIN` in the backend to the deployed frontend URL.

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
