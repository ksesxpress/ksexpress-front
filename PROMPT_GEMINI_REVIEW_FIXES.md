# Corrections à faire — ksexpress-front (suite à un audit de code)

Contexte : ceci est le frontend Next.js (App Router, TypeScript, Tailwind) de KS Express Service, dans `ksexpress-front/`. Un audit de code (lecture seule, aucune modification) a été fait sur l'état actuel du dépôt et a identifié les problèmes ci-dessous. Merci de les corriger dans l'ordre, en vérifiant après chaque étape avec `npx tsc --noEmit` et `npx eslint .`.

## 1. Permission "canCreate" mal nommée qui cache les boutons d'action (bug utilisateur signalé)

Fichier : `app/staff/(shell)/clients/page.tsx`.

Le variable `canCreate` contrôle à la fois la création ET l'affichage de toute la colonne "Actions" (Modifier / Désactiver / Réactiver). Résultat : un utilisateur dont le rôle de succursale actif est "CASHIER" (ou tout rôle non autorisé à créer) ne voit AUCUN bouton d'action, y compris "Réactiver" un client désactivé — alors que réactiver un client n'a pas forcément besoin d'être la même permission que créer.

**À faire** : séparer en deux permissions distinctes et cohérentes avec ce que permet réellement le backend (vérifier les rôles autorisés côté `ksexpress-back` pour `PATCH /clients/:id`, `/clients/:id/deactivate`, `/clients/:id/activate`) :
- une permission pour "créer un client"
- une permission pour "modifier / désactiver / réactiver un client"

Appliquer la même colonne d'actions avec la bonne permission, pas `canCreate` pour tout.

## 2. Logique de rôle de succursale dupliquée à 3 endroits (source probable du bug ci-dessus)

Fichiers concernés :
- `components/app-shell/AppShell.tsx` (calcul de `branchRole` ET `legacyRole`)
- `app/staff/(shell)/clients/page.tsx` (calcul de `canCreate`)
- `app/staff/(shell)/page.tsx` (dashboard, même pattern)

Chacun relit `localStorage.getItem("kse_active_succursale")` et `localStorage.getItem("kse_available_succursales")` puis fait son propre `JSON.parse(...)` dans un `try { } catch (e) {}` vide, au lieu d'utiliser les fonctions déjà existantes `getActiveSuccursale()` et `getAvailableSuccursales()` dans `lib/auth/tokens.ts`.

**À faire** : centraliser cette logique. Idéalement, créer une seule fonction utilitaire (ex. `getCurrentBranchRole()` dans `lib/auth/tokens.ts` ou un nouveau hook `useBranchRole()`) qui retourne le rôle de succursale actif, et faire en sorte que les 3 endroits l'utilisent au lieu de dupliquer le `JSON.parse` + `try/catch` vide. Typer correctement (voir point 6, ces fonctions retournent actuellement `any[]`).

## 3. `PageHeader` sticky avec un fond translucide → contenu qui "traverse" l'en-tête au scroll (bug utilisateur signalé)

Fichier : `components/app-shell/PageHeader.tsx`.

Classe actuelle : `sticky top-0 sm:top-14 z-20 ... bg-sidebar/80 backdrop-blur-md ...`. Le fond à 80% d'opacité fait que les lignes de tableau qui défilent en dessous restent partiellement visibles à travers l'en-tête sticky, donnant l'impression que "l'en-tête de liste défile dans les lignes clients".

**À faire** : rendre le fond du `PageHeader` opaque (`bg-sidebar` sans `/80`, ou une couleur solide cohérente avec le thème sombre `#040339` actuel), en gardant `backdrop-blur-md` seulement si le fond reste bien opaque visuellement. Vérifier ensuite sur `/staff/clients` (et une autre page à liste longue) qu'aucune ligne ne devient visible à travers l'en-tête pendant le scroll.

## 4. Fichier mort avec l'ancien thème clair : `components/ui/data-table.tsx`

Aucune page n'importe plus `components/ui/data-table` (confirmé par recherche globale) — toutes les pages de liste utilisent désormais des tableaux manuels avec le thème sombre actuel. Ce fichier reste cependant écrit avec l'ancien thème clair (`bg-white`, `border-[#f2e6d6]`, `text-brand-dark`) et pourrait être réutilisé par erreur dans le futur, produisant un tableau blanc cassé sur fond bleu marine.

