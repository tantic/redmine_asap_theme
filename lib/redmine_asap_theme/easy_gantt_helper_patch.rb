module RedmineAsapTheme
  module EasyGanttHelperPatch
    MIN_GANTT_DATE = Date.new(1900, 1, 1)

    def api_render_issues(api, issues, **kwargs)
      issues.each do |issue|
        issue.start_date = nil if issue.start_date && issue.start_date < MIN_GANTT_DATE
        issue.due_date   = nil if issue.due_date   && issue.due_date   < MIN_GANTT_DATE
      end
      super
    end
  end
end

Rails.configuration.to_prepare do
  if Redmine::Plugin.installed?(:easy_gantt)
    EasyGanttHelper.prepend RedmineAsapTheme::EasyGanttHelperPatch
  end
end
