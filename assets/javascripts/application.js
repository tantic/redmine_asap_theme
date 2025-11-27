
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
