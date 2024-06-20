require_dependency "application_helper"
module RedmineAsapTheme
  module ApplicationHelperPatch
    def self.included(base)
      base.class_eval do
          alias_method :project_parent_breadcrumb_patch, :project_parent_breadcrumb
          alias_method :project_parent_breadcrumb, :project_parent_breadcrumb_patch

          alias_method :project_children_breadcrumb_patch, :project_children_breadcrumb
          alias_method :project_children_breadcrumb, :project_children_breadcrumb_patch
      end
    end


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

    def render_project_jump_box
      projects = projects_for_jump_box(User.current)
      if @project && @project.persisted?
        # text = @project.name_was
        text = letter_avatar_tag(@project.name_was, 300, class: 'w-8 h-8 mr-2') + content_tag('span', @project.name_was, :class => 'uppercase font-normal text-xs line-clamp-2')
      end
      text ||= l(:label_jump_to_a_project)
      url = autocomplete_projects_path(:format => 'js', :jump => current_menu_item)
      trigger = content_tag('span', text, :class => 'drdn-trigger')
      q = text_field_tag('q', '', :id => 'projects-quick-search',
                         :class => 'autocomplete',
                         :data => {:automcomplete_url => url},
                         :autocomplete => 'off')
      all = link_to(l(:label_project_all), projects_path(:jump => current_menu_item),
                    :class => (@project.nil? && controller.class.main_menu ? 'selected' : nil))
      content =
        content_tag('div',
                    content_tag('div', q, :class => 'quick-search') +
                      content_tag('div', render_projects_for_jump_box(projects, selected: @project),
                                  :class => 'drdn-items projects selection') +
                      content_tag('div', all, :class => 'drdn-items all-projects selection'),
                    :class => 'drdn-content')
      content_tag('div', trigger + content, :id => "project-jump", :class => "drdn")
    end

    def project_parent_breadcrumb
      if @project.nil? || @project.new_record?
        # content_tag(:div, '&#47;'.html_safe, :id => 'menu-breadcrumb-empty')
      else
          b = []
          c = []
          ancestors = (@project.root? ? [] : @project.ancestors.visible.to_a)
          if ancestors.any?
              b << content_tag(:div, '&#47;'.html_safe, :id => 'menu-breadcrumb')
              root = ancestors.shift
              c << link_to_project(root, {:jump => current_menu_item}, :class => 'root')
              c += ancestors.collect {|p| link_to_project(p, {:jump => current_menu_item}, :class => 'ancestor') }
          end
          if c.size > 0
              separator = content_tag(:span, ' &#47; '.html_safe, class: 'separator')
              path = safe_join(c[0..-1], separator)
              b = [content_tag(:div, path.html_safe, id: 'breadcrumbs', style: "display:none"), b]
          else
              # b << content_tag(:div, '&#47;'.html_safe, :id => 'menu-breadcrumb-empty')
          end
          safe_join b.reverse
      end
    end

    def project_children_breadcrumb
        if @project.nil? || @project.new_record?

        else
            b = []
            c = []
            children = @project.children.visible.to_a
            chevron = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" fill="rgba(255,255,255,1)"/></svg>'
            if children.any?
                icone = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 3c-.825 0-1.5.675-1.5 1.5S11.175 6 12 6s1.5-.675 1.5-1.5S12.825 3 12 3zm0 15c-.825 0-1.5.675-1.5 1.5S11.175 21 12 21s1.5-.675 1.5-1.5S12.825 18 12 18zm0-7.5c-.825 0-1.5.675-1.5 1.5s.675 1.5 1.5 1.5 1.5-.675 1.5-1.5-.675-1.5-1.5-1.5z" fill="rgba(255,255,255,1)"/></svg>'
                b << content_tag(:a, icone.html_safe, :href => "#", :id => 'menu-breadcrumb-children')
                root = children.shift
                c << link_to_project(root, {:jump => current_menu_item}, :class => 'root')
                c += children.collect {|p| link_to_project(p, {:jump => current_menu_item}, :class => 'ancestor') }
            end
            if c.size > 0
                path = safe_join c
                b = [content_tag(:div, path.html_safe, id: 'breadcrumbs-children'), b]
            end
            safe_join b.reverse
        end
    end

    def copy_object_url_link(url)
      text = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>'+ l(:button_copy_link)
      link_to_function(
        raw(text), 'copyTextToClipboard(this);',
        class: 'flex items-center text-gray-900 hover:bg-gray-50 hover:border-l-2 hover:border-blue-800 hover:pl-3.5 px-4 py-2 text-sm',
        data: {'clipboard-text' => url}
      ) do
      test
      end
    end

    def link_to_project(project, options={}, html_options = nil)
      if project.archived?
        content_tag :div, html_options, class: 'flex items-center' do
          letter_avatar_tag(project.name, 300, class: 'w-8 h-8 mr-2') +
          content_tag(:span, project.name, class: "icon-plus icon-white uppercase font-normal text-xs line-clamp-2")
        end
      else
        link_to project_url(project, {:only_path => true}.merge(options)), html_options do
          content_tag :div, :class => 'flex items-center truncate' do
            letter_avatar_tag(project.name, 300, class: 'w-8 h-8 mr-2') +
            content_tag(:span, project.name, class: "icon-plus icon-white uppercase font-normal text-xs line-clamp-2")
          end
        end
      end
    end

    # Renders the project quick-jump box
    def render_project_jump_box
      projects = projects_for_jump_box(User.current)
      if @project && @project.persisted?
        text = @project.name_was
      end
      text ||= l(:label_jump_to_a_project)
      url = autocomplete_projects_path(:format => 'js', :jump => current_menu_item)
      trigger = content_tag('span', text, :class => 'drdn-trigger')
      q = text_field_tag('q', '', :id => 'projects-quick-search',
                        :class => 'autocomplete',
                        :data => {:automcomplete_url => url},
                        :autocomplete => 'off')
      all = link_to(l(:label_project_all), projects_path(:jump => current_menu_item),
                    :class => (@project.nil? && controller.class.main_menu ? 'selected' : nil))
      content =
        content_tag('div',
                    content_tag('div', q, :class => 'quick-search') +
                      content_tag('div', render_projects_for_jump_box(projects, selected: @project),
                                  :class => 'drdn-items projects selection') +
                      content_tag('div', all, :class => 'drdn-items all-projects selection'),
                    :class => 'drdn-content')
      content_tag('div', trigger + content, :id => "project-jump", :class => "drdn")
    end

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

        text = letter_avatar_tag(project.name, 300, class: 'w-8 h-8 mr-2') + content_tag('span', project.name, :class => 'uppercase font-normal text-xs line-clamp-2')
        s << link_to(text, project_path(project, :jump => jump),
                     :title => project.name,
                     :style => "padding-left:#{padding}px;",
                     :class => (project == selected ? 'selected flex items-center hover:bg-gray-50 px-2 ' : 'flex items-center hover:bg-gray-50 px-2'))
      end
      [
        [bookmarked, :label_optgroup_bookmarks, true],
        [recents,   :label_optgroup_recents,    false],
        [projects,  projects_label,             true]
      ].each do |projects, label, is_tree|
        next if projects.blank?

        s << content_tag(:strong, l(label))
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

    def svg_tag(icon_name, options={})
      file = File.read(Rails.root.join('public', 'plugin_assets', 'redmine_asap_theme', 'icons', "#{icon_name}"))
      doc = Nokogiri::HTML::DocumentFragment.parse file
      svg = doc.at_css 'svg'

      options.each {|attr, value| svg[attr.to_s] = value}

      doc.to_html.html_safe
    end

  end
end

# Rails.application.config.after_initialize do
#   ApplicationController.send(:helper, RedmineAsapTheme::ApplicationHelperPatch)
# end
ApplicationHelper.prepend RedmineAsapTheme::ApplicationHelperPatch
ActionView::Base.prepend ApplicationHelper