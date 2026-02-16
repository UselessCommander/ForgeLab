# Production Deployment Guide

## ✅ Projektet er nu produktionsklart!

Alle nødvendige konfigurationer er sat op for at projektet virker perfekt på internettet med tracking og admin funktionalitet.

## 🌐 Production Features

### ✅ Auto-detection af URLs
- **Frontend**: Automatisk detekterer korrekt API URL baseret på domæne
- **Backend**: Automatisk detekterer BASE_URL for tracking URLs
- **HTTPS**: Automatisk brug af HTTPS i production

### ✅ Tracking System
- ✅ QR-kode scanning tracking
- ✅ IP-adresse logging
- ✅ User-Agent tracking
- ✅ Timestamp for hver scan
- ✅ Automatisk redirect til original URL
- ✅ Real-time statistik opdatering

### ✅ Admin Dashboard
- ✅ Oversigt over alle QR-koder
- ✅ Total scanninger
- ✅ Detaljeret statistik per QR-kode
- ✅ Auto-opdatering (hver 3 sekund)
- ✅ Slet QR-koder (enkelt eller alle)
- ✅ Kopier tracking URLs

### ✅ Security
- ✅ CORS konfigureret korrekt
- ✅ Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- ✅ Input validering
- ✅ Error handling

## 🚀 Deployment til Vercel

### 1. Opret projekt på Vercel
- Gå til https://vercel.com
- Importér GitHub repository: `UselessCommander/ForgeLab`
- Vælg **Express** som Application Preset
- Klik "Deploy"

### 2. Konfigurer Custom Domain (valgfrit)
- Gå til Project Settings → Domains
- Tilføj `qr.floweffekt.dk`
- Konfigurer DNS:
  - CNAME: `qr` → `cname.vercel-dns.com`
  - Eller A record: `qr` → `76.76.21.21`

### 3. Environment Variables (valgfrit)
Hvis du vil override BASE_URL:
```
BASE_URL=https://qr.floweffekt.dk
```

## 📊 Brug af Systemet

### Generer QR-kode med Tracking
1. Gå til hoved siden (`/`)
2. Indtast URL eller tekst
3. Aktiver "Aktiver scanning tracking"
4. Klik "Generer QR Kode"
5. QR-koden peger nu på tracking URL
6. Når den scannes, tælles scanningen op og brugeren redirectes

### Se Statistikker
1. Gå til `/admin.html` eller klik "📊 Se Statistikker"
2. Se alle QR-koder og deres scanninger
3. Dashboard opdateres automatisk hver 3. sekund
4. Slet QR-koder hvis nødvendigt

## 🔧 Tekniske Detaljer

### API Endpoints
- `POST /api/create-tracked` - Opret tracked QR-kode
- `GET /api/stats` - Hent alle statistikker
- `GET /api/stats/:qrId` - Hent statistik for specifik QR-kode
- `DELETE /api/stats/:qrId` - Slet QR-kode
- `DELETE /api/stats` - Slet alle QR-koder
- `GET /track/:qrId` - Tracking endpoint (redirecter)

### Data Storage
- **Vercel**: `/tmp/scans.json` (ephemeral - nulstilles ved deployment)
- **Lokal**: `scans.json` i projekt root

⚠️ **VIGTIGT**: For permanent data storage i production, overvej at integrere en database (MongoDB, PostgreSQL, etc.)

## ✅ Alt er klar!

Projektet er nu fuldt produktionsklart og klar til brug på internettet! 🎉
