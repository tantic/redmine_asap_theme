class ProjectsSearchController < ApplicationController
  def search
    @projects = Project.visible(User.current).where("name LIKE ?", "%#{params[:q]}%")
    render partial: 'projects_search/search', locals: { projects: @projects.pluck(:id, :name).map { |id, name| { id: id, name: name } }}
  end
end