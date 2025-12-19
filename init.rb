require 'redmine'

Redmine::Plugin.register :redmine_asap_theme do
  name 'Redmine Asap Theme plugin'
  author 'DGAC/DSNA - Tantic'
  description 'UX/UI based on Tailwindcss'
  version '2.1.3'
  url 'https://github.com/tantic/redmine_asap_theme'
  author_url 'https://github.com/tantic'

  settings :default => {'empty' => true}, :partial => 'settings/redmine_asap_theme/settings'
  delete_menu_item :project_menu, :settings

  menu :tools_menu,
        :label_my_page,
        { :controller => 'my', :action => 'page' },
        :caption => :label_my_page,
        plugin: 'redmine_asap_theme',
        html: { class: 'icon' },
        icon: 'my-page'
end


lib_dir = File.join(File.dirname(__FILE__), 'lib', 'redmine_asap_theme')

# Redmine patches
patch_path = File.join(lib_dir, '*_patch.rb')
Dir.glob(patch_path).each do |file|
  require file
end

rat_helpers = File.join(lib_dir, 'helpers.rb')
require rat_helpers



libraries =
  [
    'hooks',
  ]
libraries.each do |library|
  require_dependency File.expand_path(library, lib_dir)
end

require lib_dir

include LetterAvatar::AvatarHelper
LetterAvatar.setup do |config|
  # config.fill_color        = 'rgba(255, 255, 255, 1)' # default is 'rgba(255, 255, 255, 0.65)'
  config.cache_base_path   = 'public/system'     # default is 'public/system'
  config.colors_palette    = :google                # default is :google, :iwanthue
  config.weight            = 100                      # default is 300
  config.annotate_position = '-0+5'                  # default is -0+5
  config.letters_count     = 2                        # default is 1
  config.pointsize         = 300                       # default is 140
end


Rails.configuration.to_prepare do
  require_dependency 'issues_helper'
  IssuesHelper.prepend RedmineAsapTheme::IssuesHelperPatch
end