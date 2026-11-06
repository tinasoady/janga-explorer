# Janga Explorer

**Les bons plans de Mahajanga, au bon moment.**

Janga Explorer n'est pas un annuaire de plus : c'est le réflexe local pour répondre à la question
« Qu'est-ce que je peux faire aujourd'hui à Mahajanga, où aller et comment en profiter à bon prix ? ».

- **Offres temporaires** : promotions, menus spéciaux, réductions sur les chambres et activités.
- **Informations fiables** : prix, conditions et dates de validité vérifiés auprès du professionnel.
- **Découverte facile** : filtres par catégorie, budget et recherche, pensés pour le téléphone.
- **Contact direct** : WhatsApp ou téléphone, sans commission de réservation.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Cache Components, TypeScript, Tailwind CSS 4)
- [Supabase](https://supabase.com) (Postgres + RLS) pour les données

## Démarrer

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000. Sans configuration, l'application affiche des **données de démonstration**
(établissements fictifs, dans `src/data/demo-offers.ts`).

## Brancher Supabase

1. Créer un projet sur supabase.com.
2. Appliquer les migrations avec la CLI Supabase (installée avec le projet), **sans copier de SQL à la main** :

   ```bash
   npx supabase login                                    # une fois : ouvre le navigateur
   npx supabase link --project-ref <ID_DU_PROJET>        # une fois : demande le mot de passe de la base
   npm run db:push                                       # applique toutes les migrations manquantes
   ```

   `<ID_DU_PROJET>` est la partie avant `.supabase.co` dans l'URL du projet. Pour les données de démo, coller
   `supabase/seed.sql` dans l'éditeur SQL (une seule fois). **Appliquer les migrations avant de déployer le code** :
   il lit des colonnes et des tables qu'elles créent.

   Base déjà remplie à la main avant la CLI ? Marquer ces migrations comme déjà appliquées pour ne pas les rejouer
   (`npm run db:status` montre l'état local et distant) :

   ```bash
   npx supabase migration repair --status applied 20261013000001 20261013000002 20261013000003
   ```

   Nouvelle migration plus tard : `npm run db:new nom_de_la_migration`, écrire le SQL dans le fichier créé, puis
   `npm run db:push`. Les fichiers de `supabase/migrations/` sont l'historique du schéma : ne jamais modifier une
   migration déjà appliquée, en créer une nouvelle.
3. Copier `.env.example` en `.env.local` et renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Dans Supabase > Authentication > URL Configuration, ajouter l'adresse du site (et `http://localhost:3000`) aux
   « Redirect URLs » avec le chemin `/auth/callback`. Si la confirmation par e-mail est activée (par défaut), les
   nouveaux comptes reçoivent un lien de confirmation qui revient sur cette adresse.
5. Relancer `npm run dev`.

Sans variables Supabase, l'application reste en mode démonstration : comptes, espace pro, alertes et administration
sont alors indisponibles.

### Rôles et administrateurs

| Rôle | Peut |
|---|---|
| `user` | Le seul rôle qu'une inscription peut créer. Favoris, alertes, espace pro. |
| `admin` | Valider, **créer et modifier des offres** pour n'importe quel établissement (`/admin`). |
| `superadmin` | Tout ce que fait un admin, et **nommer ou retirer les admins** (`/admin/equipe`). |

On ne devient jamais admin en s'inscrivant, ni depuis l'application sans être superadmin : la table `profiles` n'a
aucune règle d'écriture, seules les fonctions réservées au superadmin (`set_admin`) et l'éditeur SQL la modifient.

**Créer le premier super-admin** (une seule fois). Créer d'abord un compte depuis l'application (`/connexion`), puis dans
l'éditeur SQL de Supabase, après avoir appliqué la migration `20261013000003_roles.sql` :

```sql
update public.profiles set role = 'superadmin'
where id = (select id from auth.users where email = 'vous@exemple.com');
```

Ensuite, le superadmin nomme les autres admins depuis `/admin/equipe` : la personne doit avoir créé son compte, puis
on saisit son e-mail. Un superadmin ne peut être rétrogradé que depuis l'éditeur SQL.

## Comptes professionnels : sur demande, validés par le superadmin

Il n'y a **pas d'inscription libre**. Un professionnel (hôtel, restaurant, activité, événement) fait une demande sur
`/connexion?mode=inscription` : nom, entreprise, type d'activité, localité, capacité, justificatif (NIF/STAT, page
Facebook, lien Google Maps…), e-mail pro et mot de passe.

1. Le compte est créé dans Supabase Auth (le mot de passe y est stocké chiffré, jamais dans nos tables) avec la demande
   jointe, **mais il n'ouvre aucun droit** : sans demande approuvée, impossible de créer un établissement ou une offre
   (règle RLS `is_approved_pro()`, pas seulement l'interface).
2. Le superadmin reçoit un e-mail (si Resend est configuré, voir `.env.example`) et voit la demande, avec un compteur,
   sur `/admin` puis `/admin/demandes`.
3. Après vérification (justificatif, appel ou WhatsApp), il **approuve** ou **refuse** avec un motif. L'approbation
   active le compte et confirme l'adresse e-mail. Il peut aussi retirer l'accès d'un compte approuvé.
4. Tant que la demande n'est pas approuvée, `/espace-pro` affiche son état (en vérification, refusée avec le motif).

Les visiteurs n'ont pas de compte : leurs favoris restent dans le navigateur. Les alertes (`/alertes`) ne sont
accessibles qu'aux comptes connectés.

**Notification par e-mail (Resend, gratuit).** Créer un compte sur resend.com, une clé d'API, puis renseigner
`RESEND_API_KEY` et `SUPERADMIN_NOTIFY_EMAIL`. Sans domaine vérifié, Resend n'envoie qu'à l'adresse du compte Resend :
utilisez celle-ci comme `SUPERADMIN_NOTIFY_EMAIL`.

**Spam.** Supabase limite déjà les inscriptions ; si des demandes factices arrivent, activer le CAPTCHA dans
Authentication > Attack Protection.

## Comment une offre est publiée

1. **Le pro** (compte approuvé) renseigne son établissement (`/espace-pro/etablissement`, prérempli avec sa demande)
   puis publie une offre avec photo (`/espace-pro/offres/nouvelle`). L'offre est « en attente de validation » : elle
   n'est pas visible du public.
2. **L'administrateur** ouvre `/admin`, appelle l'établissement pour confirmer prix et conditions, puis publie l'offre
   avec le badge « Offre vérifiée », sans badge, ou la refuse avec un motif. Il peut aussi **créer lui-même une offre**
   (« Créer une offre »), pour un établissement existant ou nouveau sans compte, par exemple quand celui-ci l'a
   transmise par WhatsApp, et modifier n'importe quelle offre.
3. Modifier une offre déjà en ligne la repasse en validation (garde-fou posé en base, pas seulement dans l'interface).
   Les offres dont `valid_until` est passé disparaissent automatiquement.

Un compte = un établissement. Une offre a jusqu'à 8 photos (la première est la couverture, les autres s'affichent dans
la galerie de la fiche). Le pro choisit des photos jusqu'à 20 Mo : le navigateur les réduit (2 000 px de côté au plus,
JPEG) puis les envoie directement au bucket public `offer-images` (10 Mo par fichier) par des liens d'envoi signés.
Le serveur web ne reçoit que leurs adresses, car Vercel limite une requête à 4,5 Mo. À l'enregistrement, il vérifie
que chaque photo est déjà sur l'offre ou vient du dossier de la personne, et supprime du stockage les photos retirées.

## Abonnement des comptes pro

1. **Essai gratuit** : à l'approbation de sa demande, le compte pro reçoit un essai (30 jours par défaut) pendant
   lequel il publie autant d'offres qu'il veut. Les comptes déjà approuvés avant la migration
   `20261016000006_subscriptions.sql` reçoivent leur essai à partir du jour où elle est appliquée.
2. **Paiement** : depuis `/espace-pro/abonnement`, le pro choisit la durée (1, 3, 6 ou 12 mois), paie par MVola,
   Orange Money ou Airtel Money au numéro affiché, puis déclare le paiement : numéro payeur, référence de la
   transaction et capture d'écran de la confirmation. Le montant est calculé par la base (mois × prix en vigueur),
   jamais par le navigateur. Un seul paiement en attente à la fois ; une même référence ne peut pas servir deux fois.
3. **Confirmation** : tout administrateur voit les paiements à vérifier sur `/admin/abonnements` (compteur sur
   `/admin`), contrôle la réception sur le relevé de l'opérateur, puis confirme ou refuse avec un motif. Chaque mois
   payé ajoute 30 jours à la suite de l'accès en cours (rien n'est perdu en payant pendant l'essai ou avant
   l'échéance).
4. **Sans abonnement actif**, le pro publie à la durée (voir plus bas) : une offre qu'il crée, modifie ou renvoie
   reste un brouillon tant que ses jours de visibilité ne sont pas payés (règle RLS et trigger `offers_guard`, pas
   seulement l'interface). Ses offres déjà en ligne restent visibles jusqu'à leur date de fin, et il peut toujours les
   retirer. Un abonnement annulé par le superadmin bloque les deux formules.

### Publication à la durée (sans abonnement)

Pour un événement ou une promotion de quelques jours, le pro paie seulement les jours où l'offre est visible : du jour
où il déclare le paiement jusqu'à la date de fin de l'offre, au prix par jour fixé par le superadmin (1 000 Ar par
défaut, 90 jours au plus en une fois). Le formulaire d'offre affiche le montant pendant la saisie, puis envoie vers
`/espace-pro/offres/[id]/visibilite` pour payer. Le paiement suit le même circuit que l'abonnement (preuve, puis
confirmation par un admin, dans la même file de `/admin/abonnements`). À la confirmation, les jours payés sont notés sur
l'offre (`pass_until`) et le brouillon passe dans la file de validation des offres. Si le pro repousse ensuite la date
de fin, l'offre redevient un brouillon et seuls les jours en plus sont à payer.

### Billetterie des événements

Pour une offre « Sorties » ou « Activités », le pro peut choisir « Plusieurs tarifs » : jusqu'à 6 billets (normal,
VIP, étudiant…), chacun avec un prix en prévente, un prix sur place, ou les deux, et une date de fin de prévente
facultative. La fiche de l'offre affiche le tableau des billets ; les cartes affichent « dès » le tarif le moins cher
du jour (prévente tant qu'elle est ouverte, puis prix sur place) et, en prévente, le prix sur place barré. Les tarifs
sont dans `offers.ticket_tiers` (JSON vérifié par la base) et `offers.presale_until` ; le calcul du prix du jour est dans
`src/lib/tickets.ts`. Changer un tarif renvoie l'offre en validation, comme tout autre changement de contenu.

### Statistiques des offres

Chaque vue de fiche (une fois par onglet) et chaque clic sur WhatsApp, Appeler ou Voir la localisation est compté par
jour dans `offer_stats`, via `POST /api/stats` et la fonction `track_offer_event` (seules les offres en ligne comptent).
Le pro voit les totaux des 30 derniers jours dans son espace. Les chiffres sont indicatifs : rien n'empêche un visiteur
de gonfler un compteur en rechargeant la page dans un nouvel onglet.

Le dashboard `/admin/abonnements` affiche les revenus confirmés (mois en cours et 6 derniers mois), les abonnés, les
essais, les comptes qui expirent sous 7 jours (avec un bouton de relance WhatsApp) et l'historique des paiements.
**Le superadmin** y règle en plus le prix mensuel, le prix par jour, la durée de l'essai et les numéros de réception
(`/admin/abonnements/tarifs`), offre des jours, annule ou réactive un abonnement.

**À faire après la migration** : renseigner le prix (20 000 Ar par défaut) et au moins un numéro de réception dans
`/admin/abonnements/tarifs`. Tant qu'aucun numéro n'est saisi, les pros ne peuvent pas déclarer de paiement.

Les preuves sont stockées dans le bucket **privé** `payment-proofs` (lisible par le pro et les administrateurs, via des
liens temporaires). Elles ne sont pas supprimées automatiquement avec un compte : les retirer à la main dans
Supabase > Storage lors d'une fermeture de compte.

## Offres d'exemple (avant le lancement public)

La migration `20261106000009_sample_offers.sql` met en ligne 48 offres fictives de 23 établissements inventés, pour
montrer le site rempli. Leurs établissements ont `is_sample = true` : le site leur ajoute une étiquette « Exemple » (et
un avertissement sur la fiche), et l'administration les regroupe dans une section à part, hors de la file de modération.
Depuis `/admin` :

- **Prolonger de 30 jours** (administrateurs) : les dates des exemples sont relatives au jour de la migration, ils
  expirent donc au fil des semaines ;
- **Supprimer tous les exemples** (superadmin, case de confirmation) : à faire le jour du lancement public. Les vraies
  offres ne sont pas touchées.

## Démonstration (offres fictives)

`src/data/demo-offers.ts` contient une cinquantaine d'offres fictives (établissements, prix et numéros inventés,
préfixe 26199 attribué à aucun opérateur) dans les quatre rubriques, avec des billetteries, des offres qui se terminent
bientôt et des nouveautés. Elles s'affichent quand Supabase n'est pas configuré, ou partout avec
`NEXT_PUBLIC_DEMO_MODE=1`, pour montrer le site rempli sans toucher à la vraie base. Un bandeau jaune « Démonstration »
est alors affiché en haut de chaque page ; les comptes, l'espace pro et l'administration sont indisponibles.

