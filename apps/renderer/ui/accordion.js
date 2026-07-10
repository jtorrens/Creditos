(function (root) {
  function createAccordion(options = {}) {
    const documentRef = options.documentRef || root.document;
    const openByGroup = new Map();

    function renderAccordionGroup(groupId, items = [], groupOptions = {}) {
      const group = documentRef.createElement('div');
      group.className = 'accordion-group';
      group.dataset.accordionGroup = groupId;

      const validItems = items.filter((item) => item && item.id && item.title && typeof item.render === 'function');
      if (!validItems.length) return group;

      const storedOpenId = openByGroup.get(groupId);
      const defaultOpenId = groupOptions.initialOpenId || validItems[0].id;
      const currentOpenId = storedOpenId === null || validItems.some((item) => item.id === storedOpenId) ? storedOpenId : defaultOpenId;
      openByGroup.set(groupId, currentOpenId);

      const cards = validItems.map((item) => {
        const card = documentRef.createElement('section');
        card.className = 'accordion-card';
        card.dataset.accordionId = item.id;

        const header = documentRef.createElement('button');
        header.type = 'button';
        header.className = 'accordion-card-header';
        header.setAttribute('aria-expanded', 'false');

        const title = documentRef.createElement('span');
        title.className = 'accordion-card-title';
        title.textContent = item.title;
        header.appendChild(title);

        if (item.summary) {
          const summary = documentRef.createElement('span');
          summary.className = 'accordion-card-summary';
          summary.textContent = item.summary;
          header.appendChild(summary);
        }

        const marker = documentRef.createElement('span');
        marker.className = 'accordion-card-marker';
        marker.textContent = 'v';

        const panel = documentRef.createElement('div');
        panel.className = 'accordion-card-panel';
        item.render(panel);

        const status = documentRef.createElement('span');
        status.className = 'accordion-card-status';
        status.setAttribute('aria-hidden', 'true');
        updateStatusDots(status, panel, item.status);
        header.appendChild(status);
        header.appendChild(marker);

        header.addEventListener('click', () => {
          openByGroup.set(groupId, openByGroup.get(groupId) === item.id ? null : item.id);
          updateCards();
        });

        card.appendChild(header);
        card.appendChild(panel);
        group.appendChild(card);
        return { card, header, marker, panel, item };
      });

      function updateCards() {
        const openId = openByGroup.get(groupId);
        cards.forEach(({ card, header, marker, panel, item }) => {
          const isOpen = item.id === openId;
          card.classList.toggle('open', isOpen);
          header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          panel.hidden = !isOpen;
          marker.textContent = isOpen ? '^' : 'v';
        });
      }

      updateCards();
      return group;
    }

    function updateStatusDots(status, panel, explicitStatus = null) {
      const resolvedStatus = typeof explicitStatus === 'function' ? explicitStatus() : (explicitStatus || {});
      const hasOverride = !!resolvedStatus.override || panel.querySelector('.override-field, .override-control');
      const hasAnimation = !!resolvedStatus.animation || panel.querySelector('.keyframe-toggle.active');
      status.innerHTML = '';
      if (hasOverride) {
        status.appendChild(statusDot('override'));
      }
      if (hasAnimation) {
        status.appendChild(statusDot('animation'));
      }
    }

    function statusDot(kind) {
      const dot = documentRef.createElement('span');
      dot.className = `accordion-status-dot ${kind}`;
      return dot;
    }

    return {
      renderAccordionGroup,
    };
  }

  root.CreditosUiAccordion = {
    createAccordion,
  };
})(globalThis);
