
// Fix context menu position: Redmine places #context-menu inside #content (position:relative)
// but uses event.pageY (absolute coords). Our theme adds a fixed header (56px) which offsets
// #content, causing the menu to appear lower than the cursor. We override contextMenuShow
// to subtract #content's offset from the coordinates.
// Fix Redmine's collapsibleSidebar not retaining state across Turbo navigation.
// Root cause: `localStorageKey` in the jQuery plugin closure accumulates on every call
// (via +=), so the key used to read state differs from the one used to write it.
(function() {
  var SIDEBAR_KEY = 'asap-sidebar-state';

  function saveSidebarState() {
    var main = document.getElementById('main');
    if (!main) return;
    localStorage.setItem(SIDEBAR_KEY, main.classList.contains('collapsedsidebar') ? 'hidden' : 'visible');
  }

  function applySavedSidebarState() {
    var main = document.getElementById('main');
    if (!main || !main.classList.contains('collapsiblesidebar')) return;
    var saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved === 'hidden') {
      main.classList.add('collapsedsidebar');
    } else if (saved === 'visible') {
      main.classList.remove('collapsedsidebar');
    }
  }

  // Intercept sidebar button click to persist state under our own key
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('#sidebar-switch-button');
    if (!btn) return;
    setTimeout(saveSidebarState, 0); // state toggles after click
  });

  // After each Turbo navigation, collapsibleSidebar() has already run (wrongly reset state)
  // — re-apply our saved state
  document.addEventListener('turbo:render', function() {
    setTimeout(applySavedSidebarState, 0);
  });
})();

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
