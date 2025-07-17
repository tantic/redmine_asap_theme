module RedmineAsapTheme
	module LocalAvatars
		# def send_avatar(user)
		# 	av = user.attachments.find_by_description 'avatar'
		# 	image = av.thumbnail(:size => 150)

    #   if image
		# 	send_file(image, :filename => filename_for_content_disposition(av.filename),
		# 	                       :type => av.content_type,
		# 												 :disposition => (av.image? ? 'inline' : 'attachment')) if av
    #   end
		# end

    def send_avatar(user)
      av = user.attachments.find_by_description('avatar')
      unless av
        Rails.logger.warn "No avatar for user: #{user.id}"
        head :not_found and return
      end

      image_path = av.respond_to?(:thumbnail) ? av.thumbnail(size: 150) : nil
      image_path ||= av.respond_to?(:diskfile) ? av.diskfile : nil

      Rails.logger.debug "Avatar path for user #{user.id}: #{image_path}"

      unless image_path.present? && File.exist?(image_path)
        Rails.logger.warn "Avatar file not found (#{image_path}) user: #{user.id}"
        head :not_found and return
      end

      send_file(
        image_path,
        filename: filename_for_content_disposition(av.filename),
        type: av.content_type,
        disposition: (av.image? ? 'inline' : 'attachment')
      ) and return
    end
		# expects @user to be set.
		# In case of error, raises an exception and sets @possible_error
		# def save_or_delete
		# 	# clear the attachments.  Then, save if
		# 	# we have to delete.  Otherwise add the new
		# 	# avatar and then save
		# 	# TODO:  This doesn't play nice with any other possible
		# 	# attachments on the user (just because there aren't any
		# 	# now doesn't mean there won't be in the future.  It should
		# 	# be changed to only remove an attachment with description == 'avatar'
		# 	@user.attachments.clear
		# 	if params[:commit] == l(:button_delete) then
		# 		@possible_error = l(:unable_to_delete_avatar)
		# 		@user.save!
		# 		flash[:notice] = l(:avatar_deleted)
		# 	else # take anything else as save
		# 		file_field = params[:avatar]
		# 		Attachment.attach_files(@user, {'first' => {'file' => file_field, 'description' => 'avatar'}})
		# 		@possible_error = l(:error_saving_avatar)
		# 		@user.save!
		# 		flash[:notice] = l(:message_avatar_uploaded)
		# 	end
		# end

    def save_or_delete
      # TOUJOURS supprimer seulement l'avatar, PAS tous les attachements
      @user.attachments.where(description: 'avatar').each(&:destroy)

      if params[:commit] == l(:button_delete)
        @possible_error = l(:unable_to_delete_avatar)
        @user.save!
        flash[:notice] = l(:avatar_deleted)
      else
        file_field = params[:avatar]

        result = Attachment.attach_files(@user, {
          'avatar' => { 'file' => file_field, 'description' => 'avatar' }
        })

        # Force charge + sauvegarde le nouvel attachment si upload réussi
        if result[:files].present?
          @user.save!
          flash[:notice] = l(:message_avatar_uploaded)
        else
          flash[:error] = l(:error_saving_avatar)
        end
      end
    end
	end
end
