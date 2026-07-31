# Fonctionnalités de Piaf

## Gameplay

- ✅ Boucle infinie classique : battre des ailes pour rester en vol, franchir les tuyaux
- ✅ 3 modes de difficulté (Facile / Normal / Expert), vitesse/écart des tuyaux et
  progression par score propres à chacun
- ✅ Score au tuyau franchi, palier « Niveau » tous les 10 points
- ✅ Pièces à ramasser (bonus de score), record de pièces séparé du record de score
- ✅ 3 power-ups temporaires : aimant (rayon de ramassage élargi), ralenti (défilement
  réduit), bouclier (traverse les tuyaux sans mourir)
- ✅ 6 thèmes visuels à débloquer en cumulant score + pièces sur une partie (un seul thème
  débloqué par partie, au maximum), avec transition fluide et météo dédiée par thème
  (pluie, neige, feuilles)
- ✅ **Aperçu du thème sur l'écran « Prêt à voler » fiable** : le thème annoncé est
  désormais celui qui sera vraiment utilisé (bug corrigé, voir todo.md)
- ✅ Record de score et de pièces sauvegardés (localStorage)

## Interface

- ✅ Écran menu avec sélection de difficulté et progression des thèmes débloqués
- ✅ HUD en jeu (score, pièces, niveau, power-up actif avec minuteur)
- ✅ Overlays « Prêt à voler » et « Perdu » avec statistiques de fin de partie
- ✅ Mode plein écran, jouable au clavier, à la souris ou au tactile
- ✅ Aucun débordement horizontal en 390×844

## Audio

- ✅ Musique de fond et effets sonores (battement d'aile, score, pièce, power-up, palier,
  crash) synthétisés en Web Audio
- ✅ Coupure du son au clic ou à la touche M

## Technique

- ✅ Build en un seul fichier (~252 Ko), fonctionne hors ligne
- ✅ TypeScript strict
- ✅ Génération des tuyaux vérifiée par simulation (120 300 tuyaux testés sur les 3 modes,
  hauteurs de canvas 500 à 800 px, scores 0 à 400) : aucune configuration hors canvas ni
  trou plus petit que l'oiseau
- ✅ Bloc SEO complet, favicon, og-image (capture réelle du jeu)
- ⬜ Pas de tests automatisés embarqués
