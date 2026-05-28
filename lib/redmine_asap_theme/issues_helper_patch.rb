require_dependency 'issues_helper'

module RedmineAsapTheme
  module IssuesHelperPatch
    INLINE_EDIT_CF_FORMATS = %w[list list_optional string link int float date text version].freeze

    def render_issue_subject_with_tree(issue)
      ancestors = issue.root? ? [] : issue.ancestors.visible.to_a
      panel_mode = defined?(params) && params[:panel].present?

      separator = content_tag(:span, ' › ', class: "text-gray-400 dark:text-gray-500 text-xs")

      ancestor_items = ancestors.map do |ancestor|
        badge = content_tag(:span,
          "#{ancestor.tracker.name} ##{ancestor.id}",
          class: "rounded px-1.5 py-0.5 text-[11px] font-medium",
          style: "background-color: #{ancestor.tracker.bg_color}; color: #{ancestor.tracker.text_color};"
        )
        link_to(badge, issue_path(ancestor), title: ancestor.subject, class: "hover:opacity-75")
      end

      current_badge = if panel_mode
        content_tag(:span,
          "#{issue.tracker.name} ##{issue.id}",
          class: "rounded px-1.5 py-0.5 text-[11px] font-medium",
          style: "background-color: #{issue.tracker.bg_color}; color: #{issue.tracker.text_color};"
        )
      end

      all_items = ancestor_items + (current_badge ? [current_badge] : [])

      if all_items.any?
        crumbs = safe_join(all_items.each_with_index.map { |item, i|
          i < all_items.size - 1 ? item + separator : item
        })
        content_tag(:div, class: "flex flex-col") do
          content_tag(:div, crumbs, class: "flex items-center flex-wrap gap-x-0.5 gap-y-1 mb-1") +
          content_tag('h3', h(issue.subject))
        end
      else
        content_tag('h3', h(issue.subject))
      end
    end

    def issue_heading(issue)
      text = "#{issue.tracker.name} ##{issue.id}"
      content_tag(
        'span',
        text,
        class: "rounded-r px-2.5 py-0.5 text-xs font-medium",
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
        all_cells = interleave(@left, @right)
        safe_join(all_cells)
      end

      def interleave(left, right)
        [left.size, right.size].max.times.flat_map { |i| [left[i], right[i]].compact }
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


    def issue_history_default_tab
      return super unless params[:panel].present?

      user_default_tab = User.current.pref.history_default_tab
      case user_default_tab
      when 'last_tab_visited'
        cookies['history_last_tab'].presence || 'notes'
      when ''
        'notes'
      else
        user_default_tab
      end
    end

    def issue_history_tabs
      tabs = super
      return tabs unless params[:panel].present?

      # Prevent URL changes when switching tabs in panel mode
      tabs = tabs.map do |tab|
        next tab unless tab[:onclick]&.include?('this.href')
        tab.merge(onclick: tab[:onclick].gsub('this.href', 'undefined'))
      end

      files_count     = @issue.attachments.size
      subtasks_count  = @issue.leaf? ? 0 : @issue.children.visible.size
      relations_count = (@relations || []).size

      tabs << {
        name: 'panel_files',
        label: :label_attachment_plural,
        onclick: 'showTab("panel_files", this.href)',
        count: files_count > 0 ? files_count : nil
      }

      if !@issue.leaf? || User.current.allowed_to?(:manage_subtasks, @project) ||
         @relations.present? || User.current.allowed_to?(:manage_issue_relations, @project)
        tabs << {
          name: 'panel_relations',
          label: :label_relations,
          onclick: 'showTab("panel_relations", this.href)',
          count: (subtasks_count + relations_count) > 0 ? subtasks_count + relations_count : nil
        }
      end

      tabs
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
      items = safe_join(values.map do |value|
        cf = value.custom_field
        value_tag = if editable && INLINE_EDIT_CF_FORMATS.include?(cf.field_format)
          inline_edit_cf_tag(issue, value)
        else
          custom_field_value_tag(value)
        end
        label = content_tag('div', custom_field_name_tag(cf).to_s + ':', class: 'label')
        val   = content_tag('div', value_tag, class: 'value')
        content_tag('div', label + val, class: "attribute #{cf.css_classes}".strip)
      end)
      items
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
        class: 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 px-1 rounded block -mx-1'
      )

      input_el, extra_data = cf_input_for(cf, current, issue)
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

    def cf_input_for(cf, current, issue = nil)
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
      when 'version'
        versions = cf.possible_values_options(issue)
        options_html = safe_join(
          [content_tag(:option, '—', value: '')] +
          versions.map { |name, id| content_tag(:option, name, value: id.to_s, selected: id.to_s == current) }
        )
        input = content_tag(:select, options_html,
          data: { field_edit_target: 'input', action: 'change->field-edit#save' },
          class: input_class
        )
        [input, {}]
      end
    end
  end
end


# Patch propre
# IssuesHelper.include RedmineAsapTheme::IssuesHelperPatch
Rails.application.config.after_initialize do
  IssuesHelper.prepend RedmineAsapTheme::IssuesHelperPatch
end
