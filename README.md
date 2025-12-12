# Redmine ASAP Theme

This plugin try to propose a new UX/UI for Redmine with new tools like Stimulus/Turbo and Tailwindcss (one day Hotwire :-)).
The first version started almost from a blank page by replacing all Redmine pages. It worked but it's not enough progressive.
This version start from the original theme of Redmine so all pages works (normally) and the theme can be used now.

* Status : first version usable but need to be used and improved (feedback appreciated)
* Compatibility : work for Redmine >=6.1 (other versions not tested)

If you want to test it quickly with docker, you can use the repo https://github.com/tantic/redmine_asap_docker.git

## Documentation

https://tantic.github.io/redmine_asap_docs/docs/theme/intro

## Changelog

[Changelog](doc/CHANGELOG.md)

## Features

Ready
* New general design
* New navbar for navigation and new menu for project
* New home page
* Local avatar or letter for users (all credits to A.Chaika and contributors of the next versions)
* Letter avatar for projects
* Account is now preferences and is displayed in a modal
* Logo's color is customizable
* Login page is customizable with picture
* Issue statuses can be customized (background color and color)
* Tracker can be customized (background color and color)
* Dark theme : each user can choose light or dark theme from the settings modale
* Responsive mode
* Colors and icons on default priorities (not customisable for now)
* Button to toggle display of the query form

In progress
* Display issue in a panel when click on an issue of the main list

## Screenshots

![Login page](doc/screenshots/login.png | width=)

![welcome page](doc/screenshots/welcome.png)

![Issues page](doc/screenshots/issues.png)

![Issue page](doc/screenshots/issue.png)

![Preferences](doc/screenshots/preferences.png)

![Dark](doc/screenshots/dark.png)

![Mobile](doc/screenshots/mobile.png)

![Mobile](doc/screenshots/mobile2.png)

## Installation

### Requirements

You'll need deface so if you have installed a plugin like aditionnals it will work out of the box. Otherwise I suggest that you use this plugin
https://github.com/jbbarth/redmine_base_deface

### Installation

This plugin has been tested with Redmine 6.1.x

```
cd $REDMINE_ROOT
git clone https://github.com/tantic/redmine_asap_theme.git plugins/redmine_asap_theme
bundle install
bundle exec rake redmine:plugins:migrate RAILS_ENV=production
```

### Configuration

Go to the admin section > /settings/plugin/redmine_asap_theme to change the settings.
Note : you can add your own wallpapers for the login page in the folder /assets/images/login and restart Redmine.

## Contributing

I'm not a designer neither a real developer so be comprehensive :smiley: I would be really happy to have help on this, you're all really welcome.

* Fork it
* Create your feature branch (git checkout -b my-new-feature)
* Commit your changes (git commit -am 'Add some feature')
* Push to the branch (git push origin my-new-feature)
* Create new Pull Request