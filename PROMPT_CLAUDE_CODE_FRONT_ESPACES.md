# Verifikasyon Espas Kliyan (`/portal`) ak Espas Anplwaye (`/staff`) — pou Claude Code

## Kontèks

Nan `ksexpress-front`, mwen konekte sit la ak vrè backend `ksexpress-back` la (pa gen done senile ankò pou zòn otantifye yo). Mwen bati:

- `/login`, `/register` (ak verifikasyon kòd), `/forgot-password`, `/reset-password` — konekte ak vrè `/auth/*`.
- `/portal` (rôl CLIENT) : rezime, mwen colis, mwen factè (telechaje PDF), preferans notifikasyon.
- `/staff` (rôl SUPER_ADMIN / EMPLOYE_SHIPPING / CAISSIER) : colis (rechèch/kreye/edite/statik/foto/etikèt), colis non-idantifye, scanner, lo, kliyan, factè (kreye/ankesman/resi), `/staff/admin/*` (Super Admin sèlman) : itilizatè entèn, grid tarifè, paramèt, jounal odit.

Menm login pou tout moun — redireksyon otomatik apre koneksyon selon wòl la (CLIENT → `/portal`, lòt yo → `/staff`).

## Round 2 — chanjman jodi a (dwe verifye an priyorite)

1. **Sidebar strict** : `AppShell` refèt an vrè barre laterale (pa yon barre orizontal), seksyon ki gen plizyè lyen yo (Colis, Administration) ouvri an akordeyon **anndan menm sidebar la** (`components/ui/accordion.tsx`, baze sou `@base-ui/react` Accordion — pa Radix dirèk, pou match konvansyon `combobox.tsx` ki deja la). Premye vèsyon te itilize yon dropdown ki flote deyò sidebar la (`components/ui/dropdown-menu.tsx`, toujou disponib men pa itilize nan sidebar la ankò) — korije apre remak itilizatè a.
2. **Yon lo = yon sèl kliyan** (règ entèn, pa gen RG-SHP ofisyèl) : `LotsService.attachColis` kounya rejte si w eseye mete colis 2 kliyan diferan nan menm lo, oswa yon colis ki poko gen kliyan (non-idantifye). **Sa a bezwen tès reyèl** : eseye rataché 2 colis 2 kliyan diferan nan menm lo → dwe voye `ConflictException`.
3. **Yon lo pa dwe gen yon sèl colis avan l pati** : `LotsService.changerStatut` rejte tranzisyon `WAITING_SHIPMENT → IN_TRANSIT` si lo a gen mwens pase 2 colis. **Tès reyèl** : kreye yon lo, mete yon sèl colis, eseye chanje estati l pou `IN_TRANSIT` → dwe echwe.
4. **Tracking obligatwa** : `CreateColisDto.tracking` pa `@IsOptional()` ankò — kreyasyon colis san tracking dwe echwe (400). Plizyè colis ka toujou gen menm tracking (pa gen chanjman sou `@@unique([tracking, clientId])`).
5. **Grille tarifè — mòd calcul** : nouvo enum Prisma `ModeCalculTarif` (`POIDS` | `FIXE`) + chan `GrilleTarifaire.calculMode` (default `POIDS`). Sèlman mòd `POIDS` fè kalkil pa lb (`poidsLb × prixParLb + fraisFixes`) ; mòd `FIXE` itilize `prixParLb` kòm yon pri fiks (poids pa antre nan kalkil la ditou, e pa oblije ranpli). **BEZWEN MIGRATION** : `npx prisma migrate dev --name add_calcul_mode_grille_tarifaire` avan sa mache kont vrè DB a — mwen pa t kapab fè l nan sandbox mwen an (rezo bloke pou binè Prisma), men `npx prisma generate` te reyisi pandan sesyon an (kliyan Prisma jenere a deja gen `calculMode`), donk `tsc --noEmit` klè de bò a — se sèlman migration DB a ki rete.
6. **Detay colis/lo amelyore** : `GET /packages/:id` ak `GET /lots/:id` kounya voye `client` (id/codeKse/nom/prenom/telefòn) anndan repons lan. Paj `/staff/packages/:id` afiche kliyan an ak yon lyen tounen; paj `/staff/lots/:id` afiche poids total + kategori + kliyan lo a + lyen sou chak colis.
7. **Kategori colis** : chwazi nan yon `<select>` ranpli ak kategori aktif nan grille tarifè a (`GET /admin/pricing-grids?actif=true`), pa ekri lib ankò.
8. **Statik colis normalize** : etikèt yo senp an anglè (Created, Received, Waiting, In Transit, Customs, Arrived, Available, Delivered, Cancelled, Returned, Lost) — wè `components/app-shell/StatusBadge.tsx`.
9. **Siyati kliyan retire** nan paj `/staff/invoices/:id` (backend `POST /invoices/:id/signature` toujou egziste, men UI a pa mande l ankò pou ankesman an).

**Sa mwen VERIFYE nan sandbox mwen an** : `npx tsc --noEmit` klè ak `npx eslint .` klè sou de repo yo (front AK back), kòd la li tout DTO/kontwolè backend yo pou asire chan yo matche egzakteman ak sa fwontyè a voye. **Mwen PA t kapab teste an dirèk kont vrè DB a** (migration Prisma, règ "yon lo = yon kliyan", règ "2 colis minimòm") — se sa ki rete pou ou.

## Sa pou verifye an dirèk

1. `cd ksexpress-back && npx prisma migrate dev --name add_calcul_mode_grille_tarifaire && npm run start:dev` (pò 3001 pa defo).
2. `cd ksexpress-front && cp .env.example .env.local` (verifye `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`), `npm run dev` (pò 3000).
3. **Kliyan** : enskri yon nouvo kont sou `/register`, verifye kòd la, konekte sou `/login` → dwe voye ale nan `/portal`. Verifye rezime a, `/portal/packages`, `/portal/invoices`, chanje preferans nan `/portal/settings`.
4. **Anplwaye entèn** : itilize kont Super Admin `npm run db:seed` la pou konekte, verifye sidebar la ak dropdown yo (Colis, Administration) mache byen, epi:
   - Kreye yon kliyan (`/staff/clients`), kreye 2 colis pou li AK tracking obligatwa (`/staff/packages/new`) — kategori a chwazi nan yon dropdown ki soti nan grille tarifè a.
   - Chanje yo pou `RECEIVED_USA`, kreye yon lo (`/staff/lots`), rataché LE 2 colis yo — dwe mache. Eseye rataché yon colis yon lòt kliyan nan menm lo a — dwe echwe.
   - Eseye chanje lo a pou `IN_TRANSIT` avèk yon sèl colis (retire lòt la anvan) — dwe echwe ; ak 2 colis — dwe mache.
   - Nan lis `/staff/packages`, konfime lo a parèt kòm yon liy gwoupe (klike pou wè colis anndan l), ak kolòn Client ranpli.
   - Nan `/staff/lots/:id`, konfime poids total ak kategori yo afiche kòrèkteman.
   - Kreye yon grille tarifè `FIXE` (`/staff/admin/pricing-grids`), kreye yon colis nan kategori sa a san poids, fè l rive `READY_PICKUP`, kreye yon factè — konfime montan an se pri fiks la, pa yon kalkil pa lb.
   - Fè yon ankesman san siyati — konfime `/staff/invoices/:id` pa mande siyati ankò, colis yo pase `DELIVERED`.
5. Konekte kòm Kesye/Employé Shipping separeman, konfime yo PA ka wè paj Super Admin yo, ak Kliyan pa ka rive nan `/staff` ditou.
6. `npm run build` (backend AK front) — konfime l pase san erè.

