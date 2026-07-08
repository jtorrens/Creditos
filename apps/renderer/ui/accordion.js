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
        header.appendChild(marker);

        const panel = documentRef.createElement('div');
        panel.className = 'accordion-card-panel';
        item.render(panel);

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

    return {
      renderAccordionGroup,
    };
  }

  root.CreditosUiAccordion = {
    createAccordion,
  };
})(globalThis);
