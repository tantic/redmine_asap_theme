module QueriesFormBoardFields
  Deface::Override.new(
    virtual_path:  'queries/_form',
    name:          'add_board_settings_to_save_form',
    insert_before: 'fieldset#filters',
    text: <<~ERB
      <% if @query.respond_to?(:board_view) && @query.board_view == 'board' %>
      <%= hidden_field_tag 'view', 'board' %>
      <fieldset id="board-save-options">
        <legend><%= l(:label_board_columns) %></legend>
        <p class="board-options__row">
          <label><%= l(:label_board_column_by) %></label>
          <%= select_tag 'query[board_column_type]',
                options_for_select(
                  [[l(:label_board_column_status), 'status'], [l(:label_board_column_version), 'version']],
                  @query.board_column_type
                ),
                id: 'board_save_column_type' %>
        </p>
        <div id="board-save-status-cols" class="board-options__row"
             style="<%= 'display:none' if @query.board_column_type == 'version' %>">
          <label><%= l(:label_board_status_columns) %></label>
          <%= hidden_field_tag 'query[board_status_ids][]', '' %>
          <% _sel = @query.respond_to?(:board_status_ids) ? (@query.board_status_ids || []) : [] %>
          <div class="board-status-list">
            <% IssueStatus.sorted.each do |_st| %>
              <label class="board-status-picker__item">
                <%= check_box_tag 'query[board_status_ids][]', _st.id,
                      _sel.empty? || _sel.include?(_st.id) %>
                <%= _st.name %>
              </label>
            <% end %>
          </div>
        </div>
        <div id="board-save-version-cols" class="board-options__row"
             style="<%= 'display:none' if @query.board_column_type != 'version' %>">
          <label><%= l(:label_board_status_columns) %></label>
          <%= hidden_field_tag 'query[board_version_ids][]', '' %>
          <% _proj = @query.project %>
          <% _versions = _proj ? _proj.versions.open.sort_by { |v| [v.effective_date.to_s, v.name] } : [] %>
          <% _sel_v = @query.respond_to?(:board_version_ids) ? (@query.board_version_ids || []) : [] %>
          <div class="board-status-list">
            <% _versions.each do |_v| %>
              <label class="board-status-picker__item">
                <%= check_box_tag 'query[board_version_ids][]', _v.id,
                      _sel_v.empty? || _sel_v.include?(_v.id) %>
                <%= _v.name %>
              </label>
            <% end %>
          </div>
        </div>
      </fieldset>
      <script>
      (function() {
        var sel    = document.getElementById('board_save_column_type');
        var status = document.getElementById('board-save-status-cols');
        var ver    = document.getElementById('board-save-version-cols');
        if (!sel) return;
        sel.addEventListener('change', function() {
          var isVersion = sel.value === 'version';
          status.style.display = isVersion ? 'none' : '';
          ver.style.display    = isVersion ? '' : 'none';
        });
      })();
      </script>
      <% end %>
    ERB
  )
end
