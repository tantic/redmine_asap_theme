class BoardCardPosition < ActiveRecord::Base
  belongs_to :issue
  belongs_to :project

  def self.positions_for(issue_ids, project_id, column_type = 'status')
    where(issue_id: issue_ids, project_id: project_id, column_type: column_type)
      .index_by { |p| [p.issue_id, p.status_id] }
  end
end
