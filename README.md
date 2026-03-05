# PT Tracker - Personal Trainer App

Een volledige web-app voor personal trainers om klanten te beheren, workouts te loggen en voortgang bij te houden.

## Functies
- 🔐 Meerdere trainers kunnen registreren en inloggen
- 👥 Klantenbeheer (toevoegen, bewerken, verwijderen)
- 💪 Workouts loggen met sets, reps, gewicht en RPE
- 📈 Voortgangsgrafieken per oefening per klant
- 🏋️ Database met 70+ oefeningen + eigen oefeningen toevoegen

## Installatie

### Vereisten
- **Node.js** (versie 18 of hoger)
  - Download via: https://nodejs.org/
  - Of via Homebrew: `brew install node`

### Backend starten

```bash
cd PTApp/backend
npm install
node seed.js        # Vult de oefeningen database (eenmalig)
npm run dev         # Start de backend op http://localhost:3001
```

### Frontend starten (nieuw terminal venster)

```bash
cd PTApp/frontend
npm install
npm start           # Start de app op http://localhost:3000
```

## Gebruik
1. Ga naar http://localhost:3000
2. Maak een account aan als trainer
3. Voeg klanten toe via het Dashboard
4. Log workouts via "Log Workout"
5. Bekijk voortgang via de knop "Voortgang" bij een klant

## Technologie
- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Frontend**: React + Tailwind CSS + Chart.js
- **Auth**: JWT tokens
