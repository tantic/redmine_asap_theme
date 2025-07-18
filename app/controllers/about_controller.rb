
class AboutController < ApplicationController
  self.main_menu = false
  before_action :require_login
  # let user change user's password when user has to
  skip_before_action :check_password_change, :check_twofa_activation, :only => :password


  helper :issues
  helper :users
  helper :custom_fields
  helper :queries
  helper :activities
  # helper :calendars

  def show
    @user = User.current
    render partial: 'about/show', locals: { user: @user}
  end

end