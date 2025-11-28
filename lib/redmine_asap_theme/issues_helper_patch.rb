# plugins/redmine_asap_theme/lib/redmine_asap_theme/issues_helper_patch.rb

require_dependency 'issues_helper'

module RedmineAsapTheme
  module IssuesHelperPatch
    class IssueFieldsRows
      include ActionView::Helpers::TagHelper
      include ApplicationHelper
include IssuesHelper

      def initialize(issue)
        @issue = issue
        @left = []
        @right = []
      end

      def left(*args)
        args.any? ? @left << cells(*args) : @left
      end

      def right(*args)
        args.any? ? @right << cells(*args) : @right
      end

      def size
        [@left.size, @right.size].max
      end

      def to_html
        # rubocop:disable Performance/Sum
        content =
          content_tag('div', @left.reduce(&:+), :class => 'splitcontentleft') +
          content_tag('div', @right.reduce(&:+), :class => 'splitcontentleft')
        # rubocop:enable Performance/Sum

        content_tag('div', content, :class => 'splitcontent')
      end

      def cells(label, text, options={})
        options[:class] = [options[:class] || "", 'attribute'].join(' ')
        if label == l(:field_status)
          text = content_tag(
            'span',
            @issue.status.name,
            class: "rounded px-2.5 py-0.5 text-xs font-medium",
            style: "background-color: #{@issue.status.bg_color}; color: #{@issue.status.text_color};"
          )
        end

        content_tag(
          'div',
          content_tag('div', label + ":", class: 'label') +
            content_tag('div', text, class: 'value'),
          options
        )
      end
    end

    def issue_heading(issue)
      text = issue.tracker.name + ' #' + issue.id.to_s

      content_tag(
          'span',
          text,
          class: "rounded px-2.5 py-1 text-xs font-medium",
            style: "background-color: #{@issue.tracker.bg_color}; color: #{@issue.tracker.text_color};"
        )
      # h("#{issue.tracker} ##{issue.id}")
    end

    def issue_fields_rows
      issue = @issue
      r = IssueFieldsRows.new(issue)
      yield r
      r.to_html
    end
  end
end

# Patch propre
IssuesHelper.prepend RedmineAsapTheme::IssuesHelperPatch
