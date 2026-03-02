require_dependency 'welcome_controller'

module RedmineAsapTheme
  module WelcomeControllerPatch

    OTHER_PROJECTS_PER_PAGE = 8

    def index
      @jump_box = Redmine::ProjectJumpBox.new(User.current)

      # ── Favoris (toujours affichés en entier) ────────────────────────────
      @bookmarked_projects = @jump_box.bookmarked_projects.to_a
      bookmarked_ids = @bookmarked_projects.map(&:id)

      # ── Autres projets membres (paginés), 100% SQL ───────────────────────
      other_base = Project.active.visible
                          .joins(:members)
                          .where(members: { user_id: User.current.id })
                          .where.not(id: bookmarked_ids)
                          .order(:name)
      @other_projects_total = other_base.count
      @other_projects = other_base.limit(OTHER_PROJECTS_PER_PAGE).to_a

      # ── Requêtes groupées : zéro N+1 ─────────────────────────────────────
      all_ids = bookmarked_ids + @other_projects.map(&:id)

      if all_ids.any?
        @projects_open_counts = Issue.open
                                     .where(project_id: all_ids)
                                     .group(:project_id)
                                     .count

        @projects_children_counts = Project.where(parent_id: all_ids)
                                           .visible
                                           .group(:parent_id)
                                           .count

        @projects_with_trackers = Project.includes(:trackers)
                                         .where(id: all_ids)
                                         .index_by(&:id)

        @projects_logos = Attachment.where(
          container_type: 'Project',
          container_id: all_ids,
          description: 'logo'
        ).index_by(&:container_id)
      else
        @projects_open_counts     = {}
        @projects_children_counts = {}
        @projects_with_trackers   = {}
        @projects_logos           = {}
      end

      @news_from_my_projects = News.latest(User.current, 5)
      news_project_ids = @news_from_my_projects.map { |n| n.project_id }.uniq
      @news_projects_logos = if news_project_ids.any?
        Attachment.where(container_type: 'Project', container_id: news_project_ids, description: 'logo')
                  .index_by(&:container_id)
      else
        {}
      end

      # ── Stats bar ─────────────────────────────────────────────────────────
      @stat_assigned_count = Issue.open.where(assigned_to: User.current).count
      @stat_watched_count  = Issue.open.joins(:watchers).where(watchers: { user_id: User.current.id }).count
      @stat_overdue_count  = Issue.open.where(assigned_to: User.current).where('due_date < ?', Date.today).count
      @stat_projects_count = bookmarked_ids.size + @other_projects_total
    end

    def more_projects
      page = (params[:page] || 1).to_i
      @jump_box = Redmine::ProjectJumpBox.new(User.current)
      bookmarked_ids = @jump_box.bookmarked_projects.map(&:id)

      other_base = Project.active.visible
                          .joins(:members)
                          .where(members: { user_id: User.current.id })
                          .where.not(id: bookmarked_ids)
                          .order(:name)

      offset = page * OTHER_PROJECTS_PER_PAGE
      projects = other_base.limit(OTHER_PROJECTS_PER_PAGE).offset(offset).to_a
      has_more = other_base.count > (offset + OTHER_PROJECTS_PER_PAGE)

      all_ids = projects.map(&:id)

      if all_ids.any?
        open_counts     = Issue.open.where(project_id: all_ids).group(:project_id).count
        children_counts = Project.where(parent_id: all_ids).visible.group(:parent_id).count
        projects_with_trackers = Project.includes(:trackers).where(id: all_ids).index_by(&:id)
        logos = Attachment.where(
          container_type: 'Project',
          container_id: all_ids,
          description: 'logo'
        ).index_by(&:container_id)
      else
        open_counts = children_counts = projects_with_trackers = logos = {}
      end

      render partial: 'welcome/more_projects_rows', locals: {
        projects: projects,
        jump_box: @jump_box,
        open_counts: open_counts,
        children_counts: children_counts,
        projects_with_trackers: projects_with_trackers,
        logos: logos,
        has_more: has_more,
        next_page: page + 1
      }
    end

    def my_projects
      @my_projects = User.current.projects
    end

    def my_issues
      @observed_issues = Issue.open
                              .joins(:watchers)
                              .where(watchers: { user_id: User.current.id })
                              .includes(:project, :priority, :status, :tracker)
                              .order(updated_on: :desc)
                              .limit(10)
      @observed_issues_total = Issue.open.joins(:watchers).where(watchers: { user_id: User.current.id }).count

      @my_issues = Issue.open
                        .where(assigned_to: User.current)
                        .includes(:project, :priority, :status, :tracker)
                        .order(due_date: :asc, updated_on: :desc)
                        .limit(20)
      @my_issues_total = Issue.open.where(assigned_to: User.current).count
    end

    def project
      @project = Project.find_by_id(params[:id])
      base = Issue.open
                  .where(project_id: @project.id, assigned_to: User.current.id)
                  .includes(:tracker, :status, :priority)
                  .order(Arel.sql('due_date IS NULL, due_date ASC, updated_on DESC'))
      my_issues_total = base.count
      @my_issues = base.limit(10).to_a
      @sub_projects = @project.children.visible(User.current).includes(:trackers).to_a
      @versions = @project.versions
                          .where.not(effective_date: nil)
                          .order(:effective_date)
                          .to_a
      version_ids = @versions.map(&:id)
      @versions_issue_counts = if version_ids.any?
        issues_by_version = Issue.where(fixed_version_id: version_ids)
                                 .group(:fixed_version_id)
                                 .count
        closed_by_version  = Issue.where(fixed_version_id: version_ids)
                                  .joins(:status)
                                  .where(issue_statuses: { is_closed: true })
                                  .group(:fixed_version_id)
                                  .count
        version_ids.index_with do |vid|
          total  = issues_by_version[vid] || 0
          closed = closed_by_version[vid]  || 0
          pct    = total > 0 ? (closed * 100.0 / total).round : 0
          { total: total, closed: closed, pct: pct }
        end
      else
        {}
      end
      render partial: 'welcome/project_accordion',
             locals: { project: @project, my_issues: @my_issues, my_issues_total: my_issues_total, sub_projects: @sub_projects, versions: @versions, versions_issue_counts: @versions_issue_counts }
    end

    def bookmark
      @project = Project.find(params[:id])
      jump_box = Redmine::ProjectJumpBox.new User.current
      if request.delete?
        jump_box.delete_project_bookmark @project
      elsif request.post?
        jump_box.bookmark_project @project
      end
      respond_to do |format|
        format.js
        format.html { redirect_to home_path() }
      end
    end
  end
end

WelcomeController.prepend RedmineAsapTheme::WelcomeControllerPatch
