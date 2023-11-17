terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

locals {
  controller_data = jsondecode(file("${path.module}/../../packer/controller/controller-ami.json"))
  drone_data      = jsondecode(file("${path.module}/../../packer/drone/drone-ami.json"))
  drone_ami       = local.drone_data.builds[length(local.drone_data.builds) - 1].artifact_id
  controller_ami  = local.controller_data.builds[length(local.controller_data.builds) - 1].artifact_id
  config_data = jsondecode(file("${path.module}/../../config.json"))
  max_size = local.config_data.DRONE_ASG_MAX_SIZE
  min_size = local.config_data.DRONE_ASG_MIN_SIZE
  desired_capacity = local.config_data.DRONE_ASG_DESIRED_CAPACITY
  region = local.config_data.AWS_REGION
  instance_type = local.config_data.INSTANCE_TYPE
  drone_conf = "drone-conf-${uuid()}"
}

provider "aws" {
  region = local.region
}

resource "aws_security_group" "controller_sg" {
  name        = "controller-sg"
  description = "Allow ports 3001, 4222, 53/tcp, 53/udp, 22/ssh"

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 4222
    to_port     = 4222
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 53
    to_port     = 53
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "controller-sg"
  }
}

resource "aws_security_group" "drone_sg" {
  name        = "drone-sg"
  description = "Allow ports 8080, 4222, 22/ssh"

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 4222
    to_port     = 4222
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "drone-sg"
  }
}

resource "aws_instance" "controller" {
  ami                    = split(":", local.controller_ami)[1]
  instance_type          = local.instance_type
  vpc_security_group_ids = [aws_security_group.controller_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              cd /home/ubuntu/mayfly-api
              npm install
              cd /home/ubuntu/controller-config/compose
              docker compose pull
              docker_pulls=$(docker ps -a | grep 'Up .* seconds' | wc -l)
              while [ $docker_pulls -gt 0 ]; do
                sleep 5
                docker_pulls=$(docker ps -a | grep 'Up .* seconds' | wc -l) 
              done
              sudo systemctl stop systemd-resolved
              docker compose up -d
              cd /home/ubuntu/mayfly-api
              node api.js
              EOF
  tags = {
    Name = "Controller"
  }
}

data "terraform_remote_state" "elasticIP" {
  backend = "local"

  config = {
    path = "../elasticIP/terraform.tfstate"
  }
}

resource "aws_eip_association" "controller" {
  allocation_id = data.terraform_remote_state.elasticIP.outputs.eip_allocation_id
  instance_id   = aws_instance.controller.id
}

resource "aws_launch_configuration" "drone_conf" {
  name            = local.drone_conf
  image_id        = split(":", local.drone_ami)[1]
  instance_type   = local.instance_type
  security_groups = [aws_security_group.drone_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              cd /home/ubuntu/drone-config/compose
              docker compose pull
              docker_pulls=$(docker ps -a | grep 'Up .* seconds' | wc -l)
              while [ $docker_pulls -gt 0 ]; do
                sleep 5
                docker_pulls=$(docker ps -a | grep 'Up .* seconds' | wc -l) 
              done
              docker compose up -d
              EOF

  lifecycle {
    create_before_destroy = true
  }
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_autoscaling_group" "drone-asg" {
  launch_configuration = aws_launch_configuration.drone_conf.id
  min_size             = local.max_size
  max_size             = local.min_size
  desired_capacity     = local.desired_capacity
  vpc_zone_identifier  = data.aws_subnets.default.ids

  tag {
    key                 = "drone-asg"
    value               = "drone-asg-instance"
    propagate_at_launch = true
  }
}
