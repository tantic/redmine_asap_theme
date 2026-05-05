require_dependency 'issues_controller'

module RedmineAsapTheme
  module IssuesControllerPanelPatch
    # Uses a minimal layout (no nav/sidebar) when ?panel=1 is present,
    # reducing the payload by ~70% for the issue panel.
    # _layout is called by Rails at render time, after instance variables are set.
    def _layout(*args)
      if params[:panel].present? && action_name.in?(%w[show new create])
        turbo_panel = Setting.plugin_redmine_asap_theme['turbo_panel'].to_s == 'true'
        return turbo_panel ? 'panel_turbo' : 'panel'
      end
      super
    end
  end
end

IssuesController.prepend RedmineAsapTheme::IssuesControllerPanelPatch
