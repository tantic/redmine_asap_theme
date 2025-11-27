require 'redmine'

module RedmineAsapTheme
  class Hooks < Redmine::Hook::ViewListener

    render_on :view_layouts_base_html_head, partial: 'redmine_asap_theme/html_head'

  end
end