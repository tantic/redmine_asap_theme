(async function () {
  // Wait for Stimulus application to be available
  while (typeof Stimulus === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Import Controller from Stimulus module
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("members", class extends Controller {

    static targets = [ "list", "toggleLink" ]
    static values = {
        expanded: Boolean
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

 });

})();
