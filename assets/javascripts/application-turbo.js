
document.addEventListener("turbo:load", function(e) {
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

document.addEventListener("turbo:load", function(e) {
  $('#content').on('change', 'input[data-disables], input[data-enables], input[data-shows]', toggleDisabledOnChange);
  toggleDisabledInit();

  $('#content').on('click', '.toggle-multiselect', function() {
    toggleMultiSelect($(this).siblings('select'));
    $(this).toggleClass('icon-toggle-plus icon-toggle-minus');
  });
  toggleMultiSelectIconInit();

  $('#history .tabs').on('click', 'a', function(e){
    var tab = $(e.target).attr('id').replace('tab-','');
    document.cookie = 'history_last_tab=' + tab + '; SameSite=Lax'
  });
});

document.addEventListener("turbo:load", function(e) {
  $('#content').on('click', 'div.jstTabs a.tab-preview', function(event){
    var tab = $(event.target);

    var url = tab.data('url');
    var form = tab.parents('form');
    var jstBlock = tab.parents('.jstBlock');

    var element = encodeURIComponent(jstBlock.find('.wiki-edit').val());
    var attachments = form.find('.attachments_fields input').serialize();

    $.ajax({
      url: url,
      type: 'post',
      data: "text=" + element + '&' + attachments,
      success: function(data){
        jstBlock.find('.wiki-preview').html(data);
        setupWikiTableSortableHeader();
      }
    });
  });
});

document.addEventListener("turbo:load",function(){

  observeSearchfield('projects-quick-search', null, $('#projects-quick-search').data('automcomplete-url'));

  $(".drdn-content").keydown(function(event){
    var items = $(this).find(".drdn-items");

    // If a project is selected set focused to selected only once
    if (selected && selected.length > 0) {
      var focused = selected;
      selected = undefined;
    }
    else {
      var focused = items.find("a:focus");
    }
    switch (event.which) {
    case 40: //down
      if (focused.length > 0) {
        focused.nextAll("a").first().focus();;
      } else {
        items.find("a").first().focus();;
      }
      event.preventDefault();
      break;
    case 38: //up
      if (focused.length > 0) {
        var prev = focused.prevAll("a");
        if (prev.length > 0) {
          prev.first().focus();
        } else {
          $(this).find(".autocomplete").focus();
        }
        event.preventDefault();
      }
      break;
    case 35: //end
      if (focused.length > 0) {
        focused.nextAll("a").last().focus();
        event.preventDefault();
      }
      break;
    case 36: //home
      if (focused.length > 0) {
        focused.prevAll("a").last().focus();
        event.preventDefault();
      }
      break;
    }
  });
});




function defaultFocus(){
  // if (($('#content :focus').length == 0) && (window.location.hash == '')) {
  //   $('#content input[type=text]:visible, #content textarea:visible').first().focus();
  // }
}


function autoFillProjectIdentifier() {
  var locked = ($('#project_identifier').val() != '');
  var maxlength = parseInt($('#project_identifier').attr('maxlength'));

  $('#project_name').keyup(function(){
    if(!locked) {
      $('#project_identifier').val(generateProjectIdentifier($('#project_name').val(), maxlength));
    }
  });

  $('#project_identifier').keyup(function(){
    locked = ($('#project_identifier').val() != '' && $('#project_identifier').val() != generateProjectIdentifier($('#project_name').val(), maxlength));
  });
}

function toggle(breadcrumb){
  if (breadcrumb.style.display === "none") {
    breadcrumb.style.display = "flex";
  } else {
    breadcrumb.style.display = "none";
  }
}



function buildFilterRow(field, operator, values) {
  var fieldId = field.replace('.', '_');
  var filterTable = $("#filters-table");
  var filterOptions = availableFilters[field];
  if (!filterOptions) return;
  var operators = operatorByType[filterOptions['type']];
  var filterValues = filterOptions['values'];
  var i, select;

  var tr = $('<div class="filter">').attr('id', 'tr_'+fieldId).html(
    '<td class="field"><input checked="checked" id="cb_'+fieldId+'" name="f[]" value="'+field+'" type="checkbox"><label for="cb_'+fieldId+'"> '+filterOptions['name']+'</label></td>' +
    '<td class="operator"><select id="operators_'+fieldId+'" name="op['+field+']"></td>' +
    '<td class="values"></td>'
  );
  filterTable.append(tr);

  select = tr.find('td.operator select');
  for (i = 0; i < operators.length; i++) {
    var option = $('<option>').val(operators[i]).text(operatorLabels[operators[i]]);
    if (operators[i] == operator) { option.prop('selected', true); }
    select.append(option);
  }
  select.change(function(){ toggleOperator(field); });

  switch (filterOptions['type']) {
  case "list":
  case "list_with_history":
  case "list_optional":
  case "list_optional_with_history":
  case "list_status":
  case "list_subprojects":
    tr.find('td.values').append(
      '<span style="display:none;"><select class="value" id="values_'+fieldId+'_1" name="v['+field+'][]"></select>' +
      ' <span class="toggle-multiselect icon-only '+(values.length > 1 ? 'icon-toggle-minus' : 'icon-toggle-plus')+'">&nbsp;</span></span>'
    );
    select = tr.find('td.values select');
    if (values.length > 1) { select.attr('multiple', true); }
    for (i = 0; i < filterValues.length; i++) {
      var filterValue = filterValues[i];
      var option = $('<option>');
      if ($.isArray(filterValue)) {
        option.val(filterValue[1]).text(filterValue[0]);
        if ($.inArray(filterValue[1], values) > -1) {option.prop('selected', true);}
        if (filterValue.length == 3) {
          var optgroup = select.find('optgroup').filter(function(){return $(this).attr('label') == filterValue[2]});
          if (!optgroup.length) {optgroup = $('<optgroup>').attr('label', filterValue[2]);}
          option = optgroup.append(option);
        }
      } else {
        option.val(filterValue).text(filterValue);
        if ($.inArray(filterValue, values) > -1) {option.prop('selected', true);}
      }
      select.append(option);
    }
    break;
  case "date":
  case "date_past":
    tr.find('td.values').append(
      '<span style="display:none;"><input type="date" name="v['+field+'][]" id="values_'+fieldId+'_1" size="10" class="value date_value" /></span>' +
      ' <span style="display:none;"><input type="date" name="v['+field+'][]" id="values_'+fieldId+'_2" size="10" class="value date_value" /></span>' +
      ' <span style="display:none;"><input type="text" name="v['+field+'][]" id="values_'+fieldId+'" size="3" class="value" /> '+labelDayPlural+'</span>'
    );
    $('#values_'+fieldId+'_1').val(values[0]).datepickerFallback(datepickerOptions);
    $('#values_'+fieldId+'_2').val(values[1]).datepickerFallback(datepickerOptions);
    $('#values_'+fieldId).val(values[0]);
    break;
  case "string":
  case "text":
  case "search":
    tr.find('td.values').append(
      '<span style="display:none;"><input type="text" name="v['+field+'][]" id="values_'+fieldId+'" size="30" class="value" /></span>'
    );
    $('#values_'+fieldId).val(values[0]);
    break;
  case "relation":
    tr.find('td.values').append(
      '<span style="display:none;"><input type="text" name="v['+field+'][]" id="values_'+fieldId+'" size="6" class="value" /></span>' +
      '<span style="display:none;"><select class="value" name="v['+field+'][]" id="values_'+fieldId+'_1"></select></span>'
    );
    $('#values_'+fieldId).val(values[0]);
    select = tr.find('td.values select');
    for (i = 0; i < filterValues.length; i++) {
      var filterValue = filterValues[i];
      var option = $('<option>');
      option.val(filterValue[1]).text(filterValue[0]);
      if (values[0] == filterValue[1]) { option.prop('selected', true); }
      select.append(option);
    }
    break;
  case "integer":
  case "float":
  case "tree":
    tr.find('td.values').append(
      '<span style="display:none;"><input type="text" name="v['+field+'][]" id="values_'+fieldId+'_1" size="14" class="value" /></span>' +
      ' <span style="display:none;"><input type="text" name="v['+field+'][]" id="values_'+fieldId+'_2" size="14" class="value" /></span>'
    );
    $('#values_'+fieldId+'_1').val(values[0]);
    $('#values_'+fieldId+'_2').val(values[1]);
    break;
  }
}




document.addEventListener("turbo:load",function(){
  $(function () {
    $("[title]:not(.no-tooltip)").tooltip({
      show: {
        delay: 400
      },
      position: {
        my: "center bottom-5",
        at: "center top"
      }
    });
  });
});

document.addEventListener("turbo:load",function(){
  // $('#content').on('change', 'input[data-disables], input[data-enables], input[data-shows]', toggleDisabledOnChange);
  // toggleDisabledInit();

  // $('#content').on('click', '.toggle-multiselect', function() {
  //   toggleMultiSelect($(this).siblings('select'));
  //   $(this).toggleClass('icon-toggle-plus icon-toggle-minus');
  // });
  // toggleMultiSelectIconInit();

  $('#history .tabs li').on('click', 'a', function(e){
    console.log("clic sur la tab")
    var tab = $(e.target).attr('id').replace('tab-','');
    document.cookie = 'history_last_tab=' + tab + '; SameSite=Lax'
  });
});

document.addEventListener("turbo:load",function(){
  $('#content').on('click', 'div.jstTabs a.tab-preview', function(event){
    var tab = $(event.target);

    var url = tab.data('url');
    var form = tab.parents('form');
    var jstBlock = tab.parents('.jstBlock');

    var element = encodeURIComponent(jstBlock.find('.wiki-edit').val());
    var attachments = form.find('.attachments_fields input').serialize();

    $.ajax({
      url: url,
      type: 'post',
      data: "text=" + element + '&' + attachments,
      success: function(data){
        jstBlock.find('.wiki-preview').html(data);
        setupWikiTableSortableHeader();
      }
    });
  });
});


document.addEventListener("turbo:load",function(){
  function initFilters() {
    $('#add_filter_select').change(function() {
      addFilter($(this).val(), '', []);
    });
    $('#filters-table td.field input[type=checkbox]').each(function() {
      toggleFilter($(this).val());
    });
    $('#filters-table').on('click', 'td.field input[type=checkbox]', function() {
      toggleFilter($(this).val());
    });
    $('#filters-table').on('keypress', 'input[type=text]', function(e) {
      if (e.keyCode == 13) $(this).closest('form').submit();
    });
  }}
);

document.addEventListener("turbo:load",function(){
  function showTab(name, url) {
    $('#tab-content-' + name).parent().find('.tab-content').hide();
    $('#tab-content-' + name).show();
    $('#tab-' + name).closest('.tabs').find('a').removeClass('selected');
    $('#tab-' + name).addClass('selected');

    replaceInHistory(url)

    return false;
  }}
);

document.addEventListener("turbo:load",function(){
  function showIssueHistory(journal, url) {
    tab_content = $('#tab-content-history');
    tab_content.parent().find('.tab-content').hide();
    tab_content.show();
    tab_content.parent().children('div.tabs').find('a').removeClass('selected');

    $('#tab-' + journal).addClass('selected');

    replaceInHistory(url)

    switch(journal) {
      case 'notes':
        tab_content.find('.journal').show();
        tab_content.find('.journal:not(.has-notes)').hide();
        tab_content.find('.journal .wiki').show();
        tab_content.find('.journal .contextual .journal-actions').show();

        // always show thumbnails in notes tab
        var thumbnails = tab_content.find('.journal .thumbnails');
        thumbnails.show();
        // show journals without notes, but with thumbnails
        thumbnails.parents('.journal').show();
        break;
      case 'properties':
        tab_content.find('.journal').show();
        tab_content.find('.journal:not(.has-details)').hide();
        tab_content.find('.journal .wiki').hide();
        tab_content.find('.journal .thumbnails').hide();
        tab_content.find('.journal .contextual .journal-actions').hide();
        break;
      default:
        tab_content.find('.journal').show();
        tab_content.find('.journal .wiki').show();
        tab_content.find('.journal .thumbnails').show();
        tab_content.find('.journal .contextual .journal-actions').show();
    }

    return false;
  }
});

document.addEventListener("turbo:load",function(){
  function getRemoteTab(name, remote_url, url, load_always) {
    load_always = load_always || false;
    var tab_content = $('#tab-content-' + name);

    tab_content.parent().find('.tab-content').hide();
    tab_content.parent().children('div.tabs').find('a').removeClass('selected');
    $('#tab-' + name).addClass('selected');

    replaceInHistory(url);

    if (tab_content.children().length == 0 && load_always == false) {
      $.ajax({
        url: remote_url,
        type: 'get',
        success: function(data){
          tab_content.html(data)
        }
      });
    }

    tab_content.show();
    return false;
  }
});


//replaces current URL with the "href" attribute of the current link
//(only triggered if supported by browser)
document.addEventListener("turbo:load",function(){
  function replaceInHistory(url) {
    if ("replaceState" in window.history && url !== undefined) {
      window.history.replaceState(null, document.title, url);
    }
  }
});


document.addEventListener("turbo:load",function(){
  function moveTabRight(el) {
    var lis = $(el).parents('div.tabs').first().find('ul').children();
    var bw = $(el).parents('div.tabs-buttons').outerWidth(true);
    var tabsWidth = 0;
    var i = 0;
    lis.each(function() {
      if ($(this).is(':visible')) {
        tabsWidth += $(this).outerWidth(true);
      }
    });
    if (tabsWidth < $(el).parents('div.tabs').first().width() - bw) { return; }
    $(el).siblings('.tab-left').removeClass('disabled');
    while (i<lis.length && !lis.eq(i).is(':visible')) { i++; }
    var w = lis.eq(i).width();
    lis.eq(i).hide();
    if (tabsWidth - w < $(el).parents('div.tabs').first().width() - bw) {
      $(el).addClass('disabled');
    }
  }
});

window.keepAnchorOnSignIn = function (form) {
  var hash = decodeURIComponent(document.location.hash);

  if (hash) {
    if (!hash.startsWith("#")) {
      hash = "#" + hash;
    }
    form.action = form.action + hash;
  }
  form.submit();
  return false;
};


document.addEventListener("turbo:load",function(){
  $(function ($) {
    $('#auth_source_ldap_mode').change(function () {
      $('.ldaps_warning').toggle($(this).val() != 'ldaps_verify_peer');
    }).change();
  });
});


document.addEventListener("turbo:load",function(){
  function inlineAutoComplete(element) {
      'use strict';

      // do not attach if Tribute is already initialized
      if (element.dataset.tribute === 'true') {return};

      const getDataSource = function(entity) {
        const dataSources = rm.AutoComplete.dataSources;

        if (dataSources[entity]) {
          return dataSources[entity];
        } else {
          return false;
        }
      }

      const debounce = function(func, delay) {
        let timeout;

        return function(...args) {
          const context = this;
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(context, args), delay);
        };
      }

      const remoteSearch = debounce((url, cb) => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function ()
        {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              var data = JSON.parse(xhr.responseText);
              cb(data);
            } else if (xhr.status === 403) {
              cb([]);
            }
          }
        };
        xhr.open("GET", url, true);
        xhr.send();
      }, 200);

      const tribute = new Tribute({
        collection: [
          {
            trigger: '#',
            values: function (text, cb) {
              if (event.target.type === 'text' && element.getAttribute('autocomplete') != 'off') {
                element.setAttribute('autocomplete', 'off');
              }
              // When triggered with text starting with "##", like "##a", the search term will become "#a",
              // causing the SQL query to fail in finding issues with "a" in the subject.
              // To avoid this, remove the first "#" from the search term.
              if (text) {
                text = text.replace(/^#/, '');
              }
              remoteSearch(getDataSource('issues') + encodeURIComponent(text), function (issues) {
                return cb(issues);
              });
            },
            lookup: 'label',
            fillAttr: 'label',
            requireLeadingSpace: true,
            selectTemplate: function (issue) {
              let leadingHash = "#"
              // keep ## syntax which is a valid issue syntax to show issue with title.
              if (this.currentMentionTextSnapshot.charAt(0) === "#") {
                leadingHash = "##"
              }
              return leadingHash + issue.original.id;
            },
            menuItemTemplate: function (issue) {
              return sanitizeHTML(issue.original.label);
            }
          },
          {
            trigger: '[[',
            values: function (text, cb) {
              remoteSearch(getDataSource('wiki_pages') + encodeURIComponent(text), function (wikiPages) {
                return cb(wikiPages);
              });
            },
            lookup: 'label',
            fillAttr: 'label',
            requireLeadingSpace: true,
            selectTemplate: function (wikiPage) {
              return '[[' + wikiPage.original.value + ']]';
            },
            menuItemTemplate: function (wikiPage) {
              return sanitizeHTML(wikiPage.original.label);
            }
          },
          {
            trigger: '@',
            lookup: function (user, mentionText) {
              return user.name + user.firstname + user.lastname + user.login;
            },
            values: function (text, cb) {
              const url = getDataSource('users');
              if (url) {
                remoteSearch(url + encodeURIComponent(text), function (users) {
                  return cb(users);
                });
              }
            },
            menuItemTemplate: function (user) {
              return user.original.name;
            },
            selectTemplate: function (user) {
              return '@' + user.original.login;
            }
          }
        ],
        noMatchTemplate: ""
      });

      tribute.attach(element);
  }
});

