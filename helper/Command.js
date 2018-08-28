const log = require('loglevel');
const merge = require('lodash.merge');
const spawn = require('child_process').spawn;
const { stringify } = require('q-i');

const DEFAULT_OPTIONS = {
    stdio: 'pipe',
    cwd: __dirname
};

const DEFAULT_ENV = {
    FORCE_COLOR: true
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
        // Prepend any specified PATH variable to existing PATH
        if (this.options && this.options.env) {
            if (this.options.env.PATH) {
                this.options.env.PATH = [
                    this.options.env.PATH,
                    process.env.PATH
                ].join(':')
            }
            this.options.env = {
                ...DEFAULT_ENV, ...process.env, ...this.options.env
            };
            return;
        }

        this.options.env = {
            ...DEFAULT_ENV, ...process.env
        };
    }

    _run() {
        this._setEnvVariables();

        this._dump();

        if (this.options.requiresRoot) {
            this._transformRootCommand();
        }

        const ps = spawn(this.command, this.args, this.options);

        ps.stdout.on('data', this._stdout.bind(this));
        ps.stderr.on('data', this._stderr.bind(this));
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

    _transformRootCommand() {
        const envString = Object.entries(this.options.env).map(keyAndValue => keyAndValue.join('='));
        this.args = [ ...envString, this.command, ...this.args ];
        this.command = 'sudo';
        this.options.shell = true;
        this.log.debug(`Transformed root command: ${this.command} ${this.args.join(' ')}`.grey)
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