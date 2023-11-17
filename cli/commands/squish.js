const path = require('path');
const execAsync = require('../helpers/execAsync')

async function squish() {
  const originalDir = __dirname;

  try {
    process.chdir(path.join(originalDir, '../../terraform/elasticIP'));
    await execAsync('terraform', ['destroy', '-auto-approve']);

    process.chdir(path.join(originalDir, '../../terraform/main'));
    await execAsync('terraform', ['destroy', '-auto-approve']);

    console.log('Squish complete!');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    process.chdir(originalDir);
  }
}

module.exports = squish;
