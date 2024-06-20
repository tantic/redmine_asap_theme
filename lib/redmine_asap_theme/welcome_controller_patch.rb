require_dependency 'welcome_controller'

module RedmineAsapTheme
  module WelcomeControllerPatch

    def index
      jump_box = Redmine::ProjectJumpBox.new User.current
      @recent_projects = jump_box.recently_used_projects
      @bookmarked_projects = jump_box.bookmarked_projects
      @news_from_my_projects = News.latest(User.current, 5)
    end

    def my_projects
      @my_projects = User.current.projects
    end

    def my_issues
      @observed_issues = Issue.open.joins(:watchers).where(watchers: { user_id: User.current.id }).order(updated_on: :desc).limit(10)
      @observed_issues_total = Issue.open.joins(:watchers).where(watchers: { user_id: User.current.id }).count
      @my_issues = Issue.open.where(:assigned_to => User.current).order(updated_on: :desc).limit(10)
      @my_issues_total = Issue.open.where(:assigned_to => User.current).count
    end

    def project
      @project = Project.find_by_id(params[:id])
      @my_issues = Issue.where(:project_id => @project.id, :assigned_to => User.current.id).open
      @news = News.where(:project_id => @project.id).limit(5)
      render partial: 'welcome/project', locals: { project: @project, my_issues: @my_issues, news: @news}
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
        format.html {redirect_to home_path()}
      end
    end
  end
end

WelcomeController.prepend RedmineAsapTheme::WelcomeControllerPatch