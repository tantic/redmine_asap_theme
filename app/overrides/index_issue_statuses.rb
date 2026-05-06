module IndexIssueStatuses
  Deface::Override.new(
    virtual_path: 'issue_statuses/index',
    name: 'show_issue_status_color_badge',
    replace_contents: 'table.issue_statuses td.name',
    text: "<%= render 'issue_statuses/name_badge', status: status %>"
  )
end
