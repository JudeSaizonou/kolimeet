# Polices pour la génération d'images OG

Pour que la génération d'images OG fonctionne en local, vous devez placer un fichier de police TTF dans ce dossier.

## Téléchargement de la police Inter

1. Allez sur https://fonts.google.com/specimen/Inter
2. Cliquez sur "Download family"
3. Extrayez le fichier `Inter-Regular.ttf` 
4. Placez-le dans ce dossier sous le nom `Inter-Regular.ttf`

Ou utilisez cette commande (si curl fonctionne avec les redirections GitHub) :

```bash
curl -L "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.ttf" -o Inter-Regular.ttf
```

**Note** : En production sur Vercel, les images OG sont générées automatiquement sans nécessiter de police locale.

