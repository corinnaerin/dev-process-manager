> This project is currently in beta. Use at your own risk, but also feel free to contribute ideas, bug reports, or code!

# Getting Started

## For users

**TODO: This is a temporary process that emulates installing the package instead of checking it out from git, pending actually publishing
this to the Qualtrics repository.**

Clone the repo, then run:

```bash
nvm use
npm link
```

This will symlink the package as if it were installed, and make the `dpm` command available on your `$PATH`.

## For contributors

## Install dependencies

* NVM: https://github.com/creationix/nvm#installation
* Yarn: `brew install yarn --without-node`

## Setup your environment

```bash
nvm use
yarn install
```

# Usage

If you've set up your environment correctly, running the following task
should output your version of node and current working directory:

`dpm test-command`

# Options

## Targets / CLI options

| name | description |
--- | ---
| <no_target> / default / help | lists out the available commands and aliases |
| `--<log_level>` | Sets the log level. Defaults to `info`. |

## Configuring commands

For the most part, this script is just a light wrapper around [child_process.spawn](https://nodejs.org/docs/latest-v8.x/api/child_process.html#child_process_child_process_spawn_command_args_options_), 
but takes the pain out of manually running multiple CLIs in certain orders and in different terminal windows.
You can add or edit the commands in `./config/commands.json` to fit your own development environment and processes. The JSON
is just a simple map from the command name (which can be whatever you want) and a configuration object that should match
the linked API doc for [child_process.spawn](https://nodejs.org/docs/latest-v8.x/api/child_process.html#child_process_child_process_spawn_command_args_options_).
 
### Additional options / behavior

These command options are supported by this script and are _not_ natively part of `child_process.spawn`, or they have extra logic on top of them.

| name | default | description
--- | --- | ---
| requiresRoot | false | The specified command requires root/sudo in order to run. You will be prompted for your password upon execution of the command.
| nvm | null | Any valid nvm version or alias, used to set the correct Node path into the PATH variable for the command. Requires `nvm` to be available in your shell.
| shell | true | NodeJS defaults this to false, however many of the commands (`nvm`, `sudo`) have unpredictable behavior and/or failures unless running inside a shell. This uses the default shell, but you can specify the path to a specific shell if you prefer.

#### Regarding nvm / node versions

**TODO: Only enable auto-nvm if an option in defaultOptions is set**

If the base command is `node` or `npm`, `nvm` will be invoked automatically in the working directory of the command. This means
`nvm` will attempt to determine the `node` version from any `.nvmrc` files in the directory tree and/or however you have
nvm configured. If there is no available `.nvmrc` for the command you're trying to configure, or you can't set the working directory
to the location of it, you can use `options.nvm` to manually specify the version, which can be any valid `nvm` version string. 
**Note that if you are explicitly adding a version of node to the beginning of your `$PATH` in your shell startup script, 
that will take precedence over this and potentially cause problems. You can easily fix this by adding your preferred default node to the _end_ of your $PATH instead.**

## Configuring aliases & workflows

You can specify aliases, or shortcuts to run multiple commands. `series.json` contains a mapping from the alias name
to a list of tasks that should be run synchronously in the order specified. `parallel.json` is the same but the 
tasks will be run asynchronously. 

**TODO: the below is not currently true - gulp will fail if the dependent task hasn't been created yet. Needs some
thought on how to implement this**
You can use aliases in other alias definitions. So, for example, if you had tasks A and B that did not depend on
each other, and tasks C & D that need to be run in order but only after tasks A and B are both complete, you could do:

parallel.json
```json
{
  "alias_1": ["A", "B"]
}
```

series.json
```json
{
  "alias_2": ["alias_1", "C", "D"]
}
```

Just be careful not to introduce circular dependencies!

## Default command options

Edit `./config/defaultOptions.json` to specify options to be passed by default to all commands. This supports all 
options that can be configured for an individual command.

# FAQ

* **What if I want to configure or use a task that requires sudo access?** Simply add `requiresRoot: true` as an option 
to the command config. You will be prompted for your password when the command starts. Please note that if there is a lot of stdout 
coming from various commands, the prompt may be difficult to notice, but you can provide your password anyway at any time.

# Troubleshooting

## `TypeError` or other language parsing errors at runtime

Make sure you are using a supported version of node. See `.nvmrc` for the supported version.

# TODO

* Running grunt? Weirdness going on with this due to grunt requirements of having local & global grunt
* Move user config file in HOME directory
* Make publishable npm package
* Make each command its own file? Is that better or worse than all in one file?
* Remove Gulp dependency? I'm pushing gulp way further than it was designed for, and it's going to make it really difficult to have the more elaborate configurations, 
and it shouldn't be hard to just support synchronous vs. asynchronous execution without it
* Make sure all processes exit if one fails unexpectedly (or don't fail the parent process?)