document.addEventListener("turbo:load",function(){
  function addFormObserversForDoubleSubmit() {
    $('form[method=post]').each(function() {
      if (!$(this).hasClass('multiple-submit')) {
        $(this).submit(function(form_submission) {
          if ($(form_submission.target).attr('data-submitted')) {
            form_submission.preventDefault();
          } else {
            $(form_submission.target).attr('data-submitted', true);
          }
        });
      }
    });
  }
});

document.addEventListener("turbo:load",function(){
  function showModal(id, width, title) {
    var el = $('#'+id).first();
    if (el.length === 0 || el.is(':visible')) {return;}
    if (!title) title = el.find('h3.title').text();
    // moves existing modals behind the transparent background
    $(".modal").css('zIndex',99);
    el.dialog({
      width: width,
      modal: true,
      resizable: false,
      dialogClass: 'modal',
      title: title
    }).on('dialogclose', function(){
      $(".modal").css('zIndex',101);
    });
    el.find("input[type=text], input[type=submit]").first().focus();
  }
});

document.addEventListener("turbo:load",setupAjaxIndicator);
document.addEventListener("turbo:load",hideOnLoad);
document.addEventListener("turbo:load",addFormObserversForDoubleSubmit);
document.addEventListener("turbo:load",defaultFocus);
document.addEventListener("turbo:load",setupAttachmentDetail);
document.addEventListener("turbo:load",setupTabs);
document.addEventListener("turbo:load",setupFilePreviewNavigation);
document.addEventListener("turbo:load",setupWikiTableSortableHeader);
document.addEventListener("turbo:load", () => {
  document.addEventListener("focusin", (event) => {
    const el = event.target
    if (el.matches('[data-auto-complete="true"]')) {
      inlineAutoComplete(el)
    }
  })
})
document.addEventListener("turbo:load",function(){
  autoFillProjectIdentifier();
});