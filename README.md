# Service Appointment Platform

App di prenotazione online per barbieri, saloni, centri estetici e servizi su
appuntamento. **Single-tenant** (un deploy = un'attività) con **più sedi e
operatori**, mobile-first, tema personalizzabile per brand.

**Stack:** React + Vite + TypeScript · Tailwind CSS (design token) · Supabase
(Postgres, Auth, Storage, Edge Functions) · Resend (email) · Recharts (grafici).

**Funzionalità:** catalogo servizi + **pacchetti**, prenotazione con slot dinamici,
email di conferma/spostamento/cancellazione, **agenda admin** (mese/settimana/giorno)
con spostamento e cancellazione, **vetrina prodotti**, **carosello** in home, pagina
**Chi siamo** editabile, **statistiche** admin, **sidebar** post-login, tema
**Sabbia & Espresso** personalizzabile per brand.

---

## Requisiti

- Node.js 18+ e npm
- Un account [Supabase](https://supabase.com) (configurazione nella Tappa 1)

## Avvio rapido (sviluppo)

```bash
npm install
cp .env.example .env   # poi inserisci URL e anon key di Supabase
npm run dev
```

L'app parte su <http://localhost:5173>. Vite è configurato con `host: true`,
quindi puoi aprirla anche dallo **smartphone** sulla stessa rete usando l'IP
locale mostrato nel terminale (utile per testare il mobile reale).

> Nella Tappa 0 l'app mostra una landing dimostrativa per validare design system
> e responsività: non richiede ancora una connessione Supabase funzionante.

## Script

| Comando             | Cosa fa                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Server di sviluppo con hot reload        |
| `npm run build`     | Type-check + build di produzione         |
| `npm run preview`   | Anteprima della build di produzione      |
| `npm run lint`      | ESLint                                   |
| `npm run typecheck` | Controllo dei tipi senza emettere output |
| `npm run format`    | Prettier                                 |

## Variabili d'ambiente

Le chiavi Supabase NON sono mai nel codice: stanno in `.env` (ignorato da git).
Vedi `.env.example`. La chiave `service_role` non va **mai** nel frontend: si usa
solo nelle Edge Functions come secret lato Supabase.

## Personalizzazione del brand (tema)

Tutti i colori/font sono **design token** (CSS custom properties) definiti in
[`src/index.css`](src/index.css) e mappati su Tailwind in
[`tailwind.config.ts`](tailwind.config.ts).

- Default statici: [`src/brand.config.ts`](src/brand.config.ts)
- Override a runtime (senza rebuild): [`src/theme/applyBrand.ts`](src/theme/applyBrand.ts),
  che leggerà `settings.theme` dal database (Tappa 6).

Per ribrandizzare velocemente un cliente basta cambiare i valori `--color-*` in
`:root`: nessun colore è hard-coded nei componenti.

## Configurazione Supabase (Tappa 1)

Segui questi passi una sola volta per preparare il backend.

### 1. Crea il progetto

1. Vai su <https://supabase.com> → **New project**. Scegli nome, password del
   database (salvala) e regione vicina ai tuoi clienti (es. *EU Central*).
2. Apri **Project Settings → API** e copia:
   - **Project URL** → in `.env` come `VITE_SUPABASE_URL`
   - **anon public** key → in `.env` come `VITE_SUPABASE_ANON_KEY`
3. NON copiare la chiave `service_role` nel frontend: serve solo alle Edge
   Functions (Tappa 5), come secret.

### 2. Esegui le migration (SQL Editor)

Apri **SQL Editor → New query** ed esegui i file della cartella
[`supabase/migrations`](supabase/migrations) **in ordine**, uno alla volta
(incolla il contenuto e premi *Run*):

1. `0001_init.sql` — tabelle, vincoli, trigger
2. `0002_rls.sql` — Row Level Security e policy
3. `0003_functions.sql` — funzioni RPC (slot, prenotazione, annullamento)
4. `0004_seed.sql` — dati di esempio (facoltativo, comodo in sviluppo)

> I file sono idempotenti: puoi rilanciarli senza creare duplicati.

### 3. Configura l'autenticazione

In **Authentication → Providers** assicurati che **Email** sia attivo.

- Per sviluppare più velocemente puoi disattivare temporaneamente la conferma
  via email in **Authentication → Sign In / Providers → Email → "Confirm email"**
  (riattivala prima della pubblicazione).
- In **Authentication → URL Configuration** imposta il **Site URL**
  (`http://localhost:5173` in sviluppo; il dominio reale in produzione).

### 4. Crea il tuo account admin

1. Avvia l'app (`npm run dev`) e **registrati** con la tua email (la pagina di
   registrazione arriva in Tappa 2; in alternativa crea l'utente da
   **Authentication → Users → Add user**).
2. Promuovi quell'utente ad admin dal **SQL Editor**:

   ```sql
   update public.profiles
      set role = 'admin'
    where id = (select id from auth.users where email = 'tua@email.com');
   ```

### 5. Verifica rapida (consigliata)

Dallo SQL Editor controlla che lo schema e gli slot funzionino:

```sql
-- elenco servizi attivi
select id, name, duration_min from public.services;

-- slot liberi di oggi per un servizio (sostituisci l'UUID)
select * from public.get_available_slots(
  (select id from public.services limit 1),
  current_date
);
```

> Storage (logo brand) ed Edge Function per le email verranno configurati nelle
> Tappe 5–6, con istruzioni dedicate.

### Modello dati in breve

| Tabella          | Ruolo                                                        |
| ---------------- | ----------------------------------------------------------- |
| `profiles`       | Utente + ruolo (`admin`/`client`), creato al signup         |
| `services`       | Catalogo servizi (nome, durata, prezzo)                     |
| `business_hours` | Orari settimanali ricorrenti (più fasce per giorno)         |
| `closures`       | Chiusure straordinarie / ferie                              |
| `bookings`       | Prenotazioni (risorsa unica, anti-overlap a livello DB)     |
| `settings`       | Riga singola: fuso, regole slot, brand (logo, tema)         |

Sicurezza: i clienti vedono **solo le proprie** prenotazioni. La disponibilità
passa dalla funzione `get_available_slots`, che restituisce solo orari liberi
senza esporre dati altrui. La creazione passa da `create_booking`, con un vincolo
di esclusione che impedisce sovrapposizioni anche in caso di richieste concorrenti.

## Aggiornamento v2: nuove tabelle e Storage immagini

La versione 2 aggiunge pacchetti, prodotti, carosello home, contenuti "Chi siamo"
e statistiche. Per attivarla:

### 1. Esegui la migration

Nello **SQL Editor** esegui [`supabase/migrations/0005_v2.sql`](supabase/migrations/0005_v2.sql).
Aggiunge: campi pacchetto a `services`, tabelle `products` e `home_slides`, campi
"Chi siamo" su `settings`, snapshot prezzo su `bookings`, la RPC `get_admin_stats`
e le policy RLS (clienti sola lettura). Crea anche il bucket Storage `media` con
le relative policy.

### 2. Verifica il bucket Storage

Il bucket pubblico **`media`** viene creato dalla migration. Controlla in
**Storage** che esista e sia *Public*. Le immagini (prodotti, slide, servizi) si
caricano dal pannello admin in sottocartelle (`products/`, `slides/`, `services/`).

- **Lettura**: pubblica (le immagini sono mostrate in vetrina).
- **Scrittura/eliminazione**: consentita **solo agli admin** (policy
  `storage.objects` basate su `is_admin()`), quindi un cliente non può caricare
  nulla anche manomettendo il client.

> Se preferisci creare il bucket a mano: Storage → New bucket → nome `media`,
> spunta *Public bucket*. Le policy SQL restano quelle della migration.

### 3. Verifica statistiche (opzionale)

Come admin, dallo SQL Editor: `select public.get_admin_stats();` deve restituire
un JSON con clienti, fatturato e prenotazioni per mese. Come cliente solleva
"Non autorizzato".

## Aggiornamento v5: calendario + agenda giorno per operatore (Prenota)

La tab **Prenota** mostra un **calendario mensile** (giorni disponibili) e, cliccando
un giorno, una **agenda per operatore** (fasce libere verdi cliccabili, occupate
rosse). Esegui nello **SQL Editor**, in ordine:

- [`0008_month_availability.sql`](supabase/migrations/0008_month_availability.sql):
  RPC `get_month_availability(servizio, sede, anno, mese, operatore?)` → giorni con
  almeno uno slot libero (riusa `get_available_slots`).
- [`0009_day_schedule.sql`](supabase/migrations/0009_day_schedule.sql): RPC
  `get_day_schedule(servizio, sede, giorno)` → per ogni operatore le fasce
  occupate/libere. **Sola lettura, nessun dato cliente** (solo nome operatore +
  orario).

Entrambe `SECURITY DEFINER`, lettura pubblica. Nessun nuovo bucket/secret/webhook.

## Aggiornamento v4: multi-sede e multi-operatore

La v4 trasforma l'app in **un business con N sedi**, ognuna con i propri operatori
e orari. La disponibilità diventa **per-operatore-per-sede**.

### 1. Esegui la migration

Nello **SQL Editor** esegui [`supabase/migrations/0007_multisede.sql`](supabase/migrations/0007_multisede.sql):
- crea le tabelle `locations` (sedi) e `staff` (operatori, senza login);
- aggiunge `location_id` a `business_hours`/`closures` e `location_id`+`staff_id`
  (con snapshot nomi) a `bookings`;
- sostituisce l'anti-sovrapposizione con una **per operatore**;
- riscrive le RPC (`get_available_slots`, `create_booking`, `reschedule_booking`,
  `get_admin_stats`) per essere consapevoli di sede/operatore;
- **migra i dati esistenti** creando una *Sede principale* e un *Operatore* di
  default e assegnandoli a orari e prenotazioni già presenti → nessuna rottura.

> Compatibilità: finché la nuova UI non è completa, le chiamate senza sede usano
> automaticamente la sede di default, quindi l'app continua a funzionare durante la
> migrazione delle tappe.

### 2. Email: ridepolya la function

Le email automatiche (conferma/spostamento/cancellazione) ora includono **sede e
operatore** e usano il **fuso della sede**. Ridepolya l'Edge Function
`send-booking-confirmation` con il codice aggiornato. Nessun nuovo bucket, secret
o webhook.

## Aggiornamento v3: agenda admin

La v3 aggiunge un'**agenda gestionale** (viste mese/settimana/giorno) con
spostamento e cancellazione degli appuntamenti e relative email di avviso.

### 1. Esegui la migration

Nello **SQL Editor** esegui [`supabase/migrations/0006_agenda.sql`](supabase/migrations/0006_agenda.sql):
- estende `get_available_slots` con un parametro opzionale per escludere un
  appuntamento (serve allo spostamento);
- aggiunge la RPC **`reschedule_booking`** (admin-only, `SECURITY DEFINER`) che
  ri-valida orari, pause, chiusure e anti-sovrapposizione prima di spostare.

La cancellazione riusa `cancel_booking` (già admin-or-owner). Entrambe le RPC sono
protette da `is_admin()`: un cliente non può spostare/cancellare appuntamenti altrui.

### 2. Email di avviso → nuovo webhook UPDATE

Le email di **spostamento** e **cancellazione** partono quando l'admin aggiorna un
appuntamento. Serve quindi un secondo webhook (oltre a quello INSERT già esistente):

1. **Ridepoloya** l'Edge Function `send-booking-confirmation` (codice aggiornato:
   gestisce sia INSERT sia UPDATE).
