require_relative 'local_avatars'

require_dependency 'account_controller'

module RedmineAsapTheme
	module AccountControllerPatch

		def self.included(base) # :nodoc:
			base.class_eval do
				helper :attachments
				include AttachmentsHelper
			end
		end

		include LocalAvatars

		def get_avatar
			@user = User.find(params[:id])
			send_avatar(@user)
		end
	end
end

AccountController.include RedmineAsapTheme::AccountControllerPatch
