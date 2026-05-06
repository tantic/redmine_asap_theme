module IndexTrackers
  Deface::Override.new(
    virtual_path: 'trackers/index',
    name: 'show_tracker_color_badge',
    replace_contents: 'table.trackers td.name',
    text: "<%= render 'trackers/name_badge', tracker: tracker %>"
  )
end
