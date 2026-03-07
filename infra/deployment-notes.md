# Deployment Notes

## MongoDB Atlas

1. Create a free cluster
2. Add database user + password
3. Whitelist IPs (local + Render)
4. Copy connection string into API `.env`

## Backend (Render)

- Build: `npm install && npm run build --workspace=apps/api`
- Start: `npm start --workspace=apps/api`
- Env: See `infra/api.env.template`

## Frontend (Vercel)

- Root: `apps/web`
- Build: `npm run build`
- Output: `dist`
- Env: See `infra/web.env.template`

## CORS + Cookies

- Set `CLIENT_URL` to Vercel domain
- Use `sameSite=none` and `secure=true` in production
