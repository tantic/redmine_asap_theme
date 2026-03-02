# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html

get '/user/settings/:user_id', to: 'user_settings#show', :as => "show_settings"
put '/user/settings/:user_id', to: 'user_settings#update', :as => "update_settings"

get '/about', to: 'about#show', :as => 'show_about'

get 'home/my-projects', :to => 'welcome#my_projects', :as => 'home_my_projects'
get 'home/my-issues', :to => 'welcome#my_issues', :as => 'home_my_issues'
get 'home/project/:id', :to => 'welcome#project', :as => 'home_project'
get 'home/more-projects', :to => 'welcome#more_projects', :as => 'home_more_projects'
post 'homepage/project/:id/bookmark', :to => 'welcome#bookmark', :as => 'welcome_bookmark_project'
delete 'homepage/project/:id/bookmark', :to => 'welcome#bookmark', :as => 'welcome_bookmark_project_delete'

# Project logo
get    'projects/:id/logo', :to => 'projects#get_logo',    :as => 'asap_project_logo'
post   'projects/:id/logo', :to => 'projects#save_logo',   :as => 'project_save_logo'
delete 'projects/:id/logo', :to => 'projects#delete_logo', :as => 'project_delete_logo'


# Local avatar and letter avatar
match 'my/avatar', :to => 'my#avatar', :via => [:get, :post]
match 'my/save_avatar/:id', :to => 'my#save_avatar', :via => [:get, :post]
match 'account/get_avatar/:id', :to => 'account#get_avatar', :constraints => {:id=>/\d+/}, :via => [:get, :post]
match 'users/save_avatar/:id', :to => 'users#save_avatar', :constraints => {:id=>/\d+/}, :via => [:get, :post]
match 'users/get_avatar/:id', :to => 'users#get_avatar', :constraints => {:id=>/\d+/}, :via => [:get, :post]

