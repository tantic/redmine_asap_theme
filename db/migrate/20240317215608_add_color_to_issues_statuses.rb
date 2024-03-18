class AddColorToIssuesStatuses < ActiveRecord::Migration[6.1]
  def change
    add_column :issue_statuses, :bg_color, :string
    add_column :issue_statuses, :text_color, :string
  end
end
