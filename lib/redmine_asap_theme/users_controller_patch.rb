require_relative 'local_avatars'
require_dependency 'users_controller'

module RedmineAsapTheme
	module UsersControllerPatch

		def self.included(base) # :nodoc:
			base.class_eval do
        skip_before_action :require_admin, only: [:get_avatar, :save_avatar], raise: false
				helper :attachments
				include AttachmentsHelper
			end
		end

		include LocalAvatars

		def get_avatar
			@user = User.find(params[:id])
			send_avatar(@user)
		end

		def save_avatar
			@user = User.find(params[:id])
			begin
				save_or_delete # see the LocalAvatars module
			rescue
				flash[:error] = @possible_error
			end
			redirect_back fallback_location: { action: 'edit', id: @user }
		end
	end
end

UsersController.include RedmineAsapTheme::UsersControllerPatch