## Round 2b — apre rapò w la (dwe verifye tou)

1. **Sidebar akordeyon → korije pou vre** : `SidebarGroup` a te fè yon panèl flote deyò sidebar la olye ouvri anndan l — korije, kounya seksyon yo ouvri **anndan menm kolòn sidebar la** (menm mekanis akordeyon ak anvan, jis bug rannu li a te korije).
2. **Anbigwite scan tracking** : `ColisService.lookupByCode` te itilize yon `findFirst` san limit lè plizyè colis gen menm tracking (posib depi tracking pa oblije inik atravè kliyan) — te ka voye colis yon lòt kliyan pa erè. Kounya : si plizyè colis matche, API a voye `409 Conflict` ak yon lis `candidats` (id/codeKse/kliyan/statik) nan `détails`, epi paj `/staff/scan` afiche yon lis pou chwazi bon kolis la avan avanse. **Tès reyèl** : kreye 2 colis 2 kliyan diferan AK MENM tracking, eseye eskane tracking sa a → dwe wè lis chwa a, pa yon colis o aza.
3. **Jounal odit pou Paramèt** : `PATCH /admin/settings/logo`, `PATCH /admin/settings/exchange-rate-htg`, `POST/PATCH/DELETE /admin/settings/payment-methods*` kounya kreye yon antre nan jounal odit (`AuditService.log`, module `ADM`) — anvan pa t gen tras pou chanjman sa yo. **Tès reyèl** : chanje logo a oswa to chanj lan, epi verifye yon nouvo antre parèt nan `/staff/admin/audit-log`.
4. **Tès inite backend** : fixtures `lots.service.spec.ts` ak `tarification.service.spec.ts` mete ajou pou nouvo règ yo (yon lo = yon kliyan, minimòm 2 colis, mòd FIXE). Mwen pa t kapab lanse `npx jest` nan sandbox mwen an (pwoblèm anviwònman deja konnen ak `ts-jest`) — **bezwen ou lanse `npm test` (backend) pou konfime tout tès yo pase**, sitou 2 nouvo tès yo (`refuse un colis non rattaché à un client`, `refuse un colis d'un autre client`, `refuse le départ en transit d'un lot avec un seul colis`, `mode FIXE`).

## Round 3 — tableau de bord ak sidebar primitif (nouvo, pa t gen pandan Round 2)

1. **Tableau de bord `/staff` refèt an anblèt (tabs)** : `npx shadcn@latest add tabs` echwe (rezo bloke pou `ui.shadcn.com`, menm jan ak `accordion`/`dropdown-menu`) — rebati alamen ak `@base-ui/react` Tabs (`components/ui/tabs.tsx`). Paj la kounya gen 3 seksyon : **Overview** (kat KPI : colis an tranzit, disponib, lo aktif, kliyan aktif, factè ouvè, total ankese + rakousi paj yo), **Analytics** (grafik ak `recharts` : volim colis 14 jou, colis pa statik, repartisyon pa kategori, chifè afè fakti-vs-ankese sou 6 mwa), **Reports** (top 5 kliyan pa kantite colis, factè resan, lo aktif). **Enpòtan** : pa gen endpoint estatistik dedye kote backend a — tout kalkil yo fèt kote fwontyè a apati `searchColis/searchLots/searchFactures/searchClients` ak `taille: 500` chak — si w gen plis pase 500 anrejistreman nan youn nan tab sa yo, chif yo ka pa reflete 100% done yo. **Tès reyèl bezwen** : konekte kòm chak wòl (Super Admin, Employé Shipping, Caissier) epi konfime kat/grafik ki koresponn ak dwa wòl la parèt (Employé Shipping pa dwe wè "Total encaissé" pa egzanp, li pa gen aksè `/invoices` kòm lekti lis — tcheke `CAN_READ_*` nan `app/staff/page.tsx` kont vrè `@Roles(...)` bakenn kontwolè).
2. **Sidebar rebati ak yon primitif estil shadcn** : `npx shadcn@latest add sidebar` echwe menm jan an — rebati alamen `components/ui/sidebar.tsx` (SidebarProvider/Sidebar/SidebarHeader/SidebarContent/SidebarFooter/SidebarMenu/SidebarMenuButton/SidebarMenuSub/SidebarTrigger/SidebarInset/useSidebar), `AppShell.tsx` refèt pou itilize l. Konpòtman vizyèl la **rete menm jan an** (menm akordeyon, menm koulè, menm lyen) — se sèlman achitekti kòd la ki chanje. **Yon bug reyèl te korije nan menm okazyon an** : ansyen `AppShell` te montre `{children}` (kontni paj la) DE FWA nan DOM (yon fwa pou mobil, yon fwa pou desktop, chak kache/montre an CSS) — sa te vle di paj tablo bò a t ap fè LE APPÈL API DE FWA an paralèl chak fwa l louvri. Kounya gen sèlman YON `<main>`, kontni an monte yon sèl fwa. **Tès reyèl bezwen** : louvri `/staff` epi gade nan onglè Network — konfime `searchColis`/`searchLots`/etc rele **yon sèl fwa** chak, pa de fwa. Epi tcheke sidebar mobil la (redwi lajè navigatè a anba `sm`) : bouton anmbagè a louvri tiwa a, klike sou yon lyen fèmen l, men klike sou yon tit gwoup (Colis, Administration) pou ouvri l DWE PA fèmen tiwa a (se yon lòt bug ki te posib nan ansyen kòd la, korije nan menm okazyon an).

**Sa mwen VERIFYE nan sandbox mwen an pou Round 2b + Round 3** : `npx tsc --noEmit` klè ak `npx eslint .` klè sou tout `ksexpress-front` (tout fichye, pa sèlman sa mwen te modifye yo) ak sou `ksexpress-back` (2 fichye spec yo). **Mwen PA t kapab** : lanse `npx jest` (pwoblèm anviwònman sandbox), ni teste vizyèlman sidebar/tabs/grafik yo nan yon navigatè reyèl (pa gen aksè navigatè nan sandbox mwen an).

## Round 4 — logo la chwazi kòm fichye, pa yon lyen (nouvo)

Nan `/staff/admin/settings`, seksyon Logo a te yon senp chan tèks kote w te oblije kole yon lyen Cloudinary — chanje pou yon vrè seleksyon fichye. Nouvo endpoint `POST /admin/settings/logo/upload` (multipart, chan `logo`, jiska 10 Mo, sèlman imaj) reyitilize `CloudinaryService` ki deja egziste pou foto colis yo (`ksexpress/settings` kòm folder) — mwen pa envante nouvo mekanism, mwen reyitilize sa ki te deja mache a. `PATCH /admin/settings/logo` (kole yon lyen dirèkteman) toujou la tou, pa retire. **Tès reyèl bezwen** : ale nan `/staff/admin/settings`, klike "Choisir un fichier", chwazi yon imaj lokal → dwe montre yon apèsi (preview) 64×64 epi konfime `getLogoUrl()` retounen nouvo lyen Cloudinary a. Konfime tou yon antre nouvo parèt nan jounal odit (`PARAM_LOGO_MODIFIE`) — menm jan ak chanjman pa `PATCH`.

## Round 5 — Paramèt anrichi (nouvo — 5 nouvo bagay konfigirab)

Repons a kesyon "eske paramèt la pa ka pi anrichi?" — mwen chèche nan kòd la sa ki te ekri an dur epi mwen ajoute nan Paramèt (`/staff/admin/settings`) 3 nouvo seksyon backend/frontend :

