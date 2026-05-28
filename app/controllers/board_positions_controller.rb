class BoardPositionsController < ApplicationController
  before_action :require_login

  def reorder
    project_id = params[:project_id].to_i
    status_id  = params[:status_id].to_i
    issue_ids  = Array(params[:issue_ids]).map(&:to_i)

    return head :bad_request if project_id.zero? || status_id.zero?
    return head :forbidden unless User.current.allowed_to?(:edit_issues, Project.find(project_id))

    ActiveRecord::Base.transaction do
      issue_ids.each_with_index do |issue_id, position|
        BoardCardPosition
          .find_or_initialize_by(issue_id: issue_id, status_id: status_id, project_id: project_id)
          .update!(position: position)
      end
    end

    head :ok
  end
end
