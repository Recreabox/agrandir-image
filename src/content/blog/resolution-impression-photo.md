---
title: "Quelle résolution pour imprimer une photo ? Pixels, DPI et tableau du 10 × 15 au poster"
seoTitle: "Quelle résolution pour imprimer une photo ? (tableau DPI)"
description: "Pixels, DPI, distance de vue : le tableau du 10 × 15 au poster, la formule à retenir et quoi faire quand ta photo est trop petite pour l’impression."
publishedAt: 2026-10-19
updatedAt: 2026-10-19
readingMinutes: 8
author: "L’équipe Coelus"
tool: "/agrandir-image-impression/"
cta:
  text: "Affiches, flyers, brochures : chez Coelus, on les conçoit directement aux bonnes dimensions pour l’imprimeur. C’est le cœur de notre travail d’agence, et ce calculateur gratuit n’en est qu’une petite partie."
  href: "https://coelus.fr/service/graphisme/?utm_source=agrandir-image.fr&utm_medium=referral&utm_campaign=article-resolution-impression-photo"
  label: "Voir l’offre graphisme"
---

Ton labo photo ou ton imprimeur trouve la résolution de ta photo « trop faible » ? Rien de mystérieux : il manque des pixels pour le format demandé. Voici les pixels à viser pour chaque format, la formule pour les recalculer, et que faire quand ta photo est vraiment trop petite.

> **La réponse courte.** Pour un tirage regardé de près, vise 300 pixels par pouce (300 dpi) : un A4 demande alors 2480 × 3508 pixels, un 10 × 15 cm, 1181 × 1772 pixels. Pour une affiche regardée de loin, 150 dpi suffisent en général, soit 1240 × 1754 pixels en A4.

## DPI, PPP, pixels : ce que veulent dire ces mots

Une photo numérique est une grille de pixels : 4032 × 3024, par exemple. À l’écran, seul ce nombre de pixels compte (pour un écran HD ou 4K, vois plutôt la page [augmenter la résolution d’une image](/augmenter-resolution-image/)). Le DPI n’entre en jeu qu’à l’impression : il indique combien de pixels on serre dans un pouce de papier, donc à quelle taille l’image sortira.

### DPI ou PPP : pour un fichier, c’est la même idée

