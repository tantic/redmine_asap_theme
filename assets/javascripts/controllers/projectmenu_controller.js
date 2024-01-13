(() => {
  const application = Stimulus.Application.start()

  application.register("projectmenu", class extends Stimulus.Controller {

    static get targets() {
      return [ "projectsubmenu", "projectactionsubmenu"]
    }

    connect() {}

    toggle(event){
      this.projectsubmenuTarget.classList.toggle('hidden');
      this.dismissOnClick(this.projectsubmenuTarget);
    }

    toggleAction(event){
      this.projectactionsubmenuTarget.classList.toggle('hidden');
      this.dismissOnClick(this.projectactionsubmenuTarget);
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
