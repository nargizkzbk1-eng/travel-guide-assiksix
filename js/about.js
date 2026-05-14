/**
 * About page: contact form validation without a server endpoint.
 * Demonstrates blur, input, and submit listeners; conditional logic via switch.
 */
(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var DEST_KEY = "travel-guide-dream-dest";

  /** Maps each logical field name to its input, error container, and required flag. */
  var fields = {
    name: { el: document.getElementById("name"), err: document.getElementById("err-name"), required: true },
    email: { el: document.getElementById("email"), err: document.getElementById("err-email"), required: true },
    destination: {
      el: document.getElementById("destination"),
      err: document.getElementById("err-destination"),
      required: false,
    },
    message: { el: document.getElementById("message"), err: document.getElementById("err-message"), required: true },
  };

  /** @returns {boolean} True if the string matches a minimal valid e-mail pattern. */
  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  /**
   * @param {string} name Field identifier (must match a key in fields).
   * @returns {string} Human-readable error text, or an empty string when the field is valid.
   */
  function validateField(name) {
    var f = fields[name];
    if (!f || !f.el) return "";
    var v = f.el.value.trim();

    switch (name) {
      case "name":
        if (f.required && v.length < 2) return "Please enter at least 2 characters.";
        break;
      case "email":
        if (f.required && !v) return "Email is required.";
        if (v && !isValidEmail(v)) return "Use a valid email format (name@domain.com).";
        break;
      case "destination":
        if (v.length > 80) return "Keep it under 80 characters.";
        break;
      case "message":
        if (f.required && v.length < 10) return "Tell us a bit more (at least 10 characters).";
        break;
      default:
        break;
    }
    return "";
  }

  /** Renders inline validation feedback and toggles the invalid state on the field group. */
  function showError(name, message) {
    var f = fields[name];
    if (!f || !f.el || !f.err) return;
    f.err.textContent = message;
    var group = f.el.closest(".form-group");
    if (group) group.classList.toggle("invalid", Boolean(message));
  }

  /** Validates every registered field; returns false if any error message is produced. */
  function validateAll() {
    var ok = true;
    var names = Object.keys(fields);
    for (var i = 0; i < names.length; i++) {
      var msg = validateField(names[i]);
      showError(names[i], msg);
      if (msg) ok = false;
    }
    return ok;
  }

  /** Restores the optional destination field from localStorage on page load. */
  function loadSavedDestination() {
    var d = fields.destination && fields.destination.el;
    if (!d) return;
    var saved = localStorage.getItem(DEST_KEY);
    if (saved) d.value = saved;
  }

  /** Registers per-field blur and input handlers for incremental validation. */
  function attachListeners() {
    var names = Object.keys(fields);
    for (var i = 0; i < names.length; i++) {
      (function (name) {
        var el = fields[name].el;
        if (!el) return;
        el.addEventListener("blur", function () {
          showError(name, validateField(name));
        });
        el.addEventListener("input", function () {
          if (fields[name].err && fields[name].err.textContent) {
            showError(name, validateField(name));
          }
        });
      })(names[i]);
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var success = document.getElementById("form-success");
    if (!validateAll()) {
      if (success) success.classList.remove("is-visible");
      return;
    }
    var dest = fields.destination && fields.destination.el ? fields.destination.el.value.trim() : "";
    if (dest) localStorage.setItem(DEST_KEY, dest);
    if (success) success.classList.add("is-visible");
    form.reset();
    loadSavedDestination();
  });

  loadSavedDestination();
  attachListeners();
})();
