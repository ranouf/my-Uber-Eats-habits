# Version de l'extension

Chaque modification livrée dans ce dépôt doit augmenter la version de l'extension avant son enregistrement sur GitHub.

Exécuter `npm run version:bump` une fois par livraison. Cette commande incrémente le correctif et synchronise `package.json`, `package-lock.json` et `manifest.json`.

Utiliser `npm version minor --no-git-tag-version` ou `npm version major --no-git-tag-version` si la portée du changement le justifie. Le même script de synchronisation s'exécute automatiquement.

L'interface doit lire la version depuis `chrome.runtime.getManifest().version` et l'afficher dans le bouton flottant et l'en-tête du panneau.

Avant la livraison, exécuter `npm run version:check`, les contrôles de format et les tests, puis analyser les captures des interfaces modifiées.
