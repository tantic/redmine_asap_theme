# Redmine ASAP Theme

This plugin try to propose a new UX/UI for Redmine with new tools like Stimulus/Turbo and Tailwindcss (one day Hotwire :-)).

* Status : first version usable but need to be used and improved (feedback appreciated)
* Compatibility :
  * 2.1.6 work for Redmine 6.0.x
  * 2.2.0 work for Redmine 6.0.x and 6.1.x


If you want to test it quickly with docker, you can use the repo https://github.com/tantic/redmine_asap_docker.git


This plugin is part of a suite which add features to redmine :
* [Redmine asap theme](https://github.com/tantic/redmine_asap_theme) : new UX/UI, new navigation
* [Redmine asap user features](https://github.com/tantic/redmine_asap_user_features) : new personal features like inbox, todo
* Redmine asap pilot : dashboards to pilote multi-projects

## Documentation

https://tantic.github.io/redmine_asap_docs/docs/theme/intro

## Features

UX/UI
* New general design based on Tailwind CSS and stimulus / turbo
* New navbar for navigation and new menu for project
* Show / hide query form
* New home page with bookmarked projects, project. Project overview
* Login page is customizable with picture (some wallpapers are available)
* Logo's color is customizable
* Dark theme : each user can choose light or dark theme from the settings modale
* Responsive mode for mobile and tablet devices

User
* Account is now preferences and is displayed in a modal
* Local avatar or letter for users (all credits to A.Chaika and contributors of the next versions)
* New options in the preferences to customize the user experience

Project
* Logo or Letter avatar for projects
* Project homepage : member box and subproject box overrides (search...)

Issues
* Issue statuses can be customized (background color and color)
* Notes form is displayed on the bottom of the issue page (no need to edit the issue to add a note)
* Tracker can be customized (background color and color)
* Colors and icons on default priorities (not customisable for now)
* [Beta] Display issue in a panel when click on an issue of the main list : you can now edit online all attributes

## Screenshots

<table>
  <tr>
    <td align="center">
      <a href="doc/screenshots/login.png">
        <img src="doc/screenshots/login.png" width="200"><br>
            Login page
      </a>
    </td>
    <td align="center">
      <a href="doc/screenshots/welcome.png">
        <img src="doc/screenshots/welcome.png" width="200"><br>
        Screen 2
      </a>
    </td>
    <td align="center">
      <a href="doc/screenshots/issue-panel.png">
        <img src="doc/screenshots/issue-panel.png" width="200"><br>
        Screen 3
      </a>
    </td>
  </tr>
</table>

<p align="center">


  <a href="doc/screenshots/issue.png">
    <img src="doc/screenshots/issue.png" width="200" />
  </a>
  <a href="doc/screenshots/preferences.png">
    <img src="doc/screenshots/preferences.png" width="200" />
  </a>
  <a href="doc/screenshots/dark.png">
    <img src="doc/screenshots/dark.png" width="200" />
  </a>
  <a href="doc/screenshots/mobile.png">
    <img src="doc/screenshots/mobile.png" width="200" />
  </a>
  <a href="doc/screenshots/mobile2.png">
    <img src="doc/screenshots/mobile2.png" width="200" />
  </a>
</p>


## Installation

This plugin has been tested with Redmine 6.0.x and 6.1.x

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
