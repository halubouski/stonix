/* Stonix landing: hero height, sliders, mobile menu, FAQ accordion, quote modal (dialog / bottom sheet),
   forms (validation, phone format, attachments). */
(() => {
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const compactMq = matchMedia('(max-width: 1279.98px)');
  const behavior = () => (reducedMotion.matches ? 'auto' : 'smooth');

  /* --fixed-vh: set in <head>; updated only when the width changes, so mobile toolbars do not make the hero jump */
  let lastWidth = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastWidth) return;
    lastWidth = innerWidth;
    root.style.setProperty('--fixed-vh', innerHeight + 'px');
  });

  /* ---------- Sliders: [data-slider="name"] ----------
     Our work (node 41:154 / 52:336) on every screen, Materials (node 52:280) on compact screens only
     (on desktop the tiles fit, so there is nothing to scroll). Native horizontal scroll + scroll snap
     (touch, trackpad, keyboard); arrows [data-<name>-prev|next] step one card, dots [data-dots-for="<name>"]
     jump to a card, a mouse can drag the track. Arrows are disabled at either end. */
  function initSlider(track) {
    const name = track.dataset.slider;
    const prevs = [...document.querySelectorAll(`[data-${name}-prev]`)];
    const nexts = [...document.querySelectorAll(`[data-${name}-next]`)];
    const dotsBox = document.querySelector(`[data-dots-for="${name}"]`);
    const cards = [...track.querySelectorAll(':scope > li, :scope > * > li')];
    const edge = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const maxScroll = () => track.scrollWidth - track.clientWidth;

    // Snap positions of the cards; positions close to the end merge into the end itself
    const targets = () => {
      const max = maxScroll();
      if (max <= 1) return [0];
      const near = (cards[0]?.offsetWidth || 0) * 0.4;
      return [...new Set(cards.map((card) => {
        const t = Math.max(0, card.offsetLeft - edge());
        return max - t < near ? max : t;
      }))];
    };
    const current = (list) => {
      const x = track.scrollLeft;
      return list.reduce((best, t, i) => (Math.abs(t - x) < Math.abs(list[best] - x) ? i : best), 0);
    };
    const go = (left) => track.scrollTo({ left, behavior: behavior() });

    let dotCount = -1;
    const renderDots = (list) => {
      if (!dotsBox) return;
      if (list.length !== dotCount) {
        dotCount = list.length;
        dotsBox.replaceChildren(...list.map((t, i) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'slider-dot';
          dot.setAttribute('aria-label', `Go to slide ${i + 1} of ${list.length}`);
          dot.addEventListener('click', () => go(targets()[i] ?? 0));
          return dot;
        }));
        dotsBox.hidden = list.length < 2;
      }
      const active = current(list);
      [...dotsBox.children].forEach((dot, i) => {
        dot.classList.toggle('is-active', i === active);
        dot.toggleAttribute('aria-current', i === active);
      });
    };

    const update = () => {
      const list = targets();
      prevs.forEach((b) => (b.disabled = track.scrollLeft <= 2));
      nexts.forEach((b) => (b.disabled = track.scrollLeft >= maxScroll() - 2));
      renderDots(list);
    };
    const step = (dir) => {
      const x = track.scrollLeft;
      const list = targets();
      const left = dir > 0 ? list.find((t) => t > x + 2) : [...list].reverse().find((t) => t < x - 2);
      go(left ?? (dir > 0 ? maxScroll() : 0));
    };
    prevs.forEach((b) => b.addEventListener('click', () => step(-1)));
    nexts.forEach((b) => b.addEventListener('click', () => step(1)));
    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }, { passive: true });
    addEventListener('resize', update);
    update();

    // Mouse drag (touch and pens scroll natively)
    let drag = null;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || maxScroll() <= 1) return;
      drag = { x: e.clientX, left: track.scrollLeft, moved: false, id: e.pointerId };
    });
    track.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 4) return;
      if (!drag.moved) {
        drag.moved = true;
        track.classList.add('is-dragging');
        track.setPointerCapture(drag.id);
      }
      track.scrollLeft = drag.left - dx;
    });
    const endDrag = () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (!moved) return;
      // Settle on the nearest card, then hand control back to scroll snap
      const list = targets();
      go(list[current(list)]);
      setTimeout(() => track.classList.remove('is-dragging'), reducedMotion.matches ? 0 : 450);
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('dragstart', (e) => e.preventDefault());

    // Load every card's photo once the slider is near, so none decodes in the middle of a swipe
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      track.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
    }, { rootMargin: '600px 0px' });
    io.observe(track);
  }
  document.querySelectorAll('[data-slider]').forEach(initSlider);

  /* ---------- Mobile menu (node 52:621) ----------
     The burger opens a full-screen panel; page scroll stops while it is open; Esc, the close button
     and every link close it (a link closes first, so its anchor scroll or popup runs on an unlocked page). */
  const menu = document.querySelector('[data-mobile-menu]');
  const menuOpener = document.querySelector('[data-menu-open]');
  if (menu && menuOpener) {
    const openMenu = () => {
      menu.inert = false;
      menu.classList.add('is-open');
      menuOpener.setAttribute('aria-expanded', 'true');
      root.classList.add('is-locked');
      menu.querySelector('.mnav__head button[data-menu-close]')?.focus({ preventScroll: true });
    };
    const closeMenu = (refocus = true) => {
      if (!menu.classList.contains('is-open')) return;
      menu.classList.remove('is-open');
      menu.inert = true;
      menuOpener.setAttribute('aria-expanded', 'false');
      root.classList.remove('is-locked');
      if (refocus) menuOpener.focus({ preventScroll: true });
    };
    menuOpener.addEventListener('click', openMenu);
    menu.querySelectorAll('[data-menu-close]').forEach((el) => {
      el.addEventListener('click', () => closeMenu(el.tagName === 'BUTTON'));
    });
    menu.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());
    compactMq.addEventListener('change', () => !compactMq.matches && closeMenu(false));
  }

  /* ---------- FAQ accordion (node 11:95 / 52:493): one item open at a time ---------- */
  const accordion = document.querySelector('[data-accordion]');
  if (accordion) {
    const items = [...accordion.querySelectorAll('.faq-item')];
    const setOpen = (item, open) => {
      item.classList.toggle('is-open', open);
      item.querySelector('.faq-item__btn').setAttribute('aria-expanded', String(open));
    };
    items.forEach((item) => {
      item.querySelector('.faq-item__btn').addEventListener('click', () => {
        const open = !item.classList.contains('is-open');
        items.forEach((other) => other !== item && setOpen(other, false));
        setOpen(item, open);
      });
    });
  }

  /* ---------- Quote modal (nodes 13:154 / 13:219; compact: bottom sheet 52:673 / 52:735) ---------- */
  const modal = document.querySelector('[data-modal]');
  let returnFocus = null;
  let closeTimer = 0;

  const setView = (name) => {
    modal.querySelectorAll('[data-modal-view]').forEach((view) => {
      view.hidden = view.dataset.modalView !== name;
    });
    modal.setAttribute('aria-labelledby', name === 'sent' ? 'modal-sent-title' : 'modal-title');
  };

  // Compact screens: the dialog is a bottom sheet that slides up / down (Web Animations, see compact.tpl.css)
  const SHEET_IN = { duration: 700, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' };
  const SHEET_OUT = { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.9, 0.6)', fill: 'forwards' };
  const sheetMode = () => compactMq.matches && !reducedMotion.matches;
  const slideSheet = (from, to, timing) => {
    modal.getAnimations().forEach((a) => a.cancel());
    return modal.animate([{ transform: `translateY(${from})` }, { transform: `translateY(${to})` }], timing);
  };

  const openModal = (view = 'form', trigger = document.activeElement) => {
    if (!modal) return;
    clearTimeout(closeTimer);
    setView(view);
    if (!modal.open) {
      returnFocus = trigger;
      // park the sheet below the screen before the dialog's first paint
      if (sheetMode()) modal.style.transform = 'translateY(100%)';
      modal.showModal();
      root.classList.add('is-locked');
      if (sheetMode()) {
        slideSheet('100%', '0', SHEET_IN).finished.then(() => modal.style.removeProperty('transform')).catch(() => {});
      }
      requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
    }
    // On phones the title takes the focus, not the first field, so the keyboard does not jump the sheet
    const focusTarget = view === 'sent' || compactMq.matches
      ? modal.querySelector(view === 'sent' ? '#modal-sent-title' : '#modal-title')
      : modal.querySelector('#m-name');
    focusTarget?.focus({ preventScroll: true });
  };

  const closeModal = () => {
    if (!modal?.open) return;
    modal.classList.remove('is-open');
    if (sheetMode()) slideSheet('0', '100%', SHEET_OUT);
    const finish = () => {
      modal.close();
      modal.getAnimations().forEach((a) => a.cancel());
      modal.style.removeProperty('transform');
      root.classList.remove('is-locked');
      setView('form');
      resetForm(modal.querySelector('[data-form]'));
      returnFocus?.focus?.({ preventScroll: true });
    };
    closeTimer = setTimeout(finish, reducedMotion.matches ? 0 : (compactMq.matches ? 420 : 350));
  };

  if (modal) {
    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-modal-open]');
      if (opener) {
        e.preventDefault();
        openModal('form', opener);
      }
    });
    modal.querySelectorAll('[data-modal-close]').forEach((btn) => btn.addEventListener('click', closeModal));
    // Esc: animate out instead of the instant native close
    modal.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeModal();
    });
    // A press on the backdrop (outside the panel's box) closes
    modal.addEventListener('pointerdown', (e) => {
      if (e.target !== modal) return;
      const r = modal.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) closeModal();
    });
  }

  /* ---------- Forms: inline quote form (node 8:122 / 52:441) and the modal form ----------
     No backend yet: a valid submit shows the modal's "sent" view. */
  const VALIDATORS = {
    required: (v) => (v.trim() ? '' : 'Please fill this in.'),
    phone: (v) => (v.replace(/\D/g, '').replace(/^1/, '').length === 10 ? '' : 'Enter a 10-digit phone number.'),
    email: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email.'),
    zip: (v) => (!v.trim() || /^\d{5}(-\d{4})?$/.test(v.trim()) ? '' : 'Enter a 5-digit ZIP code.'),
  };
  const MAX_BYTES = 10 * 1024 * 1024;

  // US format while typing: (206) 555-0100
  const formatPhone = (value) => {
    const d = value.replace(/\D/g, '').replace(/^1/, '').slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const check = (input) => {
    const message = VALIDATORS[input.dataset.validate](input.value);
    const error = document.getElementById(input.getAttribute('aria-describedby'));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) error.textContent = message;
    return !message;
  };

  function resetForm(form) {
    if (!form) return;
    form.reset();
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field__error').forEach((el) => (el.textContent = ''));
    const hint = form.querySelector('[data-attach-hint]');
    if (hint) hint.textContent = hint.dataset.default;
  }

  document.querySelectorAll('[data-form]').forEach((form) => {
    const fields = [...form.querySelectorAll('[data-validate]')];
    fields.forEach((input) => {
      input.addEventListener('blur', () => input.value && check(input));
      input.addEventListener('input', () => {
        if (input.dataset.validate === 'phone') {
          // reformat only when typing at the end, so editing in the middle keeps the caret where it is
          const atEnd = input.selectionStart === input.value.length;
          const formatted = formatPhone(input.value);
          if (formatted !== input.value && atEnd) input.value = formatted;
        }
        if (input.getAttribute('aria-invalid') === 'true') check(input);
      });
    });

    // Attachments: PDF, JPG or PNG up to 10 MB each; the hint shows what was picked
    const attach = form.querySelector('[data-attach]');
    const hint = form.querySelector('[data-attach-hint]');
    attach?.addEventListener('change', () => {
      const files = [...attach.files];
      const tooBig = files.find((f) => f.size > MAX_BYTES);
      if (tooBig) {
        attach.value = '';
        hint.textContent = `${tooBig.name} is larger than 10 MB`;
        return;
      }
      hint.textContent = files.length ? files.map((f) => f.name).join(', ') : hint.dataset.default;
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const invalid = fields.filter((input) => !check(input));
      if (invalid.length) {
        invalid[0].focus();
        return;
      }
      // TODO: send to the endpoint in form.getAttribute('action') once the backend exists
      resetForm(form);
      openModal('sent', form.querySelector('[type="submit"]'));
    });
  });
})();
