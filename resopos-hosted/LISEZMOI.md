# ResoPOS – version à héberger

Fichiers : `index.html` (application), `config.js` (vos clés), `schema.sql` (base de données), `manifest.json` + `sw.js` + icônes (installation et mode hors ligne).

## Mise en ligne en 10 minutes
1. **Supabase** (supabase.com, offre gratuite) : créez un projet.
2. **SQL Editor** : collez tout `schema.sql` puis *Run*.
3. **Project Settings > API** : copiez *Project URL* et la clé *anon public* dans `config.js`.
4. **Authentication > URL Configuration** : indiquez l'adresse finale de votre site (*Site URL*). Pour tester vite, vous pouvez désactiver *Confirm email* (Authentication > Providers > Email).
5. **Hébergez le dossier** (HTTPS obligatoire) : Netlify (glisser-déposer du dossier), Cloudflare Pages, Vercel ou GitHub Pages.
6. **Installer** : ouvrez le site sur le téléphone puis menu du navigateur > *Installer l'application* / *Ajouter à l'écran d'accueil*.

## Droits par rôle (appliqués par la base de données)
| Action | Patron | Caisse | Cuisine |
|---|---|---|---|
| Voir menu, stock, commandes | oui | oui | oui |
| Créer / encaisser / fusionner / diviser une commande | oui | oui | non |
| Changer le statut d'une commande | oui | oui | oui (statut uniquement) |
| Annuler une commande non payée | oui | oui | non |
| Modifier ou annuler une commande payée | oui | non | non |
| Menu, prix, photos, réglages, bilan | oui | non | non |
| Stock : fixer la quantité | oui | non | non |
| Stock : décompte automatique à la vente | oui | oui | non |
| Gérer l'équipe, codes d'invitation | oui | non | non |

## Fonctionnement
- Chaque personne a son compte (e-mail + mot de passe). Le premier compte qui crée un restaurant en est le **patron**.
- Réglages > *Équipe et droits* : changer le rôle ou retirer quelqu'un. *Inviter l'équipe* donne deux codes (caisse, cuisine) : la personne crée son compte puis « Rejoindre une équipe ».
- Les photos des plats sont envoyées dans Supabase Storage (bucket `menu-photos`), pas dans le menu. L'écran cuisine est en direct (Realtime). Hors connexion, l'application s'ouvre et les ventes sont mises en file d'attente.

## Limites connues
- Version 2 : exécutez `schema.sql` sur un projet Supabase neuf (il remplace la version 1).
- Hors connexion, les numéros de commande sont temporaires (longs) jusqu'au retour du réseau.
- Pas de paiement en ligne, ni d'abonnement facturé aux restaurants.
- Pensez à tester chaque rôle avec trois comptes avant la mise en service.
