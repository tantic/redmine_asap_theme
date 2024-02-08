# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html

# Settings
get '/user/settings/:user_id', to: 'user_settings#show', :as => "show_settings"
put '/user/settings/:user_id', to: 'user_settings#update', :as => "update_settings"