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
      const handler = (evt) => {
        if (!element.contains(evt.target)) {
          element.classList.add('hidden')
        } else {
          document.addEventListener('click', handler, { once: true });
        }
      };
      setTimeout(() => document.addEventListener('click', handler, { once: true }), 0);
    }

 });

})();
