class IssueFieldsController < ApplicationController
  helper IssueStatusesHelper
  helper IssuesHelper

  before_action :find_issue
  before_action :check_editable

  ALLOWED_FIELDS = %w[
    subject status_id priority_id assigned_to_id fixed_version_id
    category_id due_date start_date done_ratio estimated_hours description
    parent_issue_id
  ].freeze

  def update
    field = params[:field].to_s

    if field.start_with?('cf_')
      return update_custom_field(field)
    end

    if field.start_with?('agile_')
      return update_agile_field(field)
    end

    unless ALLOWED_FIELDS.include?(field)
      render json: { error: 'Champ non autorisé' }, status: :unprocessable_entity
      return
    end

    @issue.init_journal(User.current)

    if params[:attachments].present?
      att_hash = {}
      Array(params[:attachments]).each_with_index do |att, i|
        att_hash[i.to_s] = { 'token' => att[:token].to_s, 'filename' => att[:filename].to_s, 'description' => '' }
      end
      @issue.save_attachments(att_hash) if att_hash.any?
    end

    if @issue.update(field => params[:value])
      AsapNotification.create_for_issue_update(@issue, @issue.current_journal) rescue nil
      response_data = { success: true, rendered_html: render_field_html(field),
                        lock_version: @issue.lock_version,
                        last_journal_id: @issue.journals.maximum(:id) }

      if field == 'priority_id'
        default_pos = IssuePriority.default&.position || 0
        max_pos     = IssuePriority.active.maximum(:position) || 0
        prio_pos    = @issue.priority.position
        response_data[:priority_level] = if prio_pos < default_pos
          'low'
        elsif prio_pos == default_pos
          'normal'
        elsif prio_pos == max_pos
          'urgent'
        else
          'high'
        end
      end

      if field == 'status_id'
        status = @issue.status
        response_data[:status_bg_color]   = status.bg_color
        response_data[:status_text_color] = status.text_color
        response_data[:status_badge_html] = view_context.issue_status_type_badge(status)
      end

      render json: response_data, status: :ok
    else
      render json: { errors: @issue.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def find_issue
    @issue = Issue.visible.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Issue non trouvée' }, status: :not_found
  end

  def check_editable
    unless @issue.editable?
      render json: { error: 'Non autorisé' }, status: :forbidden
    end
  end

  def update_custom_field(field)
    cf_id = field.sub('cf_', '').to_i
    cf = @issue.editable_custom_field_values.map(&:custom_field).find { |c| c.id == cf_id }
    unless cf
      render json: { error: 'Champ non autorisé' }, status: :unprocessable_entity
      return
    end
    @issue.init_journal(User.current)
    if @issue.update(custom_field_values: { cf_id.to_s => params[:value] })
      cf_value = @issue.custom_value_for(cf)
      render json: { success: true, rendered_html: view_context.format_object(cf_value),
                     lock_version: @issue.lock_version,
                     last_journal_id: @issue.journals.maximum(:id) }, status: :ok
    else
      render json: { errors: @issue.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update_agile_field(field)
    unless @issue.project.module_enabled?('agile')
      render json: { error: 'Module agile non activé' }, status: :unprocessable_entity
      return
    end

    agile_data = @issue.agile_data || @issue.build_agile_data

    case field
    when 'agile_story_points'
      value = params[:value].to_s.strip.empty? ? nil : params[:value].to_i
      if agile_data.update(story_points: value)
        render json: { success: true, rendered_html: value&.to_s || '-' }, status: :ok
      else
        render json: { errors: agile_data.errors.full_messages }, status: :unprocessable_entity
      end
    when 'agile_sprint_id'
      unless User.current.allowed_to?(:manage_sprints, @issue.project)
        render json: { error: 'Non autorisé' }, status: :forbidden
        return
      end
      sprint_id = params[:value].to_s.strip.empty? ? nil : params[:value].to_i
      if agile_data.update(agile_sprint_id: sprint_id)
        sprint = sprint_id ? AgileSprint.find_by(id: sprint_id) : nil
        render json: { success: true, rendered_html: sprint&.to_s || '-' }, status: :ok
      else
        render json: { errors: agile_data.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: 'Champ agile non supporté' }, status: :unprocessable_entity
    end
  end

  def render_field_html(field)
    case field
    when 'subject'          then @issue.subject
    when 'status_id'        then @issue.status.name
    when 'priority_id'      then @issue.priority.name
    when 'assigned_to_id'   then @issue.assigned_to&.name || '-'
    when 'category_id'      then @issue.category&.name || '-'
    when 'fixed_version_id' then @issue.fixed_version&.name || '-'
    when 'start_date'       then view_context.format_date(@issue.start_date) || '-'
    when 'due_date'         then view_context.format_date(@issue.due_date) || '-'
    when 'done_ratio'       then view_context.progress_bar(@issue.done_ratio, legend: "#{@issue.done_ratio}%")
    when 'estimated_hours'  then view_context.issue_estimated_hours_details(@issue).presence || '-'
    when 'description'      then view_context.textilizable(@issue, :description)
    when 'parent_issue_id'
      if @issue.parent
        view_context.link_to("##{@issue.parent.id} #{@issue.parent.subject}",
                             view_context.issue_path(@issue.parent),
                             class: 'text-blue-600 hover:underline text-xs')
      else
        '-'
      end
    else                         params[:value].to_s.presence || '-'
    end
  end
end
