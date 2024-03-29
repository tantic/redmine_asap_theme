(() => {
  const application = Stimulus.Application.start()

  application.register("contextual", class extends Stimulus.Controller {

    static get targets() {
      return [ "actions" ]
    }

    connect() {}

    toggleActions(event){
      this.actionsTarget.classList.toggle('hidden');
      this.dismissOnClick(this.actionsTarget);
    }

    dismissOnClick(element) {
      document.addEventListener('click', (evt) => {
        var isClickInside = element.contains(evt.target);
        if (!isClickInside) {
          element.classList.add('hidden')
        }
      },
      { once: true, capture: true }
     );
    }

  })

})()
