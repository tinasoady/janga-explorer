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

Un compte = un établissement. Les photos sont stockées dans le bucket public `offer-images` (5 Mo, JPEG/PNG/WebP).

## Favoris et alertes

- Les favoris restent dans le navigateur. Avec un compte connecté, ils sont aussi enregistrés sur le compte et suivent
  la personne d'un appareil à l'autre (fusion à la première synchronisation, puis le compte fait foi).
- Une alerte (catégorie, budget maximum, mot-clé) compte les offres qui correspondent et signale celles mises en
  ligne depuis la dernière visite. Elle s'affiche dans l'application : **aucune notification n'est envoyée** (e-mail ou
  WhatsApp), ce qui demanderait un service d'envoi.

## Structure

```
src/app/            pages : accueil, bons-plans, offres/[slug], favoris, alertes, profil, connexion, pro (présentation)
src/app/espace-pro/ tableau de bord du professionnel : établissement, offres (créer, modifier, retirer)
src/app/admin/      modération, création d'offres par l'admin, demandes de compte pro et équipe d'administration (superadmin)
src/proxy.ts        rafraîchit la session Supabase pour les pages avec compte
src/components/     cartes d'offres, navigation, favoris, éléments de formulaire…
src/lib/offers.ts   accès public aux offres (Supabase ou démo), filtres et tri
src/lib/auth.ts     session, rôles et pages protégées
supabase/           migrations SQL (schéma, règles d'accès RLS) et données de démonstration
```

## Feuille de route

- [x] Côté visiteur : accueil, liste filtrable, fiche offre + WhatsApp, favoris
- [x] Espace pro : connexion des établissements et publication de leurs offres
- [x] Back-office : validation des offres (badge « Offre vérifiée »)
- [x] Compte utilisateur, favoris synchronisés et alertes dans l'application
- [ ] Notifications des alertes (e-mail ou WhatsApp)
- [ ] Plusieurs établissements par compte
