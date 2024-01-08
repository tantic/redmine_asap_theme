(() => {
  const application = Stimulus.Application.start()

  application.register("usermenu", class extends Stimulus.Controller {

    static get targets() {
      return [ "usersubmenu" ]
    }

    connect() {
      console.log("user menu test ")
      console.log("Submenu "+this.usersubmenuTarget)
    }

    toggle(event){
      this.usersubmenuTarget.classList.toggle('hidden');
      this.dismissOnClick(this.usersubmenuTarget);
    }

    dismissOnClick(element) {
      document.addEventListener('click', (evt) => {
          var isClickInside = element.contains(evt.target);
          if (!isClickInside) {
              console.log("clic en dehors")
              element.classList.add('hidden')
          }
      },
      { once: true, capture: true }
    );
  }



  })

})()
