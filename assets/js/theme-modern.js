(function () {
  function initThemeToggle() {
    var body = document.body;
    if (!body.classList.contains('theme-modern')) return;

    var storedTheme = '';
    try {
      storedTheme = window.localStorage.getItem('portfolio-theme') || '';
    } catch (error) {
      storedTheme = '';
    }

    if (storedTheme === 'light') {
      body.classList.add('theme-light');
    }

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'theme-toggle';

    function updateLabel() {
      var lightActive = body.classList.contains('theme-light');
      toggle.textContent = lightActive ? 'Dark' : 'Light';
      toggle.setAttribute('aria-label', lightActive ? 'Switch to dark mode' : 'Switch to light mode');
    }

    toggle.addEventListener('click', function () {
      body.classList.toggle('theme-light');
      var lightActive = body.classList.contains('theme-light');
      try {
        window.localStorage.setItem('portfolio-theme', lightActive ? 'light' : 'dark');
      } catch (error) {
        // Ignore storage errors.
      }
      updateLabel();
    });

    updateLabel();
    body.appendChild(toggle);
  }

  function initTabs() {
    var groups = document.querySelectorAll('.tabs');
    groups.forEach(function (group) {
      var links = group.querySelectorAll('.tab-links a');
      var tabs = group.querySelectorAll('.tab');
      if (!links.length || !tabs.length) return;

      links.forEach(function (link) {
        link.addEventListener('click', function (event) {
          event.preventDefault();
          var targetId = link.getAttribute('href');
          var target = group.querySelector(targetId);
          if (!target) return;

          links.forEach(function (item) {
            item.classList.remove('active');
          });
          tabs.forEach(function (item) {
            item.classList.remove('active');
          });

          link.classList.add('active');
          target.classList.add('active');
        });
      });
    });
  }

  function initTyping() {
    var rotator = document.querySelector('.typing-rotator[data-rotate]');
    if (!rotator) return;

    var words = rotator
      .getAttribute('data-rotate')
      .split('|')
      .map(function (word) {
        return word.trim();
      })
      .filter(Boolean);

    if (!words.length) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isPaused = false;

    function pause() {
      isPaused = true;
    }

    function resume() {
      isPaused = false;
    }

    rotator.addEventListener('mouseenter', pause);
    rotator.addEventListener('mouseleave', resume);
    rotator.addEventListener('focus', pause);
    rotator.addEventListener('blur', resume);
    rotator.addEventListener('click', function () {
      pause();
      window.setTimeout(resume, 1800);
    });

    if (reduceMotion) {
      var idxReduce = 0;
      rotator.textContent = words[idxReduce];
      setInterval(function () {
        if (isPaused) return;
        idxReduce = (idxReduce + 1) % words.length;
        rotator.textContent = words[idxReduce];
      }, 3600);
      return;
    }

    var wordIndex = 0;
    var charIndex = 0;
    var deleting = false;

    function step() {
      if (isPaused) {
        window.setTimeout(step, 160);
        return;
      }

      var currentWord = words[wordIndex];

      if (!deleting) {
        charIndex += 1;
        rotator.textContent = currentWord.slice(0, charIndex);

        if (charIndex >= currentWord.length) {
          deleting = true;
          window.setTimeout(step, 2400);
          return;
        }

        window.setTimeout(step, 64);
        return;
      }

      charIndex -= 1;
      rotator.textContent = currentWord.slice(0, charIndex);

      if (charIndex <= 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        window.setTimeout(step, 520);
        return;
      }

      window.setTimeout(step, 38);
    }

    rotator.textContent = '';
    window.setTimeout(step, 520);
  }

  function initFeaturedCarousel() {
    var carousels = document.querySelectorAll('[data-fp-carousel]');
    if (!carousels.length) return;

    carousels.forEach(function (carousel) {
      var viewport = carousel.querySelector('.fp-carousel__viewport');
      var track = carousel.querySelector('.fp-carousel__track');
      var prevButton = carousel.querySelector('[data-fp-prev]');
      var nextButton = carousel.querySelector('[data-fp-next]');
      if (!viewport || !track || !prevButton || !nextButton) return;

      var originalCards = Array.prototype.slice.call(track.children);
      if (originalCards.length < 2) return;

      var transitionValue = 'transform 760ms cubic-bezier(0.22, 0.74, 0.21, 1)';
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var autoplayDelay = 4600;
      var autoplayId = null;
      var paused = false;
      var index = 0;
      var cardWidth = 0;
      var gapWidth = 0;
      var resizeTimeout = null;
      var isAnimating = false;
      var cloneCount = 0;

      function getPerView() {
        var raw = window.getComputedStyle(carousel).getPropertyValue('--fp-per-view');
        var parsed = parseInt(raw, 10);
        return parsed > 0 ? parsed : 1;
      }

      function getGap() {
        var styles = window.getComputedStyle(track);
        var raw = styles.columnGap || styles.gap || '0';
        var parsed = parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : 0;
      }

      function disableCloneFocus(card) {
        card.setAttribute('aria-hidden', 'true');
        var focusables = card.querySelectorAll('a, button, input, select, textarea, [tabindex]');
        focusables.forEach(function (node) {
          node.setAttribute('tabindex', '-1');
        });
      }

      cloneCount = Math.min(originalCards.length, Math.max(3, getPerView()));
      index = cloneCount;

      var prependFragment = document.createDocumentFragment();
      var appendFragment = document.createDocumentFragment();
      var prependStart = originalCards.length - cloneCount;

      for (var i = prependStart; i < originalCards.length; i += 1) {
        var prependClone = originalCards[i].cloneNode(true);
        disableCloneFocus(prependClone);
        prependFragment.appendChild(prependClone);
      }

      for (var j = 0; j < cloneCount; j += 1) {
        var appendClone = originalCards[j].cloneNode(true);
        disableCloneFocus(appendClone);
        appendFragment.appendChild(appendClone);
      }

      track.insertBefore(prependFragment, track.firstChild);
      track.appendChild(appendFragment);

      function allCards() {
        return Array.prototype.slice.call(track.children);
      }

      function setCardWidths() {
        var perView = getPerView();
        gapWidth = getGap();
        cardWidth = (viewport.clientWidth - gapWidth * (perView - 1)) / perView;

        allCards().forEach(function (card) {
          card.style.flexBasis = cardWidth + 'px';
        });
      }

      function setTrackPosition(animate) {
        var shouldAnimate = animate !== false && !reduceMotion;
        track.style.transition = shouldAnimate ? transitionValue : 'none';
        var offset = index * (cardWidth + gapWidth);
        track.style.transform = 'translate3d(' + -offset + 'px, 0, 0)';

        if (!shouldAnimate) {
          track.offsetHeight;
          track.style.transition = transitionValue;
          isAnimating = false;
        } else {
          isAnimating = true;
        }
      }

      function normalizeLoop() {
        if (index < cloneCount) {
          index += originalCards.length;
          setTrackPosition(false);
        }

        if (index >= originalCards.length + cloneCount) {
          index -= originalCards.length;
          setTrackPosition(false);
        }

        isAnimating = false;
      }

      function next() {
        if (isAnimating) return;
        index += 1;
        setTrackPosition(true);
        if (reduceMotion) normalizeLoop();
      }

      function prev() {
        if (isAnimating) return;
        index -= 1;
        setTrackPosition(true);
        if (reduceMotion) normalizeLoop();
      }

      function stopAutoplay() {
        if (!autoplayId) return;
        window.clearInterval(autoplayId);
        autoplayId = null;
      }

      function startAutoplay() {
        if (reduceMotion) return;
        stopAutoplay();
        autoplayId = window.setInterval(function () {
          if (paused) return;
          next();
        }, autoplayDelay);
      }

      function setPaused(value) {
        paused = value;
        if (paused) {
          stopAutoplay();
          return;
        }
        startAutoplay();
      }

      nextButton.addEventListener('click', function () {
        next();
        if (!paused) startAutoplay();
      });

      prevButton.addEventListener('click', function () {
        prev();
        if (!paused) startAutoplay();
      });

      carousel.addEventListener('mouseenter', function () {
        setPaused(true);
      });

      carousel.addEventListener('mouseleave', function () {
        setPaused(false);
      });

      carousel.addEventListener('focusin', function () {
        setPaused(true);
      });

      carousel.addEventListener('focusout', function (event) {
        if (carousel.contains(event.relatedTarget)) return;
        setPaused(false);
      });

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          stopAutoplay();
          return;
        }
        if (!paused) startAutoplay();
      });

      track.addEventListener('transitionend', function (event) {
        if (event.propertyName !== 'transform') return;
        normalizeLoop();
      });

      window.addEventListener('resize', function () {
        window.clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(function () {
          setCardWidths();
          setTrackPosition(false);
        }, 120);
      });

      setCardWidths();
      setTrackPosition(false);
      startAutoplay();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initThemeToggle();
    initTabs();
    initTyping();
    initFeaturedCarousel();
  });
})();
