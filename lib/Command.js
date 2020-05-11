const log = require('loglevel');
const merge = require('lodash.merge');
const { execSync, spawn } = require('child_process');
const userDefaultOptions = require('../config/defaultOptions');
const { stringify } = require('q-i');
const { dirname, basename } = require('path');

const DEFAULT_OPTIONS = {
  stdio: 'pipe',
  shell: true,
  env: {
    FORCE_COLOR: true
  },
  inheritEnv: ['LOG_LEVEL'],
  ...userDefaultOptions
};

class Command {
  constructor(name, { command, args = [], options }) {
    this.name = name;
    this.command = command;
    this.args = args;
    this.log = log.getLogger(name);

    this.options = merge({}, DEFAULT_OPTIONS, options);
  }

  getTask() {
    return this._run.bind(this);
  }

  _setEnvVariables() {
    if (Array.isArray(this.options.inheritEnv)) {
      this.options.inheritEnv.reduce((accumulator, envVarName) => {
        accumulator[envVarName] = process.env[envVarName];
      }, this.options.env || {});
    }
  }

  _run() {
    this._setEnvVariables();

    if (this.command === 'npm' || this.command === 'node' || this.command === 'yarn' || this.options.nvm) {
      this._nvm();
    }

    this._dump();

    if (this.options.requiresRoot) {
      this._transformRootCommand();
    }

    const ps = spawn(this.command, this.args, this.options);

    if (this.options.stdio !== 'inherit') {
      ps.stdout.on('data', this._stdout.bind(this));
      ps.stderr.on('data', this._stderr.bind(this));
    }
    ps.on('close', this._close.bind(this));

    return ps;
  }

  _dump() {
    this.log.debug(`Working directory: ${this.options.cwd}`);
    const { env, ...optionsMinusEnv } = this.options;
    this.log.debug(`Options: ${stringify(optionsMinusEnv)}`);
    this.log.debug(`Env variables: ${stringify(env)}`);
    this.log.info(`Executing command: ${this.command} ${this.args.join(' ')}`);
  }

  _nvm() {
    try {
      let nvmCommand = 'nvm which';
      let explicitVersion = false;

      // TODO: this is kind of confusing. We want to support executing nvm if the value is set explicitly to true,
      //  but there wouldn't be a target in that case
      if (this.options.nvm && (typeof this.options.nvm === 'string' || typeof this.options.nvm === 'number')) {
        explicitVersion = true;
        nvmCommand = `nvm which ${this.options.nvm}`;
      }

      const nvmOutput = execSync(nvmCommand, {
        cwd: this.options.cwd,
        shell: this.options.shell
      });

      let nodeExecutable;

      if (explicitVersion) {
        // If a target/version is specified, we just get a single line with the path
        nodeExecutable = nvmOutput.toString().trim();
      } else {
        // If not specified with a target, the first line always states which .nvmrc file was used
        const lines = nvmOutput.toString().split('\n');
        this.log.info(lines[0]);

        // The second line is the path to the node executable
        nodeExecutable = lines[1];
      }

      const nvmBin = dirname(nodeExecutable);
      const nodeVersion = basename(dirname(nvmBin));

      this.options.env = {
        ...this.options.env,
        PATH: nvmBin,
        NODE_VERSION: nodeVersion,
        NVM_BIN: nvmBin
      };

      this.log.info(`Resolved to node version ${nodeVersion.blue} via nvm`);
    } catch (error) {
      this.log.error('Error resolving node/npm executable via nvm', error);
      throw error;
    }
  }

  _transformRootCommand() {
    const envString = Object.entries(this.options.env).map(([key, value]) => {
      if (typeof value === 'string' && value.indexOf(' ') !== -1) {
        value = `"${value}"`;
      }
      if (key === 'PATH') {
        value = `${value}:${process.env.PATH}`;
      }
      return `${key}=${value}`;
    });
    this.args = [...envString, this.command, ...this.args];
    this.command = 'sudo';
    this.log.debug(`Transformed root command: ${this.command} ${this.args.join(' ')}`.grey);
  }

  _stdout(data) {
    this.log.info(Command._formatData(data));
  }

  _stderr(data) {
    this.log.error(Command._formatData(data));
  }

  static _formatData(data) {
    const str = data.toString().trim();
    try {
      return stringify(JSON.parse(str));
    } catch (error) {
      return str;
    }
  }

  _close(code) {
    if (code !== 0) {
      this.log.error(`Exited with code ${code}. Re-run with --debug for debug info`);
    } else {
      this.log.info(`Completed successfully`.green);
    }
  }
}

module.exports = Command;
