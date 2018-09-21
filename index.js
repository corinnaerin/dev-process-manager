#!/usr/bin/env node

const log = require('loglevel');
const logPrefix = require('loglevel-plugin-prefix');
const gulp = require('gulp');
const argv = require('yargs').argv;
const colors = require('colors');

const logLevelColors = {
    TRACE: colors.grey,
    DEBUG: colors.magenta,
    INFO: colors.blue,
    WARN: colors.yellow,
    ERROR: colors.red
};

process.env.LOG_LEVEL = 'info';

Object.keys(logLevelColors).forEach(logLevel => {
    if (argv[logLevel.toLowerCase()]) {
        process.env.LOG_LEVEL = logLevel;
    }
});

log.setLevel(process.env.LOG_LEVEL);

logPrefix.reg(log);
logPrefix.apply(log, {
    format: (level, name, timestamp)  => {
        return `${colors.grey(`[${timestamp}]`)} ${logLevelColors[level.toUpperCase()](level.padEnd(5))} ${colors.cyan(`[${name}]`)}`;
    }
});

log.info(`Welcome to your awesome dev process manager! Now you can just sit back and relax (er, code)!`.green);
log.info(`Log level set to ${process.env.LOG_LEVEL}`);

// This has to be imported after the log configurations, or they won't apply to the gulpfile
require('./gulpfile');

if (argv._.length === 0) {
    log.error(`No command specified, exiting.`);
} else {
    gulp.task(argv._[0])();
}

