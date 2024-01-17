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
      event.preventDefault();
      if(this.hasNavigationTarget) {
        if (this.navigationTarget.classList.contains("hidden")) {
          console.log("Affiche panneau");
          this.navigationTarget.classList.remove("hidden");
          this.sectionTarget.classList.remove("ml-16");
          this.sectionTarget.classList.add("ml-80");
          // this.navigationTarget.classList.toggle('hidden');
      this.dismissNavigationOnClick(this.navigationTarget);
        } else {
          console.log("Ferme panneau");
          this.navigationTarget.classList.add("hidden");
          this.sectionTarget.classList.remove("ml-80");
          this.sectionTarget.classList.add("ml-16");
        }
      }

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
