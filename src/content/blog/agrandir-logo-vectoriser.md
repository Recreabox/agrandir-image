---
title: "Agrandir un logo sans perte de qualité : upscaling IA, vectorisation ou redessin ?"
seoTitle: "Agrandir un logo : upscaling IA ou vectorisation ?"
description: "PNG trop petit, imprimeur qui réclame un vectoriel : quand l’agrandissement IA suffit, quand vectoriser, et quand il faut redessiner ton logo."
publishedAt: 2026-10-19
updatedAt: 2026-10-19
readingMinutes: 7
author: "L’équipe Coelus"
tool: "/agrandir-logo/"
cta:
  text: "L’IA te dépanne pour le web ; pour une enseigne, un véhicule ou un textile, il te faut un vrai fichier vectoriel, et c’est un travail de graphiste. La création de logos fait partie du métier de Coelus, et cet outil gratuit sort du même atelier."
  href: "https://coelus.fr/service/graphisme/?utm_source=agrandir-image.fr&utm_medium=referral&utm_campaign=article-agrandir-logo-vectoriser"
  label: "Faire redessiner mon logo"
---

Ton imprimeur réclame ton logo « en vectoriel », le brodeur parle d’un « fichier AI », et tu n’as qu’un PNG de 300 pixels récupéré sur ton site. Faut-il l’agrandir, le vectoriser ou le faire redessiner ? Les trois solutions existent, ne demandent pas le même effort et ne servent pas aux mêmes usages. Voici comment choisir.

## Vectoriel ou matriciel : la différence en 2 minutes

