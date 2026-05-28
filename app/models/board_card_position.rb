class BoardCardPosition < ActiveRecord::Base
  belongs_to :issue
  belongs_to :issue_status, foreign_key: :status_id
  belongs_to :project

  def self.positions_for(issue_ids, project_id)
    where(issue_id: issue_ids, project_id: project_id)
      .index_by { |p| [p.issue_id, p.status_id] }
  end
end
