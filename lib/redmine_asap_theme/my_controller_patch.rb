require_relative 'local_avatars'
require_dependency 'my_controller'

module RedmineAsapTheme
	module MyControllerPatch
		def self.included(base) # :nodoc:
			base.class_eval do
				helper :attachments
				include AttachmentsHelper
			end
		end

		include LocalAvatars

		def avatar
			@user = User.current
		end

		def save_avatar
			@user = User.current
      begin
				save_or_delete # see the LocalAvatars module
				redirect_to :action => 'account', :id => @user
			rescue => e
				$stderr.puts("save_or_delete raise an exception.	exception: #{e.class}:	#{e.message}")
				flash[:error] = @possible_error || e.message
				redirect_to :action => 'avatar'
			end
		end
	end
end
MyController.include RedmineAsapTheme::MyControllerPatch
