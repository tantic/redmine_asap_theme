class ChecklistItemsController < ApplicationController
  before_action :check_plugin
  before_action :find_issue, only: [:create]
  before_action :find_item, only: [:update, :destroy]
  before_action :authorize_edit

  def create
    item = Checklist.new(subject: params.dig(:checklist, :subject).to_s.strip)
    item.issue = @issue
    if item.save
      render json: { id: item.id, subject: item.subject, is_done: item.is_done,
                     is_section: item.is_section, position: item.position }, status: :created
    else
      render json: { errors: item.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    new_subject = params.dig(:checklist, :subject)
    @item.subject = new_subject.to_s.strip if new_subject.present?
    if @item.save
      render json: { id: @item.id, subject: @item.subject, is_done: @item.is_done,
                     is_section: @item.is_section, position: @item.position }
    else
      render json: { errors: @item.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @item.destroy
    head :ok
  end

  private

  def check_plugin
    unless defined?(Checklist)
      render json: { error: 'Checklist plugin not installed' }, status: :not_found
    end
  end

  def find_issue
    @issue = Issue.visible.find(params[:issue_id])
    @project = @issue.project
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  def find_item
    @item = Checklist.find(params[:id])
    @project = @item.issue.project
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Not found' }, status: :not_found
  end

  def authorize_edit
    unless User.current.allowed_to?(:edit_checklists, @project)
      render json: { error: 'Forbidden' }, status: :forbidden
    end
  end
end
