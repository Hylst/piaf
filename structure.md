# Structure de Piaf

## Arborescence

```
piaf-game-development/
├── index.html              # template Vite + bloc SEO (lang=fr)
├── package.json            # piaf v0.0.0
├── vite.config.ts          # base '/piaf/', react + tailwind + singlefile
├── tsconfig.json
├── .gitignore                 # deps, secrets, fichiers d'agents IA
├── about.md / README.md / structure.md / features.md / todo.md / changelog.md
├── public/
│   ├── favicon.png
│   ├── og-image.png / og-image.webp
│   └── icon.webp             # carte du menu, 128x128
└── src/
    ├── main.tsx
    ├── index.css
    ├── App.tsx                # composant unique : constantes, thèmes, état, boucle, rendu
    └── utils/cn.ts
```

## `App.tsx`, de haut en bas

Le jeu tient dans un seul composant, structure typique de ces exports : pas de séparation
fichier par fichier entre logique et rendu, mais le code interne SÉPARE bien les deux via
des refs (`birdY`, `pipes`, `scoreR`...) pour la boucle de jeu chaude, et du state React
(`score`, `coins`, `gameState`...) uniquement pour ce qui doit re-rendre l'UI.

- **Constantes physiques** (`GRAVITY`, `MAX_FALL`, `BIRD_SIZE`...) et **thèmes** (`THEMES`,
  6 palettes avec météo associée)
- **`AudioController`** : musique et bruitages synthétisés en Web Audio, pas de fichier son
- **`genScenery`** : décor (montagnes, collines, arbres) généré une fois via un PRNG
  déterministe (seed fixe), pas à chaque frame
- **Refs de la boucle chaude** : position/vitesse de l'oiseau, liste des tuyaux,
  particules, défilement du décor sur 3 couches (parallaxe)
- **`pickTheme`** : tire un thème débloqué au hasard. Appelée à l'entrée en "idle" (menu →
  choix de difficulté) pour que l'aperçu affiché colle à ce qui va vraiment se jouer, et de
  nouveau dans `startGame` si on relance direct depuis le game over (qui saute l'écran
  idle) — voir le bug corrigé dans `todo.md`
- **`resetGame` / `startGame` / `endGame`** : cycle de vie d'une partie
- **`gameLoop`** : tout le pas de simulation (gravité, tuyaux, collisions, particules) puis
  tout le dessin Canvas, rappelée en boucle par `requestAnimationFrame`
- **Contrôles** : clavier (Espace/↑/W, F, M), pointer (tap/clic sur le canvas)
- **Rendu JSX** : écran menu, HUD, canvas, overlays idle/game over

## Collisions

Un tuyau est un simple rectangle haut + rectangle bas séparés par un trou
(`topH` → `topH + gap`). Le test de collision compare la boîte de l'oiseau à ces deux
bornes verticales quand son `x` chevauche la largeur du tuyau — les mêmes bornes que
celles utilisées pour dessiner les tuyaux (`drawPipe`), donc pas de décalage visuel/hitbox.
Un court délai de grâce (500 ms) ignore les collisions au tout début d'une partie, et le
bouclier (power-up) les ignore aussi tant qu'il est actif.

## Build

`vite-plugin-singlefile` inline le JS et le CSS dans `index.html` (~252 Ko). Le `dist/`
contient en plus `favicon.png`, `og-image.png/webp` et `icon.webp` copiés depuis `public/`.
`base: '/piaf/'` fait résoudre ces assets sous `https://games.hylst.fr/piaf/`.
