module ShowCalendars
  Deface::Override.new :virtual_path => "calendars/show",
                      :name => "button_filter_contextual",
                      :insert_bottom => "h2",
                      :partial => "issues/toggle_filters_options"
end