# Oracle Cloud — Staging/Demo Environment Plan

**Status:** Pending PAYG upgrade
**Created:** 2026-04-11

## Prerequisites

- [ ] Upgrade Oracle account from Free Tier to PAYG (UI only, ~2 min)
- [ ] 80 EUR authorization hold will be returned in 3-5 business days
- [ ] Existing `~/.oci/config` and Python SDK already configured

## Infrastructure (Always Free Limits)

| Resource         | Free Tier Limit      | Our Usage     |
| ---------------- | -------------------- | ------------- |
| CPU              | 4 OCPU (ARM A1 Flex) | ~2.6 with K3s |
| RAM              | 24 GB                | ~5 GB         |
| Boot Volume      | 200 GB               | 100 GB        |
| Outbound Network | 10 TB/month          | Minimal       |

## Phase 1: Provisioning (Script)

Create Python/Bash script to provision via OCI SDK:

1. **VCN** — 10.0.0.0/16 CIDR
2. **Public Subnet** — 10.0.1.0/24
3. **Internet Gateway** + route table
4. **Security List** — ingress ports: 22 (SSH), 80, 443, 8001-8006
5. **A1 Flex Instance** — 4 OCPU, 24 GB RAM, 100 GB boot volume, Ubuntu 22.04
6. Output: SSH connection string

## Phase 2: K3s + Docker Setup

1. Install K3s (lightweight K8s)
2. Install Helm
3. Configure kubectl
4. Set up container registry (GitHub Container Registry or OCI Registry)

## Phase 3: Deploy Services

1. Dockerize all services (Dockerfiles already exist)
2. Create Helm charts / K8s manifests
3. Deploy infra: PostgreSQL, Redis, Kafka, Keycloak, MinIO
4. Deploy apps: api-gateway, user-service, interview-service, ai-analysis-service, billing-service, notification-service, web
5. Nginx Ingress for routing
6. TLS via Let's Encrypt (cert-manager)

## Phase 4: CI/CD

1. GitHub Actions: build → push images → deploy to K3s
2. Staging branch auto-deploy
3. Health check monitoring

## Notes

- All within Always Free tier — no charges
- K3s overhead: ~0.3 CPU, 512 MB RAM
- If Frankfurt region full — try Amsterdam or Madrid
- Study Go + K8s in parallel with deployment
