import * as path from 'path';
import * as fs from 'fs';
import * as npm from 'npm';
import * as commander from 'commander';
import * as ini from 'ini';

const PKG = require('./package.json');
const REGISTRY = require('./registries.json');

const NRMRC = path.join(process.env.HOME, '.nrm.json');
const NPMRC = path.join(process.env.HOME, '.npmrc');

const FIELD_REGISTRY = 'registry';

commander.version(PKG.version);
commander
    .command('current')
    .option('-u, --show-url', 'Show the registry URL instead of the name')
    .description('Show current registry name or URL')
    .action(showCurrent);

commander
    .command('ls')
    .description('Show current registry name or URL')
    .action(listRegistries);

commander
    .command('use <registry>')
    .description('Show current registry name or URL')
    .action(onUse);

commander.parse(process.argv);


if (process.argv.length === 2) {
    commander.outputHelp();
}


async function showCurrent() {
    const registry = await getCurrent();
    console.log("\n");
    console.log(`   Current: ${registry}`);
    console.log("\n");
}

function getCurrent() {
    return new Promise((resolve, reject) => {
        npm.load((err, conf) => {
            if (err) reject(err);
            const registry = npm.config.get(FIELD_REGISTRY);
            resolve(registry);
        });
    });
}

async function listRegistries() {
    const registries: any = await getRegistries();
    const currentRegistry = await getCurrent();
    const keys = Object.keys(registries);
    console.log("\n");
    keys.forEach(key => {
        const item = registries[key].registry;
        if (item === currentRegistry) {
            console.log(` * ${key} -----  ${item}`);
        } else {
            console.log(`   ${key} -----  ${item}`);
        }
    });
    console.log("\n");
}


function getRegistries() {

    return new Promise((resolve, reject) => {
        fs.access(NRMRC, fs.constants.F_OK, err => {
            if (err) {
                fs.writeFile(NRMRC, JSON.stringify(REGISTRY, null, 4), err => {
                    if (err) reject(err);
                });
            }

            fs.readFile(NRMRC, 'utf8', (err, data) => {
                if (err) reject(err);
                resolve(JSON.parse(data));
            });
        });

    })
}

async function onUse(name) {
    const npmRCData = await getNpmRCData();
    const npmConfig = ini.parse(npmRCData);
    const registries = await getRegistries();
    const selectRegistry = registries[name];
    if (selectRegistry) {
        npmConfig.registry = selectRegistry.registry;
        npmConfig.home = selectRegistry.home;
        fs.writeFileSync(NPMRC, ini.stringify(npmConfig));
        console.log("\n");
        console.log(`   Registry has been set to: ${npmConfig.registry}`);
        console.log("\n");
    }
}

function getNpmRCData() {
    return new Promise((resolve, reject) => {
        fs.access(NPMRC, fs.constants.F_OK, err => {
            if (err) {
                fs.writeFile(NPMRC, '', err => {
                    if (err) reject(err);
                });
            }
        });
        fs.readFile(NPMRC, 'utf8', (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
}


