#!/usr/bin/env node

const { Command } = require('commander');
const hatch = require('./commands/hatch');

const program = new Command();

program
  .command('hatch')
  .alias('d')
  .description("Deploy Mayfly AWS infrastructure.")
  .action(hatch);

program.parse(process.argv);
