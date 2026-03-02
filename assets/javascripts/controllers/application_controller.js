(async function () {
  // Wait for Stimulus application to be available
  while (typeof Stimulus === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Import Controller from Stimulus module
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("application", class extends Controller {

    static targets = [ "modal", "modalBody", "settings", "settingsBody", "app" ]

    static values = {
        myaccount: String,
        about: String
    }

    connect() {
      console.log("dans application controller")
      this.aboutContent = null
      this.settingsContent = null
    }


    dismissOnClick(parent, element) {
      const handler = (evt) => {
        if (!element.contains(evt.target)) {
          parent.classList.add('hidden')
          element.classList.add('hidden')
        } else {
          document.addEventListener('click', handler, { once: true });
        }
      };
      setTimeout(() => document.addEventListener('click', handler, { once: true }), 0);
    }

    dismissSettingsOnClick(parent, element) {
      const handler = (evt) => {
        if (!element.contains(evt.target)) {
          if (this.hasSettingsTarget) this.hideSettings();
        } else {
          document.addEventListener('click', handler, { once: true });
        }
      };
      setTimeout(() => document.addEventListener('click', handler, { once: true }), 0);
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

 });

})();