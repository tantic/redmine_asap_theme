module IndexAgileBoard
  Deface::Override.new :virtual_path => "agile_boards/_index",
                      :name => "button_filter_contextual",
                      :insert_top => "div.contextual",
                      :partial => "issues/toggle_filters_options"
end