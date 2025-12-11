module IndexIssues
  Deface::Override.new :virtual_path => "projects/index",
                      :name => "button_filter_contextual",
                      :insert_top => "div.contextual",
                      :partial => "issues/toggle_filters_options"
end