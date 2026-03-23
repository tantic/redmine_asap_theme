require_dependency 'issues_helper'

module RedmineAsapTheme
  module IssuesHelperPatch
    INLINE_EDIT_CF_FORMATS = %w[list list_optional string link int float date text].freeze
    def issue_heading(issue)
      text = "#{issue.tracker.name} ##{issue.id}"
      content_tag(
        'span',
        text,
        class: "rounded px-2.5 py-1 text-xs font-medium",
        style: "background-color: #{issue.tracker.bg_color}; color: #{issue.tracker.text_color};"
      )
    end

    def render_issue_status(issue)
      content_tag(
        :span,
        issue.status.name,
        class: "rounded px-2.5 py-0.5 text-xs font-medium",
        style: "background-color: #{issue.status.bg_color}; color: #{issue.status.text_color};"
      )
    end

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


   def issue_fields_rows
      issue = @issue
      r = IssueFieldsRows.new(issue)
      yield r
      r.to_html
    end

    def render_half_width_custom_fields_rows(issue)
      values = issue.visible_custom_field_values.reject { |v| v.custom_field.full_width_layout? }
      return if values.empty?

      editable = issue.attributes_editable?
      half = (values.size / 2.0).ceil
      issue_fields_rows do |rows|
        values.each_with_index do |value, i|
          m = (i < half ? :left : :right)
          cf = value.custom_field
          value_tag = if editable && INLINE_EDIT_CF_FORMATS.include?(cf.field_format)
            inline_edit_cf_tag(issue, value)
          else
            custom_field_value_tag(value)
          end
          rows.send m, custom_field_name_tag(cf), value_tag, class: cf.css_classes
        end
      end
    end

    def render_full_width_custom_fields_rows(issue)
      values = issue.visible_custom_field_values.select { |v| v.custom_field.full_width_layout? }
      return if values.empty?

      editable = issue.attributes_editable?
      s = ''.html_safe
      values.each do |value|
        cf = value.custom_field
        if editable && cf.field_format == 'text'
          value_tag = inline_edit_cf_tag(issue, value)
        else
          value_tag = custom_field_value_tag(value)
          next if value_tag.blank?
        end
        content =
          content_tag('hr') +
          content_tag('p', content_tag('strong', custom_field_name_tag(cf))) +
          content_tag('div', value_tag, class: 'value')
        s << content_tag('div', content, class: "#{cf.css_classes} attribute")
      end
      s
    end

    private

    def inline_edit_cf_tag(issue, cf_value)
      cf = cf_value.custom_field
      current = cf_value.value.to_s
      field_name = "cf_#{cf.id}"

      display_html = custom_field_value_tag(cf_value).presence || '-'
      display = content_tag(:span, display_html.html_safe,
        data: { field_edit_target: 'display', action: 'click->field-edit#edit' },
        class: 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-1 rounded block -mx-1'
      )

      input_el, extra_data = cf_input_for(cf, current)
      cancel_btn = content_tag(:button, '✕',
        data: { action: 'click->field-edit#cancel' },
        type: 'button',
        class: 'ml-1 mt-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs hover:bg-gray-300 cursor-pointer'
      )
      editor = content_tag(:div, input_el + cancel_btn,
        data: { field_edit_target: 'editor' },
        class: 'hidden!'
      )

      content_tag(:div, display + editor,
        data: {
          controller: 'field-edit',
          field_edit_issue_id_value: issue.id,
          field_edit_field_value: field_name
        }.merge(extra_data)
      )
    end

    def cf_input_for(cf, current)
      input_class = 'border border-blue-400 rounded px-2 py-1 text-xs w-full dark:bg-gray-600 dark:text-gray-100'
      save_btn = content_tag(:button, '✓',
        data: { action: 'click->field-edit#save' }, type: 'button',
        class: 'mt-1 px-2 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 cursor-pointer'
      )
      buttons = content_tag(:div, save_btn + ' '.html_safe, class: 'flex gap-1')

      case cf.field_format
      when 'list', 'list_optional'
        options_html = safe_join(
          [content_tag(:option, '—', value: '')] +
          cf.possible_values.map { |v| content_tag(:option, v, value: v, selected: v == current) }
        )
        input = content_tag(:select, options_html,
          data: { field_edit_target: 'input', action: 'change->field-edit#save' },
          class: input_class
        )
        [input, {}]
      when 'string', 'link'
        input = tag(:input, type: 'text', value: current,
          data: { field_edit_target: 'input', action: 'keydown->field-edit#keydown' },
          class: input_class)
        [input + buttons, {}]
      when 'int'
        input = tag(:input, type: 'number', step: '1', value: current,
          data: { field_edit_target: 'input', action: 'keydown->field-edit#keydown' },
          class: input_class)
        [input + buttons, {}]
      when 'float'
        input = tag(:input, type: 'number', step: 'any', value: current,
          data: { field_edit_target: 'input', action: 'keydown->field-edit#keydown' },
          class: input_class)
        [input + buttons, {}]
      when 'date'
        input = tag(:input, type: 'date', value: current,
          data: { field_edit_target: 'input', action: 'keydown->field-edit#keydown' },
          class: input_class)
        [input + buttons, {}]
      when 'text'
        input = content_tag(:textarea, current,
          data: { field_edit_target: 'input', action: 'keydown->field-edit#keydown' },
          rows: 4, class: input_class)
        [input + buttons, { field_edit_type_value: 'textarea' }]
      end
    end
  end
end


# Patch propre
# IssuesHelper.include RedmineAsapTheme::IssuesHelperPatch
Rails.application.config.after_initialize do
  IssuesHelper.prepend RedmineAsapTheme::IssuesHelperPatch
end