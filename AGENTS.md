<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Projet KS Express Service — Site Vitrine

## Contexte

Ce dépôt contient le **site vitrine** de KS Express Service (entreprise haïtienne de shipping USA–Haïti, vente de produits et transferts Zelle), développé par **Nexoris** dans le cadre du contrat NEX-KSE-2026-002 (Phase 1 — Shipping MVP, étendue à un Site Vitrine simplifié).

Avant toute modification substantielle, lis les documents de référence dans `docs/` :
- `docs/Nexoris_Contrat_Phase1_SiteVitrine_KS_Express_v1.0.docx` — le contrat signé : périmètre exact, prix, ce qui est **hors périmètre** (Article 3.3).
- `docs/Nexoris_Cahier_des_Charges_KS_Express_v1.0.pdf` — spécifications fonctionnelles et techniques complètes de la plateforme (au-delà du site vitrine ; utile pour comprendre le projet global).
- `docs/Nexoris_Devis_Professionnel_KS_Express_v1.0.pdf` — chiffrage par phase.
- `docs/Nexoris_Proposition_Commerciale_KS_Express_v1.0.pdf` — vision produit et argumentaire.
- `docs/KS_Express_Maquette_Site_Vitrine.html` — maquette de référence validée pour le design (couleurs, sections, ton). Ouvrir dans un navigateur pour la consulter.

## Contrainte légale importante — ne jamais afficher "Zelle" publiquement

**Le mot "Zelle" ne doit apparaître nulle part sur le site public** (page, métadonnées, images, textes alternatifs) : Zelle n'est pas un service reconnu par l'État haïtien, et l'afficher publiquement expose KS Express à un risque légal/réputationnel. La fonctionnalité d'encaissement et de rapprochement des transferts reste bien réelle et sera développée normalement côté backend (NestJS), mais **ce n'est pas présenté publiquement comme un service à part entière** — formuler simplement que KS Express **accepte les "paiements digitaux"** parmi ses moyens de paiement (une mention, pas une carte de service dédiée type "Services > Zelle"). Ne jamais écrire "Zelle" dans `components/`, `app/`, les métadonnées SEO, ni dans le contenu visible.

## Périmètre actuel — Site Vitrine simplifié

