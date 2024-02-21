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
      if (this.timeValue) {
        this.timer()
      }
    }

    close() {
      if (this.hiddenClassValue === '') {
        return
      }

      this.element.classList.add(this.hiddenClassValue)
    }

    timer() {
      setTimeout(() => { this.close() }, this.timeValue)
    }

  })

})()
