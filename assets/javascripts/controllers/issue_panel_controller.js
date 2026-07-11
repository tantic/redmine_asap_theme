(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("issue-panel", class extends Controller {
    static targets = ["body", "external", "navPrev", "navNext", "navPosition", "actions"]

    connect() {
      this._abort = null;
      this._cache = new Map();           // url -> { html, ts }
      this._cacheTtl = 120_000;          // 2min (invalidé sur save)
      this._assetsInjected = false;
      this._currentUrl = null;
      this._prevUrl = null;
      this._nextUrl = null;
      this._turboMode = this.bodyTarget.tagName === 'TURBO-FRAME';

      this._onKeydown = (e) => { if (e.key === 'Escape') this.close(); };
      this._onFieldEditSaved = (e) => this._handleFieldEditSaved(e);
      this._onDocClick = (e) => this._handleDocClick(e);
      this._onDocSubmit = (e) => this._handleDocSubmit(e);

      document.addEventListener('keydown', this._onKeydown);
      window.addEventListener('field-edit:saved', this._onFieldEditSaved);
      document.addEventListener('click', this._onDocClick);
      document.addEventListener('submit', this._onDocSubmit);

      if (this._turboMode) {
        this._onTurboFrameLoad = () => this._handleTurboFrameLoad().catch(() => {});
        this._onTurboBeforeFetch = (e) => {
          const url = e.detail.url;
          if (!url) return;
          if (url && !url.searchParams.has('panel')) {
            url.searchParams.set('panel', '1');
          }
          // Ne mettre à jour le lien externe que si c'est une navigation vers une issue
          if (/\/issues\/\d+/.test(url.pathname)) {
            const cleanUrl = new URL(url.toString());
            cleanUrl.searchParams.delete('panel');
            this._currentUrl = cleanUrl.toString();
            this.externalTarget.href = this._currentUrl;
          }
        };
        this.bodyTarget.addEventListener('turbo:frame-load', this._onTurboFrameLoad);
        this.bodyTarget.addEventListener('turbo:before-fetch-request', this._onTurboBeforeFetch);
      }

      // Public API consommée par gantt_controller / todo_controller / inbox_controller
      window.IssuePanel = {
        open:       (url) => this.open(url),
        close:      ()    => this.close(),
        invalidate: (issueId) => {
          for (const key of this._cache.keys()) {
            if (key.includes(`/issues/${issueId}`)) this._cache.delete(key);
          }
          if (this._currentUrl?.includes(`/issues/${issueId}`)) {
            this.bodyTarget.innerHTML = '<div class="issue-panel__loading">Chargement…</div>';
            this._load(this._currentUrl);
          }
        }
      };
    }

    disconnect() {
      document.removeEventListener('keydown', this._onKeydown);
      window.removeEventListener('field-edit:saved', this._onFieldEditSaved);
      document.removeEventListener('click', this._onDocClick);
      document.removeEventListener('submit', this._onDocSubmit);
      this._abort?.abort();
      if (this._turboMode) {
        this.bodyTarget.removeEventListener('turbo:frame-load', this._onTurboFrameLoad);
        this.bodyTarget.removeEventListener('turbo:before-fetch-request', this._onTurboBeforeFetch);
      }
      if (window.IssuePanel && window.IssuePanel.open === this.open) window.IssuePanel = null;
    }

    // ── API publique ─────────────────────────────────────────────
    open(url) {
      this._currentUrl = url;
      this.externalTarget.href = url;
      this._prevUrl = null;
      this._nextUrl = null;
      if (this.hasNavPrevTarget) this.navPrevTarget.disabled = true;
      if (this.hasNavNextTarget) this.navNextTarget.disabled = true;
      if (this.hasNavPositionTarget) this.navPositionTarget.textContent = '';
      if (this.hasActionsTarget) this.actionsTarget.innerHTML = '';
      this.bodyTarget.innerHTML = '<div class="issue-panel__loading">Chargement…</div>';
      this.element.classList.add('is-open');
      document.body.classList.add('issue-panel-open');
      if (this._turboMode) {
        const panelUrl = url + (url.includes('?') ? '&' : '?') + 'panel=1';
        this.bodyTarget.setAttribute('src', panelUrl);
      } else {
        this._load(url);
      }
    }

    goNavPrev() { if (this._prevUrl) this._navigate(this._prevUrl); }
    goNavNext() { if (this._nextUrl) this._navigate(this._nextUrl); }

    _navigate(url) {
      this._currentUrl = url;
      this.externalTarget.href = url;
      this._prevUrl = null;
      this._nextUrl = null;
      if (this.hasNavPrevTarget) this.navPrevTarget.disabled = true;
      if (this.hasNavNextTarget) this.navNextTarget.disabled = true;
      if (this.hasNavPositionTarget) this.navPositionTarget.textContent = '';
      if (this.hasActionsTarget) this.actionsTarget.innerHTML = '';
      if (this._turboMode) {
        const panelUrl = url + (url.includes('?') ? '&' : '?') + 'panel=1';
        this.bodyTarget.setAttribute('src', panelUrl);
      } else {
        this.bodyTarget.innerHTML = '<div class="issue-panel__loading">Chargement…</div>';
        this._load(url);
      }
    }

    _updateNavToolbar() {
      const data = this.bodyTarget.querySelector('#issue-panel-nav-data');
      this._prevUrl = data?.dataset.prev || null;
      this._nextUrl = data?.dataset.next || null;
      const label = data?.dataset.label || '';
      if (this.hasNavPrevTarget) this.navPrevTarget.disabled = !this._prevUrl;
      if (this.hasNavNextTarget) this.navNextTarget.disabled = !this._nextUrl;
      if (this.hasNavPositionTarget) this.navPositionTarget.textContent = label;
    }

    _updateActionsToolbar() {
      if (!this.hasActionsTarget) return;
      this.actionsTarget.innerHTML = '';
      const menu = this.bodyTarget.querySelector('#issue-panel-action-menu');
      if (!menu) return;
      // Skip the .contextual wrapper — move its children directly into the toolbar
      const source = menu.querySelector('.contextual') || menu;
      while (source.firstChild) this.actionsTarget.appendChild(source.firstChild);
      menu.remove();

      // The edit button has onclick="showAndScrollTo(…); return false;" which targets the
      // inline form on the full page — that doesn't exist in panel mode. Remove the onclick
      // and load the edit form inside the panel instead.
      const editBtn = this.actionsTarget.querySelector('a.icon-edit');
      if (editBtn) {
        editBtn.removeAttribute('onclick');
        editBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this._navigate(editBtn.href);
        });
      }
    }

    close() {
      this.element.classList.remove('is-open');
      document.body.classList.remove('issue-panel-open');
    }

    // ── Post-load turbo frame ────────────────────────────────────
    async _handleTurboFrameLoad() {
      // Turbo's activateScriptElements() starts loading external scripts (jstoolbar, etc.)
      // but does NOT await them before running inline init scripts → race condition on first load.
      // We detect if jstoolbar was missing, inject assets sequentially, then re-run inline scripts.
      const toolbarMissing = typeof jsToolBar === 'undefined';
      await this._injectFrameHeadAssets();
      if (toolbarMissing && typeof jsToolBar !== 'undefined') {
        this._runInlineScripts(this.bodyTarget);
      }
      this.bodyTarget.querySelectorAll('form').forEach(f => {
        if (!f.hasAttribute('data-turbo')) f.setAttribute('data-turbo', 'false');
      });
      this._fixPanelLinks();
      this._updateNavToolbar();
      this._updateActionsToolbar();
      this._activateDefaultTab();
      if (typeof setupFileDrop === 'function') setupFileDrop();
      this._initAutoComplete();
    }

    // ── Injection séquentielle des assets du frame (jstoolbar, ckeditor, attachments) ──
    async _injectFrameHeadAssets() {
      const items = [];
      this.bodyTarget.querySelectorAll('script[src]').forEach(s => {
        const src = s.getAttribute('src') || '';
        if (!src.includes('jstoolbar') && !src.toLowerCase().includes('ckeditor') && !src.includes('attachments')) return;
        const filename = src.split('/').pop().split('?')[0];
        if (!filename || document.head.querySelector(`script[src*="${filename}"]`)) return;
        items.push(s.src);
      });
      for (const src of items) {
        await new Promise(resolve => {
          const ns = document.createElement('script');
          ns.src = src;
          ns.onload = resolve;
          ns.onerror = resolve;
          document.head.appendChild(ns);
        });
      }
    }

    // ── Chargement avec cache + abort ────────────────────────────
    async _load(url) {
      const cached = this._cache.get(url);
      if (cached && Date.now() - cached.ts < this._cacheTtl) {
        this.bodyTarget.innerHTML = cached.html;
        this._runInlineScripts(this.bodyTarget);
        this._fixPanelLinks();
        this._updateNavToolbar();
        this._updateActionsToolbar();
        this._activateDefaultTab();
        if (typeof setupFileDrop === 'function') setupFileDrop();
        this._initAutoComplete();
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
        this._fixPanelLinks();
        this._updateNavToolbar();
        this._updateActionsToolbar();
        this._activateDefaultTab();
        await this._ensureAttachmentsJs(doc);
        if (typeof setupFileDrop === 'function') setupFileDrop();
        this._initAutoComplete();
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
          if (!src.includes('jstoolbar') && !src.toLowerCase().includes('ckeditor') && !src.includes('attachments')) return;
          const filename = src.split('/').pop().split('?')[0];
          if (!filename || document.querySelector('script[src*="' + filename + '"]')) return;
          items.push({ type: 'src', value: s.src });
        } else if (
          text.includes('CKEDITOR_BASEPATH') ||
          text.includes('CKEDITOR.plugins') ||
          text.includes('CKEditor.mentionsConfig') ||
          text.includes('instanceReady') ||
          text.includes('wikiImageMimeTypes')
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

    // ── Chargement de attachments.js si absent (non chargé sur la page parente) ──
    async _ensureAttachmentsJs(doc) {
      if (typeof setupFileDrop === 'function') return;
      const script = [...doc.querySelectorAll('head script[src]')]
        .find(s => (s.getAttribute('src') || '').includes('attachments'));
      if (!script) return;
      const filename = script.src.split('/').pop().split('?')[0];
      if (filename && document.querySelector(`script[src*="${filename}"]`)) return;
      await new Promise(resolve => {
        const s = document.createElement('script');
        s.src = script.src;
        s.onload = resolve;
        s.onerror = resolve;
        document.head.appendChild(s);
      });
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

    _initAutoComplete() {
      if (typeof inlineAutoComplete !== 'function') return;
      this.bodyTarget.querySelectorAll('[data-auto-complete="true"]').forEach(el => {
        inlineAutoComplete(el);
      });
    }

    // ── Refresh de la liste parente (hors panel) ─────────────────
    async _refreshParentList() {
      const tables = document.querySelectorAll('table.issues');
      const table = Array.from(tables).find(t => !t.closest('.issue-panel'));
      const board = document.querySelector('.board-view:not(.issue-panel .board-view)');
      if (!table && !board) return;
      try {
        const res = await fetch(window.location.href, { credentials: 'same-origin' });
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        if (table) {
          const newTable = doc.querySelector('table.issues');
          if (newTable) table.outerHTML = newTable.outerHTML;
        }
        if (board) {
          const newBoard = doc.querySelector('.board-view');
          if (newBoard) board.outerHTML = newBoard.outerHTML;
        }
      } catch (_) {}
    }

    // ── Fix des liens dans le panel ──────────────────────────────
    // - href="#" (boutons Stimulus : quote, réactions…) : Turbo intercepte href="#" dans une
    //   turbo-frame et recharge la frame → panneau blanc. data-turbo="false" désactive l'interception.
    //   preventDefault empêche le scroll-to-top du navigateur ; Stimulus reçoit toujours le click.
    // - data-remote="true" (edit/delete journal) : sans rails-ujs, Turbo navigue la frame vers
    //   l'URL → réponse .js rendue comme HTML → blanc. On remplace par un fetch AJAX + eval.
    // - Autres liens non-issue (wiki, diff, externe…) : ouvrir dans un nouvel onglet.
    _fixPanelLinks() {
      this.bodyTarget.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (!href) return;

        // href="#" exact (Stimulus, onclick copy links…) : remplacer par javascript:void(0)
        // pour que la barre de statut n'affiche pas l'URL courante avec # en suffixe.
        // Turbo ignore les hrefs javascript: nativement ; pas besoin de data-turbo="false".
        if (href === '#') {
          a.setAttribute('href', 'javascript:void(0)');
          return;
        }

        // Ancres internes "#note-X" : laisser le navigateur gérer nativement
        // (scroll + mise à jour de l'URL). data-turbo="false" empêche Turbo de recharger la frame.
        if (href.startsWith('#')) {
          a.setAttribute('data-turbo', 'false');
          return;
        }

        if (href.startsWith('javascript:') || href.startsWith('data:')) return;

        try {
          const url = new URL(href, window.location.origin);

          // Liens issue : Turbo navigue la frame normalement
          if (/\/issues\/\d+/.test(url.pathname)) return;

          // data-remote="true" : rails-ujs absent → fetch AJAX + eval JS
          if (a.dataset.remote === 'true') {
            a.setAttribute('data-turbo', 'false');
            a.addEventListener('click', (e) => {
              e.preventDefault();
              const method = (a.dataset.method || 'get').toUpperCase();
              const csrf = document.querySelector('meta[name="csrf-token"]');
              const headers = { 'Accept': 'text/javascript, application/javascript', 'X-Requested-With': 'XMLHttpRequest' };
              if (csrf) headers['X-CSRF-Token'] = csrf.getAttribute('content');
              fetch(a.href, { method, credentials: 'same-origin', headers })
                .then(r => r.text())
                .then(js => { try { (0, eval)(js); } catch (_) {} })
                .catch(() => {});
            });
            return;
          }

          // Autres liens non-issue : ouvrir dans un nouvel onglet
          a.setAttribute('target', '_blank');
          if (!a.getAttribute('rel')) a.setAttribute('rel', 'noopener noreferrer');
        } catch (_) {}
      });
    }

    // ── Handlers d'événements globaux ────────────────────────────

    // Field-edit sauvegarde : invalide le cache, rafraîchit la liste.
    // Rechargement du panel uniquement pour la description : textilizable côté serveur
    // requiert @project (absent de l'action update_issue_field), donc rendered_html
    // peut être incomplet. Les autres champs se mettent à jour localement sans problème.
    _handleFieldEditSaved(e) {
      if (!this.element.classList.contains('is-open')) return;
      const issueUrl = this._currentUrl || this.externalTarget.href;
      this._cache.delete(issueUrl);
      if (e.target?.closest?.('.issue-panel__body') && e.detail?.field === 'description') {
        if (this._turboMode) {
          const panelUrl = issueUrl + (issueUrl.includes('?') ? '&' : '?') + 'panel=1';
          this.bodyTarget.setAttribute('src', panelUrl);
        } else {
          this._load(issueUrl);
        }
      }
      this._refreshParentList();
    }

    _handleDocClick(e) {
      const isOpen = this.element.classList.contains('is-open');

      // Clic sur sujet d'issue ou bouton nouvelle demande → ouvrir le panel (beta)
      if (document.body.dataset.issuePanelBeta === 'true' &&
          !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        const issueLink = e.target.closest('table.issues td.subject a');
        if (issueLink && !issueLink.closest('.issue-panel')) {
          e.preventDefault();
          this.open(issueLink.href);
          return;
        }
        const newLink = e.target.closest('a.new-issue');
        if (newLink && !newLink.closest('.issue-panel')) {
          e.preventDefault();
          this.open(newLink.href);
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

      // Prev/next navigation dans le panel — en mode turbo, Turbo gère le clic automatiquement
      if (!this._turboMode && inBody && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        const link = e.target.closest('.next-prev-links a');
        if (link && link.href) {
          e.preventDefault();
          this.externalTarget.href = link.href;
          this.bodyTarget.innerHTML = '<div class="issue-panel__loading">Chargement…</div>';
          this._load(link.href);
        }
      }
    }

    _handleDocSubmit(e) {
      if (!this.element.classList.contains('is-open')) return;
      if (!e.target.closest('.issue-panel__body')) return;
      e.preventDefault();

      const form = e.target;
      const issueUrl = this._currentUrl || this.externalTarget.href;

      // Synchroniser les instances CKEditor du panel vers leurs textarea
      if (window.CKEDITOR) {
        for (const id in CKEDITOR.instances) {
          const inst = CKEDITOR.instances[id];
          if (form.contains(document.getElementById(id))) inst.updateElement();
        }
      }

      const csrf = document.querySelector('meta[name="csrf-token"]');
      const headers = csrf ? { 'X-CSRF-Token': csrf.getAttribute('content') } : {};
      const formData = new FormData(form, e.submitter);

      form.style.opacity = '0.5';

      fetch(form.action, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        headers
      }).then(res => {
        form.style.opacity = '';
        if (res.ok) {
          this._cache.delete(issueUrl);
          this._cache.delete(res.url);
          const destPath = new URL(res.url).pathname;
          const destUrl = /\/issues\/(new|\d+)/.test(destPath) ? res.url : issueUrl;
          this._currentUrl = destUrl;
          this.externalTarget.href = destUrl;
          this.bodyTarget.innerHTML = '<div class="issue-panel__loading">Chargement…</div>';
          const addPanel = (u) => u.includes('panel=') ? u : u + (u.includes('?') ? '&' : '?') + 'panel=1';
          if (this._turboMode) {
            this.bodyTarget.setAttribute('src', addPanel(destUrl));
          } else {
            this._load(destUrl);
          }
          this._refreshParentList();
        } else {
          this.bodyTarget.innerHTML = '<p style="padding:2rem;color:#ef4444;">Erreur (' + res.status + ')</p>';
        }
      }).catch(() => {
        this.bodyTarget.style.opacity = '';
        this.bodyTarget.innerHTML = '<p style="padding:2rem;color:#ef4444;">Erreur réseau</p>';
      });
    }
  });
})();
