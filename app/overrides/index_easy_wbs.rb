module IndexEasyWbs
  Deface::Override.new :virtual_path => "easy_wbs/easy_queries/_show",
                      :name => "button_filter_contextual",
                      :insert_bottom => "div.content-title",
                      :partial => "issues/toggle_filters_options"
end