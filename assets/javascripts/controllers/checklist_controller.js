(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("checklist", class extends Controller {
    static targets = ["list", "newInput", "actionMenu"]
    static values = {
      issueId: Number,
      canEdit: Boolean,
      canDone: Boolean
    }

    async connect() {
      this._closeMenuBound = (e) => {
        if (this.hasActionMenuTarget && !this.element.contains(e.target)) {
          this.actionMenuTarget.classList.add('hidden');
        }
      };
      if (this.canEditValue) {
        await this._initSortable();
      }
    }

    disconnect() {
      document.removeEventListener('click', this._closeMenuBound);
      if (this._sortable) { this._sortable.destroy(); this._sortable = null; }
    }

    async _initSortable() {
      if (!window.Sortable) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = '/plugin_assets/redmine_asap_theme/javascripts/vendor/sortable.min.js';
          script.onload = resolve;
          script.onerror = () => resolve(); // degrade gracefully
          document.head.appendChild(script);
        });
      }
      if (!window.Sortable) return;
      this._sortable = new window.Sortable(this.listTarget, {
        animation: 150,
        handle: '.cl-handle',
        ghostClass: 'opacity-40',
        onEnd: () => this._onReorder()
      });
    }

    async _onReorder() {
      const ids = Array.from(this.listTarget.children).map(li => li.dataset.id).filter(Boolean);
      fetch(`/issues/${this.issueIdValue}/checklist_items/reorder`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-Token': this._csrf(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ ids })
      });
    }

    _csrf() {
      return document.querySelector('meta[name="csrf-token"]')?.content;
    }

    async toggleDone(event) {
      const cb = event.target;
      const li = cb.closest('li');
      const id = li.dataset.id;
      const done = cb.checked;

      const res = await fetch(`/checklists/${id}/done`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-Token': this._csrf(),
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'text/javascript'
        },
        body: `is_done=${done}`
      });

      if (res.ok) {
        const textEl = li.querySelector('[data-item-text]');
        textEl?.classList.toggle('line-through', done);
        textEl?.classList.toggle('text-gray-400', done);
        this._notifyChange();
      } else {
        cb.checked = !done;
      }
    }

    newKeydown(event) {
      if (event.key === 'Enter') { event.preventDefault(); this.addItem(); }
      if (event.key === 'Escape') { this.newInputTarget.value = ''; }
    }

    async addItem() {
      await this._createItem({ subject: this.newInputTarget.value.trim() });
    }

    async addSection() {
      this.actionMenuTarget?.classList.add('hidden');
      await this._createItem({ subject: this.newInputTarget.value.trim(), is_section: true });
    }

    async toggleActionMenu() {
      if (!this.hasActionMenuTarget) return;
      const menu = this.actionMenuTarget;

      if (menu.classList.contains('hidden')) {
        if (!this._templatesLoaded) {
          this._templatesLoaded = true;
          const res = await fetch(`/issues/${this.issueIdValue}/checklist_items/templates`, {
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
          });
          const templates = res.ok ? await res.json() : [];
          if (templates.length) {
            const divider = document.createElement('div');
            divider.className = 'border-t border-gray-100 dark:border-gray-700 my-1';
            menu.appendChild(divider);
            templates.forEach(tpl => {
              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'block w-full text-left text-xs px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer';
              btn.textContent = '📋 ' + tpl.name;
              btn.addEventListener('click', () => {
                menu.classList.add('hidden');
                this._applyTemplate(tpl);
              });
              menu.appendChild(btn);
            });
          }
        }
        menu.classList.remove('hidden');
        setTimeout(() => document.addEventListener('click', this._closeMenuBound, { once: true }), 0);
      } else {
        menu.classList.add('hidden');
      }
    }

    async _applyTemplate(template) {
      for (const item of template.items) {
        const res = await fetch(`/issues/${this.issueIdValue}/checklist_items`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'X-CSRF-Token': this._csrf(),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ checklist: { subject: item.subject, is_section: item.is_section } })
        });
        if (res.ok) {
          this._appendItem(await res.json());
          this._notifyChange();
        }
      }
    }

    async _createItem({ subject, is_section = false }) {
      if (!subject) return;
      const res = await fetch(`/issues/${this.issueIdValue}/checklist_items`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-Token': this._csrf(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ checklist: { subject, is_section } })
      });

      if (res.ok) {
        this._appendItem(await res.json());
        this.newInputTarget.value = '';
        this.newInputTarget.focus();
        this._notifyChange();
      } else {
        alert("Impossible d'ajouter l'élément.");
      }
    }

    startEdit(event) {
      const li = event.currentTarget.closest('li');
      const textEl = li.querySelector('[data-item-text]');
      if (!textEl) return;
      const id = li.dataset.id;
      const original = textEl.textContent.trim();

      const input = document.createElement('input');
      input.type = 'text';
      input.value = original;
      input.className = 'border border-blue-400 rounded px-2 py-0.5 text-xs flex-1 dark:bg-gray-700 dark:text-gray-100 focus:outline-none';
      textEl.replaceWith(input);
      input.focus();
      input.select();

      const restore = () => input.replaceWith(textEl);

      const save = async () => {
        input.removeEventListener('blur', save);
        const newSubject = input.value.trim();
        if (!newSubject || newSubject === original) { restore(); return; }

        const res = await fetch(`/checklist_items/${id}`, {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: {
            'X-CSRF-Token': this._csrf(),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ checklist: { subject: newSubject } })
        });

        if (res.ok) { textEl.textContent = newSubject; }
        restore();
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); save(); }
        if (e.key === 'Escape') { input.removeEventListener('blur', save); restore(); }
      });
      input.addEventListener('blur', save);
    }

    async deleteItem(event) {
      const li = event.currentTarget.closest('li');
      const id = li.dataset.id;

      const res = await fetch(`/checklist_items/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'X-CSRF-Token': this._csrf(), 'Accept': 'application/json' }
      });

      if (res.ok) {
        li.remove();
        this._notifyChange();
      }
    }

    _appendItem(item) {
      const li = document.createElement('li');
      li.dataset.id = item.id;
      li.className = 'flex items-center gap-2 py-1.5 group';

      if (this.canEditValue) {
        const handle = document.createElement('span');
        handle.className = 'cl-handle text-gray-300 hover:text-gray-500 cursor-grab text-xs select-none flex-shrink-0';
        handle.textContent = '⠿';
        li.appendChild(handle);
      }

      if (!item.is_section) {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!item.is_done;
        cb.className = 'cursor-pointer flex-shrink-0';
        if (!this.canDoneValue) cb.disabled = true;
        cb.addEventListener('change', (e) => this.toggleDone(e));
        li.appendChild(cb);
      }

      const span = document.createElement('span');
      span.setAttribute('data-item-text', '');
      span.textContent = item.subject;
      span.className = item.is_section
        ? 'font-semibold text-xs text-gray-700 dark:text-gray-300 flex-1'
        : 'text-xs flex-1' + (item.is_done ? ' line-through text-gray-400' : '');
      li.appendChild(span);

      if (this.canEditValue) {
        if (!item.is_section) {
          li.appendChild(this._makeBtn('✏', 'Modifier', 'hover:text-blue-600', (e) => this.startEdit(e)));
        }
        li.appendChild(this._makeBtn('×', 'Supprimer', 'hover:text-red-500 ml-1', (e) => this.deleteItem(e)));
      }

      this.listTarget.appendChild(li);
    }

    _notifyChange() {
      window.dispatchEvent(new CustomEvent('field-edit:saved', {
        detail: { issueId: this.issueIdValue, field: 'checklist' }
      }));
    }

    _makeBtn(text, title, extra, handler) {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.title = title;
      btn.className = `opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 ${extra} cursor-pointer text-sm leading-none px-0.5`;
      btn.addEventListener('click', handler);
      return btn;
    }
  });
})();
