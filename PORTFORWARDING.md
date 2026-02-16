# Portforwarding - Er det nødvendigt?

## Kort svar: NEJ! 🎉

Du behøver **IKKE** portforwarde for at bruge projektet!

## Hvornår behøver du portforwarding?

**Portforwarding er kun nødvendigt hvis:**
- Du vil have QR-koder tilgængelige fra hele internettet
- Nogen skal kunne scanne QR-koden fra et helt andet netværk/WiFi

## Hvornår virker det UDEN portforwarding?

### ✅ Lokalt netværk (samme WiFi)
- Telefon og computer på samme WiFi
- QR-koder virker perfekt
- Ingen portforwarding nødvendig
- Brug IP-adressen: `http://192.168.50.137:3000`

### ✅ Vercel Deployment (anbefalet)
- Upload til Vercel
- QR-koder virker fra hele verdenen
- Ingen portforwarding nødvendig
- Automatisk HTTPS
- Custom domain: `qr.floweffekt.dk`

## Hvis du vil teste offentligt lokalt (uden portforwarding)

Brug **ngrok** - det laver en tunnel:

1. Installer ngrok: https://ngrok.com/
2. Start din server: `npm start`
3. I ny terminal: `ngrok http 3000`
4. Brug den offentlige URL fra ngrok i QR-koderne

## Anbefaling

**Brug Vercel deployment:**
- ✅ Ingen portforwarding nødvendig
- ✅ Automatisk tilgængelig fra hele verdenen
- ✅ Gratis
- ✅ HTTPS automatisk
- ✅ Custom domain support

Portforwarding er kun nødvendigt hvis du absolut vil køre serveren lokalt OG have den tilgængelig fra hele internettet.
