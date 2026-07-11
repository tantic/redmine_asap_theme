class AsapNotificationsController < ApplicationController
  before_action :require_login

  def index
    notifications = AsapNotification.unread
      .for_user(User.current)
      .order(created_at: :desc)
      .limit(30)
    render json: {
      count: notifications.size,
      items: notifications.map { |n| serialize(n) }
    }
  end

  def mark_read
    n = AsapNotification.find_by(id: params[:id], user_id: User.current.id)
    n&.update_columns(read_at: Time.current)
    head :ok
  end

  def mark_all_read
    AsapNotification.unread.for_user(User.current).update_all(read_at: Time.current)
    head :ok
  end

  private

  def serialize(n)
    {
      id:         n.id,
      event_type: n.event_type,
      message:    format_message(n),
      url:        n.url,
      ago:        view_context.time_ago_in_words(n.created_at)
    }
  end

  def format_message(n)
    case n.event_type
    when 'assigned'  then l('asap_notifications.assigned',  actor: n.actor_name, title: n.title)
    when 'mentioned' then l('asap_notifications.mentioned', actor: n.actor_name, title: n.title)
    else n.title
    end
  end
end
