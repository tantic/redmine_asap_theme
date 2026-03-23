(function () {
  var panel = null;

  function createPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'issue-panel';
    panel.className = 'issue-panel';
    panel.innerHTML = [
      '<div class="issue-panel__backdrop"></div>',
      '<div class="issue-panel__drawer">',
        '<div class="issue-panel__toolbar">',
          '<a class="issue-panel__external" href="#" target="_blank">',
            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:14px;height:14px;">',
              '<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />',
            '</svg>',
            'Ouvrir',
          '</a>',
          '<button class="issue-panel__close" aria-label="Fermer">',
            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:18px;height:18px;">',
              '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />',
            '</svg>',
          '</button>',
        '</div>',
        '<div class="issue-panel__body">',
          '<div class="issue-panel__loading">Chargement\u2026</div>',
        '</div>',
      '</div>',
    ].join('');

    document.body.appendChild(panel);
    panel.querySelector('.issue-panel__backdrop').addEventListener('click', close);
    panel.querySelector('.issue-panel__close').addEventListener('click', close);
  }

  function open(url) {
    createPanel();
    var external = panel.querySelector('.issue-panel__external');
    external.href = url;
    panel.querySelector('.issue-panel__body').innerHTML = '<div class="issue-panel__loading">Chargement\u2026</div>';
    panel.classList.add('is-open');
    document.body.classList.add('issue-panel-open');
    load(url);
  }

  function close() {
    if (!panel) return;
    panel.classList.remove('is-open');
    document.body.classList.remove('issue-panel-open');
  }

  // Ré-exécute les scripts inline d'un container (ex: select2Tag, fixScopedTags…)
  function execInlineScripts(container) {
    container.querySelectorAll('script:not([src])').forEach(function (old) {
      var s = document.createElement('script');
      s.textContent = old.textContent;
      document.head.appendChild(s);
      document.head.removeChild(s);
    });
  }

  // Injecte les assets CSS/JS du formateur wiki depuis le <head> de la page fetchée
  // (jstoolbar, etc.) s'ils ne sont pas encore chargés dans la page courante.
  // Charge les scripts séquentiellement pour respecter les dépendances.
  function injectMissingHeadAssets(doc) {
    // CSS : injection synchrone (pas besoin d'attendre le chargement)
    doc.querySelectorAll('head link[rel="stylesheet"]').forEach(function (l) {
      var href = l.getAttribute('href') || '';
      if (!href.includes('jstoolbar')) return;
      if (document.querySelector('link[href*="jstoolbar"]')) return;
      var nl = document.createElement('link');
      nl.rel = 'stylesheet';
      nl.href = l.href;
      document.head.appendChild(nl);
    });

    // Scripts : collecte dans l'ordre du DOM, injection séquentielle
    var srcs = [];
    doc.querySelectorAll('head script[src]').forEach(function (s) {
      var src = s.getAttribute('src') || '';
      if (!src.includes('jstoolbar')) return;
      var filename = src.split('/').pop().split('?')[0];
      if (document.querySelector('script[src*="' + filename + '"]')) return;
      srcs.push(s.src);
    });

    return srcs.reduce(function (promise, src) {
      return promise.then(function () {
        return new Promise(function (resolve) {
          var ns = document.createElement('script');
          ns.src = src;
          ns.onload = resolve;
          ns.onerror = resolve;
          document.head.appendChild(ns);
        });
      });
    }, Promise.resolve());
  }

  async function load(url) {
    try {
      var res = await fetch(url, { credentials: 'same-origin' });
      var html = await res.text();
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var content = doc.querySelector('#content');
      if (content && panel) {
        // Injecter les assets du formateur wiki avant l'exécution des scripts inline
        await injectMissingHeadAssets(doc);
        panel.querySelector('.issue-panel__body').innerHTML = content.innerHTML;
        // Afficher temporairement les forms cachés pour que select2 calcule sa largeur
        var hiddenForms = panel.querySelectorAll('.issue-panel__body .hidden');
        hiddenForms.forEach(function (el) { el.style.display = 'block'; });
        // Ré-exécuter les scripts inline (initialise select2, wikitoolbar, etc.)
        execInlineScripts(panel.querySelector('.issue-panel__body'));
        // Re-cacher après l'init (select2 est async via $(function))
        setTimeout(function () {
          hiddenForms.forEach(function (el) { el.style.display = ''; });
        }, 200);
        // Activer l'onglet sélectionné par défaut via son lien href="javascript:..."
        var activeTab = panel.querySelector('.issue-panel__body .tabs ul li.selected a, .issue-panel__body .tabs ul li:first-child a');
        if (activeTab) {
          var js = activeTab.getAttribute('href');
          if (js && js.startsWith('javascript:')) {
            try { (0, eval)(js.slice(11)); } catch (_) {}
          }
        }
      }
    } catch (e) {
      if (panel) {
        panel.querySelector('.issue-panel__body').innerHTML =
          '<p style="padding:2rem;color:#ef4444;">Erreur de chargement</p>';
      }
    }
  }

  // Rafraîchit le tableau des issues sans fermer le panel
  async function refreshList() {
    // Cherche la table hors du panel (pas celle des sous-tâches dans le panel)
    var tables = document.querySelectorAll('table.issues');
    var table = Array.from(tables).find(function (t) { return !t.closest('.issue-panel'); });
    if (!table) return;
    try {
      var res = await fetch(window.location.href, { credentials: 'same-origin' });
      var html = await res.text();
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var newTable = doc.querySelector('table.issues');
      if (newTable) table.outerHTML = newTable.outerHTML;
    } catch (e) { /* silencieux */ }
  }

  // Prévisualisation jstoolbar dans le panel
  // (le handler natif de application-legacy.js est scopé à #content, pas au panel)
  document.addEventListener('click', function (e) {
    if (!panel || !panel.classList.contains('is-open')) return;
    var tab = e.target.closest('.issue-panel__body div.jstTabs a.tab-preview');
    if (!tab) return;
    var previewUrl = tab.getAttribute('data-url');
    if (!previewUrl) return;
    var jstBlock = tab.closest('.jstBlock');
    if (!jstBlock) return;
    var wikiEdit = jstBlock.querySelector('.wiki-edit');
    var text = wikiEdit ? encodeURIComponent(wikiEdit.value) : '';
    var csrfToken = document.querySelector('meta[name="csrf-token"]');
    fetch(previewUrl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': csrfToken ? csrfToken.getAttribute('content') : ''
      },
      body: 'text=' + text
    }).then(function (res) { return res.text(); })
      .then(function (html) {
        var preview = jstBlock.querySelector('.wiki-preview');
        if (preview) preview.innerHTML = html;
      });
  });

  // Écoute les saves du field-edit controller qui bubblent depuis le panel
  document.addEventListener('field-edit:saved', function (e) {
    if (!panel || !panel.classList.contains('is-open')) return;
    // Si le save vient de l'intérieur du panel, recharger le contenu du panel
    if (e.target && e.target.closest && e.target.closest('.issue-panel__body')) {
      var issueUrl = panel.querySelector('.issue-panel__external').href;
      load(issueUrl);
    }
    refreshList();
  });

  // Intercepte les soumissions de formulaire dans le panel (ajout de note, etc.)
  document.addEventListener('submit', function (e) {
    if (!panel || !panel.classList.contains('is-open')) return;
    if (!e.target.closest('.issue-panel__body')) return;
    e.preventDefault();

    var form = e.target;
    var issueUrl = panel.querySelector('.issue-panel__external').href;
    var body = panel.querySelector('.issue-panel__body');
    body.style.opacity = '0.5';

    var csrfToken = document.querySelector('meta[name="csrf-token"]');
    var headers = csrfToken ? { 'X-CSRF-Token': csrfToken.getAttribute('content') } : {};

    fetch(form.action, {
      method: 'POST', // Rails gère le override via _method dans FormData
      body: new FormData(form),
      credentials: 'same-origin',
      headers: headers
    }).then(function (res) {
      body.style.opacity = '';
      if (res.ok) {
        load(issueUrl);
        refreshList();
      } else {
        body.innerHTML = '<p style="padding:2rem;color:#ef4444;">Erreur (' + res.status + ')</p>';
      }
    }).catch(function () {
      body.style.opacity = '';
    });
  });

  // Intercept prev/next navigation links inside the panel
  document.addEventListener('click', function (e) {
    if (!panel || !panel.classList.contains('is-open')) return;
    if (!e.target.closest('.issue-panel__body')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest('.next-prev-links a');
    if (!link || !link.href) return;
    e.preventDefault();
    var issueUrl = link.href;
    panel.querySelector('.issue-panel__external').href = issueUrl;
    panel.querySelector('.issue-panel__body').innerHTML = '<div class="issue-panel__loading">Chargement\u2026</div>';
    load(issueUrl);
  });

  // Délégation : clic sur sujet d'une issue dans le tableau (hors panel)
  // Activé uniquement si l'utilisateur a activé la fonctionnalité beta
  document.addEventListener('click', function (e) {
    if (document.body.dataset.issuePanelBeta !== 'true') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest('table.issues td.subject a');
    if (!link) return;
    if (link.closest('.issue-panel')) return; // ignorer les liens dans le panel
    e.preventDefault();
    open(link.href);
  });

  // Fermer avec Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  // API publique — utilisée par todo_controller.js et inbox_controller.js
  window.IssuePanel = { open: open, close: close };
})();
