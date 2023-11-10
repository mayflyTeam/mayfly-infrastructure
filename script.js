const fs = require('fs');
const toml = require('toml');
const tomlify = require('tomlify-j0.4');
const readline = require('readline');

const controllerConfigPath = '../plane-config/controller.toml';
const droneConfigPath = '../plane-config/drone.toml'

const modifyController = () => {
  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });

  rl.question('Enter the new domain name: ', (domainName) => {
      fs.readFile(controllerConfigPath, 'utf-8', (err, data) => {
          if (err) {
              console.error("Error reading the file:", err);
              rl.close();
              return;
          }

          let config = toml.parse(data);

          config.dns = config.dns || {};
          config.dns.domain_name = domainName;

          const tomlData = tomlify.toToml(config, {space: 2});

          fs.writeFile(configFilePath, tomlData, (err) => {
              if (err) {
                  console.error("Error writing the file:", err);
              } else {
                  console.log(`File successfully updated with domain: ${domainName}`);
              }
              rl.close();
          });
      });
  });
}

const modifyDrone = () => {
  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });

  rl.question('Enter the new domain name: ', (domainName) => {
      fs.readFile(droneConfigPath, 'utf-8', (err, data) => {
          if (err) {
              console.error("Error reading the file:", err);
              rl.close();
              return;
          }

          let config = toml.parse(data);

          config.dns = config.dns || {};
          config.dns.domain_name = domainName;

          const tomlData = tomlify.toToml(config, {space: 2});

          fs.writeFile(configFilePath, tomlData, (err) => {
              if (err) {
                  console.error("Error writing the file:", err);
              } else {
                  console.log(`File successfully updated with domain: ${domainName}`);
              }
              rl.close();
          });
      });
  });
}