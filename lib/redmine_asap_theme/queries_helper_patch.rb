require_dependency "queries_helper"

module RedmineAsapTheme
  module QueriesHelperPatch

    def column_header(query, column, options = {})
      if column.name == :id
        current = params[:sort].to_s

        make_sort_link = lambda do |col, caption, default_dir|
          if current.start_with?("#{col}:")
            dir = current.end_with?(':asc') ? 'desc' : 'asc'
            css = current.end_with?(':asc') ? 'sort desc' : 'sort asc'
          else
            dir = default_dir
            css = nil
          end
          url = url_for(request.query_parameters.except('page').merge('sort' => "#{col}:#{dir}"))
          link_to(caption, url, class: css)
        end

        sep = content_tag('span', '|', style: 'color:#d1d5db; padding: 0 2px; line-height:1;')
        content_tag('th',
          content_tag('div',
            safe_join([
              make_sort_link.call('id', '#', 'desc'),
              sep,
              make_sort_link.call('tracker', l(:field_tracker), 'asc')
            ]),
            style: 'display:flex; flex-direction:row; align-items:center; justify-content:center; gap:0;'
          ),
          class: 'id'
        )
      else
        super
      end
    end

    def column_value(column, item, value)
      case column.name
      when :id
        badge = content_tag(
          'span',
          "#{item.tracker} ##{value}",
          class: "rounded-r px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
          style: "background-color: #{item.tracker.bg_color}; color: #{item.tracker.text_color};"
        )
        link_to(badge, issue_path(item))

      when :tracker
        content_tag(
          'span',
          value,
          class: "rounded-r px-2.5 py-0.5 text-xs font-medium",
          style: "background-color: #{item.tracker.bg_color};color: #{item.tracker.text_color}"
        )

      when :status
        content_tag(
          'span',
          value,
          class: "rounded px-2.5 py-0.5 text-xs font-medium",
          style: "background-color: #{item.status.bg_color};color: #{item.status.text_color}"
        )

      else
        # 👉 Laisser Redmine gérer toutes les autres colonnes
        super
      end
    end

    def filter_chip_text(query, field, options)
      label = query.label_for(field)
      op    = options[:operator]
      vals  = (options[:values] || []).reject(&:blank?)

      valueless_ops = %w[o c !* * t ld w lw l2w m lm y nd nw nm]
      if valueless_ops.include?(op) || vals.empty?
        op_label = Query.operators_labels[op] || op
        return "#{label}: #{op_label}"
      end

      filter_def = query.available_filters[field] rescue nil
      display = vals.map do |v|
        if filter_def && filter_def[:values].present?
          pair = filter_def[:values].find { |p| p.is_a?(Array) && p.last.to_s == v.to_s }
          pair ? pair.first.to_s : v.to_s
        else
          v.to_s
        end
      end.join(', ')

      "#{label}: #{display}"
    end

  end
end

Rails.application.config.after_initialize do
  QueriesHelper.prepend RedmineAsapTheme::QueriesHelperPatch
end
#
# QueriesHelper.include RedmineAsapTheme::QueriesHelperPatch
