const fs = require('fs');
const prompts = require('prompts');

/**
Things to customize:
Instance Type
Region
Min Size
Max Size
Desired Capacity
 */

const questions = [
  {
    type: 'text',
    name: 'DOMAIN_NAME',
    message: 'Enter your Domain Name:',
    validate: (value) =>
      value.trim().length !== 0 || 'Domain Name cannot be empty'
  },
  {
    type: 'text',
    name: 'SOA_EMAIL',
    message: 'Enter your SOA Email:',
    validate: (value) =>
      value.trim().length !== 0 || 'SOA Email cannot be empty'
  },
  {
    type: 'text',
    name: 'INSTANCE_TYPE',
    message: 'Enter your Instance Type:',
    initial: 't2.micro'
  },
  {
    type: 'text',
    name: 'AWS_REGION',
    message: 'Enter your AWS region:',
    initial: 'us-east-1'
  },
  {
    type: 'number',
    name: 'DRONE_ASG_MAX_SIZE',
    message: 'Enter your drone auto-scaling group maximum size:',
    initial: 3
  },
  {
    type: 'number',
    name: 'DRONE_ASG_MIN_SIZE',
    message: 'Enter your drone auto-scaling group minimum size:',
    initial: 1
  },
  {
    type: 'number',
    name: 'DRONE_ASG_DESIRED_CAPACITY',
    message: 'Enter your drone auto-scaling group desired capacity:',
    initial: 1
  },
];

const lay = async () => {
  console.log('Welcome to the Mayfly CLI!');

  console.log('Initializing Mayfly', 'Set up your Mayfly deployment pipeline!\n');

  const answers = await prompts.prompt(questions);
  const envContents = Object.keys(answers)
    .filter((key) => answers[key])
    .map((key) => `${key}=${answers[key]}`)
    .join('\n');

  fs.writeFileSync('.env', envContents);

  console.log('\n');
  console.log('Mayfly lay complete!');
};

module.exports = lay;