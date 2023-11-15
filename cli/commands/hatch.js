const { spawn } = require('child_process');
const path = require('path');
const modifyConfigFiles = require('../helpers/modifyConfigFiles');

function execAsync(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit' });

    proc.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function hatch() {
  const originalDir = __dirname; // Save the original directory

  try {
    // Navigate to elasticIP directory and run terraform apply
    process.chdir(path.join(originalDir, '../../terraform/elasticIP'));
    await execAsync('terraform', ['apply', '-auto-approve']);

    // Change back to the original directory before modifying config files
    process.chdir(path.join(originalDir, '../helpers'));
    await modifyConfigFiles();

    // Navigate to packer directory and build images
    process.chdir(path.join(originalDir, '../../packer/controller'));
    await execAsync('packer', ['build', 'aws-controller.pkr.hcl']);

    process.chdir(path.join(originalDir, '../../packer/drone'));
    await execAsync('packer', ['build', 'aws-drone.pkr.hcl']);

    // Navigate to main directory and run final terraform apply
    process.chdir(path.join(originalDir, '../../terraform/main'));
    await execAsync('terraform', ['apply', '-auto-approve']);

    console.log('Workflow complete!');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Ensure to change back to the original directory
    process.chdir(originalDir);
  }
}

module.exports = hatch;
