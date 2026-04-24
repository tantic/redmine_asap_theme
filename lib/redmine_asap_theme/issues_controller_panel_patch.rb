require_dependency 'issues_controller'

module RedmineAsapTheme
  module IssuesControllerPanelPatch
    # Uses a minimal layout (no nav/sidebar) when ?panel=1 is present,
    # reducing the payload by ~70% for the issue panel.
    # _layout is called by Rails at render time, after instance variables are set.
    def _layout(lookup_context, formats)
      if params[:panel].present? && action_name == 'show'
        return 'panel'
      end
      super
    end
  end
end

IssuesController.prepend RedmineAsapTheme::IssuesControllerPanelPatch
