module RedmineAsapTheme
  module EasyGanttHelperPatch
    if Redmine::Plugin.installed?(:easy_gantt)
      MIN_GANTT_DATE = Date.new(1900, 1, 1)

      def gantt_format_column(entity, column, value)
        if column.is_a?(QueryRelationsColumn)
          column.value_object(entity)
        else
          super
        end
      end

      def api_render_issues(api, issues, **kwargs)
        issues.each do |issue|
          issue.start_date = nil if issue.start_date && issue.start_date < MIN_GANTT_DATE
          issue.due_date   = nil if issue.due_date   && issue.due_date   < MIN_GANTT_DATE
        end
        super
      end
    end
  end
end

if Redmine::Plugin.installed?(:easy_gantt)
  EasyGanttHelper.prepend RedmineAsapTheme::EasyGanttHelperPatch
end
