# NFC Kiosk — USB Keyboard-Wedge → URL Redirect

A Next.js kiosk web app that reads NFC card UIDs from a USB keyboard-wedge NFC reader
and redirects the browser to a mapped destination URL.

---

## How it works

1. A Samsung tablet running **Fully Kiosk Browser** opens `/` on this app.
2. The USB NFC reader types the card UID as keystrokes (keyboard wedge mode).
3. The app captures the input, normalises the UID, and calls `POST /api/lookup`.
4. If the UID is found in the database, the browser redirects to the mapped URL.
5. If not found, an error is shown for 5 seconds, then the kiosk resets.

---

## Project structure

```
src/
  app/
    page.tsx                  # Public kiosk/scan page
    admin/page.tsx            # Admin dashboard (password protected)
    api/
      lookup/route.ts         # POST /api/lookup — UID lookup
      admin/
        login/route.ts        # POST/DELETE /api/admin/login
        mappings/route.ts     # GET/POST /api/admin/mappings
        mappings/[id]/route.ts# PATCH/DELETE /api/admin/mappings/:id
        logs/route.ts         # GET /api/admin/logs
  lib/
    prisma.ts                 # Prisma singleton
    uid.ts                    # UID normalisation helpers
    auth.ts                   # Admin auth helper
prisma/
  schema.prisma               # Database schema
  seed.ts                     # Optional demo seed
```

---

## Local development

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Supabase free tier works great)

### 1. Clone and install

```bash
git clone https://github.com/your-org/nfc-kiosk
cd nfc-kiosk
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
ADMIN_PASSWORD="your-secret-password"
```

### 3. Push the database schema

```bash
npx prisma db push
```

Optionally seed a demo mapping:

```bash
npm run db:seed
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the kiosk page.
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard.

---

## Deploying to Vercel

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In **Project Settings → Database → Connection string**, copy:
   - **URI (with pgBouncer)** → `DATABASE_URL`
   - **URI (direct)** → `DIRECT_URL`

### 2. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repo in the [Vercel dashboard](https://vercel.com/dashboard).

### 3. Set environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://postgres:...@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | `postgresql://postgres:...@db.xxx.supabase.co:5432/postgres` |
| `ADMIN_PASSWORD` | `your-secret-password` |

### 4. Run the migration on first deploy

After your first deploy, open the Vercel project terminal or run locally with production env:

```bash
npx prisma db push
```

---

## Environment variables reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (with pgBouncer for Supabase) |
| `DIRECT_URL` | ✅ | Direct PostgreSQL connection string (used by Prisma migrations) |
| `ADMIN_PASSWORD` | ✅ | Password to access the `/admin` page |

---

## Configuring Fully Kiosk Browser

1. Install **Fully Kiosk Browser** from the Play Store on your Samsung tablet.
2. In FKB settings:
   - **Start URL**: `https://your-app.vercel.app/?device=tablet-1`
   - **Kiosk Mode**: Enable
   - **Screen → Keep Screen On**: Enable
   - **Screen → Brightness**: 80–100%
   - **Navigation → Disable Back Button**: Enable
   - **Advanced Web Settings → Capture Plus Button**: Disable (avoid intercepting reader input)
   - **Input → Allow Physical Keyboard Input**: Enable ✅
3. Plug in the USB NFC reader via OTG adapter.
4. The reader will type the UID and press Enter automatically.

**Device name in logs**: Change `?device=tablet-1` in the start URL to identify each kiosk
(e.g. `?device=reception`, `?device=workshop-a`).

---

## Testing with a normal keyboard

You can simulate a card scan without an NFC reader:

1. Open the kiosk page in any browser.
2. Click anywhere (to ensure focus is on the hidden input).
3. Type a UID — e.g. `04032A92D41391` — and press **Enter**.
4. The app will submit and look up the UID.

**Accepted input formats** (all are normalised to uppercase hex):
- `04032A92D41391`
- `04:03:2A:92:D4:13:91`
- `04 03 2A 92 D4 13 91`
- `04032a92d41391` (lowercase)

### Test mode shortcut

Add `?test=1` to the URL to show a visible manual input box:

```
http://localhost:3000/?test=1
```

---

## Admin dashboard

Visit `/admin` and enter your `ADMIN_PASSWORD`.

From the dashboard you can:
- **Add** a new UID → URL mapping
- **Edit** an existing mapping's URL or label
- **Enable / Disable** a mapping (click the badge)
- **Delete** a mapping
- **View scan logs** — every scan with timestamp, UID, match result, and device name

---

## API reference

### `POST /api/lookup`

Called by the kiosk page when a card is scanned.

**Request body:**
```json
{
  "uid": "04:03:2A:92:D4:13:91",
  "device": "tablet-1"
}
```

**Response (found):**
```json
{ "found": true, "url": "https://example.com/destination" }
```

**Response (not found):**
```json
{ "found": false, "message": "Card not recognised" }
```

---

## UID normalisation

All UIDs are stored as uppercase hex with no separators:

| Input | Stored as |
|-------|-----------|
| `04:03:2A:92:D4:13:91` | `04032A92D41391` |
| `04 03 2a 92 d4 13 91` | `04032A92D41391` |
| `04032a92d41391` | `04032A92D41391` |

---

## Security notes

- The admin password is stored as a plain-text cookie token. For production, consider using
  NextAuth.js or a proper session system.
- The `/api/lookup` endpoint is public and rate-limiting is not included. Consider adding
  Vercel Edge Config rate limiting if the app is exposed to the internet.
- All destination URLs are validated to only allow `http://` and `https://` schemes.
