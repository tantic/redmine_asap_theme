class QuickNavController < ApplicationController
  before_action :require_login

  def search
    q = params[:q].to_s.strip
    result = { actions: [], issues: [], projects: [], wiki_pages: [], documents: [], users: [] }

    if q.start_with?('@')
      user_q = q[1..].strip
      if user_q.length >= 1
        ql = like(user_q)
        result[:users] = User.active
          .where("login LIKE :q OR firstname LIKE :q OR lastname LIKE :q OR CONCAT(firstname, ' ', lastname) LIKE :q", q: ql)
          .limit(8)
          .map { |u| { name: u.name, login: u.login, url: user_path(u) } }
      end
    elsif q.length >= 2
      ql = like(q)

      if q.match?(/\A#?\d+\z/)
        id = q.delete('#').to_i
        issue = Issue.visible.includes(:project).find_by(id: id)
        result[:issues] = [{ id: issue.id, subject: issue.subject, project: issue.project.name, url: issue_path(issue) }] if issue
      else
        result[:issues] = Issue.visible.includes(:project)
          .where("#{Issue.table_name}.subject LIKE ?", ql)
          .order(updated_on: :desc).limit(6)
          .map { |i| { id: i.id, subject: i.subject, project: i.project.name, url: issue_path(i) } }

        result[:projects] = Project.visible
          .where("#{Project.table_name}.name LIKE ?", ql)
          .order(:name).limit(3)
          .map { |p| { name: p.name, url: project_path(p) } }

        result[:wiki_pages] = WikiPage.joins(:wiki => :project)
          .merge(Project.visible)
          .where("#{WikiPage.table_name}.title LIKE ?", ql)
          .includes(:wiki => :project)
          .limit(4)
          .map { |wp| { title: wp.title.tr('_', ' '), project: wp.wiki.project.name, url: "/projects/#{wp.wiki.project.identifier}/wiki/#{wp.title}" } }

        result[:documents] = Document.joins(:project)
          .merge(Project.visible)
          .where("#{Document.table_name}.title LIKE ?", ql)
          .includes(:project)
          .limit(4)
          .map { |d| { title: d.title, project: d.project.name, url: "/documents/#{d.id}" } }

        result[:actions] = static_actions.select { |a| a[:label].downcase.include?(q.downcase) }
      end
    else
      result[:actions] = static_actions
    end

    render json: result
  end

  private

  def like(str)
    "%#{ActiveRecord::Base.sanitize_sql_like(str)}%"
  end

  def static_actions
    actions = [
      { label: l('quick_nav.action_new_issue'),  url: '/issues/new' },
      { label: l('quick_nav.action_my_profile'), url: user_path(User.current) },
      { label: l('quick_nav.action_my_issues'),  url: '/issues?assigned_to_id=me' },
      { label: l('quick_nav.action_my_page'),    url: '/my/page' },
    ]
    if Redmine::Plugin.installed?(:redmine_asap_user_features)
      actions << { label: l('quick_nav.action_my_todos'), url: '/my-space/todo' }
      actions << { label: l('quick_nav.action_inbox'),    url: '/my-space/inbox' }
      actions << { label: l('quick_nav.action_my_notes'), url: '/my-space/notes' }
    end
    actions << { label: l('quick_nav.action_admin'), url: '/admin' } if User.current.admin?
    actions
  end
end