Pour une adresse de démonstration à partager : créer un second projet Vercel (ou un déploiement de prévisualisation)
avec `NEXT_PUBLIC_DEMO_MODE=1`. En local : `NEXT_PUBLIC_DEMO_MODE=1` dans `.env.local`, puis `npm run dev`.

Les photos viennent d'Unsplash. `supabase/seed.sql` ne reprend que les 13 premières offres.

## Mode jour / nuit

Bouton lune / soleil dans l'en-tête (et sur l'accueil mobile), choix Jour / Nuit / Auto dans le profil ; « Auto » suit le
réglage de l'appareil. Le choix reste dans le navigateur (`localStorage`, clé `janga:theme`) et un petit script de
`<head>` (`src/lib/theme.ts`) pose la classe `.dark` avant l'affichage, sans flash de page claire.

Les couleurs sont nommées selon leur rôle dans `src/app/globals.css` et redéfinies sous `.dark` : `bg-card` (fond des
pages et des cartes), `text-fg` (texte), `bg-surface`, `border-line`, `text-muted`… Pour un nouvel élément, utiliser ces
noms plutôt que `bg-white` ou `text-ink`. `ink` reste le bleu nuit de la marque : fonds sombres (pied de page, cartes du
jour) et texte posé sur du jaune ou sur les boutons blancs au-dessus des photos.

