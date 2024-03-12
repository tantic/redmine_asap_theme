(() => {
  const application = Stimulus.Application.start()

  application.register("calendar", class extends Stimulus.Controller {

    static get targets() {
      return [ "day" ]
    }

    connect() {}

    new(){
      console.log("New")
    }


  })

})()
