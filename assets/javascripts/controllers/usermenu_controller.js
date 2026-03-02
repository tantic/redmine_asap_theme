(async function () {
  // Wait for Stimulus application to be available
  while (typeof Stimulus === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Import Controller from Stimulus module
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("usermenu", class extends Controller {

    static targets = [ "usersubmenu", "search", "searchinput", "adminsubmenu", "tools" ]

    connect() {
      console.log("Chargement du menu utilisateur")
    }

    toggle(event){
      this.usersubmenuTarget.classList.toggle('hidden');
      this.dismissOnClick(this.usersubmenuTarget);
    }

    toggleAdmin(event){
      this.adminsubmenuTarget.classList.toggle('hidden');
      this.dismissOnClick(this.adminsubmenuTarget);
    }

    toggleTools(event){
      this.toolsTarget.classList.toggle('hidden');
      this.dismissOnClick(this.toolsTarget);
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

    hide(){
      this.usersubmenuTarget.classList.add('hidden')
    }

    search(event) {
      event.preventDefault();
      this.searchTargets.forEach((search) => {
        if (search.classList.contains("hidden")) {
          search.classList.remove("hidden");
          this.searchinputTarget.focus();
          this.dismissOnClick(this.searchTarget);
        } else {
          search.classList.add("hidden");
        }
      });
    }

 });

})();