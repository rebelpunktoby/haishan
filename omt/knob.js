/* OMT back knob — one round ← shared by every OMT page, modelled on /breath/.
   Press order: close what is open (a sheet, a panel, the last reading opened) → then go back.
   Links marked data-sheet open in a sheet over the page, so a running piece keeps playing. */
(function () {
  "use strict";
  var embedded = window.top !== window.self;
  var opened = [];          // <details> the reader opened, newest last
  var closers = [];         // page hooks: functions that close something and return true
  var sheet = null;

  var css =
    ".omt-knob{display:inline-flex;align-items:center;justify-content:center;flex:none;width:34px;height:34px;padding:0;border-radius:50%;" +
    "border:1px solid rgba(236,234,244,.22);background:rgba(10,12,20,.5);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);" +
    "color:inherit;font:400 16px/1 'Space Grotesk',system-ui,sans-serif;text-decoration:none;cursor:pointer;transition:border-color .3s,color .3s}" +
    ".omt-knob:hover{border-color:rgba(236,234,244,.6)}.omt-knob:focus-visible{outline:2px solid #8FE3D2;outline-offset:2px}" +
    ".knob-row{display:inline-flex;align-items:center;gap:14px;min-width:0}" +
    ".omt-sheet{position:fixed;inset:0;z-index:1000;display:flex;justify-content:center;align-items:flex-end;background:rgba(5,6,10,.55);" +
    "-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .45s ease}" +
    ".omt-sheet.on{opacity:1}" +
    ".omt-sheet iframe{display:block;width:min(100%,1040px);height:calc(100% - 40px);border:0;border-radius:18px 18px 0 0;background:#090B14;" +
    "box-shadow:0 -20px 60px rgba(0,0,0,.45);transform:translateY(28px);transition:transform .55s cubic-bezier(.2,.7,.2,1)}" +
    ".omt-sheet.on iframe{transform:none}" +
    "@media(prefers-reduced-motion:reduce){.omt-sheet,.omt-sheet iframe{transition:none}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  document.addEventListener("toggle", function (e) {
    var d = e.target; if (!d || d.tagName !== "DETAILS") return;
    var i = opened.indexOf(d); if (i > -1) opened.splice(i, 1);
    if (d.open) opened.push(d);
  }, true);

  function inView(el) {
    if (el.checkVisibility && !el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return false;
    var r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
  }

  function closeSheet() {
    if (!sheet) return false;
    var s = sheet; sheet = null; s.classList.remove("on");
    setTimeout(function () { s.remove(); }, 460);
    document.documentElement.style.overflow = "";
    if (s._from) try { s._from.focus({ preventScroll: true }); } catch (e) {}
    return true;
  }

  function openSheet(url, from) {
    closeSheet();
    var s = document.createElement("div"); s.className = "omt-sheet"; s._from = from;
    var f = document.createElement("iframe"); f.src = url; f.title = (from && from.textContent.trim()) || "Read";
    s.appendChild(f);
    s.addEventListener("click", function (e) { if (e.target === s) closeSheet(); });
    document.body.appendChild(s); sheet = s;
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(function () { s.classList.add("on"); });
    f.addEventListener("load", function () { try { f.contentWindow.focus(); } catch (e) {} });
  }

  function closeSomething() {
    if (closeSheet()) return true;
    for (var i = closers.length - 1; i >= 0; i--) { try { if (closers[i]()) return true; } catch (e) {} }
    while (opened.length && !opened[opened.length - 1].open) opened.pop();
    var d = opened[opened.length - 1];
    if (d && inView(d)) {
      d.open = false;
      var s = d.querySelector("summary") || d;
      s.scrollIntoView({ behavior: "smooth", block: "center" });
      try { s.focus({ preventScroll: true }); } catch (e) {}
      return true;
    }
    return false;
  }

  function back(e) {
    if (e) e.preventDefault();
    if (closeSomething()) return;
    if (embedded) { try { if (window.parent.OMTKnob && window.parent.OMTKnob.closeSheet()) return; } catch (x) {} }
    var k = document.querySelector(".omt-knob");
    if (document.referrer.indexOf(location.origin) === 0 && history.length > 1) { history.back(); return; }
    location.href = (k && k.getAttribute("href")) || "/#omt";
  }

  window.OMTKnob = {
    back: back, closeSheet: closeSheet, openSheet: openSheet,
    addCloser: function (fn) { closers.push(fn); }
  };

  function wire() {
    document.querySelectorAll(".omt-knob").forEach(function (k) { k.addEventListener("click", back); });
    document.querySelectorAll("a[data-sheet]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault(); openSheet(a.getAttribute("href"), a);
      });
    });
    if (embedded) {
      // Inside a sheet: links that leave this page take the whole window; the knob closes the sheet.
      document.documentElement.classList.add("omt-embedded");
      document.querySelectorAll("a[href]").forEach(function (a) {
        var h = a.getAttribute("href");
        if (h && h.charAt(0) !== "#" && !a.classList.contains("omt-knob")) a.target = "_top";
      });
      document.querySelectorAll(".omt-knob").forEach(function (k) { k.setAttribute("aria-label", "Close"); k.title = "Close"; });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire); else wire();

  window.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (sheet) { e.stopImmediatePropagation(); e.preventDefault(); closeSheet(); return; }
    if (embedded) { e.preventDefault(); try { window.parent.OMTKnob && window.parent.OMTKnob.closeSheet(); } catch (x) {} }
  }, true);
})();