1. **Enfòmasyon antrepriz la** (`GET/PATCH /admin/settings/company`) : nom, adrès, telefòn, WhatsApp, email sipò — te ekri an dur "KS Express Service" + adrès nan `facture-pdf.service.ts` (fakti A4 ak POS80), `label.service.ts` (etikèt colis), 5 mòdèl email (`.hbs`), ak `components/Contact.tsx` sou sit piblik la. Kounya tout sa yo li valè a nan Paramèt (klé JSON `entreprise_info`, defo = ansyen valè an dur yo, donk anyen pa chanje si admin pa touche anyen).
2. **Prefiks nimewo fakti** (`GET/PATCH /admin/settings/invoice-prefix`) : "FAC" pa defo, itilize nan `factures.service.ts` olye "FAC-" an dur.
3. **Seuils sistèm** (`GET/PATCH /admin/settings/limits`) : kantite foto max pa colis (defo 5, RG-SHP-10), tantativ login anvan blokaj (defo 5), dire blokaj an minit (defo 15), validite kòd verifikasyon (defo 10 min), validite lyen reset modpas (defo 30 min) — tout te ekri an dur nan `ColisService`/`AuthService`. **Bonus** : tèks nan email verifikasyon/reset kounya reflete vrè valè a (`{{codeValiditeMinutes}} minutes` olye "10 minutes" an dur) — si admin chanje limit la, email la pap bay yon move enfòmasyon ankò.
4. **Nouvo endpoint piblik san otantifikasyon** : `GET /settings/public` (kontwolè separe `PublicSettingsController`, `@Public()`) — voye nom/adrès/telefòn/WhatsApp/email/logo pou sit vitrin lan (`Contact.tsx`) san bezwen konekte.
5. **Fixtures tès inite mete ajou** : `colis.service.spec.ts`, `factures.service.spec.ts`, `auth.service.spec.ts`, `email.service.spec.ts` — chak sèvis ki kounya mande `ParametresService` gen yon mock ajoute (`getLimites`, `getFacturePrefixe`, `getEntrepriseInfo`) ak menm valè defo yo, pou pa kraze tès ki te la deja. **Bezwen ou lanse `npm test` (backend) pou konfime** — mwen pa ka lanse jest nan sandbox mwen an.

**Tès reyèl bezwen** :
- Ale nan `/staff/admin/settings`, chanje enfòmasyon antrepriz la (non/adrès/telefòn), kreye yon nouvo fakti → konfime PDF la (A4 AK POS80) montre nouvo non/adrès la anba tit la.
- Chanje prefiks fakti a pou "INV" pa egzanp, kreye yon fakti → nimewo a dwe kòmanse ak "INV-".
- Chanje "Photos maximum par colis" pou 2, eseye telechaje 3 foto sou yon colis → dwe echwe apre 2.
- Chanje "Validité du code de vérification" pou 1 minit, enskri yon nouvo kont, tann plis pase 1 minit, eseye antre kòd la → dwe echwe (ekspire).
- Louvri sit piblik la (`/`), seksyon Contact — dwe montre menm enfòmasyon ou antre nan Paramèt yo (san bezwen konekte).
- Verifye yon nouvo antre `PARAM_ENTREPRISE_MODIFIE` / `PARAM_FACTURE_PREFIXE_MODIFIE` / `PARAM_LIMITES_MODIFIE` parèt nan jounal odit apre chak chanjman.

**Sa mwen VERIFYE nan sandbox mwen an** : `npx tsc --noEmit` klè ak `npx eslint .`/`npx eslint src` klè sou toude repo (tout fichye). **Mwen PA t kapab** : lanse `npx jest`, ni teste PDF/email/sit piblik la vizyèlman (pa gen aksè navigatè/DB nan sandbox mwen an).

## Round 5b — Design email verification-code.hbs / password-reset.hbs inifye (nouvo)

Repons a kesyon "pouki verification-code.hbs pa gen menm design ak lòt yo?" — te gen 2 "fanmi" mòdèl email diferan depi lontan (avan mwen menm): `colis-recu.hbs`/`colis-disponible.hbs`/`facture-reglee.hbs` te gen yon design (header ak logo + non antrepriz 2 koulè, kadwo kalòj oranj pou mesaj entwodiksyon, footer navy ak dizklamè "email otomatik"), pandan `verification-code.hbs`/`password-reset.hbs` te gen yon lòt design pi ansyen (header ble santre, footer gri klè, pa gen dizklamè ni siyati).

Mwen refè `verification-code.hbs` ak `password-reset.hbs` pou yo swiv **egzakteman** menm design ak 3 lòt yo :
- Header: logo + "KS Express Service" 2 koulè, bòdi anba.
- Mesaj entwodiksyon nan yon kadwo kalòj oranj (`#fff2e0`, bòdi gòch oranj).
- Bouton/kòd aksan an oranj (te ble avan) — kòd verifikasyon an gaadan menm gwosè/espasman, bouton reset modpas la kounya yon pilil oranj.
- Nouvo liy siyati "Cordialement, L'équipe {{entrepriseNom}}" (pa t genyen avan).
- Footer navy (`#040339`) ak dizklamè "Ceci est un email automatique, merci de ne pas y répondre." (pa t genyen avan).
- Tout varyab Handlebars ki te la deja (`{{code}}`, `{{prenom}}`, `{{{resetUrl}}}`, `{{entrepriseNom}}`, `{{entrepriseAdresse}}`, `{{codeValiditeMinutes}}`, `{{resetValiditeMinutes}}`, `{{logoUrl}}`) rete menm jan, okenn logik backend pa chanje — se sèlman markup/style HTML la ki chanje.

**Sa mwen VERIFYE nan sandbox mwen an** : `npx tsc --noEmit` ak `npx eslint src` klè sou backend lan; li `email.service.spec.ts` epi konfime assertions ki egziste yo (`toContain('123456')`, `toContain('Jean')`, `toContain('https://example.com/reset?token=abc')`) toujou dwe pase paske varyab yo prezan nan nouvo markup la — pa gen chanjman nesesè nan spec la.

**Tès reyèl bezwen** (pa gen aksè navigatè/email nan sandbox mwen an) :
- Enskri yon nouvo kont → resevwa email kòd verifikasyon → konfime li gen menm style ak email "colis reçu" (header/footer/kadwo/siyati), kòd la vizib e klè.
- Mande reset modpas → resevwa email → konfime bouton oranj la travay e style la matche tou.
- Verifye afichaj la byen sou mobil/desktop (client email divès: Gmail, Outlook si posib).

## Round 6 — Logo + adrès + pied de page sou reçu/facture PDF (nouvo)

Demann : "mete adrès la, logo an, ak yon ti note de bas de pages nan reçu ak facture yo". Nòt : `facture-pdf.service.ts` jenere **menm dokiman an** pou fakti ak reçu (sèl diferans se tit la — "Reçu de paiement" si `statut === 'PAYEE'`, "Facture" sinon) — donk yon sèl chanjman kouvri toude.

1. **Logo antrepriz la** kounya telechaje (Cloudinary, via `ParametresService.getLogoUrl()`) e enkòpore vrèman kòm imaj nan tèt paj la — POS80 (54×24pt, santre) ak A4 (90×42pt, santre, anwo non antrepriz la). Si pa gen logo konfigire (oswa telechajman an echwe pou nenpòt rezon — rezo, URL kraze, elatriye), fakti a toujou jenere san blokaj, san logo, jan li te fè avan.
2. **Adrès** — te deja parèt anba non antrepriz la nan tèt paj la (Round 5) ; kounya li parèt **AN PLIS** nan pye paj la tou (nouvo), ansanm ak telefòn.
3. **Ti nòt pye paj (footer)** :
   - POS80 : mesaj "Merci de votre confiance !" ki te la deja, kounya swiv 3 liy anplis an gri klè — non, adrès, telefòn antrepriz la.
   - A4 : **pa t gen okenn pied de page ditou avan** — kounya ajoute apre bloc verifikasyon (QR/kòd-ba) : yon liy separasyon, non/adrès/telefòn antrepriz la, ak "Merci de votre confiance !".
