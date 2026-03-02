require_dependency 'projects_controller'

module RedmineAsapTheme
  module ProjectsControllerPatch

    def self.prepended(base)
      # :authorize vérifie User.current.allowed_to?(action_name, @project)
      # Les actions save_logo/delete_logo/get_logo n'ont pas de permission Redmine dédiée,
      # on désactive le filtre et on vérifie manuellement.
      base.skip_before_action :authorize, only: [:save_logo, :delete_logo, :get_logo]
    end

    def get_logo
      logo = @project.attachments.find_by(description: 'logo')
      unless logo
        head :not_found and return
      end

      image_path = logo.respond_to?(:thumbnail) ? logo.thumbnail(size: 150) : nil
      image_path ||= logo.respond_to?(:diskfile) ? logo.diskfile : nil

      unless image_path.present? && File.exist?(image_path)
        head :not_found and return
      end

      send_file(
        image_path,
        filename: filename_for_content_disposition(logo.filename),
        type: logo.content_type,
        disposition: 'inline'
      )
    end

    def save_logo
      return deny_access unless User.current.allowed_to?(:edit_project, @project)

      # Supprimer l'ancien logo s'il existe
      @project.attachments.where(description: 'logo').each(&:destroy)

      if params[:logo_file].present?
        result = Attachment.attach_files(@project, {
          'logo' => { 'file' => params[:logo_file], 'description' => 'logo' }
        })

        if result[:files].present?
          flash[:notice] = l(:label_project_logo_saved)
        else
          flash[:error] = l(:label_project_logo_error)
        end
      else
        flash[:notice] = l(:label_project_logo_deleted)
      end

      redirect_to settings_project_path(@project, tab: 'options')
    end

    def delete_logo
      return deny_access unless User.current.allowed_to?(:edit_project, @project)

      @project.attachments.where(description: 'logo').each(&:destroy)
      flash[:notice] = l(:label_project_logo_deleted)
      redirect_to settings_project_path(@project, tab: 'options')
    end

  end
end

ProjectsController.prepend RedmineAsapTheme::ProjectsControllerPatch
