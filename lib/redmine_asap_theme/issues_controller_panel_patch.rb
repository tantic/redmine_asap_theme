require_dependency 'issues_controller'

module RedmineAsapTheme
  module IssuesControllerPanelPatch
    def _layout(*args)
      if params[:panel].present? && action_name.in?(%w[show new create edit update])
        turbo_panel = Setting.plugin_redmine_asap_theme['turbo_panel'].to_s == 'true'
        return turbo_panel ? 'panel_turbo' : 'panel'
      end
      super
    end

    # Preserve more fields when clicking "Créer et continuer"
    def redirect_after_create
      return super unless params[:continue]

      url_params = {}
      base_subject = @issue.subject.sub(/ \((\d+)\)$/, '')
      last_n       = @issue.subject[/ \((\d+)\)$/, 1].to_i
      next_subject = "#{base_subject} (#{last_n + 1})"

      url_params[:issue] = {
        tracker_id:       @issue.tracker_id,
        status_id:        @issue.status_id,
        parent_issue_id:  @issue.parent_issue_id,
        priority_id:      @issue.priority_id,
        assigned_to_id:   @issue.assigned_to_id,
        category_id:      @issue.category_id,
        fixed_version_id: @issue.fixed_version_id,
        done_ratio:       @issue.done_ratio,
        start_date:       @issue.start_date,
        due_date:         @issue.due_date,
        subject:          next_subject
      }.compact
      url_params[:back_url] = params[:back_url].presence

      if params[:project_id]
        redirect_to new_project_issue_path(@issue.project, url_params)
      else
        url_params[:issue][:project_id] = @issue.project_id
        redirect_to new_issue_path(url_params)
      end
    end
  end
end

IssuesController.prepend RedmineAsapTheme::IssuesControllerPanelPatch
