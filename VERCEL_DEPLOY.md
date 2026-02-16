# Vercel Deployment Guide

## Deployment til qr.floweffekt.dk

### 1. Installer Vercel CLI
```bash
npm install -g vercel
```

### 2. Login til Vercel
```bash
vercel login
```

### 3. Deploy projektet
```bash
vercel
```

Følg instruktionerne:
- Link til eksisterende projekt? Nej (første gang)
- Hvad er projektets navn? qr-code-generator (eller hvad du vil)
- Hvilken mappe skal deployes? . (current directory)

### 4. Konfigurer Custom Domain

1. Gå til Vercel Dashboard: https://vercel.com/dashboard
2. Vælg dit projekt
3. Gå til Settings → Domains
4. Tilføj `qr.floweffekt.dk`
5. Følg instruktionerne for at tilføje DNS records

### 5. DNS Konfiguration

Tilføj følgende DNS record hos din domain provider (floweffekt.dk):

**Type:** CNAME  
**Name:** qr  
**Value:** cname.vercel-dns.com

Eller hvis du bruger A record:
**Type:** A  
**Name:** qr  
**Value:** 76.76.21.21

### 6. Environment Variables (valgfrit)

Hvis du vil override BASE_URL, kan du tilføje i Vercel Dashboard:
- Settings → Environment Variables
- Key: `BASE_URL`
- Value: `https://qr.floweffekt.dk`

### 7. Efter Deployment

Efter deployment vil dit projekt være tilgængeligt på:
- **Production:** https://qr.floweffekt.dk
- **Preview:** https://[project-name].vercel.app

### 8. Opdatering

For at opdatere projektet:
```bash
vercel --prod
```

Eller push til GitHub og Vercel deployer automatisk hvis du har sat det op.

## Vigtige Noter

- Serverless functions har en timeout på 10 sekunder (free plan) eller 60 sekunder (pro plan)
- Data gemmes i `scans.json` filen - på Vercel bliver denne fil skrevet til `/tmp` mappen (kun midlertidig)
- For permanent data storage, overvej at bruge en database (MongoDB, PostgreSQL, etc.)

## Alternativ: Statisk Version

Hvis du vil have en helt statisk version uden server, kan jeg lave en version der bruger localStorage i stedet for server-side tracking.
