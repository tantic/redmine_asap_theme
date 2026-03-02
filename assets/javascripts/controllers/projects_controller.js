(async function () {
  // Wait for Stimulus application to be available
  while (typeof Stimulus === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("projects", class extends Controller {
    static targets = ["submenu", "panel"]

    static get values() {
      return {
        url: String,     // URL pour le side panel (home_project_path)
        moreUrl: String  // URL pour "charger plus" (home_more_projects_path)
      }
    }

    connect() {
      this.csrfToken = document.querySelector('meta[name="csrf-token"]')?.content

      // Bouton de fermeture du side panel (bind une seule fois au niveau document)
      if (!window.__projectSidePanelCloseWired) {
        window.__projectSidePanelCloseWired = true
        const closeBtn = document.getElementById('project-side-panel-close')
        if (closeBtn) {
          closeBtn.addEventListener('click', () => this._closeSidePanel())
        }
        // Fermeture au clavier (Escape)
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') this._closeSidePanel()
        })
      }
    }

    fetchHeaders() {
      const h = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'text/html' }
      if (this.csrfToken) h['X-CSRF-Token'] = this.csrfToken
      return h
    }

    // ── Side panel ───────────────────────────────────────────────────────
    async openSidePanel(event) {
      event.preventDefault()
      event.stopPropagation()

      const btn = event.currentTarget
      const projectName = btn.dataset.projectName || ''
      const logoUrl = btn.dataset.projectLogoUrl || ''

      // Remplir le header du panel
      const titleEl = document.getElementById('project-side-panel-title')
      if (titleEl) titleEl.textContent = projectName

      const avatarEl = document.getElementById('project-side-panel-avatar')
      if (avatarEl) {
        if (logoUrl) {
          avatarEl.innerHTML = `<img src="${logoUrl}" alt="${projectName}" style="position:absolute;top:0;left:0;width:32px;height:32px;object-fit:contain;">`
        } else {
          // Initiales en fallback
          const initials = projectName.split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
          avatarEl.innerHTML = `<span style="position:absolute;top:0;left:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#6b7280;background:#f3f4f6;">${initials}</span>`
        }
      }

      // Afficher le loading
      const body = document.getElementById('project-side-panel-body')
      const loading = document.getElementById('project-side-panel-loading')
      if (body && loading) {
        body.innerHTML = ''
        body.appendChild(loading)
        loading.classList.remove('hidden')
      }

      // Ouvrir le backdrop + panel
      const backdrop = document.getElementById('project-side-panel-backdrop')
      const panel = document.getElementById('project-side-panel')
      backdrop?.classList.remove('hidden')
      panel?.classList.remove('hidden')

      // Charger le contenu AJAX
      if (!this.hasUrlValue) {
        console.warn('[projects] No urlValue for side panel', this.element)
        return
      }

      try {
        const response = await fetch(this.urlValue, { headers: this.fetchHeaders() })
        if (!response.ok) {
          console.error('[projects] side panel HTTP error', response.status)
          return
        }
        const html = await response.text()
        if (body) {
          body.innerHTML = html
          if (typeof contextMenuInit === 'function') contextMenuInit()
        }
      } catch (e) {
        console.error('[projects] Side panel load failed', e)
      }
    }

    closeSidePanel(event) {
      // Action Stimulus (utilisée par le backdrop)
      this._closeSidePanel()
    }

    _closeSidePanel() {
      const backdrop = document.getElementById('project-side-panel-backdrop')
      const panel = document.getElementById('project-side-panel')
      backdrop?.classList.add('hidden')
      panel?.classList.add('hidden')
    }

    // ── Pagination "charger plus" ─────────────────────────────────────
    async loadMore(event) {
      event.preventDefault()

      const btn = event.currentTarget
      const originalText = btn.textContent
      btn.disabled = true
      btn.textContent = '…'

      // L'URL peut être sur le controller du bouton lui-même
      const moreUrl = this.hasMoreUrlValue
        ? this.moreUrlValue
        : btn.closest('[data-projects-more-url-value]')?.dataset.projectsMoreUrlValue

      if (!moreUrl) {
        btn.disabled = false
        btn.textContent = originalText
        return
      }

      try {
        const response = await fetch(moreUrl, { headers: this.fetchHeaders() })
        if (!response.ok) throw new Error('Network error')

        const html = await response.text()

        const wrapper = document.createElement('div')
        wrapper.innerHTML = html

        // Extraire le trigger de la prochaine page (s'il existe)
        const nextTrigger = wrapper.querySelector('#load-more-trigger')
        if (nextTrigger) {
          wrapper.removeChild(nextTrigger)
        }

        // Ajouter les lignes de projets dans la liste
        const list = document.getElementById('other-projects-list')
        if (list) {
          while (wrapper.firstChild) {
            list.appendChild(wrapper.firstChild)
          }
        }

        // Mettre à jour ou supprimer le bouton "charger plus"
        const container = document.getElementById('load-more-container')
        if (nextTrigger) {
          const newUrl = nextTrigger.dataset.projectsMoreUrlValue
          if (container && newUrl) {
            const newBtn = container.querySelector('button')
            if (newBtn) {
              newBtn.setAttribute('data-projects-more-url-value', newUrl)
            }
          }
          btn.disabled = false
          btn.textContent = originalText
        } else {
          // Plus de projets à charger
          if (container) {
            container.remove()
          }
        }

      } catch (e) {
        console.error('[projects] Load more failed', e)
        btn.disabled = false
        btn.textContent = originalText
      }
    }

    // ── Actions legacy (navigation/menu) ─────────────────────────────
    toggle(event) {
      this.submenuTarget.classList.toggle('hidden')
      this.dismissOnClick(this.submenuTarget)
    }

    async showDetails() {
      this.panelTarget.classList.toggle('hidden')
      this.dismissOnClick(this.panelTarget)
      const content = await this.fetch()
      if (!content) return
      const fragment = document.createRange().createContextualFragment(content)
      this.panelTarget.appendChild(fragment)
    }

    async fetch() {
      if (!this.remoteContent) {
        if (!this.hasUrlValue) {
          console.error('[projects] You need to pass an url to fetch the content.')
          return
        }
        const response = await fetch(this.urlValue, { headers: this.fetchHeaders() })
        this.remoteContent = await response.text()
      }
      return this.remoteContent
    }

    dismissOnClick(element) {
      const handler = (evt) => {
        if (!element.contains(evt.target)) {
          element.classList.add('hidden')
        } else {
          document.addEventListener('click', handler, { once: true })
        }
      }
      setTimeout(() => document.addEventListener('click', handler, { once: true }), 0)
    }
  })

})()
