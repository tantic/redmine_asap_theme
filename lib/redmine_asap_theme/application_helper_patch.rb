module RedmineAsapTheme
  module ApplicationHelperPatch
    def render_projects_for_jump_box(projects, selected: nil, query: nil)
      if query.blank?
        jump_box = Redmine::ProjectJumpBox.new User.current
        bookmarked = jump_box.bookmarked_projects
        recents = jump_box.recently_used_projects
        projects_label = :label_project_all
      else
        projects_label = :label_result_plural
      end
      jump = params[:jump].presence || current_menu_item
      s = (+'').html_safe
      build_project_link = lambda do |project, level = 0|
        padding = level * 16
        text = content_tag('span', project.name, :style => "padding-left:#{padding}px;")
        s << link_to(text, project_path(project, :jump => jump),
                     :title => project.name,
                     :class => (project == selected ? 'selected' : nil))
      end
      [
        [bookmarked, :label_optgroup_bookmarks, true],
        [recents,   :label_optgroup_recents,    false],
        [projects,  projects_label,             true]
      ].each do |projects, label, is_tree|
        next if projects.blank?

        # s << content_tag(:strong, l(label))
        s << content_tag('div', l(label), class: 'label-group')
        if is_tree
          project_tree(projects, &build_project_link)
        else
          # we do not want to render recently used projects as a tree, but in the
          # order they were used (most recent first)
          projects.each(&build_project_link)
        end
      end
      s
    end
  end
end

Rails.application.config.after_initialize do
  ApplicationController.send(:helper, RedmineAsapTheme::ApplicationHelperPatch)
end