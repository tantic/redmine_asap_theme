(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("field-edit", class extends Controller {
    static targets = ["display", "editor", "input"]
    static values = {
      issueId: Number,
      field:   String,
      type:    String,  // "text" | "select" | "textarea" | "date" — optionnel
      url:     String   // override endpoint, defaults to /issues/:id/field
    }

    connect() {
      this._ckFixed = false;
      this._pendingAttachments = []; // { token, filename } à inclure au save
      if (this.hasInputTarget) {
        const v = this.inputTarget.dataset.ckValue;
        this._initialValue = v !== undefined ? v : this.inputTarget.value;
      }
      if (this.typeValue === 'textarea') this._setupTextareaFiledrop();
    }

    _setupTextareaFiledrop() {
      const editor = this.editorTarget;
      editor.addEventListener('dragover', (e) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
        e.stopPropagation();
        editor.classList.add('fileover');
      });
      editor.addEventListener('dragleave', () => editor.classList.remove('fileover'));
      editor.addEventListener('drop', async (e) => {
        if (!e.dataTransfer?.files?.length) return;
        e.preventDefault();
        e.stopPropagation();
        editor.classList.remove('fileover');
        for (const file of e.dataTransfer.files) {
          if (!file.type.startsWith('image/')) continue;
          await this._uploadAndInsert(file);
        }
      });
      editor.addEventListener('paste', async (e) => {
        const clipboardData = e.clipboardData;
        if (!clipboardData) return;
        // Si du texte brut est présent → laisser le comportement natif du textarea
        if (clipboardData.types.some(t => /^text\/plain$/.test(t))) return;
        const images = [...clipboardData.files].filter(f => f.type.startsWith('image/'));
        if (!images.length) return;
        e.preventDefault();
        for (const file of images) {
          const d = new Date();
          const filename = 'clipboard-'
            + d.getFullYear()
            + String(d.getMonth() + 1).padStart(2, '0')
            + String(d.getDate()).padStart(2, '0')
            + String(d.getHours()).padStart(2, '0')
            + String(d.getMinutes()).padStart(2, '0')
            + '-' + Math.random().toString(36).slice(2, 7)
            + '.' + (file.name.split('.').pop() || 'png');
          await this._uploadAndInsert(new File([file], filename, { type: file.type }));
        }
      });
    }

    async _uploadAndInsert(file) {
      const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
      // Utiliser /uploads.js (pas .json) : format js n'est pas "api_request?" donc la
      // session est utilisée pour l'auth au lieu de nécessiter une clé API.
      const attachmentId = Date.now();
      const uploadUrl = `/uploads.js?attachment_id=${attachmentId}` +
        `&filename=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`;
      try {
        const res = await fetch(uploadUrl, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'X-CSRF-Token': csrf, 'Content-Type': 'application/octet-stream' },
          body: file
        });
        if (!res.ok) return;
        const jsText = await res.text();
        // La réponse JS contient : fileSpan.find('input.token').val('TOKEN');
        const match = jsText.match(/\.val\('([^']+)'\)/);
        if (!match) return; // upload échoué (alerte dans la réponse JS)
        const token = match[1];

        this._pendingAttachments.push({ token, filename: file.name });

        const markup = this._imageMarkup(file.name);
        if (!markup) return;
        const textarea = this.inputTarget;
        const pos = textarea.selectionStart ?? textarea.value.length;
        const before = textarea.value.substring(0, pos);
        const after = textarea.value.substring(pos);
        const needsNewlineBefore = before.length > 0 && !before.endsWith('\n');
        const needsNewlineAfter = after.length > 0 && !after.startsWith('\n');
        textarea.value = before + (needsNewlineBefore ? '\n' : '') + markup + (needsNewlineAfter ? '\n' : '') + after;
      } catch (_) {}
    }

    _imageMarkup(filename) {
      const sanitized = filename.replace(/[\/\?\%\*\:\|\"\'<>\n\r]+/g, '_');
      const encoded = encodeURIComponent(sanitized).replace(/[!()]/g, c => '%' + c.charCodeAt(0).toString(16));
      switch (document.body.getAttribute('data-text-formatting')) {
        case 'textile':     return `!${encoded}!`;
        case 'common_mark': return `![](${encoded})`;
        default:            return '';
      }
    }

    _initCkEditor(input, valueToSet, cfg) {
      // Détruire l'instance existante si présente (ex: init cassée dans container caché)
      if (window.CKEDITOR?.instances?.[input.id]) {
        try { CKEDITOR.instances[input.id].destroy(true); } catch (e) {}
        delete CKEDITOR.instances[input.id];
      }
      requestAnimationFrame(() => {
        const inst = CKEDITOR.replace(input.id, cfg);
        if (inst) {
          inst.on('instanceReady', () => {
            inst.setData(valueToSet);
            inst.focus();
          });
        }
      });
    }

    edit(event) {
      // Ne pas activer l'édition si le clic vient d'un lien (ex: hiérarchie parente)
      if (event?.target.closest('a')) return;
      this.element.classList.add('field-edit--active');
      this.displayTarget.classList.add('hidden!');
      this.editorTarget.classList.remove('hidden!');
      const input = this.inputTarget;
      // Lire la valeur courante au clic, pas celle stockée au connect() : en mode turbo
      // le script qui initialise textarea.value / dataset.ckValue tourne après Stimulus.
      if (this._originalValue === undefined) {
        const freshV = input.dataset.ckValue;
        this._originalValue = freshV !== undefined ? freshV : input.value;
      }
      const ckInstance = window.CKEDITOR?.instances?.[input.id];
      const capturedVal = window._issuePanelCkValues?.[input.id];

      if (window.CKEDITOR && window._issuePanelCkConfigs?.[input.id] !== undefined) {
        // Cas panel : CKEditor.replace a été intercepté au chargement, init on-demand.
        const cfg = window._issuePanelCkConfigs[input.id];
        const valueToSet = capturedVal !== undefined ? capturedVal : this._originalValue;
        this._initCkEditor(input, valueToSet, cfg);
      } else if (ckInstance) {
        if (this._ckFixed) {
          // Instance déjà correctement initialisée (container visible) : juste focus.
          ckInstance.focus();
        } else {
          // Page normale : CKEditor s'est initialisé dans le container caché → réinitialiser.
          this._ckFixed = true;
          const liveCkValue = input.dataset.ckValue;
          const valueToSet = liveCkValue !== undefined ? liveCkValue : (this._initialValue !== undefined ? this._initialValue : input.value);
          const cfg = { ...ckInstance.config };
          this._initCkEditor(input, valueToSet, cfg);
        }
      } else {
        // Forcer la valeur courante dans le champ (évite l'affichage d'une ancienne valeur)
        if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
          input.value = this._originalValue;
          input.focus();
          try { input.setSelectionRange(input.value.length, input.value.length); } catch (_) {}
        } else {
          input.focus();
        }
      }
    }

    cancel() {
      const input = this.inputTarget;
      if (this._originalValue !== undefined) {
        const ckInstance = window.CKEDITOR?.instances?.[input.id];
        if (ckInstance) {
          if (window._issuePanelCkConfigs?.[input.id] !== undefined) {
            // Panel : détruire l'instance créée à la demande
            try { ckInstance.destroy(true); } catch (e) {}
            delete CKEDITOR.instances[input.id];
            input.value = this._originalValue;
          } else {
            ckInstance.setData(this._originalValue);
          }
        } else {
          input.value = this._originalValue;
        }
        this._originalValue = undefined;
        this._pendingAttachments = [];
      }
      this.element.classList.remove('field-edit--active');
      this.editorTarget.classList.add('hidden!');
      this.displayTarget.classList.remove('hidden!');
    }

    async save() {
      const input = this.inputTarget;
      // Lire la valeur depuis CKEditor si disponible, sinon depuis le textarea
      const ckInstance = window.CKEDITOR?.instances?.[input.id];
      const value = ckInstance ? ckInstance.getData() : input.value;

      try {
        const url = this.hasUrlValue ? this.urlValue : `/issues/${this.issueIdValue}/field`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            field: this.fieldValue,
            value: value,
            ...(this._pendingAttachments.length ? { attachments: this._pendingAttachments } : {})
          })
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          this._updateDisplay(input, value, data);
          this._initialValue = value;
          this._originalValue = value; // cancel() utilisera la valeur sauvegardée, pas l'ancienne
          this._pendingAttachments = [];
          input.dataset.ckValue = value;
          if (data.lock_version != null) {
            document.querySelectorAll('input[name="issue[lock_version]"]').forEach(el => {
              el.value = data.lock_version;
            });
          }
          if (data.last_journal_id != null) {
            document.querySelectorAll('input[name="last_journal_id"]').forEach(el => {
              el.value = data.last_journal_id;
            });
          }
          this.cancel();
          const savedDetail = {
            issueId: this.issueIdValue,
            field: this.fieldValue,
            value,
            newListId: data.new_list_id,
            priorityLevel: data.priority_level
          };
          // Bulle dans l'arbre DOM → capturé par issue_panel.js (refreshList)
          this.dispatch('saved', { bubbles: true, detail: savedDetail });
          // Dispatch sur window pour les controllers hors de l'arbre (panel flottant → todo)
          window.dispatchEvent(new CustomEvent('field-edit:saved', { detail: savedDetail }));
        } else {
          const data = await response.json().catch(() => ({}));
          const errors = data?.errors?.join(', ') || `Erreur ${response.status}`;
          alert(`Impossible de sauvegarder : ${errors}`);
        }
      } catch (e) {
        alert("Erreur de connexion.");
      }
    }

    // Appui Entrée sur un input texte → sauvegarde ; Échap → annule
    keydown(event) {
      if (event.key === 'Enter' && this.inputTarget.tagName !== 'TEXTAREA') {
        event.preventDefault();
        this.save();
      } else if (event.key === 'Enter' && this.inputTarget.tagName === 'TEXTAREA') {
        this._continueList(event);
      } else if (event.key === 'Escape') {
        this.cancel();
      }
    }

    _continueList(event) {
      const input = this.inputTarget;
      // Laisser CKEditor gérer son propre Enter
      if (window.CKEDITOR?.instances?.[input.id]) return;

      const pos = input.selectionStart;
      if (pos !== input.selectionEnd) return; // sélection active, pas de continuation

      const text = input.value;
      const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
      const lineEnd   = text.indexOf('\n', pos);
      if (pos !== (lineEnd === -1 ? text.length : lineEnd)) return; // curseur pas en fin de ligne

      const line = text.substring(lineStart, pos);

      const bulletEmpty   = /^(\s*)[*\-+]\s*$/.test(line);
      const bulletMatch   = line.match(/^(\s*[*\-+] )/);
      const numberedEmpty = /^(\s*)\d+\.\s*$/.test(line);
      const numberedMatch = line.match(/^(\s*)(\d+)\. /);

      if (bulletEmpty || numberedEmpty) {
        // Item vide → terminer la liste
        event.preventDefault();
        const newText = text.substring(0, lineStart) + '\n' + text.substring(pos);
        input.value = newText;
        input.setSelectionRange(lineStart + 1, lineStart + 1);
      } else if (bulletMatch) {
        event.preventDefault();
        const insert = '\n' + bulletMatch[1];
        input.value = text.substring(0, pos) + insert + text.substring(pos);
        input.setSelectionRange(pos + insert.length, pos + insert.length);
      } else if (numberedMatch) {
        event.preventDefault();
        const insert = '\n' + numberedMatch[1] + (parseInt(numberedMatch[2]) + 1) + '. ';
        input.value = text.substring(0, pos) + insert + text.substring(pos);
        input.setSelectionRange(pos + insert.length, pos + insert.length);
      }
    }

    _updateDisplay(input, value, data = {}) {
      const display = this.displayTarget;

      if (data.rendered_html !== undefined) {
        display.innerHTML = data.rendered_html;
      } else if (input.tagName === 'SELECT') {
        const selected = input.options[input.selectedIndex];
        display.textContent = selected ? selected.text : value || '-';
      } else if (this.typeValue === 'textarea') {
        display.textContent = value || '';
      } else {
        display.textContent = value || '-';
      }

      // Mise à jour des couleurs inline (statut)
      if (data.status_bg_color !== undefined) {
        display.style.backgroundColor = data.status_bg_color || '';
        display.style.color = data.status_text_color || '';
      }

      // Mise à jour du badge open/closed dans le header
      if (data.status_badge_html !== undefined) {
        const badge = document.querySelector('.header .badge-status-open, .header .badge-status-closed');
        if (badge) badge.outerHTML = data.status_badge_html;
      }
    }
  });

})();
