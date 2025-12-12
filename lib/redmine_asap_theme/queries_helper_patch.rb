require_dependency "queries_helper"

module RedmineAsapTheme
  module QueriesHelperPatch

    def column_value(column, item, value)
      case column.name
      when :tracker
        content_tag(
          'span',
          value,
          class: "rounded-r-md px-2.5 py-1 text-xs font-medium",
          style: "background-color: #{item.tracker.bg_color};color: #{item.tracker.text_color}"
        )

      when :status
        content_tag(
          'span',
          value,
          class: "rounded px-2.5 py-0.5 text-xs font-medium",
          style: "background-color: #{item.status.bg_color};color: #{item.status.text_color}"
        )

      else
        # 👉 Laisser Redmine gérer toutes les autres colonnes
        super
      end
    end

  end
end

Rails.application.config.after_initialize do
  QueriesHelper.prepend RedmineAsapTheme::QueriesHelperPatch
end
#
# QueriesHelper.include RedmineAsapTheme::QueriesHelperPatch
