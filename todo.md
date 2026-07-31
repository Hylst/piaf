# TODO de Piaf

Audit fait le 2026-08-01 sur l'export brut (`build-flappy-bird-game (1)`), suivi d'un
stress-test numérique de la génération des tuyaux et d'une passe QA navigateur (Playwright
+ Chromium) avec vérification réelle de la mécanique centrale (vol, score, collision).

---

## ✅ Corrigé — incohérence

- [x] **L'écran « Prêt à voler » annonçait un thème qui n'était pas forcément celui qui
  allait vraiment être joué.** Le thème était tiré au hasard uniquement dans `startGame`,
  déclenché seulement quand on quitte l'écran idle pour de vrai. Résultat : la première
  fois, l'écran idle affichait toujours « Thème : Aube » (valeur par défaut de la ref,
  jamais mise à jour avant le premier lancement) quel que soit le thème réellement tiré au
  moment de battre des ailes ; après une partie, il affichait le thème de la partie
  précédente au lieu d'un aperçu de la suivante. Un libellé qui ne correspond pas au
  comportement réel, catégorie explicitement à traquer pendant l'audit. Corrigé en extrayant
  le tirage dans `pickTheme()`, appelée à l'entrée en idle (sélection de difficulté, clic
  ou raccourci clavier) pour que l'aperçu soit honnête, et encore une fois dans `startGame`
  uniquement si on relance direct depuis le game over (qui saute l'écran idle et doit donc
  quand même varier le thème à chaque partie). **Vérifié sur l'application réelle** :
  écran idle affichant « Thème : Jour ☀️ », partie lancée, ciel bleu jour effectivement
  utilisé dès la première frame de jeu.

## ✅ Vérification de la génération procédurale

- [x] `getDifficulty` + le tirage de `topH` extraits dans un script Node, martelés sur
  120 300 tuyaux simulés (3 modes × 5 hauteurs de canvas de 500 à 800 px × scores 0 à 400
  × 20 tirages) : **0 échec**. Aucun trou plus petit que l'oiseau, aucun tuyau dépassant le
  sol ou le haut du canvas, aucune plage de tirage vide.

## ✅ La passe QA navigateur

- [x] 0 erreur console, 0 exception non gérée
- [x] Écran menu, sélection de difficulté, écran « Prêt à voler », HUD en jeu, overlay
  « Perdu »
- [x] **Mécanique de score observée réellement** : pilotage automatique visant le centre du
  trou du prochain tuyau (lu en direct depuis l'état du jeu), score passé de 0 à 4 en
  franchissant 4 tuyaux d'affilée, HUD à jour à chaque tuyau
- [x] **Pièce ramassée et comptée** (2 pièces collectées pendant le vol contrôlé)
- [x] **Mort par collision avec un tuyau observée**, pas seulement collision avec le sol :
  pilotage délibérément dirigé sous le trou pour percuter le tuyau du bas, `gameover`
  déclenché, overlay affichant Score 4 / Pièces 2 / Niveau 1 / Record 4 avec le badge
  « Nouveau record »
- [x] Relance directe depuis le game over vérifiée : score remis à 0, nouvelle partie
  démarrée
- [x] `localStorage` vérifié après partie : `piaf-high` = 4, `piaf-coins` = 2
- [x] Aucun débordement horizontal en 390×844

### Méthode de vérification

Instrumentation temporaire : un `window.__qa` exposé en fin de boucle de jeu (score,
pièces, état, position de l'oiseau, liste des tuyaux avec leurs coordonnées), lue en
continu par le script Playwright pour piloter l'oiseau vers le centre du trou (score) puis
délibérément vers le tuyau du bas (collision), plutôt que de deviner au clavier à
l'aveugle. Retirée avant le commit ; le build final ne contient aucune trace de
l'instrumentation (hash de bundle identique avant/après son ajout puis son retrait).

---

## ⬜ Idées d'amélioration (non corrigées, notes d'audit)

- [ ] `AudioController.score()` / `.milestone()` / `.coin()` / `.powerUp()` utilisent des
  `setTimeout` non annulés pour enchaîner les notes. Si le composant se démonte pile
  pendant l'un de ces courts enchaînements (quelques dizaines de ms), la note en attente
  joue quand même. Sans effet observable en pratique (fenêtre de quelques dizaines de ms,
  aucun état React touché), pas corrigé.
- [ ] Le bouclier laisse rebondir sur le sol au lieu d'y mettre fin à la partie (`birdVel`
  remis à `FLAP_VELOCITY` au contact du sol si bouclier actif), alors qu'il ne protège
  normalement que des tuyaux. Comportement voulu ou effet de bord non documenté nulle
  part dans le jeu : pas tranché, laissé tel quel.
