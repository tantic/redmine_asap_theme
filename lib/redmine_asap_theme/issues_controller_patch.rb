require_dependency 'issues_controller'

module RedmineAsapTheme
  module IssuesControllerPatch
    def show
      # use_session = !request.format.csv?
      # retrieve_default_query(use_session)
      # retrieve_query(IssueQuery, use_session)
      # if @query.valid?
      #   @issues = @query.issues()
      # end
      @issues = Issue.where(:project_id => @issue.project.id)

      @journals = @issue.visible_journals_with_index
      @has_changesets = @issue.changesets.visible.preload(:repository, :user).exists?
      @relations =
        @issue.relations.
          select do |r|
            r.other_issue(@issue) && r.other_issue(@issue).visible?
          end
      @journals.reverse! if User.current.wants_comments_in_reverse_order?

      if User.current.allowed_to?(:view_time_entries, @project)
        Issue.load_visible_spent_hours([@issue])
        Issue.load_visible_total_spent_hours([@issue])
      end

      respond_to do |format|
        format.html do
          @allowed_statuses = @issue.new_statuses_allowed_to(User.current)
          @priorities = IssuePriority.active
          @time_entry = TimeEntry.new(:issue => @issue, :project => @issue.project)
          @time_entries = @issue.time_entries.visible.preload(:activity, :user)
          @relation = IssueRelation.new
          retrieve_previous_and_next_issue_ids
          render :template => 'issues/show'
        end
        format.api do
          @allowed_statuses = @issue.new_statuses_allowed_to(User.current)
          @changesets = @issue.changesets.visible.preload(:repository, :user).to_a
          @changesets.reverse! if User.current.wants_comments_in_reverse_order?
        end
        format.atom do
          render :template => 'journals/index', :layout => false,
          :content_type => 'application/atom+xml'
        end
        format.pdf do
          send_file_headers!(:type => 'application/pdf',
                             :filename => "#{@project.identifier}-#{@issue.id}.pdf")
        end
      end
    end
  end
end

IssuesController.prepend RedmineAsapTheme::IssuesControllerPatch