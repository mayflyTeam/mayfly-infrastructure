packer {
  required_plugins {
    amazon = {
      version = ">= 0.0.1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

locals {
  ami_name = "mayfly-drone-${uuidv4()}"
  config_data = jsondecode(file("${path.module}/../../config.json"))
  region = local.config_data.AWS_REGION
  instance_type = local.config_data.INSTANCE_TYPE
}

source "amazon-ebs" "drone" {
  ami_name      = local.ami_name
  instance_type = local.instance_type
  region        = local.region
  source_ami    = "ami-0c8dfd6b207aecadf"
  ssh_username  = "ubuntu"
}

build {
  name = "provision-drone"
  sources = [
    "source.amazon-ebs.drone"
  ]
  provisioner "shell" {
    inline = [
      "sudo curl -L \"https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose",
      "sudo chmod +x /usr/local/bin/docker-compose"
    ]
  }
  provisioner "file" {
    source      = "./drone-config"
    destination = "/home/ubuntu"
  }
  post-processor "manifest" {
    output = "drone-ami.json"
  }
}