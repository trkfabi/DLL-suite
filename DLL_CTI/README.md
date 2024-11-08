# DLL Express Finance (CTI)
Titanium Alloy App for De Lage Landen.

## Table of Contents

<!-- MarkdownTOC autolink=true bracket=round depth=0 -->

- [Supported Platforms:](#supported-platforms)
- [Development environment versions](#development-environment-versions)
- [Getting Started](#getting-started)
- [Building for device \(iOS\)](#building-for-device-ios)
- [Standards versions used by this project](#standards-versions-used-by-this-project)
- [App Version Format](#app-version-format)
- [Branching Strategy](#branching-strategy)
- [App Settings \(settings.js\)](#app-settings-settingsjs)
- [Constants per environment \(constants.js\)](#constants-per-environment-constantsjs)
- [Legal](#legal)

<!-- /MarkdownTOC -->


## Supported Platforms:
* iPhone (iOS 11+)

## Development environment versions
- **Node.js:** 10+
- **npm:** 6+
- **appc cli:** 8.0.0
- **Xcode:** 11.3
- **Java:** 11.0.1

## Getting Started
1. Make sure you have compiled the project using Alloy. This should be needed only **once** after you cloned the repository the first time.

    ```bash
    $ alloy compile --config platform=ios
    ```

1. To run the project on iOS simulator.

    ```bash
    $ ti build -p ios [--iphone|-C ?]
    ```

## Building for device (iOS)

- In order for debugging using an iOS device, make sure you first:

    - Change the appid for `com.propelics.dll`

    - Delete the [`Entitlements.plist`](Entitlements.plist) file, if exists.

    - Use the Provisioning Profile ***App Debug***, from Propelics Enterprise.

    - Are logged in using the "dll.dev@propelics.com" account:

        ```bash
        $ appc logout -D
        $ appc login --username "dll.dev@propelics.com" --password "<ask the password with your project lead>" --org-id "100000030"
        ```

    - Install the app using the `appc` cli:

        ```bash
        $ appc ti build -p ios -T device
        ```

## Standards versions used by this project
- **[JavaScript](https://github.com/anexinet/ReusableComponents/blob/master/Docs/JavaScriptCodingStandard.md):** 1.8
- **[Titanium/Alloy](https://github.com/anexinet/ReusableComponents/blob/master/Docs/TitaniumCodingStandard.md):** 1.1
- **[JSDuck](https://github.com/anexinet/ReusableComponents/blob/master/Docs/JSDuckDocumentationStandards.md):** 1.3

## App Version Format
- The version  format for all builds is:

    ```
    <major>.<minor>.<build>.<env>
    ```

- **major** gets updated with new bleeding edge changes on the code.

- **minor** gets updated right **after** the app has been submitted to production.

- **build** gets updated with each new `dev` build delivered.

- **env** gets updated depending on the build that is being created. See the [settings file](scripts/settings.js) for the complete list.

## Branching Strategy
- This app is based on the [Propelics git-workflow guide](https://propelics.box.com/v/git-workflow).

- All PR's and new builds start from `dev`, promoting to other branches depends on the project requests.

- If a *hotfix* is needed, the architect should decide what branch to create/merge the hotfix against.

    - `acc` is the usual branch for creating hotfixes.

- The merge strategy is:

    ```
    - dev
        |
        +- test
            |
            +- acc
                |
                +- stage
                    |
                    +- demo
                    |
                    +- release
                    |   |
                    |   +- master
                    |
                    +- sit-tst
                    |
                    +- sit-acc
    ```

## App Settings (settings.js)
- All general app settings (that affect the `tiapp.xml` file) live under the [settings script](scripts/settings.js).

- If a change is required for some specific environemnt, that file should be updated in `dev` and PR **MUST** be created.

- The steps applied for each environment are as follows (in the Terminal):

    ```bash
    $ npm install
    $ npm start -- -e <Env Settings>
    $ ti clean
    $ ti build
    ```

- Depending on the branch, the environemnt settings will be applied:

Branch name | Env Settings | Back-end Base URL | Notes
----------- | ------------ | ----------------- | -----
`dev` | `dev` | TST | All PR's should be against this branch. Used for internal testing.
`test` | `test` | TST | First build tested by DLL.
`acc` | `acc` | ACC | Second build tested by DLL.
`stage` | `stage` | PROD | Pre-production build. Should be created once the app is ready for release.
`demo` | `demo` | PROD | Contains the latest `stage` code, but it won't submit quotes to DLL.
`sit-tst` | `sit-tst` | TST | Contains the latest `stage` code, but pointing to **TST** back-end.
`sit-acc` | `sit-acc` | ACC | Contains the latest `stage` code, but pointing to **ACC** back-end.
`release` | `prod` | PROD | Release build for the Stores (App Store, Play Store).
`master` | `prod` | PROD | Shallow copy of `release`, no builds are created from this branch.

## Constants per environment (constants.js)
- All the app constants the change based on the environment live under the [constants file](app/lib/constants.js).

- Depending on the environment the app is running in, the constants will be loaded as cascade (similarly to how the `config.json` file works).

- `global` values will be directly affected by the same variable constant (if applies).

- If the value must remain exactly the same on all environments, it can be declared in the `alloy.js` file.

## Legal

Anexinet, All Rights Reserved.

