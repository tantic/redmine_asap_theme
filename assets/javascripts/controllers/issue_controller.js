(() => {
  const application = Stimulus.Application.start()

  application.register("issue", class extends Stimulus.Controller {

    static get targets() {
      return [ "actions", "navigation", "section" ]
    }

    connect() {}

    toggle(event){
      this.actionsTarget.classList.toggle('hidden');
      this.dismissOnClick(this.actionsTarget);
    }

    toggleNavigation(event){
      this.navigationTarget.classList.toggle('hidden');
      this.dismissOnClick(this.navigationTarget);
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

    dismissNavigationOnClick(element) {
      document.addEventListener('click', (evt) => {
        var isClickInside = element.contains(evt.target);
        if (!isClickInside) {
          this.toggleNavigation(evt)
        }
      },
      { once: true, capture: true }
     );
    }

  })

})()
