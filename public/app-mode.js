/*
 * The Android app (a Trusted Web Activity, see android/) shows this same site.
 * Google Play does not allow an app to sell digital goods through any payment
 * system but its own, or to send people elsewhere to buy them, so inside the
 * app every route to the download bundle and the family plan is hidden.
 *
 * Kept in sessionStorage, not a cookie: the app shares Chrome's cookie jar, so
 * a cookie would hide the shop on the ordinary website too. The app always
 * opens on /today/?src=twa, and every page after that is in the same tab.
 *
 * A plain blocking script, not a module, so the class is on <html> before the
 * first paint and the links never flash into view. It is a few hundred bytes.
 */
(function () {
  try {
    var store = sessionStorage;
    if (/[?&]src=twa(&|$)/.test(location.search) || document.referrer.indexOf('android-app://com.posora.app') === 0) {
      store.setItem('posora_app', '1');
    }
    if (store.getItem('posora_app') !== '1') return;
    document.documentElement.classList.add('in-app');
    if (/^\/(digital-pack|family)(\/|$)/.test(location.pathname)) location.replace('/today/');
  } catch (e) {
    /* storage blocked: behave as the website */
  }
})();
