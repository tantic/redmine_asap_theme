# Patch QueriesController to handle redirect after saving an EasyWbs::IssueQuery.
# "EasyWbs::IssueQuery".underscore produces "easy_wbs/issue_query" (with a slash),
# which is not a valid Ruby method name. This patch normalizes it to underscore.

module RedmineAsapTheme
  module EasyWbsQueriesControllerPatch
    if Redmine::Plugin.installed?(:easy_wbs)

      def redirect_to_items(options)
        method_name = "redirect_to_#{@query.class.name.underscore.tr('/', '_')}"
        if respond_to?(method_name, true)
          send method_name, options
        else
          super
        end
      end

      def redirect_to_easy_wbs_issue_query(options)
        redirect_to project_easy_wbs_index_path(@project, options)
      end

    end
  end
end

if Redmine::Plugin.installed?(:easy_wbs)
  require_dependency 'queries_controller'
  QueriesController.prepend RedmineAsapTheme::EasyWbsQueriesControllerPatch
end
