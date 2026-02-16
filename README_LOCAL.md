# Lokal Kørsel - Quick Start Guide

## 🚀 Hurtig Start

### Windows - Nemmeste metode:
1. **Dobbeltklik på `start-server.bat`**
2. Vent til serveren starter
3. Åbn browseren: `http://localhost:3000`

### Alternativ - Kommando linje:
```bash
npm start
```

## 📋 Hvad sker der når serveren starter?

Når serveren starter, ser du:
```
============================================================
🚀 QR Kode Generator Server
============================================================

✅ Server kører på:
   • Localhost:  http://localhost:3000
   • Lokalt netværk: http://192.168.50.137:3000
```

## 🌐 Tilgængelighed

- **Fra din computer:** http://localhost:3000
- **Fra telefon/anden computer:** http://192.168.50.137:3000 (eller den IP der vises)
- **Sørg for:** Telefon og computer er på samme WiFi

## 📄 Sider

- **Hoved side (Generator):** http://localhost:3000/
- **Dashboard (Statistikker):** http://localhost:3000/admin.html

## ⏹️ Stop serveren

Tryk `Ctrl + C` i terminalen hvor serveren kører.

## 🔧 Fejlfinding

### Serveren starter ikke?
1. Tjek at Node.js er installeret: `node --version`
2. Installer dependencies: `npm install`
3. Tjek om port 3000 er optaget

### Kan ikke tilgå fra telefon?
1. Tjek at telefon og computer er på samme WiFi
2. Brug IP-adressen fra server konsollen (ikke localhost)
3. Tjek firewall indstillinger

### QR-koder virker ikke?
1. Sørg for at tracking er aktiveret
2. Tjek at serveren kører
3. Brug IP-adressen i stedet for localhost i QR-koden
