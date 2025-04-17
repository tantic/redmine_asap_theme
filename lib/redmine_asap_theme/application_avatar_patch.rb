require_dependency "avatars_helper"

module RedmineAsapTheme
    module ApplicationAvatarPatch
        def self.included(base)
            base.class_eval do
                alias_method :avatar_without_local, :avatar
                alias_method :avatar, :avatar_with_local
            end
        end

        def avatar_with_local(user, options = { })
            if user.is_a?(User)then
                av = user.attachments.find_by_description 'avatar'
                options[:size] = "32" unless options[:size]
                if av then
                    image_url = url_for :only_path => true, :controller => 'account', :action => 'get_avatar', :id => user
                    options[:size] = "32" unless options[:size]
                    return "<img class=\"gravatar #{options[:class]}\" width=\"#{options[:size]}\" height=\"#{options[:size]}\" src=\"#{image_url}\" title=\"#{options[:title]}\"/>".html_safe
                else
                    # return "<img class=\"gravatar\" width=\"#{options[:size]}\" height=\"#{options[:size]}\"  title=\"#{options[:title]}\" avatar=\"#{ user.name[0..1].upcase }\" />".html_safe
                    return letter_avatar_tag(user.name, options[:size].to_i, class: 'gravatar user-avatar')
                end
            end
            avatar_without_local(user, options)
        end
    end
end
AvatarsHelper.include RedmineAsapTheme::ApplicationAvatarPatch
