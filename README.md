# Piaf

**Ça vole pas haut. Un oiseau, des tuyaux, un bouton.**

Joue ici : [games.hylst.fr/piaf/](https://games.hylst.fr/piaf/)

![Piaf](og-image.png)

## Comment on joue

L'oiseau tombe en continu, un appui le fait remonter d'un battement d'aile. Il faut
enchaîner les tuyaux sans les toucher : chaque tuyau franchi rapporte un point. Des pièces
flottent parfois au milieu du trou (bonus de score), et des power-ups plus rares donnent
un aimant à pièces, un ralenti, ou un bouclier temporaire qui laisse traverser les tuyaux.

Cumuler score + pièces sur une partie débloque progressivement de nouveaux thèmes visuels
(aube, jour, crépuscule, nuit, automne, arc-en-ciel), chacun avec sa propre météo.

## Contrôles

| Action | Effet |
|--------|-------|
| Espace / Flèche haut / W | Battre des ailes |
| Clic / tap sur l'écran de jeu | Battre des ailes |
| F | Plein écran |
| M | Couper / activer le son |

## Ce qu'il y a dedans

- 3 modes de difficulté (Facile / Normal / Expert), difficulté progressive par paliers
- 6 thèmes visuels à débloquer, avec transition fluide entre eux et météo dédiée (pluie,
  neige, feuilles)
- Pièces à collectionner, 3 power-ups temporaires (aimant, ralenti, bouclier)
- Traînée de vol, particules, tremblement d'écran à l'impact
- Musique et effets sonores synthétisés en Web Audio
- Mode plein écran, jouable au clavier, à la souris ou au tactile

## L'arborescence

```
piaf-game-development/
├── index.html          # template + bloc SEO
├── vite.config.ts      # base '/piaf/' + singlefile
├── public/
│   ├── favicon.png
│   ├── og-image.png / og-image.webp
│   └── icon.webp        # carte du menu, 128x128
└── src/
    ├── main.tsx
    ├── App.tsx           # tout le jeu : état, boucle, rendu Canvas
    └── utils/cn.ts
```

## Dev

```bash
npm install
npm run dev       # http://localhost:5173/piaf/
npm run build     # dist/index.html, un seul fichier
npm run preview
```

## Stack

React 19, TypeScript 5.9 (strict), Tailwind CSS 4, Vite 7, vite-plugin-singlefile.

Zéro sprite : tout est dessiné en Canvas 2D, les sons sont synthétisés au vol.

## Licence

AGPL-3.0-or-later, Geoffroy Streit (Hylst). Voir `LICENSE`.
