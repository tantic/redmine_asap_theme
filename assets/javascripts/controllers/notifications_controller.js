(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("notifications", class extends Controller {
    static targets = ["panel", "badge", "list", "empty"];

    connect() {
      this._open = false;
      this._fetch();
      this._interval = setInterval(() => this._fetch(), 60000);
      this._visibilityHandler = () => {
        if (document.hidden) {
          clearInterval(this._interval);
        } else {
          this._fetch();
          this._interval = setInterval(() => this._fetch(), 60000);
        }
      };
      this._outsideHandler = (e) => {
        if (this._open && !this.element.contains(e.target)) this._closePanel();
      };
      document.addEventListener('visibilitychange', this._visibilityHandler);
      document.addEventListener('click', this._outsideHandler);
    }

    disconnect() {
      clearInterval(this._interval);
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      document.removeEventListener('click', this._outsideHandler);
    }

    toggle() {
      this._open ? this._closePanel() : this._openPanel();
    }

    dismissAll() {
      const token = document.querySelector('meta[name="csrf-token"]')?.content;
      fetch('/my/notifications/mark_all', {
        method: 'PATCH',
        headers: { 'X-CSRF-Token': token }
      }).then(() => {
        this.listTarget.innerHTML = '';
        this._setBadge(0);
        this.emptyTarget.classList.remove('hidden');
      });
    }

    dismiss(e) {
      e.preventDefault();
      e.stopPropagation();
      const id = e.currentTarget.dataset.id;
      const item = e.currentTarget.closest('.notif-item');
      const token = document.querySelector('meta[name="csrf-token"]')?.content;
      fetch(`/my/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'X-CSRF-Token': token }
      }).then(() => {
        item?.remove();
        const remaining = this.listTarget.querySelectorAll('.notif-item').length;
        this._setBadge(remaining);
        if (!remaining) this.emptyTarget.classList.remove('hidden');
      });
    }

    _openPanel() {
      this._open = true;
      this.panelTarget.classList.remove('hidden');
    }

    _closePanel() {
      this._open = false;
      this.panelTarget.classList.add('hidden');
    }

    async _fetch() {
      try {
        const res = await fetch('/my/notifications', {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await res.json();
        this._setBadge(data.count);
        this._renderList(data.items);
      } catch (_) {}
    }

    _setBadge(count) {
      if (!this.hasBadgeTarget) return;
      if (count > 0) {
        this.badgeTarget.textContent = count > 99 ? '99+' : count;
        this.badgeTarget.classList.remove('hidden');
      } else {
        this.badgeTarget.classList.add('hidden');
      }
    }

    _renderList(items) {
      if (!this.hasListTarget) return;
      if (!items.length) {
        this.listTarget.innerHTML = '';
        this.emptyTarget.classList.remove('hidden');
        return;
      }
      this.emptyTarget.classList.add('hidden');
      const bellSvg = (type) => {
        if (type === 'assigned') {
          return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>`;
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/></svg>`;
      };
      const closeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>`;

      this.listTarget.innerHTML = items.map(n => `
        <a href="${this._esc(n.url)}" class="notif-item block">
          <span class="notif-icon notif-icon--${this._esc(n.event_type)}">${bellSvg(n.event_type)}</span>
          <span class="notif-body">
            <span class="notif-message">${this._esc(n.message)}</span>
            <span class="notif-ago">${this._esc(n.ago)}</span>
          </span>
          <button class="notif-dismiss" data-action="click->notifications#dismiss" data-id="${n.id}" title="Marquer lu">${closeSvg}</button>
        </a>
      `).join('');
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
