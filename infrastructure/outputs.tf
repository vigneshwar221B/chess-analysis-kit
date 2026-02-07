# ── VPC ───────────────────────────────────────────────

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

# ── EKS ──────────────────────────────────────────────

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_arn" {
  description = "EKS cluster ARN"
  value       = module.eks.cluster_arn
}

output "eks_update_kubeconfig" {
  description = "Command to update kubeconfig"
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
}

# ── ECR ──────────────────────────────────────────────

output "ecr_backend_repo_url" {
  description = "Backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repo_url" {
  description = "Frontend ECR repository URL"
  value       = aws_ecr_repository.frontend.repository_url
}

# ── Frontend ─────────────────────────────────────────

output "frontend_url" {
  description = "CloudFront frontend URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "frontend_bucket_name" {
  description = "S3 bucket name for frontend assets"
  value       = module.frontend_bucket.s3_bucket_id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.frontend.id
}

# ── Backend ──────────────────────────────────────────

output "backend_url" {
  description = "Backend ALB URL"
  value       = "http://${module.alb.dns_name}"
}

# ── Redis ────────────────────────────────────────────

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

# ── IRSA Role ARNs ───────────────────────────────────

output "alb_controller_role_arn" {
  description = "IAM role ARN for AWS Load Balancer Controller"
  value       = module.alb_controller_irsa.iam_role_arn
}

output "fluent_bit_role_arn" {
  description = "IAM role ARN for Fluent Bit"
  value       = module.fluent_bit_irsa.iam_role_arn
}

output "backend_pods_role_arn" {
  description = "IAM role ARN for backend pods"
  value       = module.backend_pods_irsa.iam_role_arn
}

# ── GitHub Actions ───────────────────────────────────

output "github_actions_cicd_role_arn" {
  description = "IAM role ARN for GitHub Actions CI/CD (store as GitHub secret AWS_ROLE_ARN)"
  value       = aws_iam_role.github_actions_cicd.arn
}

output "github_actions_terraform_role_arn" {
  description = "IAM role ARN for GitHub Actions Terraform (store as GitHub secret TF_AWS_ROLE_ARN)"
  value       = aws_iam_role.github_actions_terraform.arn
}
