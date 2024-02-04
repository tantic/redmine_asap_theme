import "./controllers/usermenu_controller.js"
import "./controllers/projectmenu_controller.js"
import "./controllers/issues_controller.js"
import "./controllers/issue_controller.js"
import "./controllers/query_controller.js"

document.addEventListener("DOMContentLoaded", function(e) {
  if(document.querySelector('#menu-breadcrumb')){
    document.querySelector('#menu-breadcrumb').addEventListener('click', function(event){
      event.stopPropagation();
      const breadcrumb = document.querySelector('#breadcrumbs');
      toggle(breadcrumb)
    });

    document.addEventListener('click', function handleClickOutsideBox(event) {
      const breadcrumb = document.querySelector('#breadcrumbs');
      if (!breadcrumb.contains(event.target)) {
        breadcrumb.style.display = "flex"
        toggle(breadcrumb);
      }
    });
  }
});


function toggle(breadcrumb){
  if (breadcrumb.style.display === "none") {
    breadcrumb.style.display = "flex";
  } else {
    breadcrumb.style.display = "none";
  }
}