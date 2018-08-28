const log = require('loglevel').getLogger('gulpfile');

const gulp = require('gulp');
const Command = require('./helper/Command');
const { stringify } = require('q-i');
require('colors');

const commands = require('./config/commands');
const parallelTasks = require('./config/parallel');
const seriesTasks = require('./config/series');

//TODO Running grunt?
//TODO nvm?
//TODO user config file in HOME directory
//TODO make publishable npm package
//TODO make executable
//TODO make each command its own file?

Object.entries(commands).forEach(([name, config]) => {
    log.debug(`Registering command '${name}'`.grey);
    const command = new Command(name, config);
    gulp.task(name, command.getTask());
});


Object.entries(seriesTasks).forEach(([name, tasks]) => {
    log.debug(`Registering series alias '${name}':`.grey + stringify(tasks));
    gulp.task(name, gulp.series(...tasks));
});

Object.entries(parallelTasks).forEach(([name, tasks]) => {
    log.debug(`Registering parallel alias '${name}':`.grey + stringify(tasks));
    gulp.task(name, gulp.parallel(...tasks));
});


function list() {
    log.info(`All available (individual) commands: ${stringify(Object.keys(commands))}`);
    log.info(`All available parallel alias commands: ${stringify(parallelTasks)}`);
    log.info(`All available series alias commands: ${stringify(seriesTasks)}`);
}

gulp.task(list);
gulp.task('help', list);
gulp.task('default', list);
