# Guide: Slet branch indhold og kopier fra main

## Metode 1: Reset branch til main (anbefalet)

Hvis du vil have branch'en til at være identisk med main/master:

```bash
# 1. Skift til den branch du vil opdatere
git checkout [branch-navn]

# 2. Reset branch'en til at være identisk med main
git reset --hard main

# Eller hvis din main branch hedder master:
git reset --hard master

# 3. Force push til remote (VIGTIGT: Dette overskriver remote branch!)
git push origin [branch-navn] --force
```

## Metode 2: Slet og genopret branch

Hvis du vil slette branch'en helt og lave en ny:

```bash
# 1. Skift til main/master
git checkout main
# eller
git checkout master

# 2. Slet branch'en lokalt
git branch -D [branch-navn]

# 3. Slet branch'en på remote
git push origin --delete [branch-navn]

# 4. Opret ny branch fra main
git checkout -b [branch-navn]

# 5. Push den nye branch
git push origin [branch-navn]
```

## Metode 3: Merge main ind i branch (bevarer branch historik)

Hvis du vil beholde branch historikken men opdatere indholdet:

```bash
# 1. Skift til din branch
git checkout [branch-navn]

# 2. Merge main ind i branch'en
git merge main --strategy-option theirs

# Eller hvis du vil erstatte alt:
git reset --hard main
git push origin [branch-navn] --force
```

## Eksempel

Hvis din branch hedder `development` og du vil kopiere fra `main`:

```bash
git checkout development
git reset --hard main
git push origin development --force
```

## ⚠️ ADVARSEL

- `--force` push overskriver remote branch permanent
- Sørg for at have backup hvis andre arbejder på branch'en
- Vær sikker på at du vil slette alt i branch'en før du kører disse kommandoer
