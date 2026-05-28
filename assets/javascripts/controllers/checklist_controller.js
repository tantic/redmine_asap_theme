(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("checklist", class extends Controller {
    static targets = ["list", "newInput"]
    static values = {
      issueId: Number,
      canEdit: Boolean,
      canDone: Boolean
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
      const input = this.newInputTarget;
      const subject = input.value.trim();
      if (!subject) return;

      const res = await fetch(`/issues/${this.issueIdValue}/checklist_items`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-Token': this._csrf(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ checklist: { subject } })
      });

      if (res.ok) {
        const data = await res.json();
        this._appendItem(data.checklist || data);
        input.value = '';
        input.focus();
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

        if (res.ok) {
          textEl.textContent = newSubject;
        }
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
      span.className = 'text-xs flex-1' + (item.is_done ? ' line-through text-gray-400' : '');
      li.appendChild(span);

      if (this.canEditValue && !item.is_section) {
        li.appendChild(this._makeBtn('✏', 'Modifier', 'hover:text-blue-600', (e) => this.startEdit(e)));
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
