require_dependency 'tracker'

module RedmineAsapTheme
  module TrackerPatch
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

Tracker.send(:include, RedmineAsapTheme::TrackerPatch) unless Tracker.included_modules.include? RedmineAsapTheme::TrackerPatch