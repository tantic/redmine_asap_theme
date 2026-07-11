class AsapNotification < ApplicationRecord
  self.table_name = 'asap_notifications'

  belongs_to :user
  belongs_to :notifiable, polymorphic: true, optional: true

  scope :unread,    -> { where(read_at: nil) }
  scope :for_user,  ->(user) { where(user_id: user.id) }

  def self.create_for_issue_create(issue)
    return unless issue.assigned_to.is_a?(User)
    assignee = issue.assigned_to
    return if assignee == User.current
    create!(
      user:           assignee,
      notifiable:     issue,
      event_type:     'assigned',
      title:          "##{issue.id} - #{issue.subject.truncate(60)}",
      url:            "/issues/#{issue.id}",
      actor_name:     User.current&.name || '?'
    )
  rescue ActiveRecord::RecordInvalid
    # ignore
  end

  def self.create_for_issue_update(issue, journal)
    return unless journal

    # Assignment change
    assignment = journal.details.find { |d| d.property == 'attr' && d.prop_key == 'assigned_to_id' }
    if assignment&.value.present?
      new_assignee = User.find_by(id: assignment.value)
      if new_assignee&.active? && new_assignee != User.current
        create!(
          user:       new_assignee,
          notifiable: issue,
          event_type: 'assigned',
          title:      "##{issue.id} - #{issue.subject.truncate(60)}",
          url:        "/issues/#{issue.id}",
          actor_name: User.current&.name || '?'
        ) rescue nil
      end
    end

    # Mentions in notes
    return if journal.notes.blank?
    journal.notes.scan(/@([a-z0-9_\-]+)/i).flatten.uniq.each do |login|
      mentioned = User.find_by(login: login)
      next unless mentioned&.active? && mentioned != User.current
      create!(
        user:       mentioned,
        notifiable: journal,
        event_type: 'mentioned',
        title:      "##{issue.id} - #{issue.subject.truncate(60)}",
        url:        "/issues/#{issue.id}",
        actor_name: User.current&.name || '?'
      ) rescue nil
    end
  end
end
