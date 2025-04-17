// console.log("dans le application.js")
// import "./test.js"
// console.log("UsermenuController :", UsermenuController);
// import "./controllers/usermenu_controller.js"
// import "./controllers/projectmenu_controller.js"
// import "./controllers/issues_controller.js"
// import "./controllers/issue_controller.js"
// import "./controllers/query_controller.js"
// import "./controllers/application_controller.js"
// import "./controllers/tabs_controller.js"


// document.addEventListener("DOMContentLoaded", function(e) {
//   if(document.querySelector('#menu-breadcrumb')){
//     document.querySelector('#menu-breadcrumb').addEventListener('click', function(event){
//       event.stopPropagation();
//       const breadcrumb = document.querySelector('#breadcrumbs');
//       toggle(breadcrumb)
//     });

//     document.addEventListener('click', function handleClickOutsideBox(event) {
//       const breadcrumb = document.querySelector('#breadcrumbs');
//       if (!breadcrumb.contains(event.target)) {
//         breadcrumb.style.display = "flex"
//         toggle(breadcrumb);
//       }
//     });
//   }
// });


// function toggle(breadcrumb){
//   if (breadcrumb.style.display === "none") {
//     breadcrumb.style.display = "flex";
//   } else {
//     breadcrumb.style.display = "none";
//   }
// }

$(document).ready( function(){
  $('#menu-breadcrumb').click( function(event){
      event.stopPropagation();
      $('#breadcrumbs').toggle();
  });

  $(document).click( function(){
      $('#breadcrumbs').hide();
  });

  $('#menu-breadcrumb-children').click( function(event){
      event.stopPropagation();
      $('#breadcrumbs-children').toggle();
  });

  $(document).click( function(){
      $('#breadcrumbs-children').hide();
  });
});

// window.showAndScrollTo = function(id, focus) {
//   $('#'+id).show();

//   // Masquer le formulaire de commentaire si on édite
//   if (id === 'update') {
//     $('#comment-form-block').hide();
//   }

//   if (focus !== null) {
//     $('#'+focus).focus();
//   }
//   $('html, body').animate({scrollTop: $('#'+id).offset().top}, 100);
// };
