# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html

get   'my/notifications',              to: 'asap_notifications#index',    as: :asap_notifications
patch 'my/notifications/mark_all',    to: 'asap_notifications#mark_all_read', as: :asap_notifications_mark_all
patch 'my/notifications/:id/read',    to: 'asap_notifications#mark_read', as: :asap_notification_read

get   '/user/settings/:user_id', to: 'user_settings#show',       :as => "show_settings"
put   '/user/settings/:user_id', to: 'user_settings#update',     :as => "update_settings"
patch '/user/pref',              to: 'user_settings#update_pref', :as => "update_user_pref"

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


# Quick navigation (command palette)
get 'quick_nav', to: 'quick_nav#search', as: :quick_nav

# Issue field inline edit
patch 'issues/:id/field', to: 'issue_fields#update', as: :issue_field_update

# Checklist items (session-authenticated, bypasses API format auth restriction)
post   'issues/:issue_id/checklist_items',           to: 'checklist_items#create',    as: :create_checklist_item
get    'issues/:issue_id/checklist_items/templates', to: 'checklist_items#templates', as: :checklist_item_templates
post   'issues/:issue_id/checklist_items/reorder',   to: 'checklist_items#reorder',   as: :reorder_checklist_items
patch  'checklist_items/:id',                        to: 'checklist_items#update',    as: :update_checklist_item
delete 'checklist_items/:id',                        to: 'checklist_items#destroy',   as: :destroy_checklist_item

# Board card positions
post  'board_positions/reorder',     to: 'board_positions#reorder',     as: :board_positions_reorder
patch 'board_positions/update_card', to: 'board_positions#update_card', as: :board_positions_update_card

# Local avatar and letter avatar
match 'my/avatar', :to => 'my#avatar', :via => [:get, :post]
match 'my/save_avatar/:id', :to => 'my#save_avatar', :via => [:get, :post]
match 'account/get_avatar/:id', :to => 'account#get_avatar', :constraints => {:id=>/\d+/}, :via => [:get, :post]
match 'users/save_avatar/:id', :to => 'users#save_avatar', :constraints => {:id=>/\d+/}, :via => [:get, :post]
match 'users/get_avatar/:id', :to => 'users#get_avatar', :constraints => {:id=>/\d+/}, :via => [:get, :post]

