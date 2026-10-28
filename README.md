# X3M Onderhoud

Kilometerstand bijhouden, zien welk onderhoud eraan komt, welke onderdelen je nodig hebt en wat dat ongeveer kost. Gebouwd met Vite, Supabase (login en database) en bedoeld voor Vercel.

Alle onderhoudspunten, intervallen en prijzen staan bovenaan `src/main.js` in de lijst `ITEMS`. Prijzen met het label "schatting" zijn richtprijzen, geen nagekeken winkelprijzen. Je kunt ze in de app aanpassen, dan worden ze in je eigen account bewaard.

## Installeren in vier stappen

### 1. Supabase
1. Maak op supabase.com een gratis project aan en kies een regio in Europa.
2. Open **SQL Editor**, plak de inhoud van `supabase/schema.sql` en klik op **Run**. Dit maakt de tabellen en zet de beveiliging aan, zodat iedereen alleen zijn eigen regels ziet.
3. Open **Authentication > Users** en voeg jezelf toe met e-mailadres en wachtwoord (kies "Auto Confirm User").
4. Zet daarna onder de instellingen van de e-mailprovider nieuwe aanmeldingen uit (het schakelaartje "Allow new users to sign up"). De app heeft geen aanmeldscherm, dus dit is alleen een extra slot.
5. Open **Project Settings > API** en kopieer de **Project URL** en de **anon / publishable key**. Gebruik nooit de `service_role`-key in deze app.

### 2. GitHub
1. Maak een nieuwe repository aan (privé is prima).
2. Zet de bestanden uit deze map erin, zonder `node_modules`, `dist` en `.env`. Die staan al in `.gitignore`.

   ```
   git init
   git add .
   git commit -m "X3M Onderhoud"
   git branch -M main
   git remote add origin https://github.com/JOUW-NAAM/x3m-onderhoud.git
   git push -u origin main
   ```

### 3. Vercel
1. Kies **Add New > Project** en importeer de repository. Vercel herkent Vite zelf.
2. Voeg onder **Environment Variables** deze twee toe, met de waarden uit stap 1.5:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Klik op **Deploy**.

### 4. Eerste keer gebruiken
1. Open je Vercel-adres en log in.
2. Je account is nog leeg, dus de app toont bovenaan **Startgegevens importeren**. Klik erop: dat zet je stand van 133.890 km (27 oktober 2026) en de 18 regels uit je Excel in de database. Doe dit één keer.
3. Op je telefoon: kies in de browser **Zet op beginscherm**, dan opent de app als losse app.

## Lokaal draaien
```
cp .env.example .env     # vul de twee waarden in
npm install
npm run dev
```

## Goed om te weten
- **Pauze bij weinig gebruik.** Gratis Supabase-projecten worden gepauzeerd na ongeveer een week met weinig verkeer. Een paar verzoeken per dag houdt het project actief; één keer per week een stand invullen zit op de grens. Een gepauzeerd project kun je in het dashboard hervatten (tot een jaar na de pauze). Een betaald plan voorkomt dit.
- **Back-up.** In Supabase kun je onder **Table Editor** elke tabel als CSV exporteren.
- **Wachtwoord vergeten.** Zet een nieuw wachtwoord via Supabase onder **Authentication > Users**.
- **Eén gebruiker.** De app is gemaakt voor één persoon. Meerdere accounts werken, maar elk account ziet alleen zijn eigen gegevens.
