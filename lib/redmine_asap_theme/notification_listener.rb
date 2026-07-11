module RedmineAsapTheme
  class NotificationListener < Redmine::Hook::Listener
    def controller_issues_new_after_save(context = {})
      AsapNotification.create_for_issue_create(context[:issue])
    rescue => e
      Rails.logger.error "[AsapNotification] new: #{e.message}"
    end

    def controller_issues_edit_after_save(context = {})
      issue   = context[:issue]
      journal = context[:journal]
      Rails.logger.info "[AsapNotification] edit hook fired: issue=#{issue&.id} journal=#{journal&.id} current_user=#{User.current&.id}"
      if journal
        Rails.logger.info "[AsapNotification] journal details: #{journal.details.map { |d| "#{d.prop_key}:#{d.old_value}->#{d.value}" }.inspect}"
        Rails.logger.info "[AsapNotification] notes blank? #{journal.notes.blank?}"
      end
      AsapNotification.create_for_issue_update(issue, journal)
    rescue => e
      Rails.logger.error "[AsapNotification] edit: #{e.class} #{e.message}\n#{e.backtrace.first(3).join("\n")}"
    end
  end
end
