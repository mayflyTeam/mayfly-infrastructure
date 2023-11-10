terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_eip" "my_eip" {
  vpc = false
}

output "eip_address" {
  value = aws_eip.my_eip.public_ip
}