## Langues (français / anglais)

Tout le site existe en français et en anglais, **à la même adresse** : le choix est gardé dans le cookie `lang`
(sélecteur FR / EN dans l'en-tête, le pied de page, le profil et l'en-tête mobile de l'accueil). À la première visite, la
langue du navigateur décide (anglais si elle commence par `en`, sinon français).

- Les pages sont sous `src/app/[lang]/` et prérendues dans les deux langues. `src/proxy.ts` réécrit `/bons-plans` en
  `/fr/bons-plans` ou `/en/bons-plans`. Un lien préfixé (`/en/bons-plans`, pratique à partager) choisit la langue puis
  redirige vers l'adresse sans préfixe.
- Les textes sont rangés à côté du code qui les affiche, dans un objet `messages({ fr: {…}, en: {…} })` : TypeScript
  refuse une traduction qui manque. Composants serveur : `getLocale()` (`src/lib/locale.ts`) ; composants client :
  `useLocale()` ; Server Actions : `getRequestLocale()` (lit le cookie).
- Ce que les pros saisissent (titres, descriptions, conditions) n'est pas traduit. Les messages WhatsApp envoyés aux
  pros depuis l'administration restent en français, de même que l'e-mail de notification au superadmin.
- En cas de désaccord, la version française des conditions d'utilisation fait foi.

**Ajouter un texte** : le mettre dans les deux langues du `messages(...)` du fichier, jamais en dur dans le JSX.

## Favoris et alertes

- Les favoris restent dans le navigateur. Avec un compte connecté, ils sont aussi enregistrés sur le compte et suivent
  la personne d'un appareil à l'autre (fusion à la première synchronisation, puis le compte fait foi).
- Une alerte (catégorie, budget maximum, mot-clé) compte les offres qui correspondent et signale celles mises en
  ligne depuis la dernière visite. Elle s'affiche dans l'application : **aucune notification n'est envoyée** (e-mail ou
  WhatsApp), ce qui demanderait un service d'envoi.

