// FAQ de l'accueil : questions courtes, réponses de 1 à 3 phrases.
export interface QA { q: string; a: string }

export const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function faqJsonLd(items: QA[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: stripHtml(it.a) } })),
  };
}

export const FAQ_HOME: QA[] = [
  {
    q: 'L’outil est-il vraiment gratuit ?',
    a: '<p>Oui : pas de compte, pas de crédits, pas de filigrane et pas de limite d’images. Le calcul se fait sur votre appareil, ce qui ne nous coûte presque rien.</p>',
  },
  {
    q: 'Mes images sont-elles envoyées sur un serveur ?',
    a: '<p>Non. Vos images sont traitées directement dans votre navigateur et ne quittent jamais votre appareil. Seul le modèle d’IA est téléchargé depuis notre site, une seule fois.</p>',
  },
  {
    q: 'Peut-on agrandir une image sans perte de qualité ?',
    a: '<p>Pas au sens strict : une petite image contient peu d’information. L’IA reconstruit des détails plausibles, ce qui donne un résultat net, mais elle ne retrouve pas ce qui n’existe pas, comme un texte illisible ou un visage minuscule.</p>',
  },
  {
    q: 'Jusqu’à quelle taille puis-je agrandir une image ?',
    a: '<p>Jusqu’à ×4 en largeur et en hauteur. L’image finale est limitée à 64&nbsp;mégapixels sur ordinateur et 16&nbsp;mégapixels sur téléphone ; au-delà, l’outil réduit automatiquement l’agrandissement.</p>',
  },
  {
    q: 'Pourquoi le traitement est-il lent sur mon appareil ?',
    a: '<p>Tout est calculé par votre appareil. Avec une carte graphique récente, quelques secondes suffisent ; sur un téléphone ou un ordinateur ancien, comptez parfois une minute ou plus. La qualité Standard est beaucoup plus rapide que la qualité Maximale.</p>',
  },
  {
    q: 'Photo, Photo abîmée ou Dessin : que choisir ?',
    a: '<p>Photo pour la plupart des photos. Photo abîmée pour une photo ancienne, floue ou très compressée : le nettoyage est plus fort. Dessin ou logo pour les aplats de couleur, les illustrations et les captures d’écran.</p>',
  },
];
