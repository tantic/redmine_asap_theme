(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register('documents', class extends Controller {
    static targets = ['category', 'body', 'chevron'];

    connect() {
      this.categoryTargets.forEach(cat => {
        const id = cat.dataset.categoryId;
        const collapsed = localStorage.getItem(`docs_cat_${id}`) === 'collapsed';
        if (collapsed) this._collapse(cat, false);
      });
    }

    toggle(e) {
      const cat = e.currentTarget.closest('[data-documents-target="category"]');
      if (!cat) return;
      const id = cat.dataset.categoryId;
      const body = cat.querySelector('[data-documents-target="body"]');
      const chevron = cat.querySelector('[data-documents-target="chevron"]');
      const isCollapsed = body.classList.contains('docs-hidden');
      if (isCollapsed) {
        body.classList.remove('docs-hidden');
        chevron.classList.remove('docs-chevron--collapsed');
        localStorage.setItem(`docs_cat_${id}`, 'open');
      } else {
        body.classList.add('docs-hidden');
        chevron.classList.add('docs-chevron--collapsed');
        localStorage.setItem(`docs_cat_${id}`, 'collapsed');
      }
    }

    _collapse(cat, animate) {
      const body = cat.querySelector('[data-documents-target="body"]');
      const chevron = cat.querySelector('[data-documents-target="chevron"]');
      body.classList.add('docs-hidden');
      chevron.classList.add('docs-chevron--collapsed');
    }
  });
})();