## Intégration continue (GitHub Actions)

Le workflow `.github/workflows/ci.yml` tourne à chaque push et pull request :

| Job | Quand | Ce qu'il fait |
|---|---|---|
| Lint, types et build | toujours | `npm run lint`, TypeScript, `npm run build` (en mode démonstration, sans Supabase) |
| Tests SQL des migrations | toujours | `npm run db:test` : rejoue toutes les migrations dans PGlite (Postgres embarqué) et vérifie les règles d'accès de l'abonnement |
| Migrations Supabase | push sur `main` | `supabase db push` sur la base de production, après les tests SQL |

`npm run db:test` se lance aussi en local, sans Docker ni base Supabase. Le test est dans `supabase/tests/`.

**Secrets à créer** dans GitHub > Settings > Secrets and variables > Actions :

- `SUPABASE_ACCESS_TOKEN` : jeton personnel créé sur supabase.com > Account > Access Tokens ;
- `SUPABASE_PROJECT_ID` : identifiant du projet (la partie avant `.supabase.co`) ;
- `SUPABASE_DB_PASSWORD` (facultatif) : mot de passe de la base. Sans lui, la CLI se connecte avec un rôle temporaire
  qu'elle crée grâce au jeton.

Sans eux, le job « Migrations Supabase » échoue avec la liste des secrets manquants.

