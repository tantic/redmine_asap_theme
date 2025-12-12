# plugins/redmine_asap_theme/lib/redmine_asap_theme/issues_helper_patch.rb

require_dependency 'issues_helper'

module RedmineAsapTheme
  module IssuesHelperPatch
    def issue_heading(issue)
      text = "#{issue.tracker.name} ##{issue.id}"
      content_tag(
        'span',
        text,
        class: "rounded px-2.5 py-1 text-xs font-medium",
        style: "background-color: #{issue.tracker.bg_color}; color: #{issue.tracker.text_color};"
      )
    end

    def render_issue_status(issue)
      content_tag(
        'span',
        issue.status.name,
        class: "rounded px-2.5 py-0.5 text-xs font-medium",
        style: "background-color: #{issue.status.bg_color}; color: #{issue.status.text_color};"
      )
    end

    def issue_fields_rows
      super do |r|
        # Monkey patch des lignes déjà construites par le core
        r.left.each do |cell|
          if cell.include?(l(:field_status))
            cell.sub!(issue.status.name, render_issue_status(issue))
          end
        end
        yield r if block_given?
      end
    end
  end
end

# Patch propre
# IssuesHelper.include RedmineAsapTheme::IssuesHelperPatch
Rails.application.config.after_initialize do
  IssuesHelper.prepend RedmineAsapTheme::IssuesHelperPatch
end