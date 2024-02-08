(() => {
  const application = Stimulus.Application.start()

  application.register("tabs", class extends Stimulus.Controller {

    static get targets() {
      return [ 'btn', 'tab' ]
    }

    // static targets = ["btn", "tab"]
    static get values() {
      return {defaultTab: String}
    }

  connect() {
    console.log("tabs")
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

    // connect() {
    //   this.showTab(0); // Afficher le premier onglet par défaut
    // }

    // showTab(event){
    //   this.tabTargets.forEach((tab, index) => {

    //     tab.classList.toggle("active",
    //     event.target.dataset.index == index)
    //   })
    // }

    // showTab(event) {
    //   this.tabTargets.forEach((tab, i) => {
    //     tab.classList.toggle('active', tab.dataset.index == i);
    //   });

    //   console.log("sdfsdf")
    //   this.contentTargets.forEach((content, i) => {
    //     content.classList.toggle('active', i === index);
    //   });
    // }

  })

})()
