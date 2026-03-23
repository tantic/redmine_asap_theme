# Patch QueriesController to handle redirect after saving an EasyGanttIssueQuery.
# easy_gantt patches query_class to recognize EasyGantt::EasyGanttIssueQuery, but does not
# implement the redirect_to_* method that QueriesController#redirect_to_items expects.
# Without this patch, saving a gantt query raises NoMethodError because
# "EasyGantt::EasyGanttIssueQuery".underscore produces "easy_gantt/easy_gantt_issue_query"
# (with a slash), which is not a valid Ruby method name.

module RedmineAsapTheme
  module EasyGanttQueriesControllerPatch
    if Redmine::Plugin.installed?(:easy_gantt)

      # Override redirect_to_items to normalize the module separator slash to underscore
      # before dispatching, so "easy_gantt/easy_gantt_issue_query" becomes
      # "easy_gantt_easy_gantt_issue_query" — a valid method name.
      def redirect_to_items(options)
        method_name = "redirect_to_#{@query.class.name.underscore.tr('/', '_')}"
        if respond_to?(method_name, true)
          send method_name, options
        else
          super
        end
      end

      def redirect_to_easy_gantt_easy_gantt_issue_query(options)
        if @project
          redirect_to easy_gantt_path(@project, options)
        else
          redirect_to easy_gantt_path(options)
        end
      end

    end
  end
end

if Redmine::Plugin.installed?(:easy_gantt)
  require_dependency 'queries_controller'
  QueriesController.prepend RedmineAsapTheme::EasyGanttQueriesControllerPatch
end
