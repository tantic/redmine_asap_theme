(() => {
  const application = Stimulus.Application.start()

  application.register("projects", class extends Stimulus.Controller {
    static get targets() {
      return [ "submenu", "panel" ]
    }


    static get values() {
      return {url: String}
    }

    toggle(event){
      this.submenuTarget.classList.toggle('hidden');
      this.dismissOnClick(this.submenuTarget);
    }

    async showDetails(){
      this.panelTarget.classList.toggle('hidden');
      this.dismissOnClick(this.panelTarget);
      let content = null
      content = await this.fetch()

      if (!content) return

      const fragment = document.createRange().createContextualFragment(content)
      this.panelTarget.appendChild(fragment)

    }

    async fetch () {
      if (!this.remoteContent) {

        if (!this.hasUrlValue) {
          console.error('[stimulus-popover] You need to pass an url to fetch the popover content.')
          return
        }

        const response = await fetch(this.urlValue)
        this.remoteContent = await response.text()
      }

      return this.remoteContent
    }

    dismissOnClick(element) {
      document.addEventListener('click', (evt) => {
        var isClickInside = element.contains(evt.target);
        if (!isClickInside) {
          element.classList.add('hidden')
        }
      },
      { once: true, capture: true }
     );
    }


  })
})()