---
title: "Agrandir une image avec l’IA sans l’envoyer dans le cloud : Upscayl, HiPixel ou navigateur ?"
seoTitle: "Agrandir une image avec l’IA sans cloud : Upscayl, HiPixel…"
description: "Upscayl, HiPixel ou navigateur : trois façons d’agrandir une image avec l’IA sans l’envoyer sur un serveur. Comparatif, limites et cas d’usage."
publishedAt: 2026-10-19
updatedAt: 2026-10-19
readingMinutes: 7
author: "L’équipe Coelus"
tool: "/upscale-image/"
cta:
  text: "Sites WordPress, boutiques WooCommerce, référencement, design : c’est le travail de Coelus, l’agence montpelliéraine qui développe agrandir-image.fr, et cet outil gratuit sert aussi à nous faire connaître. Si tu as un projet, écris-nous."
  href: "https://coelus.fr/contact/?utm_source=agrandir-image.fr&utm_medium=referral&utm_campaign=article-agrandir-image-ia-sans-cloud"
  label: "Écrire à Coelus"
---

Quand tu glisses une photo dans un upscaler en ligne, elle part sur un serveur : elle y est calculée, conservée au moins le temps du traitement, puis renvoyée. Pour un paysage de vacances, ce n’est pas un drame. Pour la photo d’un client, un document scanné ou le visuel d’un produit pas encore lancé, la question mérite d’être posée. Bonne nouvelle : les modèles d’IA qui font ce travail sont open source et tournent sur un ordinateur, et même sur un téléphone. Voici trois façons de s’en servir sans rien envoyer.

## Ce qui se passe avec un upscaler en ligne

