const fs = require('fs');
const util = require('util');
const toml = require('toml');
const tomlify = require('tomlify-j0.4');
const readline = require('readline');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const controllerConfigPath = '../../packer/controller/controller-config/plane-config/controller.toml';
const droneConfigPath = '../../packer/drone/drone-config/plane-config/drone.toml';

const question = (rl, query) => new Promise(resolve => rl.question(query, resolve));

const modifyConfigFiles = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const domainName = await question(rl, 'Enter your domain name: ');
    const soaEmail = await question(rl, 'Enter your SOA email: ');

    const controllerData = await readFile(controllerConfigPath, 'utf-8');
    let controllerConfig = toml.parse(controllerData);

    controllerConfig.dns.domain_name = domainName;
    controllerConfig.dns.soa_email = soaEmail;

    const controllerTomlData = tomlify.toToml(controllerConfig, {space: 2});
    await writeFile(controllerConfigPath, controllerTomlData);
    console.log(`Controller successfully updated`);

    const droneData = await readFile(droneConfigPath, 'utf-8');
    let droneConfig = toml.parse(droneData);

    const tfState = JSON.parse(fs.readFileSync('../../terraform/elasticIP/terraform.tfstate'));
    droneConfig.cluster_domain = domainName;
    droneConfig.nats.hosts = [tfState.outputs.eip_address.value];

    const droneTomlData = tomlify.toToml(droneConfig, {space: 2});
    await writeFile(droneConfigPath, droneTomlData);
    console.log(`Drone successfully updated`);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    rl.close();
  }
};

module.exports = modifyConfigFiles;