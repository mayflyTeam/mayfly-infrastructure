const { Stack, Construct } = require('aws-cdk-lib');
// const sqs = require('aws-cdk-lib/aws-sqs');
// const cdk = require('@aws-cdk/core');
const ec2 = require('aws-cdk-lib/aws-ec2');
const path = require('path');
const fs = require('fs');

class MayFlyStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, {
      ...props,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true // this will select the default VPC
    });

    // Lookup for the Controller AMI
    const controllerAmi = ec2.MachineImage.genericLinux({
      'us-east-1': 'ami-087ae21f27fd5b999' // replace with your ControllerAMI ID
    });

    // Lookup for the Drone AMI
    const droneAmi = ec2.MachineImage.genericLinux({
      'us-east-1': 'ami-072b21d703acefd0b' // replace with your DroneAMI ID
    });

    const controllerSG = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'MayFlyControllerSG',
      'sg-0c56b9546252b37c9',
      {
        mutable: false
      }
    )

    const droneSG = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'MayFlyDroneSG',
      'sg-0ff7edad0522b9dfe',
      {
        mutable: false
      }
    )

    // Read the first file as a string
    const commands1 = fs.readFileSync(path.join(__dirname, 'controllerUserData.sh'), 'utf-8');
    // Split the string into an array of commands
    const controllerCommands = commands1.split('\n');
    
    // Read the second file as a string
    const commands2 = fs.readFileSync(path.join(__dirname, 'droneUserData.sh'), 'utf-8');
    // Split the string into an array of commands
    const droneCommands = commands2.split('\n');

    const controllerUserData = ec2.UserData.forLinux();
    controllerUserData.addCommands(...controllerCommands)

    const droneUserData = ec2.UserData.forLinux();
    droneUserData.addCommands(...droneCommands)

    // Create an EC2 instance of the controller
    const controller = new ec2.Instance(this, 'MayflyController', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: controllerAmi,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      keyName: 'mayfly',
      securityGroup: controllerSG,
      userData: controllerUserData
    });

    // Create an EC2 instance of the drone
    const drone = new ec2.Instance(this, 'MayflyDrone', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: droneAmi,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      keyName: 'mayfly',
      securityGroup: droneSG,
      userData: droneUserData,
      instanceProps: {
        associatePublicIpAddress: true,
        instanceId: '',
        eip:
      }
    });

    // Associate an existing Elastic IP with the controller
    new ec2.CfnEIPAssociation(this, 'Controller EIP Association', {
      eip: '35.175.5.35', // replace 'your-elastic-ip' with your Elastic IP address
      instanceId: controller.instanceId,
    });
  }
}
module.exports = { MayFlyStack }
