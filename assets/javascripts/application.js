
// Fix context menu position: Redmine places #context-menu inside #content (position:relative)
// but uses event.pageY (absolute coords). Our theme adds a fixed header (56px) which offsets
// #content, causing the menu to appear lower than the cursor. We override contextMenuShow
// to subtract #content's offset from the coordinates.
$(document).ready(function() {
  var _origContextMenuShow = window.contextMenuShow;
  if (typeof _origContextMenuShow === 'function') {
    window.contextMenuShow = function(event) {
      var content = document.getElementById('content');
      var rect = content ? content.getBoundingClientRect() : { top: 0, left: 0 };
      var offsetTop  = rect.top  + window.scrollY;
      var offsetLeft = rect.left + window.scrollX;
      var proxy = {
        pageX:   event.pageX   - offsetLeft,
        pageY:   event.pageY   - offsetTop,
        clientY: event.clientY,
        target:  event.target
      };
      _origContextMenuShow(proxy);
    };
  }
});

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
