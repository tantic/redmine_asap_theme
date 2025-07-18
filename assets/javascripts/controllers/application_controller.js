(() => {
  const application = Stimulus.Application.start()

  application.register("application", class extends Stimulus.Controller {

    static get targets() {
      return [ "modal", "modalBody", "settings", "settingsBody", "app" ]
    }

    static get values() {
      return {myaccount: String, about: String}
    }

    connect() {
      console.log("dans application")
      this.aboutContent = null
      this.settingsContent = null
    }


    dismissOnClick(parent, element) {
      document.addEventListener('click', (evt) => {
        var isClickInside = element.contains(evt.target);
        if (!isClickInside) {
          parent.classList.add('hidden')
          element.classList.add('hidden')
        }
        else{
          this.dismissOnClick(this.modalTarget, this.modalbodyTarget);
        }
      },
      { once: true, capture: true }
     );
    }

    dismissSettingsOnClick(parent, element) {
      document.addEventListener('click', (evt) => {
        var isClickInside = element.contains(evt.target);
        if (!isClickInside) {
          this.hideSettings();
        }
        else{
          this.dismissSettingsOnClick(this.settingsTarget, this.settingsBodyTarget);
        }
      },
      { once: true, capture: true }
     );
    }

    async showAbout(){
      let content = null
      content = await this.fetchAbout()

      if (!content) return

      const fragment = document.createRange().createContextualFragment(content)
      this.appTarget.appendChild(fragment);
      this.dismissOnClick(this.modalTarget, this.modalBodyTarget);
    }

    async showSettings(){
      let content = null
      content = await this.fetch()

      if (!content) return

      const fragment = document.createRange().createContextualFragment(content)
      this.appTarget.appendChild(fragment);
      this.dismissSettingsOnClick(this.settingsTarget, this.settingsBodyTarget);
    }

    hideSettings(){
      this.settingsTarget.remove();
    }

    hide(){
      this.modalTarget.remove();
    }

    async fetchAbout () {
      if (!this.aboutContent) {
        if (!this.hasAboutValue) {
          console.error('You need to pass an url to fetch the content.')
          return
        }

        const response = await fetch(this.aboutValue)
        this.aboutContent = await response.text()
      }

      return this.aboutContent
    }

    async fetch () {
      if (!this.settingsContent) {

        if (!this.hasMyaccountValue) {
          console.error('You need to pass an url to fetch the content.')
          return
        }

        const response = await fetch(this.myaccountValue)
        this.settingsContent = await response.text()
      }

      return this.settingsContent
    }

  })

})()