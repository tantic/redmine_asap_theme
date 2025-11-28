class AddColorToTrackers < ActiveRecord::Migration[7.2]
  def change
    add_column :trackers, :bg_color, :string
    add_column :trackers, :text_color, :string
  end
end
