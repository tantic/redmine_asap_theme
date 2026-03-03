# Patch EasyGanttController#retrieve_query to persist the selected gantt query in session,
# so it is restored when navigating back to /easy_gantt from another page.

module RedmineAsapTheme
  module EasyGanttControllerPatch

    def retrieve_query
      if params[:query_id].present?
        cond = 'project_id IS NULL'
        cond << " OR project_id = #{@project.id}" if @project

        @query = query_class.where(cond).find_by(id: params[:query_id])
        raise ActiveRecord::RecordNotFound if @query.nil?
        raise Unauthorized unless @query.visible?

        @query.project = @project
        sort_clear

        session[:easy_gantt_query] = { id: @query.id, project_id: @query.project_id }
        session[:issue_query] = { id: @query.id, project_id: @query.project_id }
      else
        restored = false
        if session[:easy_gantt_query].present?
          sess = session[:easy_gantt_query].with_indifferent_access
          saved_id = sess[:id]
          saved_project_id = sess[:project_id].presence&.to_i

          if saved_id && saved_project_id == @project&.id
            candidate = IssueQuery.find_by(id: saved_id)
            if candidate.is_a?(EasyGantt::EasyGanttIssueQuery) && candidate.visible?
              @query = candidate
              @query.project = @project
              restored = true
            end
          end
        end

        unless restored
          @query = query_class.new(name: '_')
          @query.project = @project
          @query.from_params(params)
        end
      end

      @query.opened_project = @opened_project if @opened_project
    end

  end
end

Rails.configuration.to_prepare do
  if Redmine::Plugin.installed?(:easy_gantt)
    EasyGanttController.prepend RedmineAsapTheme::EasyGanttControllerPatch
  end
end