2. Supabase → **Database → Webhooks → Create a new hook**:
   - Table `public.bookings`, **Events: `UPDATE`**
   - Type *Supabase Edge Functions* → `send-booking-confirmation`
   - Header `x-webhook-secret` con lo stesso valore di `WEBHOOK_SECRET`.

Nessun nuovo secret. La function distingue i casi dal payload: cancellazione
(`status` → `cancelled`), spostamento (`starts_at` cambiato).

## Email di conferma (Tappa 5)

Quando viene creata una prenotazione, un **Database Webhook** chiama l'Edge
Function [`send-booking-confirmation`](supabase/functions/send-booking-confirmation/index.ts),
che invia l'email tramite **Resend**.

### 1. Account Resend

1. Registrati su <https://resend.com> e crea una **API key** (Dashboard → API Keys).
2. **Mittente**: per inviare a qualsiasi destinatario devi **verificare un dominio**
   (Resend → Domains). In fase di test, senza dominio, Resend invia solo verso
   l'email del tuo account e da `onboarding@resend.dev`.
3. Annota il mittente, es. `Barber Shop <noreply@tuodominio.it>`.

### 2. Deploy della Edge Function

**Opzione A — Dashboard (consigliata, niente strumenti da installare):**

1. Supabase → **Edge Functions → Deploy a new function**.
2. Nome: `send-booking-confirmation`. Incolla il contenuto di
   [`index.ts`](supabase/functions/send-booking-confirmation/index.ts) e
   [`template.ts`](supabase/functions/send-booking-confirmation/template.ts).
