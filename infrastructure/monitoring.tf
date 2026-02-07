# ── CloudWatch Log Groups ─────────────────────────────

resource "aws_cloudwatch_log_group" "containers" {
  name              = "/chess-app/containers"
  retention_in_days = 30
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "application" {
  name              = "/chess-app/application"
  retention_in_days = 90
  tags              = local.tags
}

# ── IAM policy for Fluent Bit → CloudWatch ────────────

resource "aws_iam_policy" "fluent_bit_cloudwatch" {
  name        = "${var.project_name}-fluent-bit-cloudwatch"
  description = "Allow Fluent Bit to write logs to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/chess-app/*",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/chess-app/*:*"
        ]
      }
    ]
  })

  tags = local.tags
}
