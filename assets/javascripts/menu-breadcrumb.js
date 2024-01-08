document.addEventListener("DOMContentLoaded", function(e) {
  document.querySelector('#menu-breadcrumb').addEventListener('click', function(event){
    event.stopPropagation();
    breadcrumb = document.querySelector('#breadcrumbs');
    toggle(breadcrumb)
  });

  document.addEventListener('click', function handleClickOutsideBox(event) {
    const breadcrumb = document.querySelector('#breadcrumbs');
    if (!breadcrumb.contains(event.target)) {
      breadcrumb.style.display = "flex"
      toggle(breadcrumb);
    }
  });
});


function toggle(breadcrumb){
  if (breadcrumb.style.display === "none") {
    breadcrumb.style.display = "flex";
  } else {
    breadcrumb.style.display = "none";
  }
}