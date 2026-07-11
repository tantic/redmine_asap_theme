class CreateAsapNotifications < ActiveRecord::Migration[7.2]
  def change
    create_table :asap_notifications do |t|
      t.integer  :user_id,          null: false
      t.string   :notifiable_type
      t.integer  :notifiable_id
      t.string   :event_type,        null: false
      t.string   :title,             null: false
      t.string   :url,               null: false
      t.string   :actor_name
      t.datetime :read_at
      t.timestamps
    end
    add_index :asap_notifications, [:user_id, :read_at]
    add_index :asap_notifications, [:notifiable_type, :notifiable_id]
  end
end