4. Wotè paj POS80 la (`hauteurPos80`) ogmante (230 → 300pt baz) pou fè plas pou logo a + 2 nouvo liy nan pye paj la, pou anyen pa koupe sou woulo tèmik la.

**Sa mwen VERIFYE nan sandbox mwen an** : `npx tsc --noEmit` ak `npx eslint src` klè (te gen kèk erè prettier ki korije otomatikman ak `--fix`). Pa gen fichye tès inite (`.spec.ts`) pou `facture-pdf.service.ts` — pa gen mock pou mete ajou.

**Tès reyèl bezwen** (mwen pa ka jenere/gade yon PDF vre nan sandbox mwen an) :
- Si pa gen logo konfigire nan Paramèt ankò: telechaje yon fakti (A4 ak POS80) → dwe jenere nòmalman san logo, san erè.
- Telechaje yon logo nan `/staff/admin/settings` → kreye/telechaje yon nouvo fakti (A4 AK POS80) → logo a dwe parèt nan tèt paj la, byen santre, pa distòde/deforme.
- Konfime pye paj la (bòf paj la) montre non + adrès + telefòn antrepriz la + "Merci de votre confiance !" sou toude fòma.
- Konfime yon fakti ak anpil colis (plizyè paj) pa gen chevochman ant kontni ak pye paj la.
- Peye yon fakti (`statut = PAYEE`) → tit la dwe di "Reçu de paiement" — konfime logo/adrès/pied de page yo parèt menm jan sou vèsyon "reçu" a.

## Round 7 — Korije 2 bug ou te jwenn (limit foto an dur + mesaj erè jenerik)

Repons a 2 bagay ou te siyale nan dènye rapò a (pa t korije lè sa a, senpleman enfòmasyon) :

1. **"Photos (X/5)" an dur** nan `app/staff/packages/[id]/page.tsx` — pa t li vrè valè `maxPhotosParColis` konfigirab la. Pwoblèm : `GET /admin/settings/limits` rezève Super Admin sèlman (`@Roles` nivo kontwolè), donk Employé Shipping/Caissier pa t ka rele l dirèkteman. Solisyon : mwen ekspoze `maxPhotosParColis` nan `GET /settings/public` (wout ki deja piblik, itilize pou sit vitrin lan) — valè sa a pa sansib, e backend lan deja aplike limit la kanmenm. Paj `packages/[id]` la chaje limit la nan yon `useEffect`, ak yon repli 5 si apèl la echwe. Afichaj "X/Y" ak kondisyon montre bouton "Ajouter des photos" lan kounya suiv vrè limit la.
2. **Mesaj erè jenerik "Échec de l'envoi des photos."** — kounya `handleUploadPhotos` li vrè kò repons erè backend lan (`ApiErrorBody`) e afiche mesaj egzat li a (pa egzanp "Maximum 2 photos par colis (RG-SHP-10) — 2 déjà présente(s).") olye yon tèks jenerik, menm jan `apiFetch`/`ApiError` fè pou tout lòt apèl API yo.

**Sa mwen VERIFYE nan sandbox mwen an** : `npx tsc --noEmit` ak `npx eslint` (frontend AK backend) klè. Pa gen fichye tès inite pou `public-settings.controller.ts` — pa gen mock pou mete ajou.

**Tès reyèl bezwen** :
- Kòm Employé Shipping oswa Caissier (pa Super Admin), louvri yon colis → konfime "Photos (X/Y)" montre vrè limit konfigire a (pa toujou "5"), menm si w chanje limit la nan Paramèt kòm admin apre sa.
- Eseye depase limit la (pa egzanp limit = 2, eseye telechaje yon 3yèm foto) → mesaj erè a dwe montre rezon egzat backend lan bay la ("Maximum 2 photos par colis..."), pa "Échec de l'envoi des photos." jenerik la.

## Round 8 — Korije 500 sou fakti ≥11 colis (timeout transaksyon)

