(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("issue-panel", class extends Controller {
    static targets = ["body", "external"]

    connect() {
      this._abort = null;
      this._cache = new Map();           // url -> { html, ts }
      this._cacheTtl = 30_000;           // 30s
      this._assetsInjected = false;

      this._onKeydown = (e) => { if (e.key === 'Escape') this.close(); };
      this._onFieldEditSaved = (e) => this._handleFieldEditSaved(e);
      this._onDocClick = (e) => this._handleDocClick(e);
      this._onDocSubmit = (e) => this._handleDocSubmit(e);

      document.addEventListener('keydown', this._onKeydown);
      window.addEventListener('field-edit:saved', this._onFieldEditSaved);
      document.addEventListener('click', this._onDocClick);
      document.addEventListener('submit', this._onDocSubmit);

      // Public API consommée par gantt_controller / todo_controller / inbox_controller
      window.IssuePanel = { open: (url) => this.open(url), close: () => this.close() };
    }

    disconnect() {
      document.removeEventListener('keydown', this._onKeydown);
      window.removeEventListener('field-edit:saved', this._onFieldEditSaved);
      document.removeEventListener('click', this._onDocClick);
      document.removeEventListener('submit', this._onDocSubmit);
      this._abort?.abort();
      if (window.IssuePanel && window.IssuePanel.open === this.open) window.IssuePanel = null;
    }

    // ── API publique ─────────────────────────────────────────────
    open(url) {
      this.externalTarget.href = url;
      this.bodyTarget.innerHTML = '<div class="issue-panel__loading">Chargement\u2026</div>';
      this.element.classList.add('is-open');
      document.body.classList.add('issue-panel-open');
      this._load(url);
    }

    close() {
      this.element.classList.remove('is-open');
      document.body.classList.remove('issue-panel-open');
    }

    // ── Chargement avec cache + abort ────────────────────────────
    async _load(url) {
      const cached = this._cache.get(url);
      if (cached && Date.now() - cached.ts < this._cacheTtl) {
        this.bodyTarget.innerHTML = cached.html;
        this._runInlineScripts(this.bodyTarget);
        this._activateDefaultTab();
        return;
      }

      this._abort?.abort();
      this._abort = new AbortController();
      const signal = this._abort.signal;

      try {
        const panelUrl = url + (url.includes('?') ? '&' : '?') + 'panel=1';
        const res = await fetch(panelUrl, { credentials: 'same-origin', signal });
        const html = await res.text();
        if (signal.aborted) return;
        const doc = new DOMParser().parseFromString(html, 'text/html');

        if (!this._assetsInjected) {
          await this._injectHeadAssets(doc);
          this._assetsInjected = true;
        }
        if (signal.aborted) return;

        // Avec le layout panel : pas de #content, on prend body directement.
        // Fallback si le serveur retourne la page complète (patch pas encore actif) : on extrait #content.
        const contentEl = doc.querySelector('#content') ?? doc.body;
        const content = contentEl?.innerHTML ?? '';
        if (!content || !this.element.classList.contains('is-open')) return;

        this._cache.set(url, { html: content, ts: Date.now() });

        // Afficher temporairement les forms cachés pour que select2 calcule sa largeur
        this.bodyTarget.innerHTML = content;
        const hiddenForms = this.bodyTarget.querySelectorAll('.hidden');
        hiddenForms.forEach(el => el.style.display = 'block');
        this._runInlineScripts(this.bodyTarget);
        setTimeout(() => hiddenForms.forEach(el => el.style.display = ''), 200);
        this._activateDefaultTab();
      } catch (e) {
        if (e.name === 'AbortError') return;
        this.bodyTarget.innerHTML = '<p style="padding:2rem;color:#ef4444;">Erreur de chargement</p>';
      }
    }

    // ── Injection unique des assets du formateur wiki ────────────
    async _injectHeadAssets(doc) {
      // CSS
      doc.querySelectorAll('head link[rel="stylesheet"]').forEach(l => {
        const href = l.getAttribute('href') || '';
        if (!href.includes('jstoolbar') && !href.toLowerCase().includes('ckeditor')) return;
        const filename = href.split('/').pop().split('?')[0];
        if (!filename || document.querySelector('link[href*="' + filename + '"]')) return;
        const nl = document.createElement('link');
        nl.rel = 'stylesheet';
        nl.href = l.href;
        document.head.appendChild(nl);
      });

      // Scripts : externes + inline CKEditor, dans l'ordre du DOM
      const items = [];
      doc.querySelectorAll('head script').forEach(s => {
        const src = s.getAttribute('src') || '';
        const text = s.textContent || '';
        if (src) {
          if (!src.includes('jstoolbar') && !src.toLowerCase().includes('ckeditor')) return;
          const filename = src.split('/').pop().split('?')[0];
          if (!filename || document.querySelector('script[src*="' + filename + '"]')) return;
          items.push({ type: 'src', value: s.src });
        } else if (
          text.includes('CKEDITOR_BASEPATH') ||
          text.includes('CKEDITOR.plugins') ||
          text.includes('CKEditor.mentionsConfig') ||
          text.includes('instanceReady')
        ) {
          items.push({ type: 'inline', value: text });
        }
      });

      // Chargement séquentiel pour respecter les dépendances
      for (const item of items) {
        await new Promise(resolve => {
          const ns = document.createElement('script');
          if (item.type === 'src') {
            ns.src = item.value;
            ns.onload = resolve;
            ns.onerror = resolve;
            document.head.appendChild(ns);
          } else {
            ns.textContent = item.value;
            document.head.appendChild(ns);
            document.head.removeChild(ns);
            resolve();
          }
        });
      }
    }

    _runInlineScripts(container) {
      container.querySelectorAll('script:not([src])').forEach(old => {
        const s = document.createElement('script');
        s.textContent = old.textContent;
        document.head.appendChild(s);
        document.head.removeChild(s);
      });
    }

    _activateDefaultTab() {
      const activeTab = this.bodyTarget.querySelector('.tabs ul li.selected a, .tabs ul li:first-child a');
      if (!activeTab) return;
      const js = activeTab.getAttribute('href');
      if (js && js.startsWith('javascript:')) {
        try { (0, eval)(js.slice(11)); } catch (_) {}
      }
    }

    // ── Refresh de la liste parente (hors panel) ─────────────────
    async _refreshParentList() {
      const tables = document.querySelectorAll('table.issues');
      const table = Array.from(tables).find(t => !t.closest('.issue-panel'));
      if (!table) return;
      try {
        const res = await fetch(window.location.href, { credentials: 'same-origin' });
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newTable = doc.querySelector('table.issues');
        if (newTable) table.outerHTML = newTable.outerHTML;
      } catch (e) { /* silencieux */ }
    }

    // ── Handlers d'événements globaux ────────────────────────────

    // Field-edit sauvegarde : invalide le cache de l'issue, recharge le panel si besoin, refresh liste
    _handleFieldEditSaved(e) {
      if (!this.element.classList.contains('is-open')) return;
      const issueUrl = this.externalTarget.href;
      this._cache.delete(issueUrl);
      // Si le save vient de l'intérieur du panel, recharger son contenu
      if (e.target && e.target.closest && e.target.closest('.issue-panel__body')) {
        this._load(issueUrl);
      }
      this._refreshParentList();
    }

    _handleDocClick(e) {
      const isOpen = this.element.classList.contains('is-open');

      // Clic sur sujet d'issue dans la liste → ouvrir le panel (beta)
      if (document.body.dataset.issuePanelBeta === 'true' &&
          !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        const link = e.target.closest('table.issues td.subject a');
        if (link && !link.closest('.issue-panel')) {
          e.preventDefault();
          this.open(link.href);
          return;
        }
      }

      if (!isOpen) return;
      const inBody = e.target.closest('.issue-panel__body');

      // Prévisualisation jstoolbar dans le panel
      const tab = inBody ? e.target.closest('div.jstTabs a.tab-preview') : null;
      if (tab) {
        const previewUrl = tab.getAttribute('data-url');
        if (!previewUrl) return;
        const jstBlock = tab.closest('.jstBlock');
        if (!jstBlock) return;
        const wikiEdit = jstBlock.querySelector('.wiki-edit');
        const text = wikiEdit ? encodeURIComponent(wikiEdit.value) : '';
        const csrf = document.querySelector('meta[name="csrf-token"]');
        fetch(previewUrl, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-Token': csrf ? csrf.getAttribute('content') : ''
          },
          body: 'text=' + text
        }).then(r => r.text()).then(html => {
          const preview = jstBlock.querySelector('.wiki-preview');
          if (preview) preview.innerHTML = html;
        });
        return;
      }

      // Prev/next navigation dans le panel
      if (inBody && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        const link = e.target.closest('.next-prev-links a');
        if (link && link.href) {
          e.preventDefault();
          this.externalTarget.href = link.href;
          this.bodyTarget.innerHTML = '<div class="issue-panel__loading">Chargement\u2026</div>';
          this._load(link.href);
        }
      }
    }

    _handleDocSubmit(e) {
      if (!this.element.classList.contains('is-open')) return;
      if (!e.target.closest('.issue-panel__body')) return;
      e.preventDefault();

      const form = e.target;
      const issueUrl = this.externalTarget.href;
      this.bodyTarget.style.opacity = '0.5';

      // Synchroniser les instances CKEditor du panel vers leurs textarea
      if (window.CKEDITOR) {
        for (const id in CKEDITOR.instances) {
          const inst = CKEDITOR.instances[id];
          if (form.contains(document.getElementById(id))) inst.updateElement();
        }
      }

      const csrf = document.querySelector('meta[name="csrf-token"]');
      const headers = csrf ? { 'X-CSRF-Token': csrf.getAttribute('content') } : {};

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        credentials: 'same-origin',
        headers
      }).then(res => {
        this.bodyTarget.style.opacity = '';
        if (res.ok) {
          this._cache.delete(issueUrl);
          this._load(issueUrl);
          this._refreshParentList();
        } else {
          this.bodyTarget.innerHTML = '<p style="padding:2rem;color:#ef4444;">Erreur (' + res.status + ')</p>';
        }
      }).catch(() => {
        this.bodyTarget.style.opacity = '';
      });
    }
  });
})();
