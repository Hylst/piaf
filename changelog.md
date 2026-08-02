# Changelog de Piaf

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnage
[SemVer](https://semver.org/lang/fr/).

## [1.1.0] 2026-08-02

### Ajouté
- Lien « ℹ️ Comment ce jeu a été fait » (écran de menu) ouvrant une modale avec la stack,
  les graphismes, la musique, les interactions, l'architecture et les algorithmes notables
  (resserrement progressif de l'écart entre tuyaux, thèmes à débloquer). Étape 15 du
  chantier de retrofit décrit dans `todo.md` racine du monorepo.

### Vérifié
- Build propre (après réinstallation de `node_modules`, absent au début de cette session),
  modale testée à l'ouverture/fermeture, aucune erreur console, aucun débordement
  horizontal en 390×844.

## [1.0.0] 2026-08-01

Première version intégrable à Hylst.Games, partie d'un export brut audité puis corrigé.

### Ajouté
- Bloc SEO complet dans `index.html` (description, keywords, og, twitter, robots,
  canonical) et `lang="fr"`
- `favicon.png` 32×32, `og-image.png` 1024×576 (capture réelle du jeu) et sa variante
  `og-image.webp`, `icon.webp` 128×128 pour la carte du menu
- `base: '/piaf/'` dans `vite.config.ts`
- La doc : `about.md`, `README.md`, `structure.md`, `features.md`, `todo.md`,
  `changelog.md`

### Modifié
- Renommé en **Piaf**. « Flappy Bird » est une marque déposée ; le nom original reste
  uniquement dans les `keywords` SEO.
- `package.json` : `react-vite-tailwind` v0.0.0 devenu `piaf` v0.0.0
- Clés `localStorage` renommées de `fb-*` vers `piaf-*` (`piaf-high`, `piaf-coins`,
  `piaf-themes`)

### Corrigé
- **L'écran « Prêt à voler » annonçait un thème qui n'était pas celui réellement joué.**
  Le tirage aléatoire du thème n'avait lieu qu'au tout début de `startGame`, jamais à
  l'entrée sur l'écran idle qui précède. Extrait dans une fonction `pickTheme()` appelée à
  l'entrée en idle (aperçu honnête) et, séparément, au redémarrage direct depuis le game
  over (qui saute l'écran idle). Vérifié sur l'application réelle : le thème annoncé
  correspond au ciel effectivement affiché dès la première frame de jeu.

### Vérifié
- Génération procédurale des tuyaux martelée sur 120 300 tirages simulés (3 modes, 5
  hauteurs de canvas, scores 0 à 400) : aucune configuration hors limites.
- QA Playwright avec pilotage automatique lisant l'état réel du jeu : score passé de 0 à 4
  en franchissant des tuyaux, 2 pièces ramassées, mort par collision avec un tuyau
  provoquée et observée (pas seulement collision au sol), overlay de fin de partie et
  `localStorage` corrects.
