class BoardPositionsController < ApplicationController
  before_action :require_login

  def update_card
    issue = Issue.find(params[:issue_id])
    return head :forbidden unless issue.visible?
    return head :forbidden unless User.current.allowed_to?(:edit_issues, issue.project)

    column_type = params[:column_type].presence_in(%w[status version]) || 'status'
    column_id   = params[:column_id].to_s

    safe_attrs = {}
    %w[status_id fixed_version_id category_id assigned_to_id priority_id tracker_id parent_issue_id].each do |f|
      safe_attrs[f] = params[f] if params.key?(f)
    end

    issue.init_journal(User.current)
    issue.safe_attributes = safe_attrs

    if issue.save
      applied = if column_type == 'version'
        expected = column_id.present? && column_id != '0' ? column_id.to_i : nil
        issue.fixed_version_id == expected
      else
        issue.status_id == column_id.to_i
      end
      render json: { applied: applied }
    else
      render json: { applied: false }, status: :unprocessable_entity
    end
  end

  def reorder
    project_id  = params[:project_id].to_i
    column_id   = (params[:column_id] || params[:status_id]).to_i
    column_type = params[:column_type].presence_in(%w[status version]) || 'status'
    issue_ids   = Array(params[:issue_ids]).map(&:to_i)

    return head :bad_request if project_id.zero? || column_id.zero?
    return head :forbidden unless User.current.allowed_to?(:edit_issues, Project.find(project_id))

    ActiveRecord::Base.transaction do
      issue_ids.each_with_index do |issue_id, position|
        BoardCardPosition
          .find_or_initialize_by(issue_id: issue_id, status_id: column_id, project_id: project_id, column_type: column_type)
          .update!(position: position)
      end
    end

    head :ok
  end
end
