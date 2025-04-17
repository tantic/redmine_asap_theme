require_relative 'local_avatars'
require_dependency 'users_helper'
module RedmineAsapTheme
  module UsersHelperPatch
    def self.included(base) # :nodoc:
      base.class_eval do
        alias_method :user_settings_tabs_without_avatar, :user_settings_tabs
        alias_method :user_settings_tabs, :user_settings_tabs_with_avatar
      end
    end

		def user_settings_tabs_with_avatar
			tabs = user_settings_tabs_without_avatar
			tabs << {:name => 'avatar', :partial => 'my/avatar', :label => :label_avatar}
		end
  end
end
UsersHelper.include RedmineAsapTheme::UsersHelperPatch

