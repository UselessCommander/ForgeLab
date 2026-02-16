# ForgeLab

# QR Kode Generator med Tracking

En QR kode generator med mulighed for at tracke hvor mange gange QR-koden bliver scannet.

## Funktioner

- ✅ Generer QR koder fra tekst eller URL'er
- ✅ Justér størrelse og fejlkorrektion
- ✅ **Tracking af scanninger** - Se hvor mange gange din QR-kode er blevet scannet
- ✅ Download QR-koder som PNG
- ✅ Real-time statistik
- ✅ Dashboard med oversigt over alle QR-koder
- ✅ Slet QR-koder

## Installation

1. Installer dependencies:
```bash
npm install
```

QRCode biblioteket (`qrcode.min.js`) er allerede inkluderet lokalt i `public/` mappen.

## Lokal Brug

1. Start serveren:
```bash
npm start
```

2. Åbn browseren og gå til:
```
http://localhost:3000
```

**VIGTIGT:** Du skal åbne siden gennem serveren (`http://localhost:3000`) og ikke direkte fra filsystemet (`file://`).

## Deployment til Vercel

Projektet er konfigureret til deployment på Vercel med custom domain `qr.floweffekt.dk`.

### Quick Deploy

1. Installer Vercel CLI:
```bash
npm install -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

4. Konfigurer DNS:
   - Tilføj CNAME record: `qr` → `cname.vercel-dns.com`
   - Eller A record: `qr` → `76.76.21.21`

5. Tilføj custom domain i Vercel Dashboard:
   - Settings → Domains → Add `qr.floweffekt.dk`

Se `VERCEL_DEPLOY.md` for detaljerede instruktioner.

## Tracking

Når tracking er aktiveret:
- Hver QR-kode får et unikt ID
- QR-koden peger på en tracking URL (f.eks. `https://qr.floweffekt.dk/track/abc123`)
- Når QR-koden scannes, tælles scanningen op
- Brugeren sendes automatisk videre til den originale URL
- Du kan se antal scanninger i tracking informationen
- **Tælleren opdateres automatisk hver 3. sekund** når du har en tracked QR-kode

## Dashboard / Statistikker

Se alle dine QR-koder og deres scanning-statistikker:

1. Gå til dashboard'en:
   ```
   http://localhost:3000/admin.html
   ```
   Eller på production:
   ```
   https://qr.floweffekt.dk/admin.html
   ```

2. Eller klik på "📊 Se Statistikker" knappen i toppen af hoved siden

**Dashboard funktioner:**
- 📊 Oversigt over alle QR-koder
- 🔢 Total antal scanninger
- 📈 Detaljeret statistik for hver QR-kode
- 🔄 Auto-opdatering (hver 3 sek)
- 📋 Kopier tracking URLs
- 🗑️ Slet QR-koder
- 📅 Se hvornår QR-koder blev oprettet og sidst scannet

## API Endpoints

- `POST /api/create-tracked` - Opret en tracked QR-kode
- `GET /api/stats/:qrId` - Hent statistik for en specifik QR-kode
- `GET /api/stats` - Hent statistik for alle QR-koder
- `DELETE /api/stats/:qrId` - Slet en specifik QR-kode
- `DELETE /api/stats` - Slet alle QR-koder
- `GET /track/:qrId` - Tracking endpoint (redirecter til original URL)

## Data Storage

**Lokal udvikling:**
- Scanning data gemmes i `scans.json` filen i projektets root mappe.

**Vercel Production:**
- Data gemmes i `/tmp/scans.json` (ephemeral storage)
- ⚠️ **VIGTIGT:** Data bliver nulstillet ved hver deployment!
- For permanent storage, overvej at integrere en database (MongoDB, PostgreSQL, etc.)

## Vigtige Noter

- Serverless functions på Vercel har timeout (10s free, 60s pro)
- `/tmp` mappen er ephemeral - data forsvinder ved deployment
- For production med permanent data, brug en database
