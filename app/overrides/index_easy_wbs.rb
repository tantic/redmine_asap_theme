module IndexEasyWbs
  Deface::Override.new :virtual_path => "easy_wbs/easy_queries/_show",
                      :name => "button_filter_contextual",
                      :insert_bottom => "div.content-title",
                      :partial => "issues/toggle_filters_options"

  Deface::Override.new :virtual_path => "easy_wbs/index",
                      :name => "easy_wbs_sidebar",
                      :insert_after => "div#easy_wbs",
                      :text => "<% content_for :sidebar do %><%= call_hook(:view_easy_wbs_index_sidebar, project: @project, query: @query) %><% end %>"
end