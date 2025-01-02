(() => {
  const application = Stimulus.Application.start()

  application.register("sidebar", class extends Stimulus.Controller {

    static get targets() {
      return [ "projectMenu", "projectactionsubmenu", "projectsubprojects","searchInput", "searchResults", "projectsList"]
    }

    static get values() {
      return {url: String}
    }

    connect() {
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

    // search() {
    //   console.log("Dans la recherche")
    //   const query = this.searchInputTarget.value;

    //   if (query.length > 2) { // Lancer la recherche après 3 caractères minimum
    //     const response = await fetch(`/autocomplete/search?q=${query}`)
    //     this.remoteContent = await response.text()

    //     .then(data => {
    //       this.searchResultsTarget.innerHTML = data.map(project => `
    //         <li>
    //           <a href="/projects/${project.id}" class="block p-2 hover:bg-gray-100">
    //             ${project.name}
    //           </a>
    //         </li>
    //       `).join('');
    //     });
    //   } else {
    //     this.searchResultsTarget.innerHTML = "";
    //   }
    // }


  })

})()
