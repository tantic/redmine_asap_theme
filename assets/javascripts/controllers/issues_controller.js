(() => {
  const application = Stimulus.Application.start()

  application.register("issues", class extends Stimulus.Controller {

    static get targets() {
      return [ "filters" ]
    }

    connect() {}

    toggle(event){
      this.filtersTarget.classList.toggle('hidden');
      this.dismissOnClick(this.filtersTarget);
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
