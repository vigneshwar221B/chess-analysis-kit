module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = local.cluster_name
  cluster_version = var.eks_cluster_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  # Allow both GitHub Actions roles to access the cluster
  enable_cluster_creator_admin_permissions = true

  access_entries = {
    github_terraform = {
      principal_arn = aws_iam_role.github_actions_terraform.arn
      policy_associations = {
        admin = {
          policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = { type = "cluster" }
        }
      }
    }
    github_cicd = {
      principal_arn = aws_iam_role.github_actions_cicd.arn
      policy_associations = {
        admin = {
          policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = { type = "cluster" }
        }
      }
    }
  }

  # Control plane logging
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  # Cluster addons
  cluster_addons = {
    coredns    = { most_recent = true }
    kube-proxy = { most_recent = true }
    vpc-cni    = { most_recent = true }
  }

  # Managed node group
  eks_managed_node_groups = {
    workers = {
      name           = "workers"
      instance_types = var.eks_node_instance_types
      min_size       = var.eks_node_min_size
      max_size       = var.eks_node_max_size
      desired_size   = var.eks_node_desired_size
      disk_size      = 50

      labels = {
        role        = "worker"
        environment = var.environment
      }

      iam_role_additional_policies = {
        ssm = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
      }
    }
  }

  # Allow nodes to pull from ECR
  node_security_group_additional_rules = {
    ingress_from_alb = {
      description              = "Allow traffic from ALB"
      protocol                 = "tcp"
      from_port                = 5001
      to_port                  = 5001
      type                     = "ingress"
      source_security_group_id = module.alb.security_group_id
    }
  }

  tags = local.tags
}

# ── IRSA: AWS Load Balancer Controller ───────────────

module "alb_controller_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name                              = "${var.project_name}-alb-controller"
  attach_load_balancer_controller_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }

  tags = local.tags
}

# ── IRSA: Fluent Bit → CloudWatch ────────────────────

module "fluent_bit_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "${var.project_name}-fluent-bit"

  role_policy_arns = {
    cloudwatch = aws_iam_policy.fluent_bit_cloudwatch.arn
  }

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["logging:fluent-bit"]
    }
  }

  tags = local.tags
}

# ── IRSA: Backend pods → SSM / Secrets Manager ──────

module "backend_pods_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "${var.project_name}-backend-pods"

  role_policy_arns = {
    secrets = aws_iam_policy.backend_pods_secrets.arn
  }

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["default:chess-backend"]
    }
  }

  tags = local.tags
}
