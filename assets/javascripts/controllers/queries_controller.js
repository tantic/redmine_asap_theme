(() => {
  const application = Stimulus.Application.start()

  application.register("queries", class extends Stimulus.Controller {

    static get targets() {
      return [ "filters", "issuesfilters", "options", "buttonDisplay", "buttonFilter", "actions" ]
    }

    connect() {}

    toggle(event){
      this.filtersTarget.classList.toggle('hidden');
      this.dismissOnClick(this.filtersTarget);
      // if(this.buttonFilterTarget.classList.contains('bg-gray-100')){
      //   this.buttonFilterTarget.classList.remove('bg-gray-100')
      // }else{
      //   this.buttonFilterTarget.classList.add('bg-gray-100')
      // }
    }

    toggleIssuesFilters(event){
      this.issuesfiltersTarget.classList.toggle('hidden');
      this.filtersTarget.classList.toggle('hidden');
      this.optionsTarget.classList.toggle('hidden');
      this.dismissOnClick(this.issuesfiltersTarget);
      // if(this.buttonFilterTarget.classList.contains('bg-gray-100')){
      //   this.buttonFilterTarget.classList.remove('bg-gray-100')
      // }else{
      //   this.buttonFilterTarget.classList.add('bg-gray-100')
      // }
    }

    toggleActions(event){
      this.actionsTarget.classList.toggle('hidden');
      this.dismissOnClick(this.actionsTarget);
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
