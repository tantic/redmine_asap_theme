(() => {
  const application = Stimulus.Application.start()

  application.register("queries", class extends Stimulus.Controller {

    static get targets() {
      return [ "filters", "options", "buttonDisplay", "buttonFilter" ]
    }

    connect() {}

    toggle(event){
      this.filtersTarget.classList.toggle('hidden');
      if(this.buttonFilterTarget.classList.contains('bg-gray-100')){
        this.buttonFilterTarget.classList.remove('bg-gray-100')
      }else{
        this.buttonFilterTarget.classList.add('bg-gray-100')
      }
    }

    display(event){
      this.optionsTarget.classList.toggle('hidden');
      if(this.buttonDisplayTarget.classList.contains('bg-gray-100')){
        this.buttonDisplayTarget.classList.remove('bg-gray-100')
      }else{
        this.buttonDisplayTarget.classList.add('bg-gray-100')
      }
      // this.dismissOnClick(this.optionsTarget);
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
