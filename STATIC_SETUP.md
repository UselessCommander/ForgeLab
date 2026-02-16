# Statisk Frontend + Serverless Backend Setup

## Nuværende løsning (Vercel) er faktisk allerede statisk! ✅

Din nuværende setup er faktisk præcis hvad du beder om:
- **Frontend:** 100% statisk HTML/CSS/JS (kan hostes hvor som helst)
- **Backend:** Serverless functions (kører kun når nogen scanner QR-koden)
- **Ingen SSR** - ingen server der renderer HTML
- **Ingen konstant kørende server**

## Hvis du vil adskille frontend og backend helt:

### Option 1: Frontend på GitHub Pages + Backend på Vercel

1. **Frontend (statisk):**
   - Upload `public/` mappen til GitHub Pages
   - Eller Netlify Drop (drag & drop)
   - Eller enhver statisk hosting

2. **Backend (Vercel serverless):**
   - Deploy kun `server.js` og `vercel.json` til Vercel
   - Frontend kalder Vercel API'en

### Option 2: Alt på Vercel (anbefalet)

- Frontend og backend på samme Vercel projekt
- Alt automatisk konfigureret
- Gratis tier
- Custom domain support

## Sådan adskiller du frontend og backend:

### 1. Opret separat Vercel projekt til API'en

```bash
# I en ny mappe
mkdir qr-api
cd qr-api

# Kopier kun server.js og package.json
# Opret vercel.json der kun håndterer API routes
```

### 2. Frontend kalder API'en

Opdater `API_URL` i frontend til at pege på din Vercel API URL:

```javascript
const API_URL = 'https://qr-api.vercel.app'; // Din Vercel API URL
```

### 3. Upload frontend til statisk hosting

Upload hele `public/` mappen til:
- GitHub Pages
- Netlify
- Cloudflare Pages
- Eller enhver FTP hosting

## Anbefaling

**Behold alt på Vercel** - det er allerede statisk frontend + serverless backend:
- ✅ Ingen SSR
- ✅ Ingen konstant kørende server  
- ✅ Frontend er statisk HTML
- ✅ Backend kører kun når der er requests
- ✅ Gratis
- ✅ Automatisk HTTPS
- ✅ Custom domain

Vil du have mig til at lave en helt adskilt version hvor frontend og backend er separate projekter?
