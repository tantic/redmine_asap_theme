(() => {
  const application = Stimulus.Application.start()

  application.register("sidebar", class extends Stimulus.Controller {

    static get targets() {
      return [ "sidebar" ]
    }

    connect() {}

    toggle(event){
      console.log("dans le toggle")
      this.sidebarTarget.classList.toggle('hidden');
      this.dismissOnClick(this.sidebarTarget);
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
