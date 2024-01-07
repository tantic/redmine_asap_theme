basedir = File.expand_path('../lib', __FILE__)
libraries =
  [
    'redmine_asap_theme/application_helper_patch',
  ]

libraries.each do |library|
  require_dependency File.expand_path(library, basedir)
end

Redmine::Plugin.register :redmine_asap_theme do
  name 'Redmine Asap Theme plugin'
  author 'Tantic'
  description 'UX/UI based on Tailwindcss'
  version '0.0.1'
  url 'https://github.com/tantic/redmine_asap_theme'
  author_url 'https://github.com/tantic'
end
