# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html

# Settings
get '/user/settings/:user_id', to: 'user_settings#show', :as => "show_settings"
put '/user/settings/:user_id', to: 'user_settings#update', :as => "update_settings"


get 'home/my-projects', :to => 'welcome#my_projects', :as => 'home_my_projects'
get 'home/my-issues', :to => 'welcome#my_issues', :as => 'home_my_issues'
get 'home/project/:id', :to => 'welcome#project', :as => 'home_project'
post 'homepage/project/:id/bookmark', :to => 'welcome#bookmark', :as => 'welcome_bookmark_project'
delete 'homepage/project/:id/bookmark', :to => 'welcome#bookmark', :as => 'welcome_bookmark_project_delete'
get 'autocomplete/search', to: 'projects_search#search', as: 'search_projects'