Le principe est toujours le même : tu envoies l’image, les serveurs du service font le calcul, tu télécharges le résultat. Ce calcul a un coût, d’où les comptes, les crédits et les abonnements. Même Upscayl, connu pour son application gratuite, propose désormais une offre en ligne, Upscayl Cloud, vendue par crédits mensuels ([tarifs d’Upscayl Cloud](https://upscayl.org/pricing)).

Avant d’envoyer des images sensibles à un service, cherche trois réponses dans ses conditions d’utilisation et sa politique de confidentialité :

- **la durée de conservation** : l’image est-elle effacée après le traitement, au bout de quelques heures, ou gardée dans un historique ?
- **la réutilisation** : le service se réserve-t-il le droit d’utiliser tes images, par exemple pour améliorer ou entraîner ses modèles ?
- **la localisation** : où sont les serveurs, et quels prestataires y ont accès ?

Chaque service a ses règles, et elles évoluent : la seule façon de savoir, c’est de les lire.

## Photos de personnes, documents clients : pourquoi le local simplifie tout

Pour la CNIL, une personne peut être identifiée indirectement, notamment par sa voix ou son image : une photo où l’on reconnaît quelqu’un est donc une donnée personnelle ([définition de la CNIL](https://www.cnil.fr/fr/definition/donnee-personnelle)). Si tu es photographe, graphiste, ou que tu gères les images d’un client, envoyer ces photos à un service en ligne revient à confier des données personnelles à un tiers, avec les questions qui vont avec : contrat, durée de conservation, lieu de stockage.

Quand le calcul se fait sur ton appareil, la question du prestataire ne se pose pas : l’image ne quitte pas ta machine.

## Les modèles open source qui ont tout changé : Real-ESRGAN et ses dérivés

En 2021, des chercheurs du Tencent ARC Lab et de l’Institut de technologie avancée de Shenzhen (Académie chinoise des sciences) publient Real-ESRGAN ([article de recherche](https://arxiv.org/abs/2107.10833)). Leur idée : entraîner le réseau sur des photos nettes volontairement abîmées (flou, bruit, compression JPEG, réduction), pour qu’il apprenne à réparer ces dégâts sur de vraies images. Le code et les modèles sont publiés sous licence BSD-3-Clause ([dépôt Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN)), qui autorise leur réutilisation, y compris commerciale, à condition de conserver la mention des auteurs.

Plusieurs variantes ont suivi : RealESRGAN_x4plus pour les photos, une version pour l’anime et l’illustration, de petits modèles rapides comme realesr-general-x4v3. Autour d’eux sont nées des interfaces graphiques, dont Upscayl, et une version portable qui tourne sur les cartes graphiques Intel, AMD et Nvidia via Vulkan. Les trois outils qui suivent utilisent cette famille de modèles.

## Option 1 : Upscayl (Windows, macOS, Linux)

[Upscayl](https://github.com/upscayl/upscayl) est une application de bureau gratuite et open source (licence AGPLv3), bâtie sur Real-ESRGAN. Elle s’installe sur Windows 10 ou plus récent, macOS 12 ou plus récent et la plupart des distributions Linux. Elle traite les images par lots et accepte des modèles supplémentaires.

- **Atouts** : calcul local, pas de compte, gros lots, choix de modèles.
- **Limites** : il faut l’installer et disposer d’une carte graphique compatible Vulkan ; l’équipe prévient elle-même que beaucoup de puces graphiques intégrées ne fonctionnent pas. Et, comme le dit sa FAQ, Upscayl ne corrige ni le flou ni une mise au point ratée.

L’offre Upscayl Cloud, elle, est un service en ligne : ce qui précède concerne l’application de bureau.

## Option 2 : HiPixel sur Mac

[HiPixel](https://github.com/okooo5km/hipixel) est une application Mac native, gratuite et open source (AGPLv3), qui reprend les modèles et le moteur d’Upscayl dans une interface plus simple. Il faut macOS 13 (Ventura) ou plus récent. Tu glisses les images, elles sont traitées aussitôt ; HiPixel sait aussi surveiller un dossier pour traiter chaque nouvelle image, ou s’intégrer à l’app Raccourcis d’Apple. Au premier lancement, il télécharge son moteur et ses modèles ; ensuite, tout se passe sur le Mac. On l’a présenté en détail sur le blog de Coelus : [HiPixel, améliorer la qualité de ses images sur Mac grâce à l’IA](https://coelus.fr/hipixel-ameliorer-la-qualite-de-ses-images-sur-mac-grace-a-lia/?utm_source=agrandir-image.fr&utm_medium=referral&utm_campaign=article-agrandir-image-ia-sans-cloud).

- **Atouts** : intégration à macOS, automatisation, métadonnées EXIF conservées.
- **Limites** : Mac uniquement, installation nécessaire.

## Option 3 : directement dans le navigateur

C’est le choix fait pour agrandir-image.fr. Au premier traitement, ton navigateur télécharge depuis le site le moteur de calcul, onnxruntime-web de Microsoft (6,3 Mo en version carte graphique, 3,5 Mo en version processeur), et le modèle choisi : 2,3 Mo pour le modèle photo par défaut, 1,2 Mo pour le modèle « Dessin ou logo », jusqu’à 32,2 Mo pour la qualité « Maximale ». Les deux restent ensuite en cache. Ton image, elle, est lue, calculée et réencodée dans l’onglet. Tu peux le vérifier dans l’onglet Réseau des outils de développement : aucune requête ne la contient. Une fois tout chargé, l’onglet continue même de fonctionner si tu coupes la connexion.

Le calcul passe par la carte graphique grâce à WebGPU quand le navigateur le permet : Chrome et Edge récents, Safari 26 sur Mac, iPhone et iPad, Firefox 141 et plus sur Windows, 147 et plus sur Mac (pas encore Firefox sur Linux ni sur Android). Sinon, il passe par le processeur en WebAssembly, sur 8 cœurs au plus : ça fonctionne partout, mais plusieurs fois plus lentement. Avec une carte graphique, compte quelques secondes pour une petite image. Sur la page [upscale d’image](/upscale-image/), tu choisis le type d’image et la qualité, « Standard » ou « Maximale ».

- **Atouts** : rien à installer, gratuit, sans compte ni quota, traitement par lots de 20 images avec export ZIP, métadonnées (EXIF, position GPS) non recopiées dans le fichier agrandi.
- **Limites** : la vitesse dépend de ton appareil, le résultat est plafonné à 64 Mpx sur ordinateur et 16 Mpx sur téléphone ou tablette, et les photos HEIC d’iPhone ne s’ouvrent que dans Safari.

## Comparatif : installation, systèmes, lots, confidentialité, prix, limites

| | Upscayl | HiPixel | Navigateur (agrandir-image.fr) |
|---|---|---|---|
| Installation | Application à installer | Application à installer | Aucune |
| Systèmes | Windows 10 et suivants, macOS 12 et suivants, Linux | macOS 13 et suivants | Navigateur récent, sur ordinateur, tablette ou téléphone |
| Carte graphique | Compatible Vulkan, indispensable | Celle du Mac | Facultative, repli sur le processeur |
| Traitement par lot | Oui | Oui, et surveillance de dossier | Oui, 20 images, export ZIP |
| Confidentialité | Calcul local | Calcul local | Calcul local, vérifiable dans l’onglet Réseau |
| Prix | Gratuit (Upscayl Cloud payant à part) | Gratuit | Gratuit, sans compte |
| Limites | Beaucoup de puces graphiques intégrées refusées | Mac uniquement | 64 Mpx sur ordinateur, 16 Mpx sur mobile |

Aucun des trois ne corrige un flou de bougé ou une mise au point ratée : c’est une limite de ces modèles, pas des outils.

## Quel outil pour quel usage ?

- **Tu traites des centaines d’images régulièrement, sur un PC équipé d’une carte graphique compatible Vulkan** : Upscayl.
- **Tu travailles sur Mac et tu veux automatiser** (dossier surveillé, Raccourcis) ou garder les métadonnées : HiPixel.
- **Tu dépannes de temps en temps, sur un ordinateur qui n’est pas le tien, une machine sans carte graphique compatible ou un téléphone** : le navigateur. C’est aussi facile à conseiller à un client : un lien, rien à installer. Pour un besoin courant, [l’outil d’agrandissement d’image](/) suffit ; pour des photos de boutique, notre guide des [tailles de photos produits](/blog/taille-photo-produit-ecommerce/) donne les dimensions à viser.

## Questions fréquentes

### Le résultat est-il le même d’un outil à l’autre ?

Proche, pas identique. Les trois utilisent la même famille de modèles Real-ESRGAN : les modèles « Standard », « Lite » et « Digital Art » d’Upscayl et de HiPixel correspondent à RealESRGAN_x4plus, realesr-general-x4v3 et RealESRGAN_x4plus_anime_6B, que notre outil propose aussi. Mais les versions, les réglages et la façon de découper l’image pendant le calcul peuvent différer : compare sur tes propres images.

### Les upscalers en ligne gardent-ils mes images ?

Ça dépend de chaque service : certains annoncent un effacement rapide, d’autres présentent le stockage en ligne de tes fichiers comme un avantage. Lis la politique de confidentialité avant d’envoyer quoi que ce soit de sensible.

### Faut-il une carte graphique ?

Pour Upscayl, oui : une carte compatible Vulkan. HiPixel utilise celle du Mac. Dans le navigateur, non : sans WebGPU, le calcul passe par le processeur, plus lentement, mais il aboutit. Et si la carte graphique refuse le calcul, l’outil bascule tout seul sur le processeur.

### Ça marche sur iPhone ?

Oui. Safari 26 sur iOS et iPadOS donne accès à la carte graphique via WebGPU ; sur une version plus ancienne, le calcul passe par le processeur, plus lentement. Sur téléphone et tablette, le résultat est plafonné à 16 Mpx. Autre avantage de Safari : il ouvre les photos HEIC de l’iPhone, que les autres navigateurs ne savent pas lire (il faut alors les convertir en JPG).

### Et si je n’ai pas le temps ?

Pas le temps de comparer trois outils ? Prends le navigateur pour dépanner, et garde Upscayl ou HiPixel pour les gros volumes. Si ton besoin dépasse l’agrandissement d’images (un site, une boutique en ligne, des visuels), c’est là qu’intervient Coelus, l’agence web de Montpellier qui développe agrandir-image.fr : sites WordPress, boutiques WooCommerce, référencement et design, c’est notre travail de tous les jours. Soyons clairs, l’outil gratuit sert aussi à nous faire connaître. Si tu as un projet, [écris-nous](https://coelus.fr/contact/?utm_source=agrandir-image.fr&utm_medium=referral&utm_campaign=article-agrandir-image-ia-sans-cloud).
