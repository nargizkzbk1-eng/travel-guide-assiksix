/**
 * Home page (index.html): featured carousel and destination cards.
 * Data are stored in arrays; the DOM is built with loops and standard events.
 */
(function () {
  "use strict";

  var track = document.getElementById("carousel-track");
  var dotsWrap = document.getElementById("carousel-dots");
  var cardsWrap = document.getElementById("destination-cards");

  if (!track || !dotsWrap || !cardsWrap) return;

  /** Full-width slides: title, description, and background image URL. */
  var slides = [
    {
      title: "Kyoto in mist",
      text: "Temples, tea houses, and slow mornings by the Kamo River.",
      image:
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80",
    },
    {
      title: "Santorini blues",
      text: "Caldera views that melt into the Aegean — golden hour forever.",
      image:
        "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80",
    },
    {
      title: "Patagonian wind",
      text: "Peaks and glaciers for hikers who like their silence loud.",
      image:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    },
    {
      title: "Marrakech souks",
      text: "Spices, ceramics, and labyrinth alleys — map optional.",
      image:
        "https://images.unsplash.com/photo-1553603227-2358aabe821e?w=1200&q=80",
    },
  ];

  /** Compact cards rendered below the carousel (same array-and-loop pattern). */
  var destinations = [
    { tag: "City", title: "Lisbon", note: "Trams, tiles, and pastel light on seven hills." },
    { tag: "Nature", title: "Lofoten", note: "Arctic beaches and fishing cabins under auroras." },
    { tag: "Food", title: "Oaxaca", note: "Mole, mezcal, and markets that hum all week." },
    { tag: "Island", title: "Palawan", note: "Limestone lagoons and water the color of glass." },
    { tag: "Desert", title: "Wadi Rum", note: "Mars on Earth — camp under a river of stars." },
    { tag: "Culture", title: "Hanoi", note: "Street kitchens, lakeside walks, French echoes." },
  ];

  var index = 0;
  var timer = null;

  /** Renders one slide element per array entry and appends it to the horizontal track. */
  function renderSlides() {
    track.innerHTML = "";
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var slide = document.createElement("div");
      slide.className = "carousel-slide";
      slide.style.backgroundImage = "url('" + s.image + "')";
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", s.title);
      var cap = document.createElement("div");
      cap.className = "carousel-caption";
      cap.innerHTML = "<h2>" + s.title + "</h2><p>" + s.text + "</p>";
      slide.appendChild(cap);
      track.appendChild(slide);
    }
  }

  /** Pagination controls: one dot per slide, wired to goTo() and the autoplay timer. */
  function renderDots() {
    dotsWrap.innerHTML = "";
    for (var i = 0; i < slides.length; i++) {
      (function (idx) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", idx === 0 ? "true" : "false");
        b.setAttribute("aria-label", "Go to slide " + (idx + 1));
        if (idx === 0) b.classList.add("is-active");
        b.addEventListener("click", function () {
          goTo(idx);
          restartAuto();
        });
        dotsWrap.appendChild(b);
      })(i);
    }
  }

  /** Updates dot appearance to reflect the active slide index. */
  function updateDots() {
    var buttons = dotsWrap.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var on = i === index;
      buttons[i].classList.toggle("is-active", on);
      buttons[i].setAttribute("aria-selected", on ? "true" : "false");
    }
  }

  /** Translates the track by one slide width; indices wrap at both ends. */
  function goTo(i) {
    if (i < 0) i = slides.length - 1;
    if (i >= slides.length) i = 0;
    index = i;
    track.style.transform = "translateX(" + -index * 100 + "%)";
    updateDots();
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  /** Restarts the automatic advance interval after manual navigation. */
  function restartAuto() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 5500);
  }

  /** Builds destination cards; attaches IntersectionObserver for progressive disclosure. */
  function renderCards() {
    cardsWrap.innerHTML = "";
    for (var i = 0; i < destinations.length; i++) {
      var d = destinations[i];
      var card = document.createElement("article");
      card.className = "card fade-in-section";
      card.innerHTML =
        '<span class="tag">' +
        d.tag +
        "</span><h3>" +
        d.title +
        "</h3><p>" +
        d.note +
        "</p>";
      cardsWrap.appendChild(card);
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          for (var j = 0; j < entries.length; j++) {
            if (entries[j].isIntersecting) {
              entries[j].target.classList.add("is-visible");
              io.unobserve(entries[j].target);
            }
          }
        },
        { threshold: 0.1 }
      );
      var newCards = cardsWrap.querySelectorAll(".fade-in-section");
      for (var k = 0; k < newCards.length; k++) io.observe(newCards[k]);
    } else {
      var all = cardsWrap.querySelectorAll(".fade-in-section");
      for (var m = 0; m < all.length; m++) all[m].classList.add("is-visible");
    }
  }

  renderSlides();
  renderDots();
  renderCards();

  var btnPrev = document.getElementById("carousel-prev");
  var btnNext = document.getElementById("carousel-next");
  if (btnPrev) {
    btnPrev.addEventListener("click", function () {
      prev();
      restartAuto();
    });
  }
  if (btnNext) {
    btnNext.addEventListener("click", function () {
      next();
      restartAuto();
    });
  }

    // Keyboard support: ArrowLeft and ArrowRight mirror the previous and next controls.
    document.addEventListener("keydown", function (e) {
    if (!document.getElementById("carousel-track")) return;
    switch (e.key) {
      case "ArrowLeft":
        prev();
        restartAuto();
        break;
      case "ArrowRight":
        next();
        restartAuto();
        break;
      default:
        break;
    }
  });

  restartAuto();
})();
