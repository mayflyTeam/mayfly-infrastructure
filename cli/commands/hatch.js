const path = require('path');
const modifyConfigFiles = require('../helpers/modifyConfigFiles');
const execAsync = require('../helpers/execAsync')

async function hatch() {
  const originalDir = __dirname;

  try {
    process.chdir(path.join(originalDir, '../../terraform/elasticIP'));
    await execAsync('terraform', ['apply', '-auto-approve']);

    process.chdir(path.join(originalDir, '../helpers'));
    await modifyConfigFiles();

    process.chdir(path.join(originalDir, '../../packer/controller'));
    await execAsync('packer', ['build', 'aws-controller.pkr.hcl']);

    process.chdir(path.join(originalDir, '../../packer/drone'));
    await execAsync('packer', ['build', 'aws-drone.pkr.hcl']);

    process.chdir(path.join(originalDir, '../../terraform/main'));
    await execAsync('terraform', ['apply', '-auto-approve']);

    console.log('Hatch complete!');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    process.chdir(originalDir);
  }
}

module.exports = hatch;
