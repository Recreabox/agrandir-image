---
title: "Taille des photos produits : les bonnes dimensions pour WooCommerce, Shopify et PrestaShop"
seoTitle: "Taille photo produit : WooCommerce, Shopify, PrestaShop"
description: "Les bonnes dimensions pour tes photos produits sur WooCommerce, Shopify, PrestaShop et Etsy, et comment rattraper des photos trop petites sans tromper."
publishedAt: 2026-10-19
updatedAt: 2026-10-19
readingMinutes: 8
author: "L’équipe Coelus"
tool: "/ameliorer-qualite-image/"
cta:
  text: "Quand le catalogue compte des centaines de fiches, mieux vaut une méthode qu’un rattrapage photo par photo. Créer et optimiser des boutiques WooCommerce et Shopify, c’est le travail de Coelus au quotidien : cet outil gratuit vient de là."
  href: "https://coelus.fr/service/site-e-commerce/?utm_source=agrandir-image.fr&utm_medium=referral&utm_campaign=article-taille-photo-produit-ecommerce"
  label: "Découvrir l’offre e-commerce"
---

Ton fournisseur t’envoie des visuels de 500 pixels de côté. Sur ta fiche produit, le zoom n’affiche qu’une bouillie de pixels, la photo paraît molle sur un téléphone récent, et l’ensemble « ne fait pas pro ». Ce guide rassemble les dimensions données par les documentations officielles de WooCommerce, Shopify, PrestaShop et Etsy, une règle simple pour s’y retrouver, et la façon de rattraper des photos trop petites sans trahir le produit.

## Pourquoi la taille des photos produits compte

En magasin, le client touche le produit. En ligne, il zoome. Une photo trop petite pose trois problèmes :

