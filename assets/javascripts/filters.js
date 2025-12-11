function initToggleQueryForm() {
  var btn = document.getElementById('toggle-query-form');
  if (!btn) return;

  var form = document.getElementById('query_form');
  if (!form) return;

  var iconOn  = document.getElementById('icon-on');   // adjustments
  var iconOff = document.getElementById('icon-off');  // adjustments-off

  function updateIcon(visible) {
    // ICI L’INVERSION QUE TU VEUX :
    if (visible) {
      // query visible → montrer adjustments-off
      iconOn.style.display  = 'none';
      iconOff.style.display = 'inline';
    } else {
      // query caché → montrer adjustments
      iconOn.style.display  = 'inline';
      iconOff.style.display = 'none';
    }
  }

  // Lire l'état sauvegardé
  var saved = localStorage.getItem('query_form_visible');

  // Appliquer l'état initial
  var visible = true; // par défaut visible

  if (saved === 'false') {
    visible = false;
    form.style.display = 'none';
  } else {
    visible = true;
    form.style.display = 'block';
  }

  updateIcon(visible);

  // Toggle
  btn.addEventListener('click', function(e) {
    e.preventDefault();

    var isVisible = window.getComputedStyle(form).display !== 'none';

    if (isVisible) {
      form.style.display = 'none';
      localStorage.setItem('query_form_visible', 'false');
      updateIcon(false);
    } else {
      form.style.display = 'block';
      localStorage.setItem('query_form_visible', 'true');
      updateIcon(true);
    }
  });
};

// Événements classiques
document.addEventListener('DOMContentLoaded', initToggleQueryForm);

// Compatibilité Turbo (Hotwire)
document.addEventListener('turbo:render', initToggleQueryForm);

