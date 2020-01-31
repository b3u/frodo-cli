#!/usr/bin/env node

var commander = require("commander");
var pkg = require("./package.json");

var program = new commander.Command();

// Setup Commands
require('./lib')(program);

program
    .name(Object.keys(pkg.bin)[0])
    .version(pkg.version)


program
    .command('info')
    .description('Show info about the CLI')
    .action(function() {
        console.log(`${pkg.name}@${program._version} (${pkg.author})`)
        if(pkg.description) console.log(pkg.description);
    })
    
program.parse(process.argv);
if (!program.args.length) program.help();