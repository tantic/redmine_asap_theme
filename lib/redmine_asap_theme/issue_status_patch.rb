require_dependency 'issue_status'

module RedmineAsapTheme
  module IssueStatusPatch
    def self.included(base) # :nodoc:
      base.extend(ClassMethods)
      base.send(:include, InstanceMethods)

      base.class_eval do
        safe_attributes 'bg_color', 'text_color'
      end
    end
    module ClassMethods
    end

    module InstanceMethods
    end
  end
end

IssueStatus.send(:include, RedmineAsapTheme::IssueStatusPatch) unless IssueStatus.included_modules.include? RedmineAsapTheme::IssueStatusPatch
