require_dependency "projects_helper"

module RedmineAsapTheme
  module ProjectsHelperPatch

    def bookmark_link(project, user = User.current)
      return '' unless user && user.logged?

      @jump_box ||= Redmine::ProjectJumpBox.new user
      bookmarked = @jump_box.bookmark?(project)
      css = +"icon bookmark "

      if bookmarked
        css << "icon-bookmark cursor-pointer ml-1 p-2 rounded-full hover:bg-yellow-100 text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 hover:text-gray-800"
        method = "delete"
        # text = l(:button_project_bookmark_delete)
        icon = svg_tag("star-yellow.svg", class: 'w-5 h-5 text-yellow-400 hover:text-yellow-500')
      else
        css << "icon-bookmark-off cursor-pointer ml-1 p-2 rounded-full hover:bg-gray-100 text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 hover:text-gray-800"
        method = "post"
        # text = l(:button_project_bookmark)
        icon = svg_tag("star.svg", class: 'w-5 h-5 hover:text-gray-500')
      end

      url = bookmark_project_path(project)

      link_to url, remote: true, method: method, data: {turbo: false}, class: css do
        icon
      end
    end
  end
end


ProjectsHelper.prepend RedmineAsapTheme::ProjectsHelperPatch
ActionView::Base.prepend ProjectsHelper