Bug reyèl ou te jwenn (Round 6 #5) : `creerFacture()` nan `factures.service.ts` te trete colis yo yonn apre lòt (boukle sekans) anndan yon transaksyon Prisma — pou chak colis, 3 alératurn DB sekans (`findUnique` colis, dat ariv Ayiti, griy tarifè). Ak ≥11 colis, sa depase timeout default transaksyon entèraktif Prisma a (5s) → 500.

Koreksyon (2 bagay konbine) :
1. **Paralelizasyon** — colis yo kounya trete an paralèl (`Promise.all` sou `colisIds.map(...)`) olye yonn apre lòt. `Promise.all` garanti lòd rezilta a (donk lòd liy fakti yo kreye) rete menm jan, kèlkeswa lòd yo reyèlman fini.
2. **Filet sekirite** — timeout transaksyon an ogmante (5s default → 20s, `maxWait` 10s) pou gwo lo ki ta ka toujou pran plis tan menm ak paralelizasyon an.

**Sa mwen VERIFYE nan sandbox mwen an** : `npx tsc --noEmit` ak `npx eslint src` klè. Mwen li `factures.service.spec.ts` byen atantivman (pa ka lanse jest nan sandbox mwen an) pou konfime lòd apèl mock yo (`prisma.colis.findUnique.mockResolvedValueOnce(...).mockResolvedValueOnce(...)`) toujou matche — `Array.prototype.map` sou yon fonksyon async envoke chak apèl `findUnique` **an sekans, senkwonn**, jiska premye `await` — donk lòd apèl yo idantik ak avan, malgre yo egzekite an paralèl apre sa. Pa gen chanjman nesesè nan fichye tès la.

**Tès reyèl bezwen** (sa a se rezon prensipal Round 8 la) :
- Kreye yon fakti ak 11, 15, epi 20+ colis pou menm kliyan an → dwe reyisi san erè 500, nan yon tan rezonab (dwe pi rapid pase avan, sekans lan te bloke).
- Telechaje PDF fakti sa a (A4) → verifye pa gen chevochman ant kontni ak pied de page a sou plizyè paj (sa a se tès "Round 6 #5" ki te bloke a — kounya posib fè l).
- Verifye total fakti a kòrèk (som tout liy yo + frè siplemantè si genyen) — kalkil total la chanje lejèman nan kòd la (som tout montan liy yo, epi yon sèl `round2` final, olye `round2` apre chak ajout) — rezilta a ta dwe idantik nan tout ka nòmal, men verifye sou yon ka reyèl ak plizyè colis pou konfime.

## Round 9 — 2 dènye bagay : bug pied de page plizyè paj + 403 pricing-grids

**1. Bug nouvo ou te jwenn (paj vid an twòp sou gwo fakti) — korije.** Koz rasin ou te konfime a : blòk QR/kòd-ba/"Vérification"/pied de page (`facture-pdf.service.ts`, apre bloc "Moyens de paiement") itilize pozisyon Y absoli kalkile san verifye plas ki rete sou paj la — lè tablo colis la long (≥20 colis), sa fè "Vérification" ak pied de page a ateri sou 2 paj separe, prèske vid. Koreksyon : mwen kalkile wotè total blòk la alavans (imaj + tèks verifikasyon + pied de page, ak yon bon maj sekirite ~190pt) epi mwen fòse yon `doc.addPage()` **anvan** kòmanse desine l si li pa ka rantre nan plas ki rete a — olye kite pdfkit koupe l nan mitan.

**2. 403 console pricing-grids — korije ak apwòch "nouvo wout limite" ou te mande a** (pa touche `/admin/pricing-grids` ditou) :
- Nouvo wout `GET /pricing-categories` — kontwolè separe (`PricingCategoriesController`), aksesib pou SUPER_ADMIN + EMPLOYE_SHIPPING + CAISSIER, retounen **sèlman non kategori aktif yo** (`string[]`), san detay pri/frè/taks (sa yo rete rezève `/admin/pricing-grids`, Super Admin sèlman).
- 2 paj frontend ki te rele `/admin/pricing-grids` pou ranpli konbo "Catégorie" a kounya rele nouvo wout la : `app/staff/packages/[id]/page.tsx` (ou te teste) **AK** `app/staff/packages/new/page.tsx` (menm bug la te la tou — mwen jwenn li pandan m t ap chèche lòt itilizasyon `searchGrilles`, korije an menm tan pou konsistans).
- Paj admin (`/staff/admin/pricing-grids`) pa touche — li kontinye itilize wout admin an ak tout detay yo, nòmal.

**Sa mwen VERIFYE nan sandbox mwen an** : `npx tsc --noEmit` ak `npx eslint` (frontend AK backend) klè. Pa gen fichye tès inite ki touche pou 2 chanjman sa yo — pa gen mock pou mete ajou.

**Tès reyèl bezwen** :
- Rekreye menm senaryo 20 colis la (oswa plis), telechaje PDF A4 → konfime li rete sou 1 sèl paj byen fòme, OSWA si li bezwen plizyè paj (pi gwo lo toujou), blòk verifikasyon/pied de page a rete ANSANM sou menm paj la, pa koupe an de.
- Kòm Employé Shipping oswa Caissier : louvri paj "Nouvo colis" (`/staff/packages/new`) AK yon paj colis egzistan (`/staff/packages/[id]`) → konfime konbo "Catégorie" a ranpli kòrèkteman san erè 403 nan console.
- Kòm Super Admin : konfime paj `/staff/admin/pricing-grids` kontinye mache nòmalman (kreye/modifye grid), pa gen rega chanje la a.

## Round 10 — Style dashboard-01 (staff) + navigation an tabs sou mobil (portail kliyan)

`npx shadcn@latest add dashboard-01` bloke pa rezo sandbox mwen an (menm bagay ak tabs/sidebar nan Round 3 — konfime ak `curl` : 403 depi pwoksi a). Mwen jwenn kontni JSON registry a ak yon lòt zouti (web fetch), epi apre yon chwa ou fè (style/vizyèl sèlman, pa tout bloke a — pa gen tablo drag-and-drop, pa gen sheet/sonner), mwen pòte alamen 2 pati:

1. **`components/ui/badge.tsx`** (nouvo) — pòte fidèl depi registry shadcn a (cva, deja gen `class-variance-authority` enstale).
2. **Dashboard staff (`app/staff/page.tsx`, onglet Overview)** :
   - Kat KPI yo (Colis en transit, Disponibles, Lots actifs, Clients actifs, Factures ouvertes, Total encaissé) kounya nan style "dashboard-01" (`Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardFooter`, gradyan léjè).
   - **2 badge tandans REYÈL** (pa gen pousantaj envante) : "Total encaissé" montre % vs mwa pase a (kalkile ak done `revenuParMois` ki te deja la), ak yon nouvo blòk "Colis reçus" montre % semenn sa a vs semenn pase a.
   - **Nouvo chart entèraktif** "Colis reçus" — remplase ansyen chart 14-jou fiks la, kounya ak yon peryòd chwazi (7 jou / 30 jou / 3 mwa, bouton segmante) ak yon graphique "aire" (gradyan oranj) olye yon senp liy.
   - Onglets Analytics/Reports pa touche ditou.
3. **Navigation an tabs sou mobil pou portail kliyan** (`components/app-shell/AppShell.tsx` + `app/portal/layout.tsx`) — nouvo pwopriyete `mobileNav="tabs"`, itilize SÈLMAN sou `/portal`. Sou mobil (`sm:hidden`), olye tiwa hamburger ki te la a, kounya gen yon **bar tabs fikse anba ekran an** ak 4 destinasyon (Résumé/Mes colis/Mes factures/Préférences), ikòn + tèks, tab aktif an oranj. Espas staff (`/staff`) pa touche — li kenbe menm tiwa/hamburger la (navigasyon gen twòp gwoup pou rantre nan yon bar tabs).

**Sa mwen VERIFYE nan sandbox mwen an** : `npx tsc --noEmit` ak `npx eslint .` klè sou frontend lan.

**Tès reyèl bezwen** (mwen pa ka wè rezilta vizyèl aktyèl la nan sandbox mwen an, sitou sou mobil — sa a se pi enpòtan Round sa a) :
- Louvri `/staff` sou desktop AK mobil → konfime nouvo kat KPI yo klè, badge tandans "Total encaissé" ak "Colis reçus" montre bon siy (↑/↓) ak bon koulè, chart la chanje kòrèkteman lè w klike 7j/30j/3 mwa.
- Louvri `/portal` (kòm kliyan) sou **telefòn** (oswa Chrome DevTools mobil) → konfime bar tabs la parèt fikse anba ekran an ak 4 tab yo, tab aktif la byen make, kontni paj la pa kache anba bar la. Konfime sou **desktop**, `/portal` toujou gen sidebar gòch nòmal la (san chanjman).
- Konfime `/staff` sou mobil kontinye gen ansyen tiwa hamburger la (pa gen bar tabs).

## Round 11 — Data Table (shadcn) sou 6 paj lis yo (nouvo)

`npx shadcn@latest add table` bloke tou pa rezo sandbox mwen an (menm bagay ak Round 3/10). Menm workaround lan (web fetch + pòte alamen), plis `npm install @tanstack/react-table@8.21.3` (⚠️ pa `@latest` — vèsyon 9 gen yon API konplètman diferan, mwen te tonbe ladan l aksidan e te oblije re-enstale vèsyon 8 espesifikman).

1. **`components/ui/table.tsx`** (nouvo) — primitif Table/TableHeader/TableBody/TableRow/TableHead/TableCell, pòte fidèl depi registry shadcn a.
2. **`components/ui/data-table.tsx`** (nouvo) — konpozan jenerik `<DataTable columns data isLoading emptyMessage columnLabels />`, baze sou TanStack Table v8 (`useReactTable`). Gen yon bouton "Colonnes" (menu déroulant ak kaz a koche) pou montre/kache kolòn — **san tri ni filtraj kliyan** fè espre (rechèch/paj/filtraj rete tout fè kote backend lan, tankou anvan; pa gen okenn chanjman nan API kalòl).
3. **`components/ui/dropdown-menu.tsx`** — ajoute `DropdownMenuCheckboxItem` (te manke pou meni "Colonnes" la).
4. **Paj ki chanje** (tout 6 yo user te chwazi) :
   - `/staff/packages` (Colis) — gwoupman pa lo a (liy expansib) kenbe menm jan an, men itilize primitif `Table`/`TableRow`/`TableCell` yo kounya (pa `<table>` brit ankò), plis yon meni "Colonnes" pou kache categorie/poids/client/action (Tracking ak Statut toujou vizib, se yo ki idantifye liy lan).
   - `/staff/invoices` (Factures), `/staff/clients` (Clients), `/staff/lots` (Lots), `/staff/admin/users` (Itilizatè entèn), `/staff/admin/audit` (Jounal odit) — chak nan yo kounya itilize `<DataTable>` konplètman (kolòn idantifye — Numéro/Code KSE/Référence/Email/Date — toujou vizib, pa ka kache).
   - Pou `/staff/admin/users` : selektè Rôl la ak bouton "Désactiver" kenbe menm konpòtman/eta yo te genyen anvan (chak liy gen pwòp eta l pou "ap anrejistre..."), jis kounya yo rann kòm selil kolòn separe.

**Sa mwen VERIFYE nan sandbox mwen an** : `npx tsc --noEmit` klè, `npx eslint .` klè sou tout frontend lan (sèl bagay ki rete se yon *warning*, pa yon erè — "Compilation Skipped: Use of incompatible library" sou `data-table.tsx`, sa se nòmal/dokimante lè w melanje TanStack Table ak React Compiler, pa yon bug).

**Tès reyèl bezwen** (mwen pa ka wè rezilta vizyèl la nan sandbox mwen an) :
- Louvri chak nan 6 paj yo (`/staff/packages`, `/staff/invoices`, `/staff/clients`, `/staff/lots`, `/staff/admin/users`, `/staff/admin/audit`) → konfime tablo a afiche done yo kòrèkteman, style la matche rès sit la (pa gen bagay ki kraze/mal aliyen).
- Sou chak paj, klike bouton "Colonnes" anlè tablo a → konfime meni a ouvri ak yon lis kolòn ak kaz koche, dekoche 1-2 kolòn → konfime kolòn yo disparèt nan tablo a san rechaje paj la, koche yo ankò → yo retounen.
- Konfime kolòn idantifye yo (Tracking+Statut pou Colis, Numéro pou Factures, Code KSE pou Clients, Référence pou Lots, Email pou Itilizatè, Date pou Odit) PA gen opsyon pou kache nan meni "Colonnes" la (yo pa dwe parèt ditou nan lis la).
- Sou `/staff/admin/users` : chanje wòl yon itilizatè nan selektè a → konfime li anrejistre (mesaj/eta chajman kout), klike "Désactiver" → konfime konfimasyon an mande, epi estati a chanje pou "Désactivé".
- Rechèch/filtraj/pagination sou chak paj (yo pa t chanje) toujou fonksyone menm jan ak anvan — jis konfime anyen pa kraze.
- Sou mobil, konfime tablo yo defile orizontalman san kraze layout la (`overflow-x-auto` deja la).

## Round 12 — Header fixe, pajinasyon shadcn, scroll anndan tablo yo (nouvo)

3 chanjman lyen ansanm, sou TOUT espas Staff la (17 paj anba `/staff`) :

1. **Header fixe** (`components/app-shell/PageHeader.tsx`, nouvo) — tit/deskripsyon/onglè chak paj kounya rete kole anlè ekran an pandan w ap fè scroll sou kontni an anba l (menm prensip ak imaj Tableau de bord la ou te montre m). Aplike sou tout 17 paj yo (lis, detay, fòm kreyasyon) — pa sèlman dashboard la.
2. **Pajinasyon shadcn ak VRE nimewo paj** (`components/ui/pagination.tsx`, nouvo — `npx shadcn@latest add pagination` bloke tou, menm workaround web_fetch). Premye vèsyon te sèlman gen Précédent/Suivant + nimewo paj aktyèl la (san bouton pou 1/2/3...), paske mwen te panse backend lan pa t voye yon total. Apre yon remak ou fè (imaj referans lan te montre yon pajinasyon ak vrè nimewo klikab + "..."), mwen dekouvri backend lan DEJA voye yon `total` reyèl sou tout 5 endpoint rechèch yo (Colis/Factures/Clients/Lots/Audit) — se `extractItems()` ki t ap jete l san m pa itilize l. Korije ak yon nouvo `NumberedPagination` :
   - Kalkile vrè lis paj yo (1, 2, 3 ... dènye paj), ak "..." lè gen twòp paj (menm algorit ak egzanp shadcn/MUI a — toujou montre paj 1 ak dènye a, ansanm 1 paj bò kote paj aktif la).
   - **Factures, Jounal odit, Colis** — bouton yo ranplase pa `NumberedPagination`.
   - **Clients ak Lots** — te PA gen okenn pajinasyon ditou (yo te chaje yon sèl gwo pakèt san bouton). Kounya yo gen VRE pajinasyon ak nimewo klikab, wire ak `total`/`page`/`taille` API a te deja voye.
   - Koulè/stil rete nan tèm klè/oranj aplikasyon an (pa gen mòd sonm) — imaj referans lan te sèlman pou montre stil "vrè nimewo + ..." la, non yon demand pou chanje tèm aplikasyon an.
3. **Scroll anndan tablo a** (`components/ui/data-table.tsx` + tablo manyèl Colis ak Grilles tarifaires) — chak tablo kounya gen yon wotè maksimòm (~60vh) : lè gen twòp liy, se KÒ tablo a ki fè scroll (vètikal), tèt kolòn yo (thead) rete kole anlè pandan w ap fè scroll, epi rès paj la (filtè, pajinasyon, header) pa bouje ditou.

**Sa mwen VERIFYE nan sandbox mwen an** : `npx tsc --noEmit` klè, `npx eslint .` klè sou tout frontend lan (menm sèl *warning* enofansif TanStack Table ak anvan).

**Tès reyèl bezwen** (mwen pa ka wè rezilta vizyèl la nan sandbox mwen an) :
- Louvri nenpòt paj anba `/staff` (dashboard, Colis, Factures, Clients, Lots, Admin/Users, Admin/Audit, Admin/Grilles tarifaires, Paramèt, detay yon colis/lo/kliyan/facture, fòm nouvo colis/facture, Scanner, Colis non identifiés) → fè scroll → konfime tit paj la (ak onglè yo sou dashboard lan) rete vizib anlè ekran an, kontni an defile anba l san chevochman (pa gen tèks ki kache anba header la, pa gen "trou" blan bizè).
- Sou `/staff/packages`, `/staff/invoices`, `/staff/clients`, `/staff/lots`, `/staff/admin/users`, `/staff/admin/audit`, `/staff/admin/pricing-grids` : chaje ase done pou gen plis liy pase sa ki ka afiche nan ~60% wotè ekran an → konfime se SÈLMAN kò tablo a ki fè scroll (pa tout paj la), epi tèt kolòn yo (Tracking/Statut/Numéro/etc.) rete vizib anlè pandan w ap desann.
- Sou `/staff/packages`, `/staff/invoices`, `/staff/clients`, `/staff/lots`, `/staff/admin/audit` : konfime pajinasyon an montre VRE nimewo paj klikab (pa sèlman paj aktyèl la), ak "..." lè gen anpil paj, klike sou yon nimewo dwe mennen dirèkteman sou paj sa a (pa sèlman Précédent/Suivant youn pa youn). Précédent dezaktive sou paj 1, Suivant dezaktive sou dènye paj la.
- Sou `/staff/clients` ak `/staff/lots` : sa yo te PA gen pajinasyon ditou anvan — konfime yo gen li kounya e li mache (chanje paj chaje bon done yo).
- Sou mobil, konfime header fixe a pa kraze ak header mobil (logo KS Express + bouton deyò) ki deja la.

## Round 13 — Modifye yon itilizatè + kreyasyon SAN modpas, lyen pou li konfigire pwòp modpas li (nouvo)

1. **Bug korije nan pasaj sa** : lyen "reyisyalize modpas" (`requestPasswordReset`, deja egziste) te pwente sou `/reinitialiser-mot-de-passe` — yon wout ki PA T EGZISTE (vrè wout la se `/reset-password`). Lyen sa te kraze depi kite sesyon anvan yo — kounya li korije. **Sa mande yon tès reyèl tou** : eseye "Mot de passe oublié" sou `/login`, konfime lyen imèl la mennen sou yon paj ki mache (pa yon 404).
2. **Kreyasyon yon nouvo kont entèn PA mande modpas ankò** (`/staff/admin/users`) — jis email, telefòn (opsyonèl), wòl. Backend jenere yon modpas placeholder o aza (pa janm itilize/konnen pa pèsonn) epi voye yon imèl (nouvo modèl `account-invite.hbs`, menm style ak lòt imèl yo) ak yon lyen (menm mekanis ak "reyisyalize modpas", 30 minit pa defo) pou nouvo itilizatè a konfigire pwòp modpas li sou `/reset-password`.
3. **"Modifier" yon itilizatè kounya mache vre** — anvan, sèlman wòl la te modifyab (dropdown). Kounya gen yon bouton "Modifier" pa liy ki louvri yon mòd edisyon anndan tablo a (email, telefòn, wòl — twa a ansanm), ak "Enregistrer"/"Annuler". (Backend te deja sipòte modifye email/telefòn/wòl — se sèlman UI a ki te manke.)
4. **"Renvoyer le lien"** — nouvo bouton ki parèt sèlman pou kont ki "Jamais connecté" (`dernierAcces` vid, ki vle di li poko janm konekte/konfigire modpas li) — pèmèt Super Admin lan re-voye lyen konfigirasyon an si premye imèl la pa t rive.

**Sa mwen VERIFYE nan sandbox mwen an** : `npx tsc --noEmit` klè de bò yo, `npx eslint .` (front) ak `npx eslint src` (back, dosye `dist/` ak `prisma.config.ts`/`prisma/seed.ts` gen bri ki pa gen rapò ak chanjman sa yo — deja la anvan) klè.

**Tès reyèl bezwen** (imèl + DB, mwen pa gen aksè) :
- Sou `/staff/admin/users` (Super Admin) : kreye yon nouvo kont (san modpas) → konfime li kreye san erè, epi konfime imèl "Votre accès KS Express Service a été créé" rive nan bwat imèl la, ak yon bouton "Définir mon mot de passe" ki mennen sou `/reset-password?uid=...&token=...` ki mache.
- Sou lyen sa a, defini yon modpas → konfime ou ka konekte apre sa ak nouvo kont lan.
- Klike "Modifier" sou yon liy → chanje email/telefòn/wòl → "Enregistrer" → konfime chanjman yo anrejistre e parèt nan tablo a san rechaje paj la. "Annuler" dwe abandone chanjman yo san anyen chanje.
- Sou yon kont ki "Jamais connecté", klike "Renvoyer le lien" → konfime yon dezyèm imèl rive, ak yon lyen ki mache tou (ansyen lyen an rete valab osi jiskaske youn nan yo itilize — se konpòtman nòmal, chak lyen gen pwòp expiration l).
- Sou yon kont ki DEJA konekte omwen 1 fwa, konfime bouton "Renvoyer le lien" pa parèt ditou.
- Konfime "Mot de passe oublié" sou `/login` toujou mache (Round pa sa a korije wout li a — dwe verifye li pa kraze anyen).

## Round 14 — 2 ti korije sou `/staff/admin/users` (apre Round 13)

1. **Fòm "Nouveau compte interne" te afiche akote tit "Comptes internes" la** (2 kolòn kòtakòt), olye anba l — korije, tit la kounya sou pwòp liy li, fòm/bouton an anba l, sou tout lajè.
2. **Itilizatè konekte a pa ka fè okenn aksyon sou pwòp kont li ankò** nan lis la : liy pa li a montre "Vous" nan kolòn Aksyon an (pa gen Modifier/Renvoyer le lien/Désactiver), e wòl li parèt kòm senp tèks (pa yon dropdown chanjab). **Tès reyèl** : konekte kòm Super Admin, ale sou `/staff/admin/users`, jwenn liy pwòp kont ou a → konfime "Vous" parèt nan Aksyon, pa gen dropdown pou wòl, e sa fonksyone menm jan pou nenpòt lòt itilizatè ki konekte gade lis la (li pa ka aji sou tèt li kèlkeswa wòl li).

## Verifikasyon jeneral — koyerans shadcn (nouvo, transvèsal a tout Round yo)

Pandan plizyè Round nou pòte konpozan shadcn alamen (`ui.shadcn.com` bloke nan sandbox mwen an, `npx shadcn add ...` pa mache — wè Round 10/11/12) : `Card`, `Badge`, `Table`, `DataTable`, `Pagination`, `Tabs`, `Sidebar`, `DropdownMenu`, `InputGroup`/`Input`. Men **pa gen okenn garanti mwen pa t bliye konvèti yon ansyen bout kòd** ki te ekri anvan sa (bouton/tablo/chan tèks an dur ak klas Tailwind pèsonalize olye konpozan shadcn yo). Mwen pa gen aksè vizyèl pou konfime sa nan sandbox mwen an — men ou ka mande Claude Code (ki gen aksè kont paj yo an dirèk) fè yon ti odit rapid pandan l ap teste Round sa yo :

- Chèche nan kòd la (`grep -rn "<table"`, `grep -rn "<button"` andeyò `components/ui/`) pou wè si gen paj ki rete ak yon `<table>`/`<button>` brit olye `Table`/`Button`/`DataTable` — sa pa vle di se yon erè sistematik (kèk bouton "pilil" pèsonalize yo se yon chwa design apwopriye, pa yon bug), men bon pou konfime pa gen okenn zòn ki rete ak yon ansyen tablo HTML brit san style.
- Vizyèlman, konfime koulè/spacing/rondè kwen (border-radius) rete koyeran ant paj yo — pa gen yon paj ki "pa matche" rès aplikasyon an (egzanp : yon vye tablo gri san style k ap rete kole nan mitan yon paj ki gen tout lòt eleman nan style oranj/blan aktyèl la).
- Konfime tout paj `/staff` yo gen menm header fixe (`PageHeader`, Round 12) — pa gen youn ki bliye.

Sa a se yon *odit vizyèl*, pa yon lis egzat bug — si Claude Code jwenn yon kote ki pa koyeran, li ka dekri l epi mwen ka korije l nan yon pwochen Round.

## Round 15 — Filtre Statut sou `/staff/clients` (nouvo)

1. **Backend deja te sipòte l** : `SearchClientsDto`/`ClientsService.findAll()` te deja gen yon paramèt `actif?: boolean` (validasyon + `@Transform` ki konvèti "true"/"false" kòrèkteman), men fwontyè a pa t janm voye l. Mwen ajoute paramèt `actif` sou `searchClients()` (`lib/api/clients.ts`) epi yon `<select>` "Tous les statuts / Actif / Désactivé" akote chan rechèch la sou `/staff/clients` (menm konvansyon ak filtre Statut ki deja sou `/staff/invoices` ak `/staff/admin/audit`). Chwazi yon estati reset paj la (`page`) tounen 1, menm jan ak rechèch tèks la.
2. **Ankenn migrasyon oswa chanjman backend** pa nesesè — se te yon paramèt ki te deja disponib men pa itilize.

**Tès reyèl** : ale sou `/staff/clients`, chwazi "Désactivé" nan dropdown Statut la → dwe montre sèlman kliyan dezaktive yo (si genyen — sinon lis vid). Retounen sou "Actif" → montre sèlman kliyan aktif yo. "Tous les statuts" → tout kliyan yo, tankou avan.

**Poukisa kliyan yo pa parèt nan `/staff/admin/users`** (repons a yon kesyon, pa yon bug pou teste) : se yon chwa entansyonèl — `UsersService.findAll()` filtre `role: { not: Role.CLIENT }` esprè. Kont Kliyan yo pa janm kreye pa yon admin nan `/staff/admin/users` (ki se sèlman pou kont entèn : Super Admin, Employé Shipping, Caissier) ; kliyan yo enskri tèt yo pa `/register` epi jere apa nan `/staff/clients`. Se 2 lis separe pa desen.

## Round 16 — Anrichi paj detay `/staff/clients/:id` ak `/staff/invoices/:id` (nouvo)

1. **`/staff/clients/:id`** :
   - Ajoute yon seksyon estatistik (Colis, Total facturé, Solde impayé) anba header la, menm konvansyon ak `/staff/lots/:id`.
   - **Bug korije** : Kesye (`canEdit === false`) pa t janm wè fiche client la ditou (tout seksyon an te kache dèyè yon `if (canEdit)`) — kounya gen yon vèsyon *lekti sèlman* (Téléphone, Email, Adresse, Notifications préférées) ki afiche pou tout moun ki gen aksè paj la, e vèsyon editab la rete pou Super Admin/Employé Shipping.
   - Chan **Notifications préférées** (`canalNotificationPrefere`) ajoute nan fòm edisyon an — li te egziste nan backend/DTO men pa t janm gen okenn UI pou chanje l.
   - Liy Colis/Factures yo anrichi : Colis kounya montre kategori + poids + dat anba tracking la ; Facture kounya montre total + montan peye anba nimewo a.
2. **`/staff/invoices/:id`** :
   - Non kliyan an se kounya yon lyen (`/staff/clients/:id`) olye senp tèks.
   - Chak liy nan "Colis facturés" se kounya yon lyen (`/staff/packages/:id`) olye tèks, e li montre poids facturé + pri pa lb + frais fixes/taxes si genyen anba montan an.
   - **Bug korije** : `facture.fraisSupplementaires`/`fraisSupplementairesLabel` (chan ki egziste depi lontan nan backend, deja antre nan kalkil `total` la) pa t janm afiche okenn kote sou paj la — kounya gen yon liy "Frais supplémentaires" (oswa lib pèsonalize a) anba lis colis yo si montan an > 0.

**Tès reyèl** : ale sou yon fich kliyan ki gen omwen 1 colis ak 1 facture, konfime chif estatistik yo kòrèk (Colis = kantite, Total facturé = sòm tout `total` factè yo, Solde impayé = sòm `total - montantPaye`). Konekte kòm Kesye, konfime ou wè Fiche client an lekti sèlman (pa gen chan editab). Sou yon facture ki gen frais supplémentaires (kreye youn si nesesè via `/staff/invoices/new`), konfime liy "Frais supplémentaires" la parèt ak bon montan an, e konfime lyen kliyan/colis yo mennen nan bon paj yo.

## Round 17 — Korije 2 bug reyèl ou jwenn nan rapò verifikasyon Round 13/14 (nouvo)

1. **"Renvoyer le lien" / "Désactiver" pa t montre erè lè yo echwe** (`app/staff/admin/users/page.tsx`) : `ResendActivationButton.handleResend()` te gen sèlman `finally`, pa gen `catch` — menm bug la te la tou nan `DeactivateCell.handleDeactivate()`. Kounya toude gen yon `try/catch` ki mete mesaj erè a (`err.message` API a) nan yon ti tèks wouj anba bouton an, e bouton an dezaktive (`disabled`) pandan apèl la ap fèt. **Tès reyèl** : koupe/bloke rezo pandan ou klike "Renvoyer le lien" oswa "Désactiver" (oswa fè backend voye yon erè volontèman, tankou 503 imèl la deja teste) → dwe wè mesaj erè a parèt anba bouton an, bouton an retounen nan eta nòmal li (pa rete bloke sou "…").
2. **Thead "sticky" pa t mache ditou** (bug CSS sistemik ou jwenn nan Round 12) : `position: sticky` pa gen okenn efè lè l poze dirèkteman sou yon `<thead>` nan navigatè yo (limit CSS koni). Korije nan 2 kote : `components/ui/data-table.tsx` (itilize pa 6 paj Round 11 yo + `admin/audit`) ak `app/staff/packages/page.tsx` (ki gen pwòp tablo manyèl li poutèt gwoupman lo yo, pa t itilize `DataTable`) — klas `sticky top-0 z-10 bg-white` deplase soti sou `<TableHeader>` (thead) pou ale sou CHAK `<TableHead>` (th) anndan l. **Tès reyèl** : sou `/staff/packages` AK yon lòt paj tankou `/staff/invoices`, ranpli ase done pou gen scroll vètikal anndan tablo a, fè scroll — tèt kolòn yo (Tracking/Statut/elatriye) dwe rete "kole" anlè pandan lis anba a ap defile, pa deplase ansanm ak lis la.

## Round 18 — Aksyon dirèk sou `/staff/clients` + korije layout fòm kreyasyon (nouvo)

1. **Menm bug layout ak Round 14, men sou `/staff/clients` fwa sa a** : tit "Clients" ak fòm "Nouveau client" te kòtakòt (2 kolòn) dèyè yon `justify-between` — korije menm jan ak Users : tit la sou pwòp liy li, fòm/bouton an anba l sou tout lajè.
2. **Nouvo : kolòn Aksyon dirèk nan tablo `/staff/clients`** (te mande esplisitman, apre konparezon ak lis "Comptes internes") : "Modifier" kounya edite Prénom/Nom/Téléphone/Email **dirèkteman nan liy tablo a** (menm modèl `EditDraft` ak `/staff/admin/users`), san pa gen okenn navigasyon — "Enregistrer"/"Annuler" parèt nan plas "Modifier"/"Désactiver" pandan edisyon an. "Désactiver" se yon aksyon dirèk tou (yon sèl klik, konfimasyon, mesaj erè afiche si l echwe — menm modèl `DeactivateCell` Round 17 la, avèk `try/catch` vizib). **Adrès ak canal de notification préféré rete rezève pou fich konplè a** (`/staff/clients/:id`) — twòp kolòn pou mete yo nan tablo a.
3. **Repons a kesyon "poukisa `/staff/invoices` ouvri yon lòt paj pou kreye AK gade yon facture"** (pa yon bug, se yon chwa entansyonèl) : kreyasyon yon kliyan se yon fòm senp (5 chan), donk li rantre nan yon kat ki ouvri sou menm paj la. Kreyasyon yon facture se yon flux plizyè etap (chwazi yon kliyan → chaje lis colis "Prêt pour retrait" li yo → chwazi plizyè ladan yo → optyonèlman ajoute frais supplémentaires → soumèt) — sa pa rantre nan yon kat kout, se poutèt sa li gen pwòp paj li (`/staff/invoices/new`), menm jan ak `/staff/packages/new`. Gade yon facture (lign yo, peman yo, enprime resi) se menm jan ak gade yon kliyan oswa yon lo — toujou yon paj detay apa (`/:id`), pa yon aksyon anndan tablo a, paske gen twòp enfòmasyon pou kole nan yon liy tablo.

**Tès reyèl** : sou `/staff/clients`, klike "Modifier" sou yon liy → chan Prénom/Nom/Téléphone/Email dwe vin editab dirèkteman nan tablo a (san chanje paj) → chanje telefòn → "Enregistrer" → dwe anrejistre san rechajman, tablo a reflete chanjman an. Klike "Désactiver" sou yon lòt liy → konfimasyon → dwe dezaktive san erè, bouton an disparèt (kliyan an vin "Désactivé" nan filtre Statut la).

## Sa pou repòte

Yon rezime kout: ki sa ki mache, ki erè (si genyen) — mesaj erè egzak API a te voye, ak nan ki paj/aksyon. Mèsi.
