(() => {
  const application = Stimulus.Application.start()

  application.register("application", class extends Stimulus.Controller {

    static get targets() {
      return [ "modal", "modalbody" ]
    }

    connect() {
      console.log("application")
    }

    dismissOnClick(parent, element) {
      document.addEventListener('click', (evt) => {
        console.log("dans le dismiss")
        var isClickInside = element.contains(evt.target);
        if (!isClickInside) {
          console.log("click en dehors")
          parent.classList.add('hidden')
          element.classList.add('hidden')
        }
        else{
          console.log("click dedans")
          this.dismissOnClick(this.modalTarget, this.modalbodyTarget);
        }
      },
      { once: true, capture: true }
     );
    }

    showmodal(){
      this.modalTarget.classList.toggle('hidden');
      this.modalbodyTarget.classList.toggle('hidden');
      this.dismissOnClick(this.modalTarget, this.modalbodyTarget);
    }

  })

})()
