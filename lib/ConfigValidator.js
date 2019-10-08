// TODO: WIP
const log = require('loglevel').getLogger('ConfigValidator');
const { Schema } = require('validate');

const aliasSchema = new Schema({
  type: Object,
  each: {
    type: Array,
    each: {
      type: String
    }
  }
});

const commandSchema = new Schema({
  command: {
    type: String,
    required: true
  },
  args: {
    type: Array,
    each: {
      type: String
    },
    required: false
  },
  options: {
    cwd: String,
    env: {
      type: Array,
      each: {
        type: String
      }
    },
    argv0: String,
    uid: Number,
    gid: Number,
    shell: Boolean | String
  }
});

const reservedNames = new Set(['help', 'list', 'default']);

class ConfigValidator {
  constructor(commands, parallelTasks, seriesTasks) {
    this.commands = commands;
    this.parallelTasks = parallelTasks;
    this.seriesTasks = seriesTasks;
    this.taskNames = new Set();
    this.valid = true;
  }

  validate() {
    this._validateNames();
    this._validateAliases();
  }

  _validateName(name) {
    if (reservedNames.has(name)) {
      log.error(
        `"${name}" is a reserved command name, skipping registration. Please rename your command to something else!`
      );
      this.valid = false;
    }

    if (this.taskNames.has(name)) {
      log.error(
        `"${name}" has duplicate definitions.`
      );
      this.valid = false;
    } else {
      this.taskNames.add(name);
    }
  }

  _validateNames() {
    Object.keys(this.commands).forEach(this._validateName);
    Object.keys(this.parallelTasks).forEach(this._validateName);
    Object.keys(this.seriesTasks).forEach(this._validateName);
  }

  _validateAlias([name, tasks]) {
    tasks.forEach((task) => {
      if (!this.taskNames.has(task)) {
        log.error(
          `"The alias "${name} refers to "${task}" which is undefined`
        );
      }
    });
  }

  _validateAliases() {
    Object.entries(this.commands).forEach(this._validateAlias);
    Object.entries(this.parallelTasks).forEach(this._validateAlias);
    Object.entries(this.seriesTasks).forEach(this._validateAlias);
  }
}
