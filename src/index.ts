const shell = require('shelljs');
import program from 'commander';

import { kontentSetup, contentfulSetup } from './helpers/setupConfig';

import localeMapping from './mapping/localeMapping';
import assetMapping from './mapping/assetMapping';
import contentMapping from './mapping/contentMapping';

import createLanguages from './migrations/createLanguages';
import createAssets from './migrations/createAssets';
import createContentTypes from './migrations/createContentTypes';
import createContentEntries from './migrations/createContentEntries';
import publishContentEntries from './migrations/publishContentEntries';

import migrationSummary from './helpers/migrationSummary';

program
    .name('yarn program')
    .usage('[options] ')
    .version('0.1.0')
    .option('-f, --fetch', 'Fetch Contentful Data')
    .option('-m, --migrate', 'Run Migration to Kentico Kontent')
    .option('--all', 'Run entire migration')
    .option('-s, --summary', 'Migration summary')
    .option('-d, --delete', 'Delete all project data')
    .option('-ks, --kontent_setup', 'Setup Kontent Configuration')
    .option('-cs, --contentful_setup', 'Setup Contentful Configuration');

program.parse(process.argv);

console.log(`=================================`);
console.log(`Content Migration Tool running...`);
console.log(`=================================`);

if (program.all) {
    console.log(`Running entire migration...`);
    console.log('');

    shell.exec(`src/scripts/runDownload.sh`);
    shell.exec(`src/scripts/runMigration.sh`);

    migrationSummary();
} else {
    if (program.fetch) {
        console.log(`Running Contentful Export...`);
        console.log('');

        shell.exec(`src/scripts/runDownload.sh`);
    }
    if (program.migrate) {
        console.log(`Running migration...`);
        console.log('');

        shell.exec(`src/scripts/runMigration.sh`);

        migrationSummary();
    }
    if (program.kontent_setup) {
        kontentSetup();
    }
    if (program.contentful_setup) {
        contentfulSetup();
    }
    if (program.summary) {
        migrationSummary();
    }
    if (program.delete) {
        console.log(`Deleting all Project files...`);
        console.log('');

        shell.exec(`src/scripts/deleteMigrationFiles.sh`);
    }
}

console.log('');
console.log(`=================================`);
console.log(`Content Migration Tool complete...`);
console.log(`=================================`);
console.log('');

program.help();
