require_relative 'local_avatars'

require_dependency 'account_controller'

module RedmineAsapTheme
	module AccountControllerPatch

		def self.included(base) # :nodoc:
			base.class_eval do
				helper :attachments
				include AttachmentsHelper

        skip_before_action :require_admin, only: [:get_avatar], raise: false
			end
		end

		include LocalAvatars

		# def get_avatar
		# 	@user = User.find(params[:id])
		# 	send_avatar(@user)
		# end
    def get_avatar
      @user = User.find(params[:id])
      if request.format.html?
        head :not_acceptable
      else
        send_avatar(@user)
      end
    end
	end
end

AccountController.include RedmineAsapTheme::AccountControllerPatch
