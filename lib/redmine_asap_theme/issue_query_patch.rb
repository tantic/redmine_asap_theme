module RedmineAsapTheme
  module IssueQueryPatch
    BOARD_COLUMN_TYPES = %w[status version].freeze

    def board_column_type
      options[:board_column_type].presence || 'status'
    end

    def board_column_type=(val)
      options[:board_column_type] = BOARD_COLUMN_TYPES.include?(val.to_s) ? val.to_s : 'status'
    end

    def board_view
      options[:board_view].presence
    end

    def board_view=(val)
      options[:board_view] = (val.to_s == 'board') ? 'board' : nil
    end

    def board_status_ids
      ids = options[:board_status_ids]
      ids.is_a?(Array) && ids.any? ? ids.map(&:to_i) : nil
    end

    def board_status_ids=(val)
      options[:board_status_ids] = val.is_a?(Array) ? val.map(&:to_i).select(&:positive?) : nil
    end

    def board_version_ids
      ids = options[:board_version_ids]
      ids.is_a?(Array) && ids.any? ? ids.map(&:to_i) : nil
    end

    def board_version_ids=(val)
      options[:board_version_ids] = val.is_a?(Array) ? val.map(&:to_i).select(&:positive?) : nil
    end

    def build_from_params(params, defaults = {})
      super.tap do
        query_params = params[:query] || defaults || {}

        bct = query_params[:board_column_type] || params[:board_column_type]
        self.board_column_type = bct if bct.present?

        view = params[:view] || query_params[:view]
        self.board_view = view if view.present?

        raw_ids = query_params[:board_status_ids] || params[:board_status_ids]
        if raw_ids.is_a?(Array)
          clean = raw_ids.reject(&:blank?).map(&:to_i).select(&:positive?)
          self.board_status_ids = clean.any? ? clean : nil
        end

        raw_vids = query_params[:board_version_ids] || params[:board_version_ids]
        if raw_vids.is_a?(Array)
          clean = raw_vids.reject(&:blank?).map(&:to_i).select(&:positive?)
          self.board_version_ids = clean.any? ? clean : nil
        end
      end
    end
  end
end

Rails.application.config.after_initialize do
  class RedmineAsapTheme::ParentIssueGroupColumn < QueryColumn
    def initialize
      super(:parent_issue, caption: :field_parent_issue)
      self.groupable = true
    end

    def group_by_statement
      "#{Issue.table_name}.parent_id"
    end

    def value(issue)
      issue.parent
    end

    def group_value(issue)
      issue.parent
    end
  end

  IssueQuery.prepend RedmineAsapTheme::IssueQueryPatch
  IssueQuery.available_columns << RedmineAsapTheme::ParentIssueGroupColumn.new
end
