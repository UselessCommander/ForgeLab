# GitHub Setup Guide

Følg disse trin for at sætte projektet op på GitHub:

## 1. Installer Git (hvis ikke allerede installeret)

Download Git fra: https://git-scm.com/download/win

## 2. Åbn PowerShell eller Command Prompt i projektmappen

```powershell
cd c:\Users\Gabriel\Desktop\Qr
```

## 3. Initialiser Git repository

```bash
git init
```

## 4. Tilføj alle filer

```bash
git add .
```

## 5. Lav første commit

```bash
git commit -m "first commit"
```

## 6. Sæt branch til main

```bash
git branch -M main
```

## 7. Tilføj remote repository

```bash
git remote add origin https://github.com/UselessCommander/ForgeLab.git
```

## 8. Push til GitHub

```bash
git push -u origin main
```

**Bemærk:** Du bliver muligvis bedt om at logge ind på GitHub første gang.

## Hvis du får fejl

### "remote origin already exists"
Hvis remote allerede findes, kan du fjerne den og tilføje igen:
```bash
git remote remove origin
git remote add origin https://github.com/UselessCommander/ForgeLab.git
```

### Authentication fejl
Du skal muligvis bruge en Personal Access Token i stedet for password:
1. Gå til GitHub → Settings → Developer settings → Personal access tokens
2. Opret en ny token med `repo` permissions
3. Brug token som password når du pusher
