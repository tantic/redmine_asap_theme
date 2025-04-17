(() => {
  const application = Stimulus.Application.start()

  application.register("application", class extends Stimulus.Controller {

    static get targets() {
      return [ "modal", "modalbody", "settings", "settingsBody", "app" ]
    }

    static get values() {
      return {myaccount: String}
    }

    connect() {
      console.log("dans application")
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

    showModal(){
      this.modalTarget.classList.toggle('hidden');
      this.modalbodyTarget.classList.toggle('hidden');
      this.dismissOnClick(this.modalTarget, this.modalbodyTarget);
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

    async fetch () {
      if (!this.remoteContent) {

        if (!this.hasMyaccountValue) {
          console.error('You need to pass an url to fetch the content.')
          return
        }

        const response = await fetch(this.myaccountValue)
        this.remoteContent = await response.text()
      }

      return this.remoteContent
    }

  })

})()