Un fichier **matriciel** (PNG, JPG, WebP) est une grille de pixels. Agrandi au-delà de sa taille, il devient flou ou crénelé : il n’a pas plus de pixels à montrer. Un fichier **vectoriel** (SVG, AI, EPS, PDF vectoriel) décrit des formes, c’est-à-dire des courbes, des aplats et des contours recalculés à chaque taille. Comme le résume la documentation d’[Inkscape](https://inkscape.org/about/), le vectoriel n’est lié à aucun nombre fixe de pixels : le même fichier s’imprime net sur une carte de visite comme sur une bâche.

Un logo dessiné par un graphiste naît en général en vectoriel. Les PNG qui circulent sont des exports, faits à une taille donnée pour un usage donné : l’en-tête du site, une signature d’e-mail, un réseau social. Attention au PDF : il n’est vectoriel que s’il contient des tracés, pas une image collée dedans.

## Retrouver la version vectorielle de ton logo

Avant de bricoler, cherche l’original :

- **chez le graphiste ou l’agence** qui a créé le logo : demande les fichiers sources (AI, EPS, SVG ou PDF) ;
- **chez ton dernier imprimeur** : s’il a déjà réalisé des cartes ou une enseigne, il a peut-être gardé un fichier exploitable ;
- **dans ta charte graphique** : un PDF de charte peut contenir le logo en vectoriel ; ouvre-le dans Inkscape ou Illustrator et vérifie qu’il s’agit bien de tracés ;
- **dans le code de ton site** : certains thèmes affichent le logo en SVG ; fais un clic droit sur le logo, choisis « Inspecter » et regarde si l’élément est un svg ou un lien vers un fichier .svg.

## Option 1 : agrandir le PNG avec l’IA

C’est la solution de dépannage : gratuite et sans installation, mais le résultat reste un PNG, donc des pixels.

### Quand ça suffit : web, réseaux sociaux, présentation, petit support imprimé

Pour un site web, les réseaux sociaux, une présentation, un document ou un petit support imprimé (carte de visite, flyer), un PNG agrandi proprement fait l’affaire. Repère : un logo de 300 px agrandi ×4 fait 1200 px de large, soit environ 10 cm à 300 dpi. Pour savoir si un fichier suffit à un format d’impression, la page [agrandir une image pour l’impression](/agrandir-image-impression/) fait le calcul à ta place.

### Pas à pas avec l’outil

Sur la page [agrandir un logo](/agrandir-logo/) :

1. Glisse ton PNG, ou colle-le avec Ctrl + V.
2. Choisis le type d’image « Dessin ou logo » : ce modèle est fait pour les aplats et les bords nets, là où le modèle Photo peut ajouter du grain.
3. Prends ×4 si le logo est petit. Si le résultat manque de finesse, choisis la qualité « Maximale » : le modèle pèse 8,6 Mo au lieu de 1,2 Mo, et le calcul est nettement plus lent.
4. Exporte en PNG pour garder la transparence : le canal alpha est agrandi par le même modèle, et les contours restent propres. En JPG, le fond devient blanc.
5. Compare avant et après au zoom 100 %, sur les lettres et les angles.

### Les défauts à surveiller

L’IA redessine des contours, elle ne connaît pas ta typographie. Surveille :

- les lettres fines ou serrées, qui peuvent se déformer ou se coller ;
- les angles vifs, parfois arrondis, et les cercles, parfois cabossés ;
- les dégradés, qui peuvent former des paliers ;
- les tout petits fichiers, comme une icône de 32 px : il y a trop peu d’information, et le résultat sera une réinterprétation.

## Option 2 : la vectorisation automatique

Vectoriser, c’est demander à un logiciel de retracer l’image en formes. Tu obtiens un vrai fichier vectoriel, mais une approximation de ton logo.

### Inkscape (gratuit) : Chemin › Vectoriser un objet matriciel

[Inkscape](https://inkscape.org/about/) est un logiciel de dessin vectoriel libre et gratuit, pour Windows, macOS et Linux. Importe ton PNG, sélectionne-le, puis lance **Chemin › Vectoriser un objet matriciel** (Maj + Alt + B). Plusieurs filtres sont proposés (seuil de luminosité, détection d’arêtes, quantification des couleurs) : le didacticiel officiel conseille de les essayer, car chacun réagit différemment selon l’image, et précise que le but n’est pas de reproduire exactement l’original ([didacticiel Inkscape](https://inkscape.org/fr/doc/tutorials/tracing/tutorial-tracing.html)). Astuce : tu peux d’abord agrandir le PNG avec l’IA, pour que la vectorisation parte d’une image plus grande et plus propre.

### Illustrator : Vectorisation de l’image

Dans Illustrator, le logiciel payant d’Adobe, la fonction s’appelle **Vectorisation de l’image**. Son panneau propose des paramètres prédéfinis (noir et blanc, contour, nombre de couleurs), puis la commande **Décomposer** transforme le résultat en tracés modifiables ([aide Adobe](https://helpx.adobe.com/fr/illustrator/using/image-trace.html)).

### Les limites : courbes approximatives, typographies non reconnues, nœuds en trop

Dans les deux cas, attends-toi à :

- des courbes approximatives, surtout si le PNG de départ est petit ou flou ;
- des textes transformés en formes, sans reconnaissance de la police : impossible de corriger une lettre en la retapant ;
- des nœuds en trop, qui alourdissent le fichier et gênent la découpe ;
- des couleurs à reprendre à la main.

Pour un usage courant, ça peut suffire. Pour une enseigne ou un marquage, un graphiste devra en général repasser derrière.

## Option 3 : redessiner le logo

### Quand c’est indispensable : enseigne, véhicule, broderie, découpe, très grand format

Certains usages ne pardonnent rien :

- **enseigne et lettrage découpé** : la machine suit les tracés, et un nœud de travers se voit en grand ;
- **covering de véhicule** et grands formats vus de près ;
- **broderie** : le brodeur traduit les formes en points, il lui faut des contours nets et simples ;
- **marquage textile, gravure, tampon** : chaque couleur doit être un aplat franc, sans dégradé parasite.

### Ce que tu récupères : SVG, PDF, EPS, déclinaisons, typographies identifiées

Un redessin, c’est un logo retracé courbe par courbe par un graphiste. À la fin, demande :

- des fichiers SVG, PDF et EPS ;
- des déclinaisons : couleur, noir, blanc pour les fonds sombres, version horizontale ou carrée ;
- les références de couleurs, pour l’écran et pour l’impression ;
- la police identifiée, ou redessinée si elle n’existe pas, pour écrire un slogan dans le même style.

## Tableau de décision : quel usage, quelle solution

| Usage | Solution conseillée |
|---|---|
| Site web, réseaux sociaux, signature d’e-mail | SVG si tu l’as, sinon PNG agrandi par l’IA |
| Présentation, document, petit flyer | PNG agrandi par l’IA, vérifié au zoom |
| Cartes de visite, affiche | PNG agrandi pour un logo simple, sinon vectorisation retouchée |
| Enseigne, lettrage, covering | Redessin vectoriel |
| Broderie, flex, sérigraphie, gravure | Redessin vectoriel |
| Refonte d’identité, charte graphique | Redessin, avec ses déclinaisons |

## Exemple : un logo de 300 px, trois besoins

Imaginons un artisan qui n’a qu’un PNG de 300 × 120 px tiré de son site.

- **Pour sa page sur un réseau social** : ×4 avec le modèle « Dessin ou logo », soit 1200 × 480 px, transparence conservée. C’est réglé.
- **Pour des cartes de visite** : 1200 px couvrent environ 10 cm à 300 dpi, et un logo imprimé sur 4 cm de large n’en demande qu’environ 470. On vérifie quand même les lettres au zoom 100 %.
- **Pour le lettrage de sa camionnette** : ni l’agrandissement ni la vectorisation automatique ne donneront des tracés assez propres pour la découpe. Il faut un redessin.

## Questions fréquentes

### Un imprimeur acceptera-t-il un logo agrandi par IA ?

Pour un flyer ou une affiche, souvent, si le fichier a assez de pixels pour le format : [notre guide de la résolution d’impression](/blog/resolution-impression-photo/) donne les chiffres. Pour la découpe, la broderie ou la gravure, rarement, car ces techniques travaillent à partir de tracés. Pose-lui la question avant de commander.

### Quel format de logo pour un site web ?

Le SVG quand tu l’as : il reste net à toutes les tailles. Sinon, un PNG d’au moins deux fois la taille d’affichage, pour les écrans haute densité qui utilisent plusieurs pixels physiques par pixel CSS ([MDN](https://developer.mozilla.org/fr/docs/Web/API/Window/devicePixelRatio)). Un logo affiché sur 200 px de large demande donc un PNG d’au moins 400 px.

### Peut-on vectoriser un logo gratuitement ?

Oui, avec Inkscape, dans les limites décrites plus haut. Le résultat convient à un usage courant ; pour un marquage, fais-le vérifier par celui qui va le réaliser.

### L’outil peut-il me donner un SVG ?

Non. Agrandir n’est pas vectoriser : l’outil produit un PNG, un JPG ou un WebP plus grand, jamais un fichier vectoriel.

### Et si je n’ai pas le temps ?

L’IA dépanne pour le web. Pour une enseigne, un véhicule ou un textile, il te faut un fichier vectoriel propre et décliné, et ça, c’est un travail de graphiste. La création de logos fait partie de ce qu’on fait chez Coelus, à Montpellier ; agrandir-image.fr est un outil qu’on a construit à côté et qu’on laisse en accès libre, sans te cacher qu’il nous sert aussi de vitrine. Si ton logo mérite mieux qu’un rattrapage, [on peut le redessiner](https://coelus.fr/service/graphisme/?utm_source=agrandir-image.fr&utm_medium=referral&utm_campaign=article-agrandir-logo-vectoriser).