DPI veut dire *dots per inch*, en français PPP, points par pouce. Les puristes distinguent les points de l’imprimante et les pixels du fichier (PPI), mais labos et imprimeurs disent « DPI » pour les deux. Un fichier « à 300 dpi », c’est 300 pixels de l’image pour chaque pouce imprimé, et un pouce mesure 2,54 cm ([NIST](https://www.nist.gov/pml/owm/metric-si/unit-conversion/approximate-conversions-us-customary-measures-metric)).

### La formule à retenir : pixels = (cm ÷ 2,54) × DPI

Pour la largeur d’un A4 à 300 dpi : 21 ÷ 2,54 × 300 ≈ 2480 pixels. Dans l’autre sens, cm = pixels ÷ DPI × 2,54 : une image de 3000 pixels de large sort en 25,4 cm à 300 dpi, ou en 50,8 cm à 150 dpi.

## Le tableau : combien de pixels pour chaque format

Pixels nécessaires à 300 et à 150 dpi, arrondis au pixel. Les formats A suivent la norme [ISO 216](https://www.iso.org/standard/36631.html) (A4 = 210 × 297 mm) ; les autres sont des formats de tirage photo usuels.

| Format | À 300 dpi (px) | À 150 dpi (px) | Mégapixels à 300 dpi |
|---|---|---|---|
| 10 × 15 cm | 1181 × 1772 | 591 × 886 | 2,1 Mpx |
| 13 × 18 cm | 1535 × 2126 | 768 × 1063 | 3,3 Mpx |
| A5 (14,8 × 21 cm) | 1748 × 2480 | 874 × 1240 | 4,3 Mpx |
| A4 (21 × 29,7 cm) | 2480 × 3508 | 1240 × 1754 | 8,7 Mpx |
| 30 × 40 cm | 3543 × 4724 | 1772 × 2362 | 16,7 Mpx |
| A3 (29,7 × 42 cm) | 3508 × 4961 | 1754 × 2480 | 17,4 Mpx |
| 40 × 60 cm | 4724 × 7087 | 2362 × 3543 | 33,5 Mpx |
| A2 (42 × 59,4 cm) | 4961 × 7016 | 2480 × 3508 | 34,8 Mpx |
| 50 × 70 cm | 5906 × 8268 | 2953 × 4134 | 48,8 Mpx |
| A1 (59,4 × 84,1 cm) | 7016 × 9933 | 3508 × 4967 | 69,7 Mpx |
| 60 × 90 cm | 7087 × 10 630 | 3543 × 5315 | 75,3 Mpx |

Ces valeurs supposent une image au même ratio que le papier. Note aussi la dernière colonne : notre outil produit au plus 16 Mpx sur téléphone et 64 Mpx sur ordinateur. Un A3 à 300 dpi demande donc un ordinateur, et l’A1 comme le 60 × 90 dépassent même cette limite.

## 300 dpi, pas toujours : la distance de vue change tout

Les 300 dpi ne sont pas une loi : c’est le seuil à partir duquel, de près, l’œil ne distingue plus les pixels. Plus on s’éloigne, plus ce seuil baisse.

### La règle de l’œil : une minute d’arc

Une vue de 10/10 (6/6 ou 20/20 selon les notations) sépare des détails espacés d’environ une minute d’arc, un soixantième de degré ([Webvision](https://www.webvision.pitt.edu/book/part-viii-psychophysics-of-vision/visual-acuity/)). Un peu de trigonométrie en tire une règle simple : la finesse utile vaut environ 8730 divisé par la distance de vue en centimètres.

- à 30 cm, un tirage tenu en main : environ 290 dpi ;
- à 50 cm, un album ou un cadre sur un bureau : environ 175 dpi ;
- à 1 m, un cadre au mur : environ 87 dpi ;
- à 2 m, une affiche dans un couloir : environ 44 dpi ;
- à 3 m, un kakémono sur un stand : environ 29 dpi.

C’est un repère théorique, qui suppose une vue parfaite et une photo nette, et chaque labo fixe ses propres seuils. Photoweb, par exemple, [déconseille de descendre sous 150 dpi et juge 300 dpi nécessaires pour une impression optimale](https://www.photoweb.fr/espaces/magazine/indicateur-qualite-photo/), mais [conseille 2011 × 1340 pixels pour un tableau PVC de 40 × 60 cm](https://www.photoweb.fr/espaces/magazine/resolution-photo/), soit environ 85 dpi : un tableau se regarde de loin.

### Tirage photo, affiche de salon, kakémono, bâche : exemples

- **Tirage 10 × 15 ou album** : tenu à 30 cm, vise 300 dpi.
- **Affiche A3 ou A2 en vitrine ou sur un salon** : vue à 1 ou 2 m, 150 dpi suffisent ; monte à 200 dpi s’il y a du petit texte.
- **Kakémono ou roll-up** : la règle donne moins de 50 dpi à 2 ou 3 m, mais les visiteurs s’approchent : garde de la marge et suis la valeur de ton imprimeur.
- **Bâche sur une façade** : vue à 5 m ou plus, moins de 20 dpi suffisent.

## « Convertir en 300 dpi » : pourquoi ça ne change rien si tu ne touches pas aux pixels

La valeur DPI d’un fichier n’est qu’une étiquette enregistrée dans ses métadonnées. La modifier ne crée aucun pixel : seule la taille d’impression « par défaut » change.

### 72 → 300 dpi pas à pas : même fichier, autre taille d’impression

Une image de 1500 × 1000 pixels marquée 72 dpi « mesure » 52,9 × 35,3 cm. Passe l’étiquette à 300 dpi : elle mesure 12,7 × 8,5 cm. Mêmes pixels, même netteté. Le labo, lui, compte les pixels : ton 10 × 15 sortira pareil dans les deux cas. Pour un vrai fichier à 300 dpi, il faut plus de pixels : recadrer moins, repartir de l’original plutôt que d’une copie envoyée par messagerie, ou agrandir l’image.

## Ta photo est trop petite : l’agrandir avec l’IA

Un agrandissement classique (bicubique) étire les pixels : l’image grandit mais devient floue. Un modèle de super-résolution de la famille Real-ESRGAN, celui qu’utilise [notre outil pour agrandir une image avant impression](/agrandir-image-impression/), redessine des contours nets et des textures plausibles. Entraîné sur des photos nettes volontairement dégradées (flou, bruit, compression, réduction), il ne « retrouve » pas une information absente : il en propose une version crédible.

Sur cette page, tu choisis l’un des onze formats, du 10 × 15 au 60 × 90, et la qualité d’impression (300, 200 ou 150 dpi). L’outil calcule le facteur nécessaire, affiche la finesse obtenue et l’écrit dans le fichier JPG ou PNG. Le calcul reste dans ton navigateur : la photo n’est envoyée nulle part.

### Jusqu’où aller (×2, ×4) et quoi vérifier

L’outil s’arrête à ×4 par côté, soit 16 fois plus de pixels. Plus le facteur monte, plus la part de détails reconstruits augmente : prends le plus petit facteur qui atteint ta cible, puis regarde le résultat au zoom 100 % avec le comparateur avant/après :

- **les visages** : l’IA peut modifier légèrement un trait ; dans ce cas, repasse à ×2 et compare ;
- **les textes et les logos** : des lettres peuvent se déformer ;
- **les motifs fins** (tissus, grillages) : ils peuvent produire du moiré.

### Quand il vaut mieux renoncer

- **Une vignette de 300 pixels** : même à ×4, tu obtiens 1200 pixels, de quoi faire un 10 × 15 à environ 200 dpi, pas une affiche.
- **Une photo floue** (bougé, mise au point ratée) : l’IA agrandit le flou, elle ne le corrige pas.
- **Un visage minuscule dans une photo de groupe** : il sera réinventé, pas retrouvé.

Cherche alors l’original, ou choisis un format plus petit. Pour un logo, la bonne réponse est souvent un fichier vectoriel : on compare les options dans [agrandir un logo : upscaling IA ou vectorisation](/blog/agrandir-logo-vectoriser/).

## Préparer le fichier pour le labo ou l’imprimeur

1. **Recadre d’abord au ratio du support** (2:3 pour un 10 × 15, 1:1,414 pour les formats A), sinon le labo choisit à ta place ce qui disparaît. Agrandis ensuite.
2. **Exporte en JPG de haute qualité.** Dans l’outil, choisis JPG dans « Format de sortie ».
3. **Reste en sRGB**, sauf consigne contraire : l’outil convertit d’ailleurs les couleurs en sRGB.
4. **Ajoute les fonds perdus si on te les demande**, avant de calculer les pixels.

## Exemple chiffré : une photo de 1200 × 800 px pour un A4

Une photo de 1200 × 800 pixels, récupérée sur un site, à imprimer en A4 paysage et à regarder de près :

1. **La cible** : 3508 × 2480 pixels à 300 dpi.
2. **La finesse actuelle** : 1200 ÷ (29,7 ÷ 2,54) ≈ 103 dpi en largeur, 800 ÷ (21 ÷ 2,54) ≈ 97 dpi en hauteur. Le côté le plus faible l’emporte : environ 97 dpi, trop peu pour un tirage tenu en main.
3. **Le ratio** : photo en 3:2, A4 en 1:1,414. Pour remplir la page, environ 6 % de la largeur part au recadrage.
4. **L’agrandissement** : ×2 donne environ 194 dpi, ×3 environ 290 dpi. Avec le format d’impression A4 et la qualité 300 dpi, l’outil calcule le facteur exact, puis tu vérifies au zoom 100 % avant de commander.

## Questions fréquentes

### Une photo de smartphone suffit-elle pour un A3 ?

Une photo de 12 Mpx (4032 × 3024 pixels) donne environ 244 dpi en A3 : correct pour une affiche, un peu juste pour un tirage regardé à 30 cm. À 300 dpi, elle couvre environ 34 × 26 cm ; à 150 dpi, environ 68 × 51 cm. Pour viser 300 dpi en A3, un facteur d’environ ×1,25 suffit, sur ordinateur, car le résultat dépasse 16 Mpx.

### Faut-il des fonds perdus ?

Seulement si l’image va jusqu’au bord du papier et que l’imprimeur coupe après impression (flyers, cartes, affiches à bords perdus). Les fonds perdus sont une bande d’image au-delà du format fini, qui part à la coupe ; la « zone tranquille » est une marge de sécurité à l’intérieur du format ([Exaprint](https://www.exaprint.fr/conseils-pao/)). Leur largeur figure dans le gabarit de l’imprimeur.

### Quel format de fichier envoyer ?

Pour un tirage photo, un JPG de haute qualité en sRGB. Si l’imprimeur demande un PDF, il attend une mise en page (texte, fonds perdus, traits de coupe) dans laquelle l’image agrandie s’insère.

### Mon imprimeur demande du CMJN : que faire ?

Notre outil enregistre en sRGB, le profil des écrans. Pour passer en CMJN, il faut un logiciel qui gère ce mode et le profil fourni par l’imprimeur, à moins qu’il ne fasse la conversion lui-même : pose-lui la question. Convertis en dernier, après l’agrandissement.

### Et si je n’ai pas le temps ?

Préparer des visuels pour l’impression, c’est le quotidien de Coelus, l’agence web de Montpellier qui édite agrandir-image.fr : affiches, flyers et brochures conçus dès le départ aux bonnes dimensions. On ne va pas te le cacher, ce calculateur gratuit n’est qu’un petit bout de ce qu’on fait pour nos clients, et il nous sert aussi à nous faire connaître. Si tu as un salon ou une campagne à préparer, [parlons-en](https://coelus.fr/service/graphisme/?utm_source=agrandir-image.fr&utm_medium=referral&utm_campaign=article-resolution-impression-photo).
