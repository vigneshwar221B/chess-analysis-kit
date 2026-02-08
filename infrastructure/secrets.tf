# ── SSM Parameter Store (non-sensitive config) ────────

resource "aws_ssm_parameter" "backend_url" {
  name  = "/chess-app/backend-url"
  type  = "String"
  value = module.alb.dns_name
  tags  = local.tags
}

resource "aws_ssm_parameter" "redis_endpoint" {
  name  = "/chess-app/redis-endpoint"
  type  = "String"
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
  tags  = local.tags
}

resource "aws_ssm_parameter" "cloudfront_url" {
  name  = "/chess-app/frontend-url"
  type  = "String"
  value = aws_cloudfront_distribution.frontend.domain_name
  tags  = local.tags
}

resource "aws_ssm_parameter" "ecr_backend_repo" {
  name  = "/chess-app/ecr-backend-repo"
  type  = "String"
  value = aws_ecr_repository.backend.repository_url
  tags  = local.tags
}

resource "aws_ssm_parameter" "ecr_frontend_repo" {
  name  = "/chess-app/ecr-frontend-repo"
  type  = "String"
  value = aws_ecr_repository.frontend.repository_url
  tags  = local.tags
}

resource "aws_ssm_parameter" "backend_target_group_arn" {
  name  = "/chess-app/backend-target-group-arn"
  type  = "String"
  value = module.alb.target_groups["backend"].arn
  tags  = local.tags
}

resource "aws_ssm_parameter" "frontend_bucket" {
  name  = "/chess-app/frontend-bucket"
  type  = "String"
  value = module.frontend_bucket.s3_bucket_id
  tags  = local.tags
}

resource "aws_ssm_parameter" "cloudfront_distribution_id" {
  name  = "/chess-app/cloudfront-distribution-id"
  type  = "String"
  value = aws_cloudfront_distribution.frontend.id
  tags  = local.tags
}

# ── Secrets Manager (sensitive values) ────────────────

resource "aws_secretsmanager_secret" "redis_auth_token" {
  name                    = "/chess-app/redis-auth-token"
  description             = "Redis authentication token"
  recovery_window_in_days = 7
  tags                    = local.tags
}

resource "aws_secretsmanager_secret_version" "redis_auth_token" {
  secret_id     = aws_secretsmanager_secret.redis_auth_token.id
  secret_string = random_password.redis.result
}

# ── IAM policy for backend pods to read secrets ───────

resource "aws_iam_policy" "backend_pods_secrets" {
  name        = "${var.project_name}-backend-pods-secrets"
  description = "Allow backend pods to read SSM and Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/chess-app/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.redis_auth_token.arn
      }
    ]
  })

  tags = local.tags
}
