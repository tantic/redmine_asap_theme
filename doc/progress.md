# Progress & demos

## First step : layout & navbar

![First](img/first.gif)

The work start with the global layout (file `base.html.erb`) and the navbar.
On the left side, the projects navigation part with a breadcrumb to quickly go to the parent's projects of the current one.

On the right, the search field and a dropdown menu for the user menu.

Add project menu in the navbar

![Second](img/second.png)


Finally add issue menu

![Three](img/three.png)

And start issues list

![first-issues](img/first-issues.png)

## Issue

Tried something with issue (3 columns but only the one in the middle for now)

![first-issue](img/first-issue.png)

The idea : add a navigation on the left to go from one issue to another one.
In the middle, focus on the issue, all attributes are moved to the right panel.

Need to be improved and test

Issue with attachment and navigation on the left


![Issue](img/issue_20240118.png)

Let see it in action

![Issue](img/issue_20240118.gif)

## Calendar

![Calendar](img/redmine_calendar.png)

And when the user click on the filter icon on the right

![Calendar](img/redmine_calendar_filters.png)

## Gantt

First version but need extra work

![Gantt](img/redmine_gantt_v0.png)

## About

About in a modal

![Modal](img/redmine_about.png)

## User settings (ex : my account)


![User settings](img/user-settings.gif)


## Admin

Administration is available from the navbar. A dropdown menu allow admin user to jump directly to the differents pages.

![Admin menu](img/admin-menu.png)

![Admin menu](img/admin-projects.png)

![Admin menu](img/admin-users.png)

![Admin menu](img/admin-groups.png)

![Admin menu](img/admin-roles.png)

![Admin menu](img/admin-trackers.png)

![Admin menu](img/admin-issues-statuses.png)

![Admin menu](img/admin-workflow.png)

![Admin menu](img/admin-custom-fields.png)

![Admin menu](img/admin-enumerations.png)

![Admin menu](img/admin-settings-general.png)

![Admin menu](img/admin-ldap.png)

![Admin menu](img/admin-plugins.png)

![Admin menu](img/admin-infos.png)


## Add turbo

Include turbo 8 which has a uge effect on performances. Drawbacks are that adjustments have to be done on specific js. For example, some work on the navbar have to be done.

## User profile page

![User profile](img/user-profile.png)

## Login page

Todo : as an admin user, i'd like to choose the background image (or none) in the settings of the plugin

![Login page](img/login.png)

## Redmine asap theme settings

Ability to choose background image for the login page

![Login page](img/admin-plugin-redmine-asap-theme.png)

## Admin role edit

![Role edit](img/admin-role-edit.png)

## Flash message

Display a notification type alert for flash messages

![Flash](img/flash-message.png)
