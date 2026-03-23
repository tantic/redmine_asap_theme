require 'redmine'

module RedmineAsapTheme
  class Hooks < Redmine::Hook::ViewListener

    render_on :view_layouts_base_html_head, partial: 'redmine_asap_theme/html_head'
    render_on :view_easy_gantt_index_sidebar, partial: 'hooks/redmine_asap_theme/view_easy_gantt_index_sidebar'
    render_on :view_easy_wbs_index_sidebar,  partial: 'hooks/redmine_asap_theme/view_easy_wbs_index_sidebar'

  end
end