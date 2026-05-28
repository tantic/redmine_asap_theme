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

  end
end

IssuesController.prepend RedmineAsapTheme::IssuesControllerPanelPatch
