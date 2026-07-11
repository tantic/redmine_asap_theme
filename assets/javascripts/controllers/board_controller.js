(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("board", class extends Controller {

    connect() {
      this._restoreCollapsed();
    }

    // ── Swimlane toggle ──────────────────────────────────────────
    toggleGroup(e) {
      const row = e.currentTarget.closest('.board-grouped__row');
      if (!row) return;
      row.classList.toggle('is-collapsed');
      this._saveCollapsed();
    }

    _storageKey() {
      return `board_collapsed:${window.location.pathname}`;
    }

    _saveCollapsed() {
      const ids = Array.from(this.element.querySelectorAll('.board-grouped__row.is-collapsed'))
                       .map(r => r.dataset.groupId);
      localStorage.setItem(this._storageKey(), JSON.stringify(ids));
    }

    _restoreCollapsed() {
      try {
        const ids = JSON.parse(localStorage.getItem(this._storageKey()) || '[]');
        if (!ids.length) return;
        this.element.querySelectorAll('.board-grouped__row').forEach(row => {
          if (ids.includes(row.dataset.groupId)) row.classList.add('is-collapsed');
        });
      } catch (_) {}
    }

    // ── Card click → open panel ──────────────────────────────────
    open(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      e.preventDefault();
      const url = e.currentTarget.dataset.issueHref;
      if (window.IssuePanel) {
        window.IssuePanel.open(url);
      } else {
        window.location.href = url;
      }
    }

    // ── New issue in panel ───────────────────────────────────────
    newIssue(e) {
      e.preventDefault();
      e.stopPropagation();
      const url      = e.currentTarget.href;
      const panelUrl = url + (url.includes('?') ? '&' : '?') + 'panel=1';
      if (window.IssuePanel) {
        window.IssuePanel.open(panelUrl);
      } else {
        window.location.href = url;
      }
    }

    // ── Drag & Drop ──────────────────────────────────────────────
    dragstart(e) {
      this._dragging   = e.currentTarget;
      this._fromColumn = e.currentTarget.closest('.board-column');
      this._fromCards  = e.currentTarget.closest('.board-column__cards');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', e.currentTarget.dataset.issueId);
      requestAnimationFrame(() => e.currentTarget.classList.add('board-card-wrapper--dragging'));
    }

    dragend(e) {
      e.currentTarget.classList.remove('board-card-wrapper--dragging');
      this._clearDropIndicators();
    }

    dragover(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const cards      = e.currentTarget;
      const targetCard = e.target.closest('.board-card-wrapper');

      this._clearDropIndicators();
      cards.classList.add('drag-over');

      if (targetCard && targetCard !== this._dragging) {
        const rect = targetCard.getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
          targetCard.classList.add('drop-before');
          this._dropTarget = { card: targetCard, before: true };
        } else {
          targetCard.classList.add('drop-after');
          this._dropTarget = { card: targetCard, before: false };
        }
      } else {
        this._dropTarget = null;
      }
    }

    dragleave(e) {
      if (!e.currentTarget.contains(e.relatedTarget)) {
        e.currentTarget.classList.remove('drag-over');
        this._clearDropIndicators();
        this._dropTarget = null;
      }
    }

    drop(e) {
      e.preventDefault();
      const targetCards  = e.currentTarget;
      const targetColumn = targetCards.closest('.board-column');
      const toColumnId   = targetColumn.dataset.columnId;
      const projectId    = this.element.dataset.projectId;
      const card         = this._dragging;

      targetCards.classList.remove('drag-over');
      this._clearDropIndicators();

      if (!card) return;

      if (this._dropTarget) {
        const { card: ref, before } = this._dropTarget;
        targetCards.insertBefore(card, before ? ref : ref.nextSibling);
      } else if (targetColumn !== this._fromColumn) {
        targetCards.appendChild(card);
      }
      this._dropTarget = null;

      const fromRow  = this._fromColumn.closest('.board-grouped__row');
      const toRow    = targetColumn.closest('.board-grouped__row');
      const groupBy  = this.element.dataset.groupBy;
      const crossRow = fromRow && toRow && fromRow !== toRow && groupBy;

      if (targetColumn === this._fromColumn && !crossRow) {
        this._savePositions(targetCards, toColumnId, projectId);
      } else {
        this._updateCount(targetColumn);
        this._updateCount(this._fromColumn);
        if (crossRow) {
          this._updateGroupCount(fromRow);
          this._updateGroupCount(toRow);
        }
        const extraFields = {};
        if (crossRow) {
          const gid = toRow.dataset.groupId;
          extraFields[groupBy] = gid ? parseInt(gid) : null;
        }
        this._patchColumn(card.dataset.issueId, toColumnId, targetColumn, extraFields);
        this._savePositions(targetCards, toColumnId, projectId);
      }
    }

    _clearDropIndicators() {
      this.element.querySelectorAll('.drop-before, .drop-after, .drag-over').forEach(el => {
        el.classList.remove('drop-before', 'drop-after', 'drag-over');
      });
    }

    async _patchColumn(issueId, columnId, targetColumn, extraFields = {}) {
      const card       = this._dragging;
      const token      = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const columnType = this.element.dataset.columnType || 'status';

      const body = { issue_id: issueId, column_id: columnId, column_type: columnType, ...extraFields };
      if (columnType === 'version') {
        body.fixed_version_id = columnId === '0' ? null : parseInt(columnId);
      } else {
        body.status_id = parseInt(columnId);
      }

      try {
        const res = await fetch('/board_positions/update_card', {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          this._revert(card, targetColumn);
          return;
        }

        const data = await res.json();
        if (!data.applied) {
          this._revert(card, targetColumn);
          return;
        }

        window.IssuePanel?.invalidate?.(issueId);
      } catch (_) {
        this._revert(card, targetColumn);
      }
    }

    async _savePositions(cards, columnId, projectId) {
      if (!projectId) return;
      const columnType = this.element.dataset.columnType || 'status';
      const issueIds = Array.from(cards.querySelectorAll('.board-card-wrapper'))
                            .map(c => c.dataset.issueId);
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      try {
        await fetch('/board_positions/reorder', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token
          },
          body: JSON.stringify({ column_id: columnId, column_type: columnType, project_id: projectId, issue_ids: issueIds })
        });
      } catch (_) {}
    }

    _revert(card, fromColumn) {
      this._fromCards.appendChild(card);
      this._updateCount(fromColumn);
      this._updateCount(this._fromColumn);
      card.classList.add('board-card-wrapper--error');
      setTimeout(() => card.classList.remove('board-card-wrapper--error'), 1500);
    }

    _updateCount(column) {
      if (!column) return;
      const count = column.querySelector('.board-column__cards').childElementCount;
      const badge = column.querySelector('.board-column__count');
      if (badge) badge.textContent = count;
    }

    _updateGroupCount(row) {
      if (!row) return;
      const count = row.querySelectorAll('.board-card-wrapper').length;
      const badge = row.querySelector('.board-grouped__group-count');
      if (badge) badge.textContent = count;
    }
  });
})();
