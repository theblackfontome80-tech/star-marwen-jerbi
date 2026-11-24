/* =========================================================
   STAR Assurances – Agence Marwen Jerbi
   Interactions (vanilla JS, no dependency)
   ========================================================= */

/**
 * Configuration
 * FORM_ENDPOINT : URL d'un service de formulaire (ex. Formspree, Getform, ou votre backend).
 * Laissé vide, le formulaire prépare la demande et propose de l'envoyer par WhatsApp ou par email.
 */
const CONFIG = {
  FORM_ENDPOINT: "",
  PHONE_WA: "21623336061",
  EMAIL: "marwen.jerbi@staragence.com.tn",
};

const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Header: scroll state + mobile menu ---------- */
function initHeader() {
  const header = $("[data-header]");
  const burger = $("[data-burger]");
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
    document.body.classList.toggle("show-wa", window.scrollY > window.innerHeight * 0.35);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    header.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger?.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("#nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  // Current section highlight
  const links = $$(".nav__link");
  const sections = links.map((l) => $(l.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.toggle("is-current", l.getAttribute("href") === `#${en.target.id}`));
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const items = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  // Stagger siblings
  items.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(siblings.indexOf(el), 5) * 0.08}s`);
  });
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));
}

/* ---------- Agency photos: graceful placeholders ----------
   Le site n'utilise que les photos de l'agence, déposées dans assets/img/photos/.
   Tant qu'une photo manque, un visuel aux couleurs STAR prend sa place. */
const STAR_PATH = "M16 2.5l3.9 8.6 9.4 1-7 6.4 2 9.2L16 22.9l-8.3 4.8 2-9.2-7-6.4 9.4-1z";

function placeholderSVG(label = "") {
  const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#134231"/><stop offset="1" stop-color="#0A2E22"/></linearGradient>
      <pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0v48" fill="none" stroke="#fff" stroke-opacity=".05"/></pattern>
    </defs>
    <rect width="1200" height="1500" fill="url(#g)"/><rect width="1200" height="1500" fill="url(#p)"/>
    <g transform="translate(560 420) scale(26)" fill="#5FD08A" fill-opacity=".14"><path d="${STAR_PATH}"/></g>
    <g transform="translate(560 420) scale(26)" fill="none" stroke="#5FD08A" stroke-opacity=".5" stroke-width=".04"><path d="${STAR_PATH}"/></g>
    ${label ? `<rect x="96" y="1240" width="64" height="4" fill="#00873E"/>
    <text x="96" y="1340" fill="#fff" font-family="Georgia, 'Times New Roman', serif" font-size="84">${esc(label)}</text>` : ""}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function watchPhoto(img) {
  const fallback = () => {
    if (img.dataset.phDone) return;
    img.dataset.phDone = "1";
    if (img.dataset.ph === "remove") { img.remove(); return; }
    img.src = placeholderSVG(img.dataset.ph || "");
    img.classList.add("is-placeholder");
  };
  img.addEventListener("error", fallback);
  if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) fallback();
}

function initPhotos() {
  $$('img[src*="img/photos/"]').forEach((img) => {
    if (!img.dataset.ph) {
      const sol = img.closest(".solution");
      img.dataset.ph = sol ? $(".solution__title", sol).firstChild.textContent.trim() : "";
    }
    watchPhoto(img);
  });
}

/* ---------- Solutions: editorial index with sticky visual ---------- */
function initSolutions() {
  const list = $("[data-solutions-list]");
  const frame = $("[data-solutions-frame]");
  if (!list || !frame) return;
  const items = $$(".solution", list);
  const num = $("[data-solutions-num]");
  const tag = $("[data-solutions-tag]");

  // Build stacked images for crossfade
  const imgs = items.map((item, i) => {
    const img = new Image();
    img.dataset.ph = $(".solution__title", item).firstChild.textContent.trim();
    watchPhoto(img);
    img.src = item.dataset.img;
    img.alt = "";
    img.decoding = "async";
    if (i > 0) img.loading = "lazy";
    if (i === 0) img.classList.add("is-active");
    frame.appendChild(img);
    return img;
  });

  const activate = (i) => {
    items.forEach((it, k) => it.classList.toggle("is-active", k === i));
    imgs.forEach((im, k) => im.classList.toggle("is-active", k === i));
    if (num) num.textContent = String(i + 1).padStart(2, "0");
    if (tag) tag.textContent = items[i].dataset.tag || "";
  };

  const desktop = window.matchMedia("(min-width: 901px)");
  items.forEach((item, i) => {
    item.addEventListener("mouseenter", () => desktop.matches && activate(i));
    item.addEventListener("focusin", () => activate(i));
    item.addEventListener("click", (e) => { if (!e.target.closest("a")) activate(i); });
  });

  // Activate on scroll as well (desktop), so keyboard / trackpad users see each image
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting && desktop.matches) activate(items.indexOf(en.target));
    }),
    { rootMargin: "-48% 0px -48% 0px" }
  );
  items.forEach((it) => io.observe(it));
}

/* ---------- "En savoir plus" → preselect insurance type ---------- */
function initPreselect() {
  const select = $("#f-type");
  $$("[data-type]").forEach((a) =>
    a.addEventListener("click", () => {
      if (!select) return;
      const opt = [...select.options].find((o) => o.text === a.dataset.type);
      if (opt) { select.value = opt.value; select.dispatchEvent(new Event("change")); }
      setTimeout(() => $("#f-name")?.focus({ preventScroll: true }), 700);
    })
  );
}

/* ---------- Contact form ---------- */
function initForm() {
  const form = $("#contact-form");
  if (!form) return;
  const success = $(".form__success", form);
  const successText = $("[data-success-text]", form);

  const rules = {
    name: (v) => v.trim().length >= 2 || "Merci d'indiquer votre nom.",
    phone: (v) => /^[+\d][\d\s.-]{7,}$/.test(v.trim()) || "Merci d'indiquer un numéro de téléphone valide.",
    type: (v) => !!v || "Merci de choisir un type d'assurance.",
    message: (v) => v.trim().length >= 10 || "Votre message doit contenir au moins 10 caractères.",
  };

  const validateField = (el) => {
    const rule = rules[el.name];
    if (!rule) return true;
    const res = rule(el.value);
    const field = el.closest(".field");
    const err = $(".field__error", field);
    const ok = res === true;
    field.classList.toggle("has-error", !ok);
    el.setAttribute("aria-invalid", String(!ok));
    err.textContent = ok ? "" : res;
    return ok;
  };

  $$("input, select, textarea", form).forEach((el) => {
    el.addEventListener("blur", () => el.value && validateField(el));
    el.addEventListener("input", () => el.closest(".field").classList.contains("has-error") && validateField(el));
    el.addEventListener("change", () => el.closest(".field").classList.contains("has-error") && validateField(el));
  });

  const buildMessage = (d) =>
    `Bonjour, je souhaite être recontacté(e).\n\nNom : ${d.name}\nTéléphone : ${d.phone}\nAssurance : ${d.type}\n\n${d.message}`;

  const renderFallbackActions = (data) => {
    $(".form__actions", success)?.remove();
    const text = buildMessage(data);
    const wrap = document.createElement("div");
    wrap.className = "form__actions";
    wrap.innerHTML = `
      <a class="btn btn--whatsapp" target="_blank" rel="noopener"
         href="https://wa.me/${CONFIG.PHONE_WA}?text=${encodeURIComponent(text)}">Envoyer via WhatsApp</a>
      <a class="btn btn--deep btn--block"
         href="mailto:${CONFIG.EMAIL}?subject=${encodeURIComponent("Demande de conseil – " + data.type)}&body=${encodeURIComponent(text)}">Envoyer par email</a>`;
    $("[data-form-reset]", success).before(wrap);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = $$("input, select, textarea", form);
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) { fields.find((f) => f.getAttribute("aria-invalid") === "true")?.focus(); return; }

    const data = Object.fromEntries(new FormData(form));
    form.classList.add("is-loading");
    $(".form__submit-label", form).textContent = "Envoi en cours…";

    try {
      if (CONFIG.FORM_ENDPOINT) {
        const res = await fetch(CONFIG.FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Network");
        successText.textContent = `Merci ${data.name.split(" ")[0]}, votre demande a bien été envoyée. Notre agence vous recontacte très rapidement au ${data.phone}.`;
        $(".form__success h3", form).textContent = "Demande envoyée.";
      } else {
        await new Promise((r) => setTimeout(r, 700));
        successText.textContent = `Merci ${data.name.split(" ")[0]}. Choisissez comment transmettre votre demande à l'agence : elle est déjà rédigée pour vous.`;
        renderFallbackActions(data);
      }
      success.hidden = false;
      $(".form__success-icon", form).focus?.();
    } catch {
      const err = $(".field__error", $("#f-msg").closest(".field"));
      err.textContent = "Une erreur est survenue. Vous pouvez nous appeler au +216 23 336 061.";
    } finally {
      form.classList.remove("is-loading");
      $(".form__submit-label", form).textContent = "Envoyer ma demande";
    }
  });

  $("[data-form-reset]", form)?.addEventListener("click", () => {
    form.reset();
    success.hidden = true;
    $(".form__actions", success)?.remove();
    $("#f-name").focus();
  });
}

/* ---------- Misc ---------- */
function initMisc() {
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
}

document.documentElement.classList.remove("no-js");
initPhotos();
initHeader();
initReveal();
initSolutions();
initPreselect();
initForm();
initMisc();

/* ---------- Agency maps tabs (Sousse / Kalaa Kebira) ---------- */
(function initMaps() {
  const root = document.querySelector("[data-maps]");
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !on;
      const frame = panel.querySelector("iframe[data-src]");
      if (on && frame) { frame.src = frame.dataset.src; frame.removeAttribute("data-src"); }
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      select(next); next.focus();
    });
  });
})();

/* ---------- Photos: visible feedback on touch ---------- */
(function initTouchPhotos() {
  const sel = ".solution__thumb, .solutions__frame, .agency__media img, .awards__media, .facade img, .person__portrait";
  const release = (el) => setTimeout(() => el.classList.remove("is-pressed"), 380);
  document.addEventListener("touchstart", (e) => {
    const el = e.target.closest(sel);
    if (el) el.classList.add("is-pressed");
  }, { passive: true });
  ["touchend", "touchcancel"].forEach((type) =>
    document.addEventListener(type, () => document.querySelectorAll(".is-pressed").forEach(release), { passive: true })
  );
})();
