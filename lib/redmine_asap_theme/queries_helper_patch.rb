require_dependency "queries_helper"

module RedmineAsapTheme
  module QueriesHelperPatch

    def column_value(column, item, value)
      content =
        case column.name
        when :id
          link_to value, issue_path(item)
        when :subject
          link_to value, issue_path(item)
        when :parent, :'issue.parent'
          value ? (value.visible? ? link_to_issue(value, :subject => false) : "##{value.id}") : ''
        when :description
          item.description? ? content_tag('div', textilizable(item, :description), :class => "wiki") : ''
        when :last_notes
          item.last_notes.present? ? content_tag('div', textilizable(item, :last_notes), :class => "wiki") : ''
        when :done_ratio
          progress_bar(value)
        when :relations
          content_tag(
            'span',
            value.to_s(item) {|other| link_to_issue(other, :subject => false, :tracker => false)}.html_safe,
            :class => value.css_classes_for(item))
        when :hours, :estimated_hours, :total_estimated_hours
          format_hours(value)
        when :spent_hours
          link_to_if(value > 0, format_hours(value), project_time_entries_path(item.project, :issue_id => "#{item.id}"))
        when :total_spent_hours
          link_to_if(value > 0, format_hours(value), project_time_entries_path(item.project, :issue_id => "~#{item.id}"))
        when :attachments
          value.to_a.map {|a| format_object(a)}.join(" ").html_safe
        when :tracker
          content_tag('span', value, class: css_classes_for_item(value))
        else
          format_object(value)
        end

      call_hook(:helper_queries_column_value,
                {:content => content, :column => column, :item => item, :value => value})

      content
    end

    def css_classes_for_item(item)
      "rel-#{item.id}"
    end


  end
end


QueriesHelper.prepend RedmineAsapTheme::QueriesHelperPatch
ActionView::Base.prepend QueriesHelper