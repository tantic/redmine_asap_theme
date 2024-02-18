
class UserSettingsController < ApplicationController
  self.main_menu = false
  before_action :require_login
  # let user change user's password when user has to
  skip_before_action :check_password_change, :check_twofa_activation, :only => :password

  accept_api_auth :account

  require_sudo_mode :account, only: :put
  require_sudo_mode :reset_atom_key, :reset_api_key, :show_api_key, :destroy

  helper :issues
  helper :users
  helper :custom_fields
  helper :queries
  helper :activities
  # helper :calendars

  def show
    @user = User.current
    @pref = @user.pref
    render partial: 'user_settings/show', locals: { user: @user}
  end

  def update
    @user = User.current
    @pref = @user.pref
    @user.safe_attributes = params[:user]
    @user.pref.safe_attributes = params[:pref]
    if @user.save
      @user.pref.save
      set_language_if_valid @user.language
      redirect_back(fallback_location:"/")
    end
  end
end