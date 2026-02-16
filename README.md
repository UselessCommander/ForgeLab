# ForgeLab

Et samlet værktøjssuite med forskellige online værktøjer.

## 🛠️ Værktøjer

- **QR Code Generator** - Generer QR-koder med tracking funktionalitet
- *Flere værktøjer kommer snart...*

## 🚀 Kom i gang

### Lokal udvikling

```bash
npm install
npm start
```

Åbn http://localhost:3000 i din browser.

### Deployment til Vercel

Projektet er konfigureret til deployment på Vercel.

```bash
vercel --prod
```

## 📁 Projektstruktur

```
/
├── public/                    # Frontend filer
│   ├── index.html            # Hovedside med navigation
│   ├── admin.html            # Admin dashboard
│   └── tools/                # Individuelle værktøjer
│       └── qr-generator.html # QR Code Generator
├── server.js                 # Express server med tracking API
├── package.json              # Dependencies
└── vercel.json              # Vercel konfiguration
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
