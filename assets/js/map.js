/* Museums Near New Hope — HOME overview map + filters.
   Filters the overview-map pins, the on-page museum cards, the region section
   counts, and shows a no-results message when nothing matches. */
(function () {
  "use strict";

  var dataEl = document.getElementById("bk-data");
  var regionEl = document.getElementById("bk-regions");
  if (!dataEl || !window.L) return;

  var MUSEUMS = JSON.parse(dataEl.textContent || "[]");
  var REGIONS = JSON.parse((regionEl && regionEl.textContent) || "[]");
  var COLOR = {};
  REGIONS.forEach(function (r) { COLOR[r.id] = r.color; });

  var TILE = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  var state = { region: {}, category: {}, freeOnly: false, q: "" };
  document.querySelectorAll('.bk-chip[data-filter="region"]').forEach(function (b) { state.region[b.dataset.value] = true; });
  document.querySelectorAll('.bk-chip[data-filter="category"]').forEach(function (b) { state.category[b.dataset.value] = true; });

  function isFree(m) { return m.admission && String(m.admission).toLowerCase() === "free"; }

  function passesData(m) {
    if (state.region[m.region] === false) return false;
    if (state.category[m.category] === false) return false;
    if (state.freeOnly && !isFree(m)) return false;
    if (state.q) {
      var hay = ((m.name || "") + " " + (m.town || "") + " " + (m.category || "")).toLowerCase();
      if (hay.indexOf(state.q) === -1) return false;
    }
    return true;
  }
  // card version reads the card's data-* attributes
  function passesCard(card) {
    if (state.region[card.dataset.region] === false) return false;
    if (state.category[card.dataset.category] === false) return false;
    if (state.freeOnly && card.dataset.free !== "1") return false;
    if (state.q && (card.dataset.search || "").indexOf(state.q) === -1) return false;
    return true;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function popupHtml(m) {
    var h = '<div class="bk-pop"><strong>' + esc(m.name) + "</strong>";
    var sub = [m.town, m.admission].filter(Boolean).join(" · ");
    if (sub) h += '<div class="bk-pop-venue">' + esc(sub) + "</div>";
    if (m.hours) h += '<div class="bk-pop-venue">🕑 ' + esc(m.hours) + "</div>";
    var links = [];
    if (m.page) links.push('<a href="' + esc(m.page) + '">Hours &amp; details →</a>');
    if (m.address) links.push('<a href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(m.address) + '" target="_blank" rel="noopener">Directions ↗</a>');
    h += '<div class="bk-pop-links">' + links.join(" ") + "</div></div>";
    return h;
  }

  var el = document.getElementById("bk-map-main");
  if (!el) return;
  var located = MUSEUMS.filter(function (m) { return typeof m.lat === "number" && typeof m.lng === "number"; });
  var map = L.map(el, { scrollWheelZoom: false });
  L.tileLayer(TILE, { attribution: ATTR, maxZoom: 19, subdomains: "abcd" }).addTo(map);
  var layer = L.layerGroup().addTo(map);
  var markers = located.map(function (m) {
    var mk = L.circleMarker([m.lat, m.lng], { radius: 7, fillColor: COLOR[m.region] || "#555", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.9 });
    mk.bindPopup(popupHtml(m));
    mk._bk = m;
    return mk;
  });

  function fit() {
    var vis = markers.filter(function (mk) { return passesData(mk._bk); });
    if (vis.length) {
      map.fitBounds(L.featureGroup(vis).getBounds().pad(0.16), { maxZoom: 12 });
    } else {
      map.setView([40.30, -74.85], 9);
    }
  }

  function apply() {
    // map markers
    markers.forEach(function (mk) {
      if (passesData(mk._bk)) { if (!layer.hasLayer(mk)) layer.addLayer(mk); }
      else if (layer.hasLayer(mk)) layer.removeLayer(mk);
    });
    // cards + per-region counts + hide empty sections
    var total = 0;
    document.querySelectorAll(".bk-region-sec").forEach(function (sec) {
      var shown = 0;
      sec.querySelectorAll(".bk-mcard").forEach(function (card) {
        var ok = passesCard(card);
        card.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      total += shown;
      sec.classList.toggle("is-hidden", shown === 0);
      var badge = sec.querySelector("[data-region-count]");
      if (badge) badge.textContent = shown;
    });
    var none = document.getElementById("bk-noresults");
    if (none) none.hidden = total !== 0;
    fit();
  }

  document.querySelectorAll(".bk-chip").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var on = btn.classList.toggle("is-on");
      state[btn.dataset.filter][btn.dataset.value] = on;
      apply();
    });
  });
  var freeBox = document.getElementById("bk-free-only");
  if (freeBox) freeBox.addEventListener("change", function () { state.freeOnly = freeBox.checked; apply(); });
  var searchBox = document.getElementById("bk-search");
  if (searchBox) searchBox.addEventListener("input", function () { state.q = searchBox.value.trim().toLowerCase(); apply(); });

  function reset() {
    document.querySelectorAll(".bk-chip").forEach(function (b) { b.classList.add("is-on"); state[b.dataset.filter][b.dataset.value] = true; });
    state.freeOnly = false; state.q = "";
    if (freeBox) freeBox.checked = false;
    if (searchBox) searchBox.value = "";
    apply();
  }
  ["bk-reset", "bk-reset2"].forEach(function (id) {
    var rb = document.getElementById(id);
    if (rb) rb.addEventListener("click", reset);
  });

  apply();
  setTimeout(function () { map.invalidateSize(); fit(); }, 200);
})();