3. **Disattiva "Verify JWT"** (la chiamata arriva dal webhook, non da un utente).

**Opzione B — Supabase CLI:**

```bash
supabase functions deploy send-booking-confirmation --no-verify-jwt
```

### 3. Imposta i secrets

Supabase → **Project Settings → Edge Functions → Secrets** (oppure
`supabase secrets set ...`):

| Secret           | Valore                                                       |
| ---------------- | ------------------------------------------------------------ |
| `RESEND_API_KEY` | la tua API key Resend                                        |
| `FROM_EMAIL`     | mittente verificato, es. `Barber <noreply@tuodominio.it>`    |
| `WEBHOOK_SECRET` | (consigliato) una stringa casuale, es. `openssl rand -hex 16`|

> `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sono iniettati automaticamente:
> non vanno impostati a mano. La `service_role` resta solo lato server.

### 4. Crea il Database Webhook

Supabase → **Database → Webhooks → Create a new hook**:

- **Table**: `public.bookings`
- **Events**: `INSERT`
- **Type**: *Supabase Edge Functions* → seleziona `send-booking-confirmation`
- **HTTP Headers**: aggiungi `x-webhook-secret` con lo stesso valore di
  `WEBHOOK_SECRET` (se l'hai impostato).

### 5. Prova

Crea una prenotazione di test dall'app → dovresti ricevere l'email. In caso di
problemi controlla **Edge Functions → Logs** della function.

## Gestione dal pannello admin

Dalla Tappa 6 esiste un **pannello admin** (`/admin`, visibile solo agli utenti
con ruolo `admin`) per gestire **da interfaccia grafica**:

- **Prenotazioni** (`/admin`): viste Prossime/Passate/Tutte, contatti del cliente,
  e azioni Completata / Non presentato / Annulla.
- **Servizi** (`/admin/servizi`): crea, modifica, attiva/disattiva, elimina.
- **Orari** (`/admin/orari`): fasce settimanali e chiusure straordinarie.
- **Impostazioni** (`/admin/impostazioni`): nome, logo, **colori del brand**,
  fuso orario e regole degli slot.

> Cambiare nome e colori da qui aggiorna l'app in tempo reale (tema runtime),
> senza rebuild.

## Gestione rapida via SQL (alternativa)

In alternativa al pannello, puoi gestire tutto dal **Table Editor** o dallo
**SQL Editor** di Supabase. L'app legge i dati in tempo reale: dopo la modifica
basta ricaricare la pagina.

### Cambiare il nome dell'app

Il nome mostrato (header, footer, titolo pagina) viene da `settings.business_name`.

```sql
update public.settings set business_name = 'Barber Shop Mario' where id = true;
```

> Esiste anche un default "build-time" in [`src/brand.config.ts`](src/brand.config.ts)
> (`brandConfig.name`), usato solo come fallback se la tabella non è raggiungibile.
> Il valore nel DB ha sempre la precedenza.

### Cambiare orari e giorni di apertura

Gli orari stanno in `business_hours`. Ogni riga è **una fascia oraria** di un
giorno; convenzione: `weekday` 0 = Domenica, 1 = Lunedì … 6 = Sabato. Più righe
sullo stesso giorno = più fasce (es. mattina + pomeriggio con pausa pranzo).

```sql
-- Vedere gli orari attuali
select weekday, open_time, close_time from public.business_hours order by weekday, open_time;

