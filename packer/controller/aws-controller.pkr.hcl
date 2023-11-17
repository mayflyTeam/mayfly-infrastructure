packer {
  required_plugins {
    amazon = {
      version = ">= 0.0.1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

locals {
  ami_name = "mayfly-controller-${uuidv4()}"
  config_data = jsondecode(file("${path.module}/../../config.json"))
  region = local.config_data.AWS_REGION
  instance_type = local.config_data.INSTANCE_TYPE
}

source "amazon-ebs" "controller" {
  ami_name      = local.ami_name
  instance_type = local.instance_type
  region        = local.region
  source_ami    = "ami-0c8dfd6b207aecadf"
  ssh_username  = "ubuntu"
}

build {
  name = "provision-controller"
  sources = [
    "source.amazon-ebs.controller"
  ]
  provisioner "shell" {
    inline = [
      "sudo apt-get update -y",
      "while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do echo 'Waiting for other software managers to finish...' ; sleep 2; done",
      "sudo apt-get install -y nodejs",
      "sudo apt-get install -y npm",
      "sudo curl -L \"https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose",
      "sudo chmod +x /usr/local/bin/docker-compose"
    ]
  }
  provisioner "file" {
    source      = "./controller-config"
    destination = "/home/ubuntu"
  }
  provisioner "file" {
    source      = "./mayfly-api"
    destination = "/home/ubuntu"
  }
  post-processor "manifest" {
    output = "controller-ami.json"
  }
}