(async function () {
  // Wait for Stimulus application to be available
  while (typeof Stimulus === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Import Controller from Stimulus module
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("projectmenu", class extends Controller {

    static targets = [ "projectsubmenu", "projectactionsubmenu", "projectsubprojects"]

    connect() {
      console.log("Dans le project menu")
    }

    toggle(event){
      console.log("on lance le toggle")
      this.projectsubmenuTarget.classList.toggle('hidden');
      this.dismissOnClick(this.projectsubmenuTarget);
    }

    toggleSubprojects(event){
      this.projectsubprojectsTarget.classList.toggle('hidden');
      this.dismissOnClick(this.projectsubprojectsTarget);
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

 });

})();
