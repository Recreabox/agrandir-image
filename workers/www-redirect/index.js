// Redirige www.agrandir-image.fr (HTTP ou HTTPS) vers https://agrandir-image.fr, chemin et paramètres conservés.
// Un Worker plutôt qu'une règle de redirection Cloudflare : nos jetons n'ont pas le droit d'écrire les règles de zone.
export default {
  fetch(request) {
    const url = new URL(request.url);
    url.protocol = "https:";
    url.hostname = "agrandir-image.fr";
    url.port = "";
    return Response.redirect(url.toString(), 301);
  },
};
