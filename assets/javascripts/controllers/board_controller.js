(async function () {
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("board", class extends Controller {

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
      const toStatusId   = targetColumn.dataset.statusId;
      const projectId    = this.element.dataset.projectId;
      const card         = this._dragging;

      targetCards.classList.remove('drag-over');
      this._clearDropIndicators();

      if (!card) return;

      // Insert at the right position in DOM
      if (this._dropTarget) {
        const { card: ref, before } = this._dropTarget;
        targetCards.insertBefore(card, before ? ref : ref.nextSibling);
      } else if (targetColumn !== this._fromColumn) {
        targetCards.appendChild(card);
      }
      this._dropTarget = null;

      if (targetColumn === this._fromColumn) {
        // Intra-column reorder only
        this._savePositions(targetCards, toStatusId, projectId);
      } else {
        // Inter-column: change status + save positions in target column
        this._updateCount(targetColumn);
        this._updateCount(this._fromColumn);
        this._patchStatus(card.dataset.issueId, toStatusId, targetColumn);
        this._savePositions(targetCards, toStatusId, projectId);
      }
    }

    _clearDropIndicators() {
      this.element.querySelectorAll('.drop-before, .drop-after, .drag-over').forEach(el => {
        el.classList.remove('drop-before', 'drop-after', 'drag-over');
      });
    }

    async _patchStatus(issueId, statusId, targetColumn) {
      const card  = this._dragging;
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      try {
        const res = await fetch(`/issues/${issueId}`, {
          method: 'PATCH',
          credentials: 'same-origin',
          redirect: 'manual',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRF-Token': token
          },
          body: new URLSearchParams({ 'issue[status_id]': statusId, 'authenticity_token': token }).toString()
        });
        if (res.type !== 'opaqueredirect') {
          this._revert(card, targetColumn);
        }
      } catch (_) {
        this._revert(card, targetColumn);
      }
    }

    async _savePositions(cards, statusId, projectId) {
      if (!projectId) return;
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
          body: JSON.stringify({ status_id: statusId, project_id: projectId, issue_ids: issueIds })
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
  });
})();
