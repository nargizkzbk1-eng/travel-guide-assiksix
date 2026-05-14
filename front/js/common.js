/**
 * Shared behavior for all HTML pages: color theme persistence, primary navigation,
 * optional welcome dialog on the home page, and scroll-triggered section visibility.
 */
(function () {
  "use strict";

  var THEME_KEY = "travel-guide-theme";
  var VISIT_KEY = "travel-guide-visit-count";

  /** @returns {string} Stored theme key, or "dark" if none is saved. */
  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || "dark";
  }

  /** Applies the selected theme to the document root and updates the toggle control. */
  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    var icon = document.querySelector(".theme-icon");
    if (icon) icon.textContent = theme === "light" ? "☀️" : "🌙";
    var toggle = document.getElementById("theme-toggle");
    if (toggle) toggle.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
  }

  /** Persists the new theme and reapplies styles. */
  function toggleTheme() {
    var next = getStoredTheme() === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  /** Highlights the navigation link that matches the current URL (accessibility: aria-current). */
  function setCurrentNav() {
    var path = window.location.pathname.split("/").pop() || "index.html";
    if (path === "" || path === "front") path = "index.html";
    var links = document.querySelectorAll("#main-nav a");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href");
      if (href === path || (path === "index.html" && href === "index.html")) {
        links[i].setAttribute("aria-current", "page");
      } else {
        links[i].removeAttribute("aria-current");
      }
    }
  }

  /** Collapsible navigation for narrow viewports; synchronises ARIA expanded state. */
  function initMobileNav() {
    var btn = document.querySelector(".menu-toggle");
    var panel = document.getElementById("nav-panel");
    if (!btn || !panel) return;

    btn.addEventListener("click", function () {
      var open = !panel.classList.contains("is-open");
      panel.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    var links = panel.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        if (window.matchMedia("(max-width: 768px)").matches) {
          panel.classList.remove("is-open");
          btn.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  /**
   * Increments a visit counter in localStorage. From the second visit onward,
   * displays the welcome modal when present in the DOM (home page only).
   */
  function initWelcomeModal() {
    var backdrop = document.getElementById("welcome-modal");
    if (!backdrop) return;

    var count = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10);
    count += 1;
    localStorage.setItem(VISIT_KEY, String(count));

    var body = document.getElementById("welcome-body");

    function openModal() {
      if (count < 2) return;
      if (body) {
        body.textContent =
          "Your theme is still saved in localStorage. Use the carousel on Home or jump straight to the Flag Quiz.";
      }
      backdrop.classList.add("is-open");
      backdrop.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
      backdrop.classList.remove("is-open");
      backdrop.setAttribute("aria-hidden", "true");
    }

    setTimeout(openModal, 600);
    var dismiss = document.getElementById("modal-dismiss");
    if (dismiss) dismiss.addEventListener("click", closeModal);
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && backdrop.classList.contains("is-open")) closeModal();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(getStoredTheme());
    setCurrentNav();
    initMobileNav();

    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

    initWelcomeModal();

    // Sections bearing .fade-in-section receive .is-visible when they intersect the viewport.
    var sections = document.querySelectorAll(".fade-in-section");
    if ("IntersectionObserver" in window && sections.length) {
      var io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              entries[i].target.classList.add("is-visible");
              io.unobserve(entries[i].target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      for (var j = 0; j < sections.length; j++) io.observe(sections[j]);
    } else {
      for (var k = 0; k < sections.length; k++) sections[k].classList.add("is-visible");
    }
  });
})();
