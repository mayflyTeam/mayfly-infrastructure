#!/usr/bin/env node

const { Command } = require('commander');
const hatch = require('./commands/hatch');
const squish = require('./commands/squish')
const lay = require('./commands/lay')

const program = new Command();

program
  .command('lay')
  .alias('l')
  .description('Setup and customize Mayfly AWS infrastructure')
  .action(lay);

program
  .command('hatch')
  .alias('h')
  .description("Deploy Mayfly AWS infrastructure.")
  .action(hatch);

program
  .command('squish')
  .alias('s')
  .description("Tear down Mayfly's AWS infrastructure.")
  .action(squish);

program.parse(process.argv);
