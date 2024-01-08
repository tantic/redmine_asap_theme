(() => {
  const application = Stimulus.Application.start()

  application.register("usermenu", class extends Stimulus.Controller {

    static get targets() {
      return [ "usersubmenu", "search", "searchinput" ]
    }

    connect() {}

    toggle(event){
      this.usersubmenuTarget.classList.toggle('hidden');
      this.dismissOnClick(this.usersubmenuTarget);
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

  })

})()