-- Cambiare l'orario del lunedì pomeriggio (esempio)
update public.business_hours
   set close_time = '20:00'
 where weekday = 1 and open_time = '15:00';

-- Aggiungere una giornata/fascia (es. domenica mattina 10:00–13:00)
insert into public.business_hours (weekday, open_time, close_time) values (0, '10:00', '13:00');

-- Chiudere completamente un giorno (es. lunedì): elimina le sue fasce
delete from public.business_hours where weekday = 1;

-- Aggiungere la pausa pranzo a un giorno aperto con orario continuato:
-- elimina la fascia unica e inseriscine due (mattina + pomeriggio)
delete from public.business_hours where weekday = 6;
insert into public.business_hours (weekday, open_time, close_time)
values (6, '09:00', '13:00'), (6, '15:00', '18:00');
```

Chiusure straordinarie (ferie, festivi) → tabella `closures`:

```sql
-- Chiuso per ferie dal 10 al 20 agosto 2026
insert into public.closures (starts_at, ends_at, reason)
values ('2026-08-10 00:00+02', '2026-08-21 00:00+02', 'Ferie estive');
```

### Regole degli slot

In `settings` puoi regolare il comportamento del calcolo orari:

| Campo              | Significato                                            | Default |
| ------------------ | ------------------------------------------------------ | ------- |
| `slot_step_min`    | Granularità degli slot proposti (minuti)               | 15      |
| `min_notice_min`   | Preavviso minimo per prenotare (minuti)                | 120     |
| `max_advance_days` | Quanti giorni in avanti si può prenotare               | 60      |
| `timezone`         | Fuso orario dell'attività (es. `Europe/Rome`)          | Europe/Rome |

```sql
update public.settings
   set slot_step_min = 30, min_notice_min = 60, max_advance_days = 45
 where id = true;
```

## Pubblicazione (deploy)

L'app è una SPA statica: si pubblica facilmente su **Vercel**, **Netlify** o
**Cloudflare Pages**.

1. **Build**: `npm run build` (output in `dist/`).
2. **Variabili d'ambiente** sul provider: imposta `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` (gli stessi del `.env`).
3. **SPA fallback**: assicurati che tutte le rotte servano `index.html`
   (Vercel/Netlify lo fanno in automatico per i progetti Vite).
4. **Supabase → Authentication → URL Configuration**: imposta il **Site URL** sul
   dominio di produzione e aggiungi gli eventuali **Redirect URLs**.
5. **Riattiva la conferma email** in Authentication (se l'avevi disattivata per i
   test) e verifica che Resend usi un **dominio verificato** come mittente.

Prima di pubblicare, controlla la build localmente con `npm run preview`.

## Struttura (in crescita per tappe)

```
src/
  components/ui/        componenti base (Button, Input, Select, Card, Badge, Dialog, Spinner, States)
  components/layout/    Header (con menu mobile), Footer, Container, PublicLayout
  context/              AuthProvider + auth-context
  features/
    auth/               schermate e helper di login/registrazione
    services/           data layer e card dei servizi
    settings/           branding runtime, orari, query impostazioni
    booking/            slot, selettori data/ora, form di prenotazione
    admin/              data layer e UI del pannello admin
  routes/
    pages/              pagine pubbliche + pages/admin/*
    guards.tsx          RequireAuth / RequireAdmin
  theme/                applyBrand (tema runtime)
  lib/                  supabase client, queryClient, utility
  types/                tipi DB e di dominio
  brand.config.ts       configurazione brand di default
  index.css             design token (CSS variables)
supabase/
  migrations/           SQL: schema, RLS, funzioni, seed
  functions/            Edge Function email (Deno)
```

## Roadmap (tappe)

- [x] **Tappa 0** — Scaffold, design system, layout responsive
- [x] **Tappa 1** — Schema DB + RLS + funzioni RPC + guida Supabase
- [x] **Tappa 2** — Auth e ruoli (admin / cliente)
- [x] **Tappa 3** — Sito pubblico + catalogo servizi
- [x] **Tappa 4** — Flusso di prenotazione con slot dinamici
- [x] **Tappa 5** — Email di conferma (Resend + Edge Function)
- [x] **Tappa 6** — Pannello admin
- [x] **Tappa 7** — Rifinitura: code-splitting, menu mobile, accessibilità, deploy

### v2 — Funzionalità premium + restyling

- [x] **v2.1** — DB & Storage: pacchetti, prodotti, slide, contenuti, stats RPC, bucket `media`
- [x] **v2.2** — Restyling "Sabbia & Espresso" (token + font Cormorant/Inter)
- [x] **v2.3** — Sidebar post-login + drawer mobile
- [x] **v2.4** — Pacchetti (estensione servizi) + upload immagini
- [x] **v2.5** — Vetrina prodotti + gestione admin
- [x] **v2.6** — Carosello home + gestione slide
- [x] **v2.7** — Pagina "Chi siamo" + editor admin
- [x] **v2.8** — Statistiche admin (Recharts)
- [x] **v2.9** — Rifinitura finale

### v3 — Agenda gestionale admin

- [x] **v3.1** — DB & RPC: `reschedule_booking` + `get_available_slots` con esclusione
- [x] **v3.2** — Agenda: struttura + vista Giorno
- [x] **v3.3** — Viste Mese e Settimana (responsive)
- [x] **v3.4** — Spostamento appuntamenti (slot liberi reali)
- [x] **v3.5** — Email di avviso (spostamento / cancellazione)
- [x] **v3.6** — Editor orari per-giorno + pausa pranzo
- [x] **v3.7** — Rifinitura finale

### v4 — Multi-sede + multi-operatore

- [x] **v4.1** — DB & RPC: tabelle `locations`/`staff`, slot/anti-overlap per operatore
- [x] **v4.2** — Gestione Sedi & Operatori (admin)
- [x] **v4.3** — Orari per sede + chiusure per sede
- [x] **v4.4** — Flusso cliente: sede → operatore → orario
- [x] **v4.5** — Agenda per sede/operatore + spostamento con cambio operatore
- [x] **v4.6** — Statistiche per sede
- [x] **v4.7** — Email con sede/operatore + rifinitura