**Ordre migration / déploiement.** Vercel déploie `main` de son côté, en même temps que le workflow : une migration
peut donc arriver une minute après le nouveau code. Pour une migration dont le code dépend (nouvelle table, nouvelle
colonne lue par les pages), l'appliquer d'abord (`npm run db:push`, ou un premier commit qui ne contient que la
migration), puis pousser le code. Une migration ne doit jamais casser le code déjà en ligne : ajouter des colonnes ou
des tables, ne pas en supprimer ni en renommer dans le même déploiement.

## Structure

```
src/app/[lang]/     pages (en français et en anglais) : accueil, bons-plans, offres/[slug], favoris, alertes, profil,
                    connexion, pro (présentation), pages légales
src/app/[lang]/espace-pro/ tableau de bord du professionnel : établissement, offres, abonnement, visibilité à la durée
src/app/[lang]/admin/      modération, création d'offres par l'admin, abonnements et paiements, demandes de compte pro
                    et équipe d'administration (superadmin)
src/app/api/        statistiques des offres, favoris (hors segment de langue)
src/proxy.ts        choisit la langue (cookie) et réécrit vers /fr ou /en ; rafraîchit la session Supabase des pages
                    avec compte
src/lib/i18n.ts     langues, messages bilingues ; src/lib/locale.ts : langue de la page ou de la requête
src/components/     cartes d'offres, navigation, favoris, éléments de formulaire…
src/lib/offers.ts   accès public aux offres (Supabase ou démo), filtres et tri
src/lib/auth.ts     session, rôles et pages protégées
src/lib/subscription.ts  état de l'abonnement, réglages, paiements et preuves
supabase/           migrations SQL (schéma, règles d'accès RLS), tests SQL et données de démonstration
.github/workflows/  intégration continue : vérifications, tests SQL, migrations de production
```

## Feuille de route

- [x] Côté visiteur : accueil, liste filtrable, fiche offre + WhatsApp, favoris
- [x] Espace pro : connexion des établissements et publication de leurs offres
- [x] Back-office : validation des offres (badge « Offre vérifiée »)
- [x] Compte utilisateur, favoris synchronisés et alertes dans l'application
- [x] Abonnement des comptes pro (Mobile Money, paiements confirmés par un admin)
- [x] Publication à la durée sans abonnement, statistiques des offres pour les pros
- [x] Accueil : bon plan du jour, « Dernière chance », repères « Nouveau » / « Dernier jour »
- [x] Site en français et en anglais (sélecteur de langue, même adresse)
- [ ] Paiement Mobile Money confirmé automatiquement (API MVola / Orange Money)
- [ ] Notifications des alertes (e-mail ou WhatsApp)
- [ ] Plusieurs établissements par compte
