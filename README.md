# ForgeLab

Et samlet værktøjssuite med forskellige online værktøjer - bygget med Next.js.

## 🛠️ Værktøjer

- **QR Code Generator** - Generer QR-koder med tracking funktionalitet
- *Flere værktøjer kommer snart...*

## 🚀 Kom i gang

### Lokal udvikling

```bash
npm install
npm run dev
```

Åbn http://localhost:3000 i din browser.

### Build til production

```bash
npm run build
npm start
```

### Deployment til Vercel

Projektet er konfigureret til automatisk deployment på Vercel.

```bash
vercel --prod
```

## 📁 Projektstruktur

```
/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── create-tracked/  # Opret tracked QR-kode
│   │   ├── stats/           # Statistik API
│   │   └── track/           # Tracking redirect
│   ├── tools/               # Værktøjssider
│   │   └── qr-generator/    # QR Code Generator
│   ├── admin/               # Admin Dashboard
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Hovedside
│   └── globals.css          # Global styles
├── lib/                     # Utility funktioner
│   └── data.ts             # Data håndtering
├── package.json            # Dependencies
└── next.config.js          # Next.js konfiguration
```

## 🔧 Features

### QR Code Generator
- Generer QR-koder fra tekst eller URL'er
- Tracking funktionalitet - se hvor mange gange QR-koden bliver scannet
- Download QR-koder som PNG
- Justér størrelse og fejlkorrektion

### Admin Dashboard
- Oversigt over alle QR-koder
- Se antal scanninger per QR-kode
- Slet QR-koder (enkelt eller alle)
- Auto-opdatering hver 5. sekund

## 📝 License

MIT