À livrer : Accueil (hero), Services (Shipping / Boutique — voir contrainte légale ci-dessus : pas de carte "Zelle" ou "Transferts d'argent" dédiée, seulement une mention des paiements digitaux acceptés), Suivi de colis public (démo, données simulées — pas de vraie API pour l'instant), À propos, section "Pourquoi KS Express", Contact (formulaire + coordonnées), lien vers l'Espace Client (`/login`), Footer.

## Espace Client (`/portal`) et Back-Office (`/staff`) — ✅ construits dans ce dépôt

Ces deux espaces authentifiés (connectés au backend `ksexpress-back` réel, plus de données simulées) vivent dans **ce même dépôt Next.js**, sous `/portal` (rôle Client) et `/staff` (rôles internes — Super Admin, Employé Shipping, Caissier), avec une seule page de connexion (`/login`) qui redirige selon le rôle décodé du JWT. Ce n'est **pas** une extension hors contrat : le Devis Professionnel NEX-KSE-2026-001 §3 et le Contrat NEX-KSE-2026-002 Article 3.1 incluent explicitement le "portail client" et le module ADM dans le périmètre déjà signé et payé de la Phase 1 — seul le site vitrine (Article 3.2/3.3) avait un périmètre réduit distinct.

- `lib/api/` : client HTTP (`lib/api/client.ts`, refresh automatique sur 401), wrappers typés par module backend (`auth`, `clients`, `colis`, `factures`, `lots`, `admin`, `tarification`, `parametres`).
- `lib/auth/` : `AuthContext` (JWT décodé côté client, jamais vérifié — la sécurité réelle reste dans le backend via `@Roles`), stockage `localStorage`, `RequireRole` (garde de route par rôle, redirige `/login` ou vers l'espace approprié).
- `components/app-shell/` : `AppShell` (nav filtrée par rôle), `StatusBadge`, `ClientPicker` (recherche client réutilisée en création de colis/facture).
- `/portal` : résumé (vue 360°), mes colis, mes factures (PDF), préférences de notification — RF-CLI-004, RF-SHP portail, RG-NOT-03.
- `/staff` : colis (recherche/création/édition/statut/photos/label), colis non identifiés (rattachement), scanner, lots d'expédition, clients (fiche + vue 360°), factures (génération/encaissement/signature/reçu PDF) ; `/staff/admin/*` (Super Admin uniquement) : comptes internes, grilles tarifaires, paramètres (logo/taux de change/moyens de paiement), journal d'audit.
- `NEXT_PUBLIC_API_URL` (`.env.local`, voir `.env.example`) pointe vers le backend (`http://localhost:3001/api/v1` en local).
- Vérifié dans le sandbox de développement : `npx tsc --noEmit` et `npx eslint .` clean. **Pas de vérification en conditions réelles contre le backend** (pas d'accès réseau au sandbox) — à faire par Claude Code / l'utilisateur (voir `PROMPT_CLAUDE_CODE_FRONT_ESPACES.md`).

**Hors périmètre pour le site vitrine public — ne pas développer sans validation explicite** : catalogue produits en ligne, mini-boutique/panier, blog, FAQ, formulaire de devis structuré, paiement en ligne par carte. Ces éléments appartiennent à des phases ultérieures (Phase 2 POS, Phase 3 Zelle/Finances) définies au Cahier des Charges. (Le back-office et le portail client, eux, sont construits — voir section ci-dessus — car explicitement inclus dans la Phase 1 déjà signée.)

## Charte graphique KS Express (v2 — palette officielle, remplace les couleurs précédentes)

**Couleurs du logo (accent, boutons, icônes, CTA)** : Or `#FFAF03` · Orange-rouge `#FF590D`
**Fond en dégradé (hero, sections sombres — remplace l'ancien dégradé orange)** : Bleu vif `#030FFF` → Bleu marine très foncé `#040339`
**Blanc** : `#FFFFFF` (texte et éléments sur fond bleu)

**Règle de contraste (audit WCAG du 5 août 2026) — Or et Orange-rouge ne sont PAS assez lisibles en texte sur fond clair (blanc/`brand-light`) :**
- Boutons, fonds de bouton, icônes, gradients, et tout texte déjà sur fond bleu : `#FFAF03` / `#FF590D` inchangés, contraste correct.
- Texte orange-rouge sur fond clair (labels "eyebrow", liens actifs, prix, liens type "mot de passe oublié") : utiliser `--color-brand-orange-text: #C4440A` (variante assombrie, même teinte, 5.03:1 sur blanc / 4.74:1 sur `brand-light`) — nouveau token dédié à cet usage, ne pas modifier `brand-orange`/`brand-orange-dark`.
- Texte doré sur fond clair : **ne jamais assombrir le gold pour le faire passer en AA** (ça devient marron/olive, méconnaissable) — utiliser `brand-dark` à la place.

- Le **fond bleu en dégradé** remplace l'ancien dégradé orange du Hero et le fond sombre `#1E1408` de la barre de stats / footer — ces zones sombres utilisent maintenant le dégradé bleu (`#030FFF` → `#040339`).
- Les **couleurs du logo (or/orange-rouge)** restent les couleurs d'accent : boutons principaux, icônes, liens, chiffres clés, CTA — elles ressortent maintenant sur fond bleu au lieu de fond orange, ce qui doit rester lisible et contrasté (vérifier le contraste texte/fond après le changement).
- Les sections claires (fond `#FFF7EE`, cartes blanches) ne sont pas concernées par ce changement — seules les zones de fond sombre/dégradé passent au bleu.
- Dégradés sur boutons principaux : passer de or → orange-rouge (`#FFAF03` → `#FF590D`) plutôt qu'orange → rouge.
- Boutons en pilule (`rounded-full`), cartes arrondies, ombres douces — inchangé.
- Logo réel dans `public/logo.png` (si absent, utiliser un texte "KS EXPRESS SERVICE" stylé en attendant).
- Ces couleurs sont définies comme tokens Tailwind dans `app/globals.css` (`--color-brand-*`) — mettre à jour ces tokens plutôt que de changer les couleurs en dur dans chaque composant, pour que tout le site reste cohérent automatiquement.
- Contenu et interface en **français** (ton professionnel et chaleureux, pas corporate froid). Voir Cahier des Charges §16.4 pour les exigences de langue.

## Direction créative — éviter le look "généré par IA"

Le site doit paraître conçu par une vraie équipe pour une vraie entreprise haïtienne, pas assemblé automatiquement. Points de vigilance particuliers sur les **cartes** (Services, "Pourquoi KS Express", etc.) et plus largement sur toute la page :

- **Pas d'icônes en emoji** (📦 💸 🔒...) — utiliser des icônes propres de `lucide-react` (déjà inclus avec shadcn/ui), avec un traitement graphique cohérent (couleur, taille, fond).
- **Ne pas répéter le même patron de carte partout** (icône centrée en haut + titre + paragraphe, x3, toutes identiques). Varier : une carte peut avoir un chiffre clé en gros, une autre une mini-illustration, une autre un exemple concret (ex. un vrai numéro de tracking, un vrai statut) plutôt que juste "icône + texte générique".
- **Bannir les formules marketing vagues et interchangeables** ("Solution innovante", "Optimisez votre expérience", "Une nouvelle ère du shipping"...). Écrire des phrases concrètes, ancrées dans la réalité de KS Express : villes réelles (Port-au-Prince, Cap-Haïtien, Miami...), exemples chiffrés, situations vécues par les clients ("Fini les appels au bureau pour savoir si votre colis est arrivé").
- **Casser la symétrie parfaite** : éviter que toutes les sections soient un grid 3 colonnes centré avec le même espacement. Alterner mise en page (texte+visuel à gauche puis à droite, largeurs de cartes différentes, une section plus éditoriale).
- **Éviter les dégradés/formes décoratives génériques en fond** (blobs flous, cercles radiaux "tech") sauf sur le hero où c'est déjà la charte — ne pas en mettre partout par réflexe.
- **Ajouter de la spécificité locale et humaine** : un vrai témoignage client (même fictif mais crédible, avec prénom haïtien et détail concret), des horaires et une adresse qui sonnent réels, une mention du canal WhatsApp (très utilisé en Haïti) plutôt que seulement email.
- **Typographie et hiérarchie visuelle variées** : ne pas mettre tous les titres de section exactement au même poids/taille/alignement centré — introduire un peu de hiérarchie éditoriale (comme ferait un vrai studio de design).

Objectif : quelqu'un qui visite le site doit sentir une entreprise haïtienne concrète derrière, pas un template.

### Navbar — indicateur de section active (desktop)

Sur desktop, le lien de la Navbar correspondant à la section actuellement visible à l'écran doit afficher un **soulignement** (underline) pour indiquer où l'utilisateur se trouve sur la page. À implémenter avec un scroll-spy (`IntersectionObserver` sur chaque `<section id="...">`) qui met à jour un état "section active", puis un underline animé qui se déplace d'un lien à l'autre avec Motion (`layoutId` partagé entre les liens — pattern classique "animated underline"). Pas nécessaire sur mobile (menu burger).

## Stack et conventions

- Next.js (App Router) + TypeScript + Tailwind CSS + **shadcn/ui** pour les composants d'interface (boutons, formulaires, cartes, inputs, etc.).
- Installer les composants shadcn au besoin via `npx shadcn@latest add <composant>` plutôt que de les recoder à la main ; les personnaliser ensuite avec les couleurs de la charte graphique (voir plus bas) via le thème Tailwind / `globals.css`, pas en surchargeant chaque composant au cas par cas.
- Composants découpés par section dans `components/`, assemblés dans `app/page.tsx`.
- Mobile-first, responsive obligatoire (RNF-030/031 du Cahier des Charges).
- Métadonnées SEO de base via l'API `metadata` de Next.js.
- Pas de secrets/API keys en dur dans le code — utiliser `.env.local` (non versionné).

### Animations

- **Motion** (`npm install motion`, anciennement Framer Motion — package `motion/react`) pour les animations : entrée du hero, révélation des sections au scroll (`whileInView`), micro-interactions au survol des cartes/boutons, progression animée de la frise de suivi de colis.
- Compléter avec `tailwindcss-animate` (déjà utilisé par shadcn/ui) pour les transitions simples (ouverture de menu mobile, dropdown, etc.) — pas besoin de Motion pour ça.
- Ne pas utiliser GSAP sauf besoin précis et justifié (timeline complexe) — inutile pour ce périmètre.
- **Animer avec retenue**, dans l'esprit "humain, pas généré par IA" ci-dessus : des animations subtiles et utiles (guider l'attention, confirmer une action) plutôt que des effets décoratifs partout. Respecter `prefers-reduced-motion` (Motion le gère nativement via `useReducedMotion`).
- **Hero — état validé** : plusieurs tracés animés en fond (pas un seul avion isolé) — 2 avions (icône `Plane` de lucide-react) sur des trajectoires courbes distinctes, plus un colis (icône `Package`) sur son propre tracé séparé. Chaque élément boucle indépendamment avec un décalage (stagger) pour rester organique plutôt que synchronisé/mécanique. Rester discret : faible opacité ou petite taille, ne jamais gêner la lisibilité du titre du Hero.

**Autres options si un besoin visuel spécifique se présente (à valider avant usage) :**
- **Lottie** (`lottie-react`) ou **Rive** — animations vectorielles légères exportées depuis After Effects/Rive, idéal pour un petit avion/colis animé dans le hero (cohérent avec le motif avion du logo KS Express), beaucoup plus léger qu'une scène 3D.
- **Three.js / React Three Fiber** — vraie 3D (WebGL), seulement si un effet 3D précis est explicitement demandé. **Attention : entre en tension avec les exigences RNF-001/002 du Cahier des Charges (site utilisable sur connexion 4G modeste/instable en Haïti).** Si utilisé, isoler dans un composant chargé en lazy (`dynamic(() => import(...), { ssr: false })`), jamais sur tout le site.
- **GSAP** — pour une timeline complexe précise uniquement ; ne pas ajouter par défaut.

## Backend et données — dépôt séparé

**Ce dépôt (`ksexpress-front`) est le FRONTEND UNIQUEMENT (Next.js).** Le backend vit dans un **projet séparé**, en **NestJS** (TypeScript), avec **Prisma** comme ORM et **PostgreSQL** comme base de données. Ne pas créer de Route Handlers Next.js qui dupliquent la logique métier, ni de `prisma/schema.prisma` dans ce dépôt — ça n'a pas sa place ici.

- Ce dépôt consomme l'API NestJS via des appels HTTP (REST) — URL de base configurée via `NEXT_PUBLIC_API_URL` (ou équivalent) dans `.env.local`, jamais en dur dans le code.
- Décision d'architecture qui remplace le FastAPI/Python mentionné au Cahier des Charges §17 : c'est désormais **NestJS + Prisma + PostgreSQL**, mais le principe reste le même que le CDC — une API REST séparée, pas un backend fondu dans le frontend.
- Tant que le backend NestJS n'est pas branché : le suivi de colis (tracking) et le formulaire de contact restent des **démos avec données simulées** côté frontend (voir périmètre ci-dessus) — ne pas appeler une API qui n'existe pas encore.
- L'authentification, les calculs de tarifs, les statuts de colis et le rapprochement des transferts (RF-AUT, RG-SHP, RG-ZEL du Cahier des Charges — module historiquement appelé "Zelle" en interne, jamais nommé ainsi publiquement, voir contrainte légale plus haut) sont la responsabilité du backend NestJS, pas de ce dépôt.

## Avant de considérer une tâche terminée

1. `npm run lint` et `npm run build` doivent passer sans erreur.
2. Vérifier le rendu responsive (mobile ≥360px et desktop).
3. Ne pas casser les sections déjà validées avec le client sans demande explicite.
4. Rester strictement dans le périmètre défini ci-dessus ; toute extension (catalogue, boutique, etc.) doit être signalée à l'utilisateur, pas ajoutée silencieusement.

## Évolution prévue

Le back-office et le portail client (§17 du CDC) sont maintenant construits dans ce dépôt sous `/staff` et `/portal` (voir section dédiée plus haut), consommant l'API du backend NestJS séparé (`ksexpress-back`). Reste hors périmètre pour l'instant : module POS/Stock (Phase 2), module Finances/Zelle consolidé (Phase 3), et tout ce qui est listé "hors périmètre" pour le site vitrine public ci-dessus.
