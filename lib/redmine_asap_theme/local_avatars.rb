module RedmineAsapTheme
	module LocalAvatars
		def send_avatar(user)
			av = user.attachments.find_by_description 'avatar'
			image = av.thumbnail(:size => 150)

			send_file(image, :filename => filename_for_content_disposition(av.filename),
			                       :type => av.content_type,
														 :disposition => (av.image? ? 'inline' : 'attachment')) if av
		end

		# expects @user to be set.
		# In case of error, raises an exception and sets @possible_error
		def save_or_delete
			# clear the attachments.  Then, save if
			# we have to delete.  Otherwise add the new
			# avatar and then save
			# TODO:  This doesn't play nice with any other possible
			# attachments on the user (just because there aren't any
			# now doesn't mean there won't be in the future.  It should
			# be changed to only remove an attachment with description == 'avatar'
			@user.attachments.clear
			if params[:commit] == l(:button_delete) then
				@possible_error = l(:unable_to_delete_avatar)
				@user.save!
				flash[:notice] = l(:avatar_deleted)
			else # take anything else as save
				file_field = params[:avatar]
				Attachment.attach_files(@user, {'first' => {'file' => file_field, 'description' => 'avatar'}})
				@possible_error = l(:error_saving_avatar)
				@user.save!
				flash[:notice] = l(:message_avatar_uploaded)
			end
		end
	end
end
