(async function () {
  // Wait for Stimulus application to be available
  while (typeof Stimulus === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Import Controller from Stimulus module
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("tabs", class extends Controller {

    static targets = [ 'btn', 'tab' ]

    static values = {
      defaultTab: String
    }

    connect() {
      console.log("Dans les tabs")
      this.tabTargets.map(x => x.hidden = true) // hide all tabs by default
      // OPEN DEFAULT TAB
      try {
        let selectedBtn = this.btnTargets.find(element => element.id === this.defaultTabValue)
        let selectedTab = this.tabTargets.find(element => element.id === this.defaultTabValue)
        selectedTab.hidden = false
        selectedBtn.classList.add("active")
      } catch { }
    }

    select(event) {
      // find tab with same id as clicked btn
      let selectedTab = this.tabTargets.find(element => element.id === event.currentTarget.id)
      if (selectedTab.hidden) {
        // CLOSE CURRENT TAB
        this.tabTargets.map(x => x.hidden = true) // hide all tabs
        this.btnTargets.map(x => x.classList.remove("active")) // deactive all btns
        selectedTab.hidden = false // show current tab
        event.currentTarget.classList.add("active") // active current btn
      } else {
        // OPEN CURRENT TAB
        this.tabTargets.map(x => x.hidden = true) // hide all tabs
        this.btnTargets.map(x => x.classList.remove("active")) // deactive all btns
        selectedTab.hidden = true // hide current tab
        event.currentTarget.classList.remove("active") // deactive current btn
      }
    }

 });

})();
