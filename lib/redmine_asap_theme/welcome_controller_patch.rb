require_dependency 'welcome_controller'

module RedmineAsapTheme
  module WelcomeControllerPatch

    def index
      # # Get bookmarked projects for the current user
      jump_box = Redmine::ProjectJumpBox.new User.current
      @bookmarked = jump_box.bookmarked_projects.take(12)

      if @bookmarked.length < 12
        cpt = @bookmarked.length
        cpt_project = 12-cpt
      # Get list of all my projects
        @my_projects = User.current.projects.active.select(:id, :name, :identifier, :lft, :rgt).reject{|project| @bookmarked.include? project}.to_a.take(cpt_project.to_i)
      # @bookmarked_projects = @bookmarked.clone
      end
      # # Get 5 last news from the bookmarked projects
      # @news = News.where(project_id: @bookmarked.map{|bookmarked_project| bookmarked_project.id}).limit(5).includes(:author, :project).reorder("#{News.table_name}.created_on DESC").to_a
      # @events = []
      # @bookmarked_projects_dates = []

      # @bookmarked.each do |project|
      # 	activity = Redmine::Activity::Fetcher.new(User.current, :project => project, :author => @author)
      # 	activity.default_scope!
      # 	@events += activity.events(nil, nil, :limit => 10)
      # 	versions_with_dates = project.versions.open.select { |version| version.start_date != nil }
      # 	versions = versions_with_dates.map {|version| {
      # 		'id' => version.id,
      # 		'content' => version.name,
      # 		'start' => version.start_date.nil? ? 'null' : version.start_date.strftime("%Y/%m/%d"),
      # 		'end' => version.due_date.nil? ? 'null' : version.due_date.strftime("%Y/%m/%d"),
      # 		'group' => project.identifier,
      # 		'subgroup' => 'version',
      # 		'className' => 'vis-version'
      # 		}
      # 	}
      # 	if versions.empty?
      # 		@bookmarked_projects.delete(project)
      # 	end
      # 	@bookmarked_projects_dates.push(versions)

      # 	if Redmine::Plugin.installed?(:redmine_agile)
      # 		sprints = project.agile_sprints.map {|sprint| {
      # 			'id' => sprint.id,
      # 			'content' => sprint.name,
      # 			'start' => sprint.start_date.nil? ? 'null' : sprint.start_date.strftime("%Y/%m/%d"),
      # 			'end' => sprint.end_date.nil? ? 'null' : sprint.end_date.strftime("%Y/%m/%d"),
      # 			'group' => project.identifier,
      # 			'subgroup' => 'sprints',
      # 			'className' => 'vis-sprint'
      # 			}
      # 		}
      # 		@bookmarked_projects_dates.push(sprints)
      # 	end
      # end
      # @bookmarked_projects_dates = @bookmarked_projects_dates.flatten!

    end
  end
end

WelcomeController.prepend RedmineAsapTheme::WelcomeControllerPatch