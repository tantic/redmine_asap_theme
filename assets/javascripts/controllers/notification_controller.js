(() => {
  const application = Stimulus.Application.start()

  application.register("notification", class extends Stimulus.Controller {

    static get values() {
      return {
        hiddenClass: String,
        time: Number,
      }
    }

    connect(){
      console.log("connexion")
    }

    initialize() {
      console.log("ajout ti")
      if (this.timeValue) {
        console.log("ajout timer")
        this.timer()
      }
    }

    close() {
      console.log("ferme")
      if (this.hiddenClassValue === '') {
        console.error('Set [data-alert-hidden-class-value]')
        return
      }

      this.element.classList.add(this.hiddenClassValue)
    }

    timer() {
      setTimeout(() => { this.close() }, this.timeValue)
    }

  })

})()
