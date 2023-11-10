const { exec } = require('child_process');
const path = require('path');

// Function to execute a shell command
function execCommand(command, workingDirectory) {
    return new Promise((resolve, reject) => {
        exec(command, { cwd: workingDirectory }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                reject(stderr);
                return;
            }
            resolve(stdout.trim());
        });
    });
}

// Function to run terraform apply in a specific directory
async function runTerraformApply() {
    try {
        // Define the directory where the terraform configuration is located
        const terraformDir = path.join(__dirname, '../../terraform');

        // Running terraform apply
        console.log("Running Terraform apply...");
        const output = await execCommand('terraform apply -auto-approve', terraformDir);

        // Extract the EIP address (or other specific value) from the output
        const match = output.match(/eip_address\s+=\s+"([^"]+)"/);
        const eipAddress = match ? match[1] : null;

        if (eipAddress) {
            // Write the EIP address to a file
            const writeFileCommand = `echo ${eipAddress} > output.txt`;
            await execCommand(writeFileCommand);
            console.log(`EIP Address written to output.txt`);
        } else {
            console.log('EIP Address not found in Terraform output');
        }
    } catch (error) {
        console.error(`Failed to run Terraform: ${error}`);
    }
}

// Run the function
runTerraformApply();
