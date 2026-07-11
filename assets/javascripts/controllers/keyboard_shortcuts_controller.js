(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("keyboard-shortcuts", class extends Controller {
    static targets = ["modal", "enableToggle"];

    connect() {
      this._enabled = document.body.dataset.keyboardShortcutsEnabled !== 'false';
      this._seq = null;
      this._seqTimer = null;
      this._selectedIdx = -1;
      this._handler = this._onKey.bind(this);
      document.addEventListener('keydown', this._handler);
    }

    disconnect() {
      document.removeEventListener('keydown', this._handler);
    }

    toggleEnabled(e) {
      this._enabled = e.target.checked;
      document.body.dataset.keyboardShortcutsEnabled = this._enabled ? 'true' : 'false';
      const token = document.querySelector('meta[name="csrf-token"]')?.content;
      if (token) {
        fetch('/user/pref', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
          body: JSON.stringify({ key: 'keyboard_shortcuts_enabled', value: this._enabled ? '1' : '0' })
        });
      }
    }

    openModal() {
      if (!this.hasModalTarget) return;
      this.modalTarget.classList.remove('hidden');
      this._syncToggle();
    }

    closeModal() {
      this.modalTarget.classList.add('hidden');
    }

    _syncToggle() {
      if (!this.hasEnableToggleTarget) return;
      this.enableToggleTarget.checked = this._enabled;
    }

    _onKey(e) {
      if (!this.hasModalTarget) return;
      if (e.target.matches('input, textarea, select') || e.target.closest('[contenteditable]')) return;
      if (e.metaKey || e.altKey || e.ctrlKey) return;
      const key = e.key;

      if (key === '?' && !e.ctrlKey) {
        e.preventDefault();
        const hidden = this.modalTarget.classList.toggle('hidden');
        if (!hidden && this.hasEnableToggleTarget) {
          this.enableToggleTarget.checked = this._enabled;
        }
        return;
      }

      if (key === 'Escape') {
        if (!this.modalTarget.classList.contains('hidden')) {
          e.preventDefault();
          this.closeModal();
          return;
        }
        const closeBtn = document.querySelector('[data-action*="issue-panel#close"]');
        if (closeBtn) { e.preventDefault(); closeBtn.click(); return; }
      }

      if (!this._enabled) return;

      if (this._seq === 'g') {
        clearTimeout(this._seqTimer);
        this._seq = null;
        if (key === 'i') { e.preventDefault(); this._goto('issues'); }
        else if (key === 'p') { e.preventDefault(); window.location.href = '/projects'; }
        return;
      }

      switch (key) {
        case '/':     e.preventDefault(); this._focusSearch(); break;
        case 'c':     e.preventDefault(); this._createIssue(); break;
        case '[':     e.preventDefault(); document.querySelector('#sidebar-switch-button')?.click(); break;
        case 'j':     e.preventDefault(); this._navIssue(1); break;
        case 'k':     e.preventDefault(); this._navIssue(-1); break;
        case 'o':
        case 'Enter': if (this._selectedIdx >= 0) { e.preventDefault(); this._openIssue(); } break;
        case 'm':     e.preventDefault(); this._focusComment(); break;
        case 'e':     e.preventDefault(); this._editIssue(); break;
        case 'g':
          e.preventDefault();
          this._seq = 'g';
          this._seqTimer = setTimeout(() => { this._seq = null; }, 1500);
          break;
      }
    }

    _panelController() {
      const el = document.querySelector('[data-controller~="issue-panel"]');
      return el ? this.application.getControllerForElementAndIdentifier(el, 'issue-panel') : null;
    }

    _panelActive() {
      return document.body.dataset.issuePanelBeta === 'true';
    }

    _focusSearch() {
      const toggle = document.querySelector('[data-action*="usermenu#search"]');
      toggle?.click();
      setTimeout(() => document.querySelector('#flyout-search')?.focus(), 50);
    }

    _createIssue() {
      const link = document.querySelector('a.new-issue, a[href*="/issues/new"]');
      const m = window.location.pathname.match(/\/projects\/([^\/]+)/);
      const url = link?.href || (m ? `/projects/${m[1]}/issues/new` : '/issues/new');
      const panel = this._panelController();
      if (panel && this._panelActive()) {
        panel.open(url);
      } else {
        window.location.href = url;
      }
    }

    _goto(section) {
      const m = window.location.pathname.match(/\/projects\/([^\/]+)/);
      window.location.href = m ? `/projects/${m[1]}/${section}` : `/${section}`;
    }

    _navContext() {
      const listRows = Array.from(document.querySelectorAll('table.issues tr.issue'));
      if (listRows.length) return { type: 'list', items: listRows };
      const cards = Array.from(document.querySelectorAll('.board-card-wrapper'));
      if (cards.length) return { type: 'kanban', items: cards };
      return { type: 'none', items: [] };
    }

    _navIssue(dir) {
      const { items } = this._navContext();
      if (!items.length) return;
      if (this._selectedIdx < 0 && dir < 0) return;
      items.forEach(r => r.classList.remove('ks-selected'));
      this._selectedIdx = Math.max(0, Math.min(items.length - 1, this._selectedIdx + dir));
      items[this._selectedIdx].classList.add('ks-selected');
      items[this._selectedIdx].scrollIntoView({ block: 'nearest' });
    }

    _openIssue() {
      const { type, items } = this._navContext();
      if (this._selectedIdx < 0 || !items[this._selectedIdx]) return;
      const item = items[this._selectedIdx];
      const panel = this._panelController();
      if (type === 'list') {
        const link = item.querySelector('td.subject a');
        if (!link) return;
        if (panel && this._panelActive()) panel.open(link.href);
        else link.click();
      } else if (type === 'kanban') {
        const url = item.dataset.issueHref;
        if (!url) return;
        if (panel && this._panelActive()) panel.open(url);
        else window.location.href = url;
      }
    }

    _focusComment() {
      const el = document.querySelector('#issue_notes, textarea[name*="[notes]"]');
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }

    _editIssue() {
      // Panel mode: derive edit URL from the external link target (always up to date)
      const panelEl = document.querySelector('[data-controller~="issue-panel"]');
      if (panelEl?.classList.contains('is-open')) {
        const ext = panelEl.querySelector('[data-issue-panel-target="external"]');
        if (ext?.href && !ext.href.endsWith('#')) {
          const path = new URL(ext.href).pathname.replace(/\/edit$/, '');
          window.location.href = path + '/edit';
          return;
        }
      }
      // Full page: skip the hidden clone (#issue-panel-action-menu)
      const link = Array.from(document.querySelectorAll('.contextual a[href*="/edit"]'))
        .find(a => !a.closest('#issue-panel-action-menu'));
      if (link) window.location.href = link.href;
    }
  });
})();
