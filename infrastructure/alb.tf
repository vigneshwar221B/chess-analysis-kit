# ── Security group for ALB ────────────────────────────

module "alb_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-alb"
  description = "Security group for backend ALB"
  vpc_id      = module.vpc.vpc_id

  ingress_with_cidr_blocks = [
    {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = "0.0.0.0/0"
      description = "HTTP"
    },
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = "0.0.0.0/0"
      description = "HTTPS"
    }
  ]

  egress_with_cidr_blocks = [
    {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = module.vpc.vpc_cidr_block
      description = "All traffic to VPC"
    }
  ]

  tags = local.tags
}

# ── Application Load Balancer ─────────────────────────

module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name               = "${var.project_name}-backend"
  load_balancer_type = "application"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets
  security_groups    = [module.alb_sg.security_group_id]

  # 5 minute idle timeout for WebSocket connections
  idle_timeout = 300

  # Target group for backend pods
  target_groups = {
    backend = {
      name             = "${var.project_name}-backend"
      protocol         = "HTTP"
      port             = 5001
      target_type      = "ip"
      create_attachment = false # EKS ALB controller manages pod registration

      health_check = {
        enabled             = true
        path                = "/health"
        port                = "traffic-port"
        protocol            = "HTTP"
        healthy_threshold   = 2
        unhealthy_threshold = 3
        timeout             = 5
        interval            = 30
        matcher             = "200"
      }

      # Sticky sessions for Socket.IO WebSocket connections
      stickiness = {
        enabled         = true
        type            = "lb_cookie"
        cookie_duration = 86400
      }

      deregistration_delay = 30
    }
  }

  # HTTP listener (+ redirect to HTTPS if cert provided)
  listeners = {
    http = {
      port     = 80
      protocol = "HTTP"

      forward = {
        target_group_key = "backend"
      }
    }
  }

  tags = local.tags
}
