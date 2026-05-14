/**
 * Flag quiz (game.html): multiple-choice country identification from flag images.
 * Integrates the REST Countries API with a static fallback list; persists the best score.
 */
(function () {
  "use strict";

  var API = "https://restcountries.com/v3.1/all?fields=name,flags,cca2";
  var STORAGE_BEST = "tg-flag-best";

  /* Minimal country set for offline use; ISO 3166-1 alpha-2 codes resolve to flagcdn.com URLs. */
  var FALLBACK = [
    { name: "Japan", code: "jp" },
    { name: "Brazil", code: "br" },
    { name: "Canada", code: "ca" },
    { name: "Italy", code: "it" },
    { name: "Kenya", code: "ke" },
    { name: "Iceland", code: "is" },
    { name: "Thailand", code: "th" },
    { name: "Morocco", code: "ma" },
    { name: "Peru", code: "pe" },
    { name: "New Zealand", code: "nz" },
    { name: "Norway", code: "no" },
    { name: "India", code: "in" },
    { name: "France", code: "fr" },
    { name: "Germany", code: "de" },
    { name: "South Korea", code: "kr" },
    { name: "Mexico", code: "mx" },
    { name: "Egypt", code: "eg" },
    { name: "Argentina", code: "ar" },
    { name: "Portugal", code: "pt" },
    { name: "Vietnam", code: "vn" },
  ];

  /** @type {{ name: string, flagUrl: string, code?: string }[]} Active question pool from API or fallback. */
  var pool = [];
  var score = 0;
  var streak = 0;
  var best = parseInt(localStorage.getItem(STORAGE_BEST) || "0", 10);
  var currentCorrect = null;
  var answered = false;

  /** Constructs a PNG flag URL for the given ISO alpha-2 code (flagcdn.com). */
  function flagUrlFromCode(code) {
    return "https://flagcdn.com/w320/" + code.toLowerCase() + ".png";
  }

  /** Normalizes REST Countries payloads to { name, flagUrl, code } records. */
  function normalizeFromApi(data) {
    var out = [];
    if (!Array.isArray(data)) return out;
    for (var i = 0; i < data.length; i++) {
      var c = data[i];
      var name = c.name && c.name.common ? String(c.name.common) : "";
      var png = c.flags && c.flags.png ? c.flags.png : "";
      var code = c.cca2 ? String(c.cca2) : "";
      if (!name || !png) continue;
      if (name.length > 40) continue;
      out.push({ name: name, flagUrl: png, code: code });
    }
    return out;
  }

  /** Builds the quiz pool exclusively from the static FALLBACK list. */
  function buildFallbackPool() {
    var out = [];
    for (var i = 0; i < FALLBACK.length; i++) {
      var f = FALLBACK[i];
      out.push({ name: f.name, flagUrl: flagUrlFromCode(f.code), code: f.code });
    }
    return out;
  }

  /** Returns a shuffled copy of the array (Fisher–Yates). */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /** Selects n distinct distractors, excluding the correct country name. */
  function pickDistinct(n, excludeName) {
    var shuffled = shuffle(pool);
    var picked = [];
    for (var i = 0; i < shuffled.length && picked.length < n; i++) {
      if (shuffled[i].name === excludeName) continue;
      picked.push(shuffled[i]);
    }
    return picked;
  }

  /** Temporary overlay elements for a brief positive feedback animation. */
  function launchConfetti() {
    var layer = document.createElement("div");
    layer.className = "confetti-layer";
    var colors = ["#ff8c42", "#2dd4bf", "#a78bfa", "#f472b6", "#fbbf24"];
    for (var i = 0; i < 48; i++) {
      var p = document.createElement("div");
      p.className = "confetti-piece";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDelay = Math.random() * 0.4 + "s";
      p.style.background = colors[i % colors.length];
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(function () {
      layer.remove();
    }, 2800);
  }

  /** Synchronises numeric score, streak, and personal best with the DOM. */
  function updateStats() {
    var elS = document.getElementById("stat-score");
    var elSt = document.getElementById("stat-streak");
    var elB = document.getElementById("stat-best");
    if (elS) elS.textContent = String(score);
    if (elSt) elSt.textContent = String(streak);
    if (elB) elB.textContent = String(best);
  }

  /** Toggles the loading state on the flag container during image fetch/decode. */
  function setFrameLoading(loading) {
    var frame = document.getElementById("flag-frame");
    if (!frame) return;
    if (loading) frame.classList.add("loading");
    else frame.classList.remove("loading");
  }

  /** Prepares a new question: one correct answer, three distractors, shuffled order. */
  function nextRound() {
    if (pool.length < 8) return;
    answered = false;
    var nextBtn = document.getElementById("next-btn");
    if (nextBtn) nextBtn.hidden = true;

    var correct = pool[Math.floor(Math.random() * pool.length)];
    currentCorrect = correct;
    var wrongOnes = pickDistinct(3, correct.name);
    var options = shuffle([correct].concat(wrongOnes));

    var img = document.getElementById("flag-img");
    setFrameLoading(true);
    if (img) {
      img.hidden = true;
      img.onload = function () {
        setFrameLoading(false);
        img.hidden = false;
      };
      img.onerror = function () {
        setFrameLoading(false);
      };
      img.src = correct.flagUrl;
      img.alt = "Guess this country’s flag";
    }

    var grid = document.getElementById("options-grid");
    if (!grid) return;
    grid.innerHTML = "";
    for (var i = 0; i < options.length; i++) {
      (function (opt, idx) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option-btn";
        btn.textContent = opt.name;
        btn.dataset.index = String(idx);
        btn.addEventListener("click", function () {
          onAnswer(opt.name, btn);
        });
        grid.appendChild(btn);
      })(options[i], i);
    }
  }

  /** Evaluates the selected option, updates scoring state, and applies outcome styles. */
  function onAnswer(guess, btnEl) {
    if (answered || !currentCorrect) return;
    answered = true;
    var correctName = currentCorrect.name;
    var grid = document.getElementById("options-grid");
    var buttons = grid ? grid.querySelectorAll(".option-btn") : [];

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (buttons[i].textContent === correctName) buttons[i].classList.add("correct");
      else if (buttons[i] === btnEl && guess !== correctName) buttons[i].classList.add("wrong");
    }

    if (guess === correctName) {
      score += 10 + Math.min(streak, 5) * 2;
      streak += 1;
      if (score > best) {
        best = score;
        localStorage.setItem(STORAGE_BEST, String(best));
      }
      launchConfetti();
    } else {
      streak = 0;
    }
    updateStats();
    var nextBtn = document.getElementById("next-btn");
    if (nextBtn) nextBtn.hidden = false;
  }

  /** Maps digit keys 1–4 to the corresponding answer button (keyboard accessibility). */
  function onKeyNumber(key) {
    var n = parseInt(key, 10);
    if (n < 1 || n > 4) return;
    var grid = document.getElementById("options-grid");
    if (!grid) return;
    var buttons = grid.querySelectorAll(".option-btn");
    if (answered || !buttons.length) return;
    var btn = buttons[n - 1];
    if (btn && !btn.disabled) btn.click();
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Guard clause: skip initialisation when the quiz markup is absent.
    var status = document.getElementById("api-status");
    var nextBtn = document.getElementById("next-btn");

    if (!document.getElementById("flag-frame")) return;

    updateStats();

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        nextRound();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (/^[1-4]$/.test(e.key)) onKeyNumber(e.key);
    });

    pool = buildFallbackPool();
    if (status) status.textContent = "Using built-in flag set… trying API.";

    // Asynchronous load: replace the pool when the API returns a sufficiently large dataset.
    fetch(API)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        var normalized = normalizeFromApi(data);
        if (normalized.length >= 8) {
          pool = normalized;
          if (status) {
            status.textContent =
              "Live data: " + pool.length + " countries from REST Countries API.";
          }
        } else {
          pool = buildFallbackPool();
          if (status) status.textContent = "API returned few countries — using built-in set.";
        }
        nextRound();
      })
      .catch(function () {
        pool = buildFallbackPool();
        if (status) status.textContent = "Offline or API blocked — playing with " + pool.length + " built-in flags.";
        nextRound();
      });
  });
})();
