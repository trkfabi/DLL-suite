# DLL Ratecards Admin

Welcome to the DLL Ratecards Admin Application.
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.7.

## Getting Started 

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `npm run build` to build the project. The build will store the artifacts in the `dist/` directory. Use the `-p` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Deploy

All the updates are done by our CI server, to trigger a new build, follow these steps:	

1. Merge all the pending PRs into `dev` and checkout the branch.	

1. Bump the `minor` version into [`package.json`](./package.json) and [`app-settings.ts`](./src/app/core/app-settings.ts).	

1. (Optional). Run the formatter for missing updates from `prettier`.	

	```bash	
	$ npm install	
	$ npm run format	
	```	

1. Commit and push all the updates.	

1. In [Jenkins](https://ci2.propelics.com/view/DLL/job/DLL%20-%20AFS%20Admin/), trigger the build manually for `dev`.	

1. For promotions outside `dev` (e.g. `acc`), merge the changes from `dev` into `acc` and push it. Jenkins will automatically trigger the builds for those branches.