(async function () {
  // Wait for Stimulus application to be available
  while (typeof Stimulus === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Import Controller from Stimulus module
  const { Controller } = await import('@hotwired/stimulus');

  Stimulus.register("navbar", class extends Controller {

    static targets = [ "projectMenu", "projectactionsubmenu", "projectsubprojects","searchInput", "searchResults", "projectsList"]
    static values = {url: String}

    connect() {
      console.log("chargement du navbar")
    }

    toggleProjectMenu(event){
      console.log("dans le toggle")
      this.projectMenuTarget.classList.toggle('hidden');
      this.dismissOnClick(this.projectMenuTarget);
    }

    toggleSubprojects(event){
      const projectId = event.currentTarget.dataset.projectId
      const subprojectsMenu = document.getElementById(`subprojects-${projectId}`)

      if (subprojectsMenu) {
        // Basculer la visibilité du sous-menu du projet cliqué
        subprojectsMenu.classList.toggle("hidden")
      }
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

    async search(){
      let content = null
      const query = this.searchInputTarget.value;
      console.log("query length "+query.length)
      if (query.length > 2) {
        this.searchResultsTarget.innerHTML = '';
        content = await this.fetch(query)
        this.hideProjectsList();
        if (!content) return

        const fragment = document.createRange().createContextualFragment(content)
        this.searchResultsTarget.appendChild(fragment)
      }else{
        this.searchResultsTarget.innerHTML = '';
        this.showProjectsList();
        return;
      }
    }

    async fetch (query) {
      // if (!this.remoteContent) {

        if (!this.hasUrlValue) {
          console.error('[stimulus-search] You need to pass an url to fetch the search content.')
          return
        }

        const response = await fetch(this.urlValue+'?q='+query)
        this.remoteContent = await response.text()
      // }

      return this.remoteContent
    }

    showProjectsList(){
      this.projectsListTarget.classList.remove('hidden');
    }

    hideProjectsList(){
      this.projectsListTarget.classList.add('hidden');
    }

})

})()

