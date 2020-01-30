#!/usr/bin/env node

var commander = require("commander");
var {spawn} = require("child_process");
var chalk = require('chalk');
var os = require('os');
var fs = require('fs');
var path = require('path');
var pkg = require("./package.json");

var program = new commander.Command();

program
    .name(Object.keys(pkg.bin)[0])
    .version(pkg.version);

program
    .command('new [folder]')
    .description("Create a new project")
    .option('-Y, --yarn', "Use yarn instead of npm", false)
    .option('-G, --no-git', "Initialize git repository?")
    .option('-M, --no-mit', "Use MIT license?")
    .action(function(folder, cmdObj) {
        // console.log(cmdObj.opts(), {folder})
        try {
            repo(folder, cmdObj.opts())
        }catch(e) {
            console.error(e);
        }
    });

program
    .command('info')
    .description('Show info about the CLI')
    .action(function() {
        console.log(`${pkg.name}@${program._version} (${pkg.author})`)
        if(pkg.description) console.log(pkg.description);
    })
    
program.parse(process.argv);

function repo(dir=null, {git=true, mit=true, yarn=false}){
    let folder = path.join(process.cwd(), dir);

    // Create Folder
    if(dir) {
        console.log(`  - Creating folder ...`);
        fs.mkdirSync(folder);
        process.chdir(folder);
    } else {
        console.log("Using current directory")
    }

    // Git init
    if(git) {
        console.log("  - Initializing Git ...")
        let {stderr} = spawn("git", ["init"]);
        stderr.pipe(process.stderr);

        fs.writeFileSync(path.join(folder, '.gitignore'), 'node_modules');
    } 

    // Create License
    if(mit) {
        console.log("  - Creating license.md ...")
        let {stderr, stdout} = spawn("npm", ['get', 'init-author-name'], {shell: true});
        var buf = [];
        stdout.on('data', c => buf.push(c))
        stdout.on('end', () => {
            let txt = fs.readFileSync(path.join(__dirname, './mit.txt'), 'utf8');
            txt = txt.replace('[year]', new Date().getFullYear())

            let name =  Buffer.concat(buf).toString().trim();
            if(name === "") name = os.userInfo().username.trim();
            txt = txt.replace('[name]', name)

            fs.writeFileSync(path.join(folder, "license.md"), txt);
        })
        stderr.pipe(process.stderr);
    }

    console.log("  - Creating package.json ...")
    let {stderr} = spawn((yarn ? "yarn" : "npm"), ["init", "-y"], {shell: true})
    stderr.pipe(process.stderr);

    console.log("  - Creating readme.md")
    fs.writeFileSync(path.join(folder, "readme.md"), "# " + path.basename(folder));

    console.log("We're all done here. Happy Hacking!")
}