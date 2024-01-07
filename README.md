# Redmine asap theme

This plugin try to propose a new UX/UI for Redmine.
* Status : in development please don't use it yet

[Presentation](doc/presentation.md)
[Development](doc/development.md)

## Installation

This plugin has been tested with Redmine 5.x+

```
cd $REDMINE_ROOT
git clone https://github.com/tantic/redmine_asap_theme.git plugins/redmine_asap_theme
bundle install
bundle exec rake redmine:plugins:migrate RAILS_ENV=production
```

## Contributing

* Fork it
* Create your feature branch (git checkout -b my-new-feature)
* Commit your changes (git commit -am 'Add some feature')
* Push to the branch (git push origin my-new-feature)
* Create new Pull Request
