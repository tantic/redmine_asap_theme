# frozen_string_literal: true

require_dependency 'issue_import'

# Adds tag_list support to IssueImport when additional_tags plugin is installed.
module RedmineAsapTheme
  module IssueImportPatch
    def self.prepended(base)
      Rails.logger.warn "[IssueImportPatch] prepended onto #{base}"
      return unless Redmine::Plugin.installed?(:additional_tags)

      # Enables auto-mapping when CSV header is "tag_list" or matches l(:field_tag_list)
      base::AUTO_MAPPABLE_FIELDS['tag_list'] = 'field_tag_list'
      Rails.logger.warn "[IssueImportPatch] tag_list added to AUTO_MAPPABLE_FIELDS"
    end

    # extend_object is called after the issue is persisted — safer for acts-as-taggable-on
    def extend_object(row, item, issue)
      super

      Rails.logger.warn "[IssueImportPatch] extend_object called for issue ##{issue&.id}"

      return unless Redmine::Plugin.installed?(:additional_tags)
      Rails.logger.warn "[IssueImportPatch] additional_tags installed"

      return unless AdditionalTags.setting?(:active_issue_tags)
      Rails.logger.warn "[IssueImportPatch] active_issue_tags enabled"

      return unless issue.persisted?
      Rails.logger.warn "[IssueImportPatch] issue persisted"

      tag_value = row_value(row, 'tag_list')
      Rails.logger.warn "[IssueImportPatch] tag_value=#{tag_value.inspect}, mapping=#{mapping.inspect}"
      return if tag_value.blank?

      tag_list = tag_value.split(/,\s*/).map(&:strip).reject(&:empty?)
      Rails.logger.warn "[IssueImportPatch] tag_list=#{tag_list.inspect}"
      issue.tag_list = tag_list
      issue.send(:save_tags)
      Rails.logger.warn "[IssueImportPatch] save_tags done, tags=#{issue.tag_list.inspect}"
    end
  end
end

IssueImport.prepend RedmineAsapTheme::IssueImportPatch