- **le zoom ne sert à rien** : la visionneuse agrandit une image qui n’a pas les détails nécessaires ;
- **les écrans haute densité** (téléphones, écrans de type Retina) dessinent chaque pixel CSS avec plusieurs pixels physiques ([MDN](https://developer.mozilla.org/fr/docs/Web/API/Window/devicePixelRatio)) : une image tout juste à la taille d’affichage y paraît floue ;
- **la confiance** : une photo floue fait douter du sérieux de la boutique, parfois du produit lui-même.

Si tes produits partent aussi dans Google Shopping, s’ajoute une contrainte : à partir du 31 janvier 2027, Google Merchant Center exigera au moins 500 × 500 pixels pour toutes les images produit, et recommande environ 1500 × 1500 pixels ou plus ([aide Google Merchant Center](https://support.google.com/merchants/answer/6324350?hl=fr)). Les DPI, eux, ne changent rien à l’affichage : à l’écran, seuls les pixels comptent, comme on l’explique dans [notre guide de la résolution d’impression](/blog/resolution-impression-photo/).

## WooCommerce : les tailles d’images expliquées

### Les quatre tailles (single, thumbnail, gallery thumbnail, full)

WooCommerce déclare trois tailles d’images, auxquelles s’ajoute l’original ([documentation WooCommerce](https://developer.woocommerce.com/docs/theming/theme-development/image-sizes)) :

- **woocommerce_single**, la grande image de la fiche produit : 600 px de large par défaut, jamais recadrée ;
- **woocommerce_thumbnail**, la vignette des grilles (boutique, catégories) : 300 px de large, recadrée en carré par défaut ;
- **woocommerce_gallery_thumbnail**, les petites vignettes sous l’image principale : 100 × 100 px, toujours carrées ;
- **full**, la taille d’origine enregistrée par WordPress : c’est elle qu’utilisent le zoom et la visionneuse plein écran.

Ce sont des valeurs par défaut : depuis WooCommerce 3.3, un thème peut imposer ses propres largeurs, et le CSS décide de la taille réellement affichée. Retiens surtout la dernière ligne : la netteté du zoom dépend de l’image que tu importes.

Une précision utile : par défaut, WordPress réduit à 2560 px toute image dont la largeur ou la hauteur dépasse ce seuil, et c’est cette version réduite qui devient la plus grande taille disponible ([note de version de WordPress 5.3](https://make.wordpress.org/core/2019/10/09/introducing-handling-of-big-images-in-wordpress-5-3/)). Importer du 5000 px n’apporte donc rien au zoom.

### Régler le recadrage des miniatures dans l’outil de personnalisation

Dans l’outil de personnalisation (Apparence › Personnaliser › WooCommerce), la rubrique des images produit propose trois recadrages pour les miniatures : 1:1 (carré), personnalisé (le ratio de ton choix) ou non recadré. Si ton thème impose ses largeurs, seule l’option de recadrage reste visible. Après un changement, les miniatures doivent être régénérées pour que tes clients voient la différence.

## Shopify : 2048 × 2048 px, et les limites (5000 px, 25 Mpx, 20 Mo)

Shopify accepte des images produit jusqu’à 5000 × 5000 px ou 25 mégapixels, pour un fichier de moins de 20 Mo, et indique qu’une image carrée de 2048 × 2048 px est en général celle qui s’affiche le mieux ([aide Shopify](https://help.shopify.com/en/manual/products/product-media/product-media-types)). Il crée lui-même les déclinaisons pour chaque emplacement du thème et sert à chaque navigateur le format le plus adapté. Son conseil le plus utile est ailleurs : garde le même ratio pour toutes tes images principales, sinon les vignettes d’une page de collection n’auront pas la même taille.

## PrestaShop et Etsy : ce que disent leurs documentations

**PrestaShop** génère toutes les tailles à partir d’une image « maître » que tu importes : elle doit être assez grande et avoir le même ratio que les tailles définies par le thème, sinon des bandes blanches apparaissent ([documentation PrestaShop](https://docs.prestashop-project.org/v.9-documentation/user-guide/improving-shop/customizing-store-design/image-settings)). Avec le thème Classic, la plus grande taille produit, large_default, fait 800 × 800 px ([configuration du thème](https://github.com/PrestaShop/classic-theme/blob/develop/config/theme.yml)). Une option du back-office génère aussi des images haute résolution, deux fois plus grandes, pour les écrans de type Retina : un carré de 1600 px couvre donc les deux cas.

**Etsy** conseille des photos d’au moins 2000 pixels de largeur et de hauteur ; la première doit faire au moins 635 pixels de largeur et de hauteur, sinon la fiche risque d’apparaître plus bas dans les résultats ([aide Etsy](https://help.etsy.com/hc/fr/articles/115015663347)). Cette première photo doit être horizontale ou carrée, avec assez de marge autour du produit pour supporter les recadrages en vignette ; Etsy recommande même d’éviter les recadrages carrés. Deux pièges : un fichier de plus de 1 Mo peut échouer sur une connexion lente, et la transparence d’un PNG s’affiche en noir.

## Notre règle simple : un carré d’environ 2000 px

Les chiffres convergent. Chez Coelus, pour une boutique WooCommerce ou Shopify, on part de cette règle, qui est une recommandation et pas une norme :

- **un carré d’environ 2000 px** (2048 × 2048 pour coller à Shopify) : assez pour le zoom et les écrans haute densité, sous le seuil de 2560 px de WordPress, au-dessus des 1500 px conseillés par Google ;
- **un fond homogène** d’une photo à l’autre ;
- **le même ratio pour tout le catalogue**, pour des grilles alignées ;
- **un produit bien cadré** : Google recommande qu’il occupe entre 75 et 90 % de l’image ([aide Google Merchant Center](https://support.google.com/merchants/answer/12159030?hl=fr)), Amazon 85 % pour l’image principale ([guide Amazon des images produits](https://sellercentral.amazon.fr/help/hub/reference/external/G1881)).

Ton thème peut demander autre chose : vérifie ses réglages. Si tu vends aussi sur Etsy, prévois une version horizontale de la première photo.

## Photos fournisseur trop petites : les agrandir avec l’IA sans tromper le client

Un visuel de 500 × 500 px agrandi ×4 donne 2000 × 2000 px. Avec [l’outil pour améliorer la qualité d’une image](/ameliorer-qualite-image/), le type d’image Photo ne se contente pas d’étirer les pixels : il redessine des contours nets et atténue les artefacts de compression. Le calcul se fait dans ton navigateur, par lots de 20 images au plus, avec un export ZIP. Pour viser une taille précise (2048 px, par exemple), l’option « Taille voulue » part directement du plus grand côté voulu, sur la page [augmenter la résolution d’une image](/augmenter-resolution-image/).

### Le bon ordre : agrandir, recadrer, compresser, renommer

1. **Agrandir** : ×2 ou ×4 selon la taille de départ, type d’image Photo (« Dessin ou logo » pour un visuel à aplats). Si tu dois encore recadrer, exporte en PNG pour ne pas compresser deux fois.
2. **Recadrer** au ratio du catalogue, dans l’éditeur d’images de WordPress ou de Shopify, ou dans ton logiciel habituel.
3. **Compresser** : en WebP ou en JPG sur WooCommerce et Shopify, en JPG sur PrestaShop et Etsy. Une qualité entre 80 et 90 est un bon point de départ ; PrestaShop déconseille de descendre sous 80 en JPG.
4. **Renommer** avec des mots qui décrivent le produit : sac-cuir-cognac-face.webp plutôt que DSC_0042.jpg.

### À vérifier image par image : étiquettes, logos, textes, motifs

L’IA invente des détails plausibles, et sur une photo produit, c’est précisément là qu’est le risque. Vérifie au zoom 100 % avec le comparateur avant/après :

- **les étiquettes, logos et textes** imprimés sur le produit, que l’IA peut déformer ;
- **les motifs fins** (mailles, tressages, rayures), qui peuvent produire du moiré ;
- **les matières** : une texture peut changer d’aspect, le grain d’un cuir ou une surface brossée par exemple.

Une photo produit doit montrer le produit livré. Amazon le dit noir sur blanc : l’image principale doit représenter l’échelle, la quantité et la couleur réelles du produit, et il ne faut pas agrandir artificiellement les petites images ([guide Amazon](https://sellercentral.amazon.fr/help/hub/reference/external/G1881)). Google Merchant Center demande lui aussi d’éviter les vignettes et les images redimensionnées. Sur ces canaux, une photo trop petite appelle une nouvelle photo. Sur ta propre boutique, un agrandissement soigné peut dépanner, à condition de rester fidèle au produit.

### Quand refaire un shooting

Si les photos sont floues, mal éclairées, ou si le fournisseur ne livre que des vignettes de 200 ou 300 px, l’agrandissement ne suffira pas : l’IA agrandit le flou, elle ne le corrige pas. Et si tu refais des photos, choisis un parti pris. Chez Coelus, on préfère les photos en situation ou en studio sur fond sombre, qui montrent l’usage et la matière, à l’objet isolé sur fond blanc. C’est un choix de marque, à garder sur tout le catalogue.

## Exemple chiffré : 40 visuels fournisseur de 500 px

Imaginons une boutique WooCommerce de 40 produits dont le fournisseur ne livre que des visuels carrés de 500 × 500 px.

1. **Deux lots de 20 images** dans l’outil, type Photo, ×4 : chaque visuel passe à 2000 × 2000 px.
2. **Export direct en WebP** : le carré convient déjà au ratio du catalogue, pas de recadrage, donc pas de double compression.
3. **Contrôle au zoom 100 %** : les produits portant une étiquette lisible sont comparés un par un à l’original ; si un texte a bougé, on garde l’original ou on demande une meilleure photo au fournisseur.
4. **Renommage et import** : la fiche utilise la taille de 600 px par défaut, et le zoom dispose de 2000 px.

## Questions fréquentes

### JPEG, WebP ou PNG pour les photos produits ?

Ça dépend de la plateforme. Sur WooCommerce, le WebP est accepté depuis WordPress 5.8, si ton hébergement le gère ([annonce WordPress](https://make.wordpress.org/core/2021/06/07/wordpress-5-8-adds-webp-support/)). Shopify conseille le PNG puis le JPEG, et convertit lui-même pour chaque navigateur. PrestaShop et Amazon recommandent le JPEG, et Etsy n’accepte que le JPG, le GIF, le PNG, le SVG et le HEIC. Le PNG reste utile pour un visuel avec transparence, sauf sur Etsy.

### Le fond blanc est-il obligatoire ?

Sur Amazon, oui pour l’image principale : un fond uniquement blanc, aux valeurs RVB 255, 255, 255. Sur ta propre boutique, c’est un choix de marque : un fond homogène sur tout le catalogue compte plus que sa couleur.

### Combien de photos par produit ?

Il n’y a pas de chiffre magique. Pense aux questions qu’un client poserait en magasin : à quoi ressemble l’arrière, la matière de près, la taille réelle (porté ou en situation), les variantes de couleur. Une photo par question, c’est une bonne base.

### Des images lourdes ralentissent-elles la boutique ?

Oui : chaque image est téléchargée par le visiteur. WooCommerce, Shopify et PrestaShop créent des déclinaisons plus légères pour les grilles et les miniatures, mais la grande image et le zoom restent lourds si l’original l’est. Compresse avant l’import, et ne dépasse pas ce dont le zoom a besoin : entre 2000 et 2560 px sur WooCommerce.

### Et si je n’ai pas le temps ?

Agrandir des photos une par une reste un pansement quand le catalogue compte des centaines de fiches. Créer et optimiser des boutiques WooCommerce et Shopify (photos, fiches produits, vitesse, référencement), c’est précisément le travail de Coelus, l’agence montpelliéraine derrière agrandir-image.fr. L’outil gratuit est né de ce travail et il nous fait connaître ; la remise à plat d’un catalogue entier, c’est ce qu’on vend. [Parlons de ta boutique](https://coelus.fr/service/site-e-commerce/?utm_source=agrandir-image.fr&utm_medium=referral&utm_campaign=article-taille-photo-produit-ecommerce).
