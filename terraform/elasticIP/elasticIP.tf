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
  config_data = jsondecode(file("${path.module}/../../config.json"))
  region = local.config_data.AWS_REGION
}

provider "aws" {
  region = local.region
}

resource "aws_eip" "my_eip" {
  vpc = false
}

output "eip_address" {
  value = aws_eip.my_eip.public_ip
}

output "eip_allocation_id" {
  value = aws_eip.my_eip.allocation_id
}