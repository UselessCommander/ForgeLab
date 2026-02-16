# Er din løsning SSR eller statisk?

## ✅ Din nuværende løsning er ALLEREDE statisk!

**Hvad du har nu:**
- **Frontend:** 100% statisk HTML/CSS/JS filer i `public/` mappen
- **Backend:** Serverless functions på Vercel (kører kun når nogen scanner QR-koden)
- **Ingen SSR** - ingen server der renderer HTML dynamisk
- **Ingen konstant kørende server** - serverless functions kører kun når der er requests

## Hvad betyder det?

### Statisk Frontend ✅
- `index.html` - ren HTML fil
- `admin.html` - ren HTML fil  
- `qrcode.min.js` - ren JavaScript fil
- Kan hostes på GitHub Pages, Netlify, FTP, eller hvor som helst

### Serverless Backend ✅
- `server.js` kører som serverless functions på Vercel
- Kører kun når nogen:
  - Scanner QR-koden (`/track/:qrId`)
  - Kalder API'en (`/api/stats`, `/api/create-tracked`, etc.)
- Ingen konstant kørende server
- Gratis tier på Vercel

## Kan du uploade til FTP?

**Ja!** Du kan:

### Option 1: Frontend på FTP + Backend på Vercel
1. Upload `public/` mappen til din FTP server
2. Deploy `server.js` til Vercel separat
3. Opdater `API_URL` i frontend til at pege på Vercel API

### Option 2: Alt på Vercel (anbefalet)
- Upload hele projektet til Vercel
- Vercel håndterer både statisk frontend og serverless backend
- Gratis og nemt

## Hvis du vil have 100% statisk (uden backend)

Hvis du vil have frontend der kan hostes på GitHub Pages uden backend:
- Tracking vil kun virke lokalt i browseren (localStorage)
- Ikke tilgængelig for omverdenen
- Ingen server-side tracking

**Anbefaling:** Behold Vercel setup - det er allerede statisk frontend + serverless backend!
