# Zenithia Global School — Website + Admin Panel

A clean, international-standard school website with a minimal admin panel (CMS) to
update content and upload images — built to be deployed on **Railway** with
**PostgreSQL**.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling (brand maroon `#6E1E3C` + gold `#C6A875`)
- **Prisma** ORM + **PostgreSQL**
- Image uploads stored on disk (a **Railway Volume** in production)
- Cookie-based admin auth (JWT, `jose` + `bcryptjs`)

## Pages

- **Home** — hero, stats, about preview, features, facilities, programs, gallery, CTA
- **About** — about story, **Vision**, **Mission**, core values
- **Facilities** — campus facilities
- **Why Us (Features)** — reasons to choose the school
- **Programs** — upcoming & past programs/events
- **Gallery** — filterable photo gallery with lightbox
- **Contact** — contact details, Google Map embed, enquiry form

## Admin panel (`/admin`)

- **Site Content** — school name, tagline, hero, about/vision/mission, stats,
  contact details, Google Map embed, social links, hero image
- **Facilities / Features / Programs / Gallery** — full create / edit / delete
  with image upload
- **Messages** — read & manage contact-form enquiries

Everything updates the live site instantly — no redeploy needed.

---

## Local development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create `.env`** (a working dev file is already included). Make sure
   `DATABASE_URL` points to a local PostgreSQL database, e.g.:

   ```
   DATABASE_URL="postgresql://USER@localhost:5432/zenithia?schema=public"
   ```

3. **Run migrations + seed starter content**

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   - Website: http://localhost:3000
   - Admin: http://localhost:3000/admin
   - Default login (from `.env`): `admin@zenithia.net` / `Admin@12345`

---

## Deploying to Railway

1. **Push this folder to a GitHub repo.**

2. In Railway: **New Project → Deploy from GitHub repo**.

3. **Add a PostgreSQL database**: *New → Database → PostgreSQL*. Railway exposes a
   `DATABASE_URL` you can reference.

4. **Set environment variables** on the web service (Variables tab):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference the Postgres plugin) |
   | `AUTH_SECRET` | a long random string |
   | `ADMIN_EMAIL` | your admin email |
   | `ADMIN_PASSWORD` | a strong password |
   | `UPLOAD_DIR` | `/data/uploads` |
   | `UPLOAD_PUBLIC_BASE` | `/media` |
   | `NEXT_PUBLIC_SITE_URL` | your Railway/public URL |

5. **Add a Volume** for uploaded images: *service → Settings → Volumes → New Volume*,
   mount path **`/data`**. (We set `UPLOAD_DIR=/data/uploads` so images survive
   deploys.)

6. **Deploy.** The build runs `prisma generate && prisma migrate deploy && next build`,
   so the database schema is applied automatically.

7. **Seed the first admin + starter content** (run once) — open the service shell
   in Railway and run:

   ```bash
   npm run db:seed
   ```

   This creates the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and adds sample
   facilities, features and programs (only if those tables are empty).

8. Visit `/admin`, log in, and start editing content. 🎉

---

## Notes

- **Branding:** the official logo and banners live in `public/brand/`
  (`logo-full.png`, `logo-mark.png`, `banner-1.png`, `banner-2.png`). They are
  generated from the source files in `public/uploads/` by
  `node scripts/build-brand-assets.mjs` (requires `sharp`). The app favicon is
  `src/app/icon.png` / `apple-icon.png`. To change branding, drop new source
  files in `public/uploads/` and re-run the script, or replace the files in
  `public/brand/` directly.
- **Google Map:** in *Admin → Site Content*, paste the `<iframe>` embed code from
  Google Maps (*Share → Embed a map*).
- **Images:** uploaded via the admin panel, stored in `UPLOAD_DIR` and served via
  the `/media/<file>` route (works the same locally and on the Railway volume).
- All public pages are dynamic, so any content change in the admin appears
  immediately.

## Useful scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Generate client, run migrations, build for production |
| `npm start` | Start production server |
| `npm run db:seed` | Seed admin user + starter content |
| `npx prisma studio` | Visual database browser |
