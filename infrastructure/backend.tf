terraform {
  backend "s3" {
    bucket         = "chess-app-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "chess-app-terraform-locks"
    encrypt        = true
  }
}
