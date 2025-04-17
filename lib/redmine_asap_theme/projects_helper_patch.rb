require_dependency "projects_helper"

module RedmineAsapTheme
  module ProjectsHelperPatch

    def bookmark_link(project, user = User.current)
      return '' unless user && user.logged?

      @jump_box ||= Redmine::ProjectJumpBox.new user
      bookmarked = @jump_box.bookmark?(project)
      css = +"icon bookmark "

      if bookmarked
        css << "icon-bookmark"
        icon = "bookmark-delete"
        method = "delete"
        text = sprite_icon(icon, l(:button_project_bookmark_delete))
      else
        css << "icon-bookmark-off"
        icon = "bookmark-add"
        method = "post"
        text = sprite_icon(icon, l(:button_project_bookmark))
      end

      url = bookmark_project_path(project)
      link_to text, url, remote: true, method: method, class: css
    end

  end
end


ProjectsHelper.prepend RedmineAsapTheme::ProjectsHelperPatch
ActionView::Base.prepend ProjectsHelper