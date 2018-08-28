# Getting Started

## Dependencies

* NVM: https://github.com/creationix/nvm#installation
* Yarn: `brew install yarn --without-node`
* Gulp : `sudo npm install --global gulp-cli`

## Setup your environment

```bash
nvm use
yarn install
```

## Customize your configuration

Edit `./config/commands.json` and make sure any working directories are correctly
specified for your machine.

## Run some scripts

If you've set up your environment correctly, running the following task
should output your version of node and current working directory:

`gulp test-command`

## Targets / CLI options

| name | description |
--- | ---
| <no_target> / default | lists out the available commands and aliases |

## CLI Options

| name | description |
--- | ---
| `--verbose` | Increases the log level to `DEBUG` |

# Configuring a command

For the most part, this script is just a light wrapper around [child_process.spawn](https://nodejs.org/docs/latest-v8.x/api/child_process.html#child_process_child_process_spawn_command_args_options_).
You can add or edit the commands in `./config/commands.json` to fit your own development environment and processes. The JSON
is just a simple map from the command name (which can be whatever you want) and a configuration object that should match
the linked API doc. 
 
##Additional options / behavior

These options are supported by this script and are _not_ part of `child_process.spawn`. They can be added to the `options`
object of the configuration.

| name | default | description
--- | --- | ---
| requiresRoot | false | The specified command requires root/sudo in order to run. The script will fail the task before spawning the child process if not running in root.
| env.PATH | null | The `PATH` environment variable has special handling. If specified, its value will be _prepended_ to the existing `PATH` variable.

# Configuring alises

You can specify aliases, or shortcuts to run multiple commands. `series.json` contains a mapping from the alias name
to a list of tasks that should be run synchronously in order of specification. `parallel.json` is the same but the 
tasks will be run asynchronously. 

**TODO: the below is not currently true - gulp will fail if the dependent task hasn't been created yet. Needs some
thought on how to implement this**
You can use aliases in other alias definitions. So, for example, if you had tasks A and B that did not depend on
each other, and tasks C & D that need to be run in order but only after tasks A and B are both complete, you could do:


```json
//parallel.json
{
  "alias_1": ["A", "B"]
}
```

```json
//series.json
{
  "alias_2": ["alias_1", "C", "D"]
}
```

Just be careful not to introduce circular dependencies!

```
 
# FAQ

* **What if I want to configure or use a task that requires sudo access?** Simply add `requiresRoot: true` as an option
to the command config, and then be sure to run `sudo gulp ...`.