require_dependency "issues_helper"

module RedmineAsapTheme
  module IssuesHelperPatch

    # Renders the list of related issues on the issue details view
  def render_issue_relations(issue, relations)
    manage_relations = User.current.allowed_to?(:manage_issue_relations, issue.project)
    s = ''.html_safe
    relations.each do |relation|
      other_issue = relation.other_issue(issue)
      css = "issue hascontextmenu text-xs flex flex-col shadow bg-white my-2 rounded p-2 hover:bg-gray-50  #{other_issue.css_classes} #{relation.css_classes_for(other_issue)}"
      buttons =
        if manage_relations
          link_to(
            l(:label_relation_delete),
            relation_path(relation, issue_id: issue.id),
            :remote => true,
            :method => :delete,
            :data => {:confirm => l(:text_are_you_sure)},
            :title => l(:label_relation_delete),
            :class => 'icon-only icon-link-break'
          )
        else
          "".html_safe
        end
      buttons << link_to_context_menu
      s <<
        content_tag(
          'div',
          content_tag('div',
            content_tag('div',
                      check_box_tag(
                        "ids[]", other_issue.id,
                        false, :id => nil),
                      :class => 'checkbox') +
                      content_tag(
                        'span',
                        relation.to_s(@issue),
                        :class => 'ml-2 font-extralight'),
                      :class => 'flex items-center') +
             content_tag('div',
                            link_to(
                              other_issue.subject,
                              issue_path(other_issue),
                              class: 'font-normal'
                           ),
                         :class => 'subject flex my-2'),
            #  content_tag('div', other_issue.status, :class => 'status') +
            #  content_tag('div', link_to_user(other_issue.assigned_to), :class => 'assigned_to') +
            #  content_tag('td', format_date(other_issue.start_date), :class => 'start_date') +
            #  content_tag('td', format_date(other_issue.due_date), :class => 'due_date') +
            #  content_tag('td',
            #              (if other_issue.disabled_core_fields.include?('done_ratio')
            #                 ''
            #               else
            #                 progress_bar(other_issue.done_ratio)
            #               end),
            #              :class=> 'done_ratio') +
            #  content_tag('td', buttons, :class => 'buttons'),
          :id => "relation-#{relation.id}",
          :class => css)
    end
    content_tag('div', s, :class => 'list issues odd-even')
  end

  end
end


IssuesHelper.prepend RedmineAsapTheme::IssuesHelperPatch
ActionView::Base.prepend IssuesHelper