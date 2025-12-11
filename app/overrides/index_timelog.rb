module IndexTimelog
  Deface::Override.new :virtual_path => "timelog/index",
                     :name => "button_filter_contextual",
                     :insert_top => "div.contextual",
                     :partial => "issues/toggle_filters_options"
end