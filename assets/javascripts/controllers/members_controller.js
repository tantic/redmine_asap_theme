(() => {
  const application = Stimulus.Application.start()

  application.register("members", class extends Stimulus.Controller {

    static get targets() {
      return [ "list", "toggleLink" ]
    }

    static get values() {
      return {expanded: Boolean}
    }

    connect() {
      this.allLabel = this.toggleLinkTarget.dataset.membersAllLabel
      this.reduceLabel = this.toggleLinkTarget.dataset.membersReduceLabel
      this.update()
    }

    toggle(event) {
      event.preventDefault()
      this.expandedValue = !this.expandedValue
      this.update()
    }

    update() {
      if (this.expandedValue) {
        this.listTarget.style.height = 'auto'
        this.toggleLinkTarget.textContent = this.reduceLabel
      } else {
        this.listTarget.style.height = '16rem' // h-64
        this.toggleLinkTarget.textContent = this.allLabel
      }
    }

  })

})()
