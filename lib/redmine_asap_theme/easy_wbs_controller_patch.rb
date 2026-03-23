# Patch EasyWbsController to:
# 1. Include SortHelper (missing from the original controller, causes sort_clear NameError)
# 2. Override retrieve_query to persist the selected WBS query in session

module RedmineAsapTheme
  module EasyWbsControllerPatch

    def retrieve_query
      if params[:query_id].present?
        cond = 'project_id IS NULL'
        cond << " OR project_id = #{@project.id}" if @project

        @query = query_class.where(cond).find_by(id: params[:query_id])
        raise ActiveRecord::RecordNotFound if @query.nil?
        raise Unauthorized unless @query.visible?

        @query.project = @project
        session[:easy_wbs_query] = { id: @query.id, project_id: @query.project_id }
        session[:issue_query]    = { id: @query.id, project_id: @query.project_id }
      else
        restored = false
        [:easy_wbs_query, :issue_query].each do |key|
          break if restored
          next unless session[key].present?

          sess = session[key].with_indifferent_access
          saved_id = sess[:id]
          saved_project_id = sess[:project_id].presence&.to_i

          if saved_id && saved_project_id == @project&.id
            candidate = IssueQuery.find_by(id: saved_id)
            if candidate.is_a?(EasyWbs::IssueQuery) && candidate.visible?
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
    end

  end
end

