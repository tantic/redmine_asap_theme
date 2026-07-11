(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("quick-nav", class extends Controller {
    static targets = ["input", "results"];
    static values = {
      sectionActions: String,
      sectionIssues: String,
      sectionProjects: String,
      sectionWikiPages: String,
      sectionDocuments: String,
      sectionUsers: String,
      noResults: String,
    };

    connect() {
      this._fetchId = 0;
      this._selectedIdx = -1;
      this._items = [];
      this._debounceTimer = null;
      this._docHandler = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          if (document.body.dataset.keyboardShortcutsEnabled === 'false') return;
          e.preventDefault();
          this._open();
        }
        if (e.key === 'Escape' && !this.element.classList.contains('hidden')) {
          this._close();
        }
      };
      document.addEventListener('keydown', this._docHandler);
    }

    disconnect() {
      document.removeEventListener('keydown', this._docHandler);
    }

    close() {
      this._close();
    }

    search() {
      clearTimeout(this._debounceTimer);
      const q = this.inputTarget.value.trim();
      // single non-@ char: clear
      if (q.length === 1 && !q.startsWith('@')) {
        this._items = [];
        this._selectedIdx = -1;
        this.resultsTarget.innerHTML = '';
        return;
      }
      const delay = q === '' ? 0 : 200;
      this._debounceTimer = setTimeout(() => this._fetch(q), delay);
    }

    keydown(e) {
      switch (e.key) {
        case 'Escape':  e.preventDefault(); this._close(); break;
        case 'ArrowDown': e.preventDefault(); this._move(1); break;
        case 'ArrowUp':   e.preventDefault(); this._move(-1); break;
        case 'Enter':     e.preventDefault(); this._select(); break;
      }
    }

    selectItem(e) {
      const idx = parseInt(e.currentTarget.dataset.idx, 10);
      if (this._items[idx]) window.location.href = this._items[idx].url;
    }

    hoverItem(e) {
      this._setActive(parseInt(e.currentTarget.dataset.idx, 10));
    }

    _open() {
      this.element.classList.remove('hidden');
      this.inputTarget.value = '';
      this.resultsTarget.innerHTML = '';
      this._items = [];
      this._selectedIdx = -1;
      setTimeout(() => this.inputTarget.focus(), 0);
      this._fetch('');
    }

    _close() {
      this.element.classList.add('hidden');
    }

    async _fetch(q) {
      this._fetchId += 1;
      const myId = this._fetchId;
      try {
        const res = await fetch(`/quick_nav?q=${encodeURIComponent(q)}`, {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (myId !== this._fetchId) return;
        const data = await res.json();
        this._render(data);
      } catch (_) {}
    }

    _render(data) {
      this._items = [];
      this._selectedIdx = -1;
      let html = '';

      const item = (idx, content) =>
        `<div class="qn-item" data-idx="${idx}" data-action="click->quick-nav#selectItem mouseenter->quick-nav#hoverItem">${content}</div>`;

      const wikiSvg = `<svg class="qn-project-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>`;
      const docSvg  = `<svg class="qn-project-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>`;
      const userSvg = `<svg class="qn-project-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>`;
      const projSvg = `<svg class="qn-project-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25"/></svg>`;
      const actSvg  = `<svg class="qn-project-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>`;

      if (data.actions?.length) {
        html += `<div class="qn-section">${this._esc(this.sectionActionsValue)}</div>`;
        data.actions.forEach((a) => {
          const idx = this._items.push({ url: a.url }) - 1;
          html += item(idx, `${actSvg}<span class="qn-label">${this._esc(a.label)}</span>`);
        });
      }

      if (data.issues?.length) {
        html += `<div class="qn-section">${this._esc(this.sectionIssuesValue)}</div>`;
        data.issues.forEach((i) => {
          const idx = this._items.push({ url: i.url }) - 1;
          html += item(idx, `<span class="qn-id">#${i.id}</span><span class="qn-label">${this._esc(i.subject)}</span><span class="qn-meta">${this._esc(i.project)}</span>`);
        });
      }

      if (data.projects?.length) {
        html += `<div class="qn-section">${this._esc(this.sectionProjectsValue)}</div>`;
        data.projects.forEach((p) => {
          const idx = this._items.push({ url: p.url }) - 1;
          html += item(idx, `${projSvg}<span class="qn-label">${this._esc(p.name)}</span>`);
        });
      }

      if (data.wiki_pages?.length) {
        html += `<div class="qn-section">${this._esc(this.sectionWikiPagesValue)}</div>`;
        data.wiki_pages.forEach((wp) => {
          const idx = this._items.push({ url: wp.url }) - 1;
          html += item(idx, `${wikiSvg}<span class="qn-label">${this._esc(wp.title)}</span><span class="qn-meta">${this._esc(wp.project)}</span>`);
        });
      }

      if (data.documents?.length) {
        html += `<div class="qn-section">${this._esc(this.sectionDocumentsValue)}</div>`;
        data.documents.forEach((d) => {
          const idx = this._items.push({ url: d.url }) - 1;
          html += item(idx, `${docSvg}<span class="qn-label">${this._esc(d.title)}</span><span class="qn-meta">${this._esc(d.project)}</span>`);
        });
      }

      if (data.users?.length) {
        html += `<div class="qn-section">${this._esc(this.sectionUsersValue)}</div>`;
        data.users.forEach((u) => {
          const idx = this._items.push({ url: u.url }) - 1;
          html += item(idx, `${userSvg}<span class="qn-label">${this._esc(u.name)}</span><span class="qn-meta">${this._esc(u.login)}</span>`);
        });
      }

      if (!html) {
        html = `<div class="qn-empty">${this._esc(this.noResultsValue)}</div>`;
      }

      this.resultsTarget.innerHTML = html;
    }

    _move(dir) {
      if (!this._items.length) return;
      this._setActive(Math.max(0, Math.min(this._items.length - 1, this._selectedIdx + dir)));
    }

    _setActive(idx) {
      this.resultsTarget.querySelectorAll('.qn-item').forEach(r => r.classList.remove('qn-active'));
      this._selectedIdx = idx;
      const row = this.resultsTarget.querySelectorAll('.qn-item')[idx];
      if (row) {
        row.classList.add('qn-active');
        row.scrollIntoView({ block: 'nearest' });
      }
    }

    _select() {
      if (this._selectedIdx >= 0 && this._items[this._selectedIdx]) {
        window.location.href = this._items[this._selectedIdx].url;
      }
    }

    _esc(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  });
})();
