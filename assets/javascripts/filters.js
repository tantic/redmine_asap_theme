function initToggleQueryForm() {
  var btn = document.getElementById('toggle-query-form');
  if (!btn) return;

  var form = document.getElementById('query_form');
  if (!form) return;

  var iconOn  = document.getElementById('icon-on');   // adjustments-off (form ouvert)
  var iconOff = document.getElementById('icon-off');  // adjustments (form fermé)

  function setVisible(visible) {
    form.style.display = visible ? 'block' : 'none';
    if (iconOn)  iconOn.style.display  = visible ? 'inline' : 'none';
    if (iconOff) iconOff.style.display = visible ? 'none'   : 'inline';
    if (visible) {
      document.documentElement.classList.remove('query-form-hidden');
    } else {
      document.documentElement.classList.add('query-form-hidden');
    }
  }

  var saved = localStorage.getItem('query_form_visible');
  setVisible(saved !== 'false');

  btn.addEventListener('click', function(e) {
    e.preventDefault();
    var isVisible = window.getComputedStyle(form).display !== 'none';
    localStorage.setItem('query_form_visible', isVisible ? 'false' : 'true');
    setVisible(!isVisible);
  });
}

document.addEventListener('DOMContentLoaded', initToggleQueryForm);
document.addEventListener('turbo:render', initToggleQueryForm);