**À faire** : supprimer `components/ui/data-table.tsx` (et vérifier qu'aucun import ne casse — la recherche globale actuelle indique qu'il n'y en a aucun). Si vous préférez le garder par précaution, au minimum ajouter un commentaire "DEPRECATED / non utilisé, ne pas réutiliser sans migrer vers le thème sombre" en tête de fichier.

## 5. Couleur de grille de graphique héritée de l'ancien thème clair

Fichier : `app/staff/(shell)/page.tsx` (dashboard), 4 occurrences de `<CartesianGrid strokeDasharray="3 3" stroke="#f2e6d6" />` (Recharts).

`#f2e6d6` est une couleur crème de l'ancien thème clair, illisible/mal contrastée sur le fond actuel `#040339`.

**À faire** : remplacer `stroke="#f2e6d6"` par une couleur cohérente avec le thème sombre actuel, par exemple `stroke="rgba(255,255,255,0.1)"` (équivalent de `white/10` déjà utilisé ailleurs dans l'app pour les bordures/séparateurs sur fond sombre).

## 6. Nettoyer le lint — `npx eslint .` : 200 problèmes (137 erreurs, 63 warnings)

`npx tsc --noEmit` est propre (aucune erreur de type), mais le lint échoue largement, ce qui viole la règle du projet ("`npm run lint` doit passer sans erreur", voir `CLAUDE.md`). Par ordre de priorité :

a. **28× `react-hooks/set-state-in-effect`** (le plus important — même famille de bug que le point 1/2) : plusieurs pages appellent `setState(...)` directement dans le corps d'un `useEffect` au lieu de calculer la valeur directement dans le rendu ou de la mettre à jour dans un callback. Exemple précis : `app/staff/(shell)/clients/page.tsx` lignes ~199-217 (le `useEffect` qui calcule `canCreate`). Corriger ce pattern partout où ESLint le signale — le refactor du point 2 (fonction utilitaire centralisée) doit éliminer une bonne partie de ces occurrences d'un coup.

b. **90× `@typescript-eslint/no-explicit-any`** : remplacer les `any` par des types réels, en particulier dans `lib/api/succursales.ts`, `lib/api/roles.ts`, `lib/api/reports.ts`, `lib/api/types.ts`, `lib/auth/auth-context.tsx`, `lib/auth/tokens.ts` (`getAvailableSuccursales(): any[]` notamment — définir un type `Succursale`/`AvailableSuccursale` réel).

c. **49× `@typescript-eslint/no-unused-vars`** : supprimer les imports/variables inutilisés signalés (rapide à corriger, liste complète disponible via `npx eslint .`).

d. **7× `react-hooks/exhaustive-deps`** : dépendances manquantes dans des `useEffect` — vérifier au cas par cas que ce n'est pas un bug caché de données périmées avant d'ajouter la dépendance ou de justifier explicitement l'omission.

e. **`react/no-unescaped-entities`** (plusieurs occurrences, ex. `app/staff/(shell)/admin/roles/page.tsx:60`, `lots/page.tsx:177`, `marketing/page.tsx:16`, `packages/[id]/page.tsx:453`, `page.tsx:485`) : remplacer les apostrophes brutes dans le JSX par `&apos;` ou une citation typographique `’`.

f. `app/staff/(shell)/products/page.tsx:193` : remplacer `<img>` par `next/image` (`@next/next/no-img-element`).

g. `lib/export.ts:26` : `prefer-const` — variable `header` jamais réassignée, changer `let` en `const`.

h. `lib/api/roles.ts:29` : interface vide équivalente à son supertype (`@typescript-eslint/no-empty-object-type`) — soit la supprimer et utiliser directement le type parent, soit ajouter un membre distinctif.

## 7. Fichier orphelin à la racine du dépôt

`test-cva.tsx` à la racine de `ksexpress-front/` semble être un fichier de test/scratch committé par erreur (génère un warning ESLint `'cva' is defined but never used`). Le supprimer si son contenu n'est plus nécessaire.

## Vérification finale

Après toutes les corrections :
1. `npx tsc --noEmit` → doit rester propre.
2. `npx eslint .` → 0 erreur (les warnings restants doivent être justifiables au cas par cas, idéalement 0 aussi).
3. `npm run build` → doit passer.
4. Test manuel réel (ce sandbox n'a pas d'accès réseau/DB) : se connecter avec un compte dont le rôle de succursale actif est CASHIER, aller sur `/staff/clients`, désactiver un client (si la permission le permet) puis vérifier que le bouton "Réactiver" apparaît bien et fonctionne. Scroller une longue liste sur `/staff/clients` et confirmer qu'aucune ligne du tableau ne devient visible à travers l'en-tête sticky.
