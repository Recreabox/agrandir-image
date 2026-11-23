// Sert les assets statiques et force le domaine principal en HTTPS au niveau HTTP.
// Cette redirection Worker remplace le filet JavaScript, trop tardif pour les robots.
export default {
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "agrandir-image.fr" && url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
