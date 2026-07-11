module QueryFormBoardOptions
  Deface::Override.new(
    virtual_path:  'queries/_query_form',
    name:          'add_board_column_options',
    insert_before: 'p.buttons',
    text: <<~ERB
      <% if params[:view] == 'board' && @query.respond_to?(:board_column_type) %>
      <fieldset id="board-options" class="collapsible collapsed">
        <legend onclick="toggleFieldset(this);" class="icon icon-collapsed">
          <%= sprite_icon("angle-right", rtl: true) %>
          <%= l(:label_board_columns) %>
        </legend>
        <div class="hidden">
          <div id="board-options-inner">
            <div class="board-options__row">
              <div class="field"><label for="board_column_type"><%= l(:label_board_column_by) %></label></div>
              <div>
                <%= select_tag 'query[board_column_type]',
                      options_for_select(
                        [[l(:label_board_column_status), 'status'], [l(:label_board_column_version), 'version']],
                        @query.board_column_type
                      ),
                      id: 'board_column_type',
                      onchange: 'this.form.submit()' %>
              </div>
            </div>
            <div id="board-filter-status-cols" class="board-options__row"
                 style="<%= 'display:none' if @query.board_column_type == 'version' %>">
              <div class="field"><label><%= l(:label_board_status_columns) %></label></div>
              <div class="board-status-list">
                <%= hidden_field_tag 'query[board_status_ids][]', '' %>
                <% _sel = @query.respond_to?(:board_status_ids) ? (@query.board_status_ids || []) : [] %>
                <% _auto_status_ids = _sel.empty? ? Array(@issues).map(&:status_id).uniq : [] %>
                <% if _sel.empty? %>
                  <span class="board-status-hint"><%= l(:label_board_columns_auto) %></span>
                <% end %>
                <% IssueStatus.sorted.each do |_st| %>
                  <label class="board-status-picker__item">
                    <%= check_box_tag 'query[board_status_ids][]', _st.id,
                          _sel.include?(_st.id) || _auto_status_ids.include?(_st.id) %>
                    <%= _st.name %>
                  </label>
                <% end %>
              </div>
            </div>
            <div id="board-filter-version-cols" class="board-options__row"
                 style="<%= 'display:none' if @query.board_column_type != 'version' %>">
              <div class="field"><label><%= l(:label_board_status_columns) %></label></div>
              <div class="board-status-list">
                <%= hidden_field_tag 'query[board_version_ids][]', '' %>
                <% _proj = @query.project %>
                <% _versions = _proj ? _proj.versions.open.sort_by { |v| [v.effective_date.to_s, v.name] } : [] %>
                <% _sel_v = @query.respond_to?(:board_version_ids) ? (@query.board_version_ids || []) : [] %>
                <% _auto_version_ids = _sel_v.empty? ? Array(@issues).map(&:fixed_version_id).compact.uniq : [] %>
                <% if _sel_v.empty? %>
                  <span class="board-status-hint"><%= l(:label_board_columns_auto) %></span>
                <% end %>
                <% _versions.each do |_v| %>
                  <label class="board-status-picker__item">
                    <%= check_box_tag 'query[board_version_ids][]', _v.id,
                          _sel_v.include?(_v.id) || _auto_version_ids.include?(_v.id) %>
                    <%= _v.name %>
                  </label>
                <% end %>
              </div>
            </div>
          </div>
        </div>
      </fieldset>
      <% end %>
    ERB
  )
end
