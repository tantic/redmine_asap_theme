class AddCreatedAtIndexToAsapNotifications < ActiveRecord::Migration[7.2]
  def change
    remove_index :asap_notifications, [:user_id, :read_at]
    add_index :asap_notifications, [:user_id, :read_at, :created_at]
  end
end
