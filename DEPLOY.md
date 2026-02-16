# Deployment Guide

## Lokal brug (hurtig løsning)

Serveren bruger nu automatisk din lokale IP-adresse (`192.168.50.137`), så QR-koder virker fra din telefon!

**Vigtigt:**
- Telefon og computer skal være på samme WiFi netværk
- QR-koder vil nu pege på `http://192.168.50.137:3000/track/[qrId]`
- Firewall skal tillade forbindelser på port 3000

## Deployment til Vercel (offentlig tilgængelig)

### Forberedelse

1. Installer Vercel CLI:
```bash
npm install -g vercel
```

2. Opret `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/track/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

### Deployment

1. Login til Vercel:
```bash
vercel login
```

2. Deploy:
```bash
vercel
```

3. Følg instruktionerne i terminalen

### Efter deployment

- Opdater `API_URL` i `public/index.html` og `public/admin.html` til din Vercel URL
- Eller brug miljøvariabler i Vercel dashboard

## Deployment til Netlify

Netlify understøtter ikke Node.js server direkte. Brug Vercel i stedet, eller:

1. Konverter til serverless functions
2. Brug Netlify Functions

## Deployment til Simply.com

1. Upload alle filer til Simply.com
2. Konfigurer Node.js environment
3. Sæt start command til: `node server.js`
4. Opdater `API_URL` til din Simply.com URL

## Alternativ: ngrok (hurtig test)

For at teste offentligt uden deployment:

1. Installer ngrok: https://ngrok.com/
2. Start din server: `npm start`
3. I ny terminal: `ngrok http 3000`
4. Brug den offentlige URL fra ngrok
