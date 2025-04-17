require_relative 'local_avatars'
require_dependency 'user'

module RedmineAsapTheme
  module UsersAvatarPatch
    def self.included(base) # :nodoc:
      base.class_eval do
				acts_as_attachable
      end
    end
  end
end


User.include RedmineAsapTheme::UsersAvatarPatch
