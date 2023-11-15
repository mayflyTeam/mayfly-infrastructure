packer {
  required_plugins {
    amazon = {
      version = ">= 0.0.1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "drone" {
  ami_name      = "mayfly-drone"
  instance_type = "t2.micro"
  region        = "us-east-1"
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