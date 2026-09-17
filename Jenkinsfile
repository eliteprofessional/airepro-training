/*
 * Airepro Training — Jenkins Pipeline (split Docker FE/BE)
 *
 * Domains / ports (override via Jenkins job env):
 * - Frontend SPA: https://training.airepro.in  → 127.0.0.1:410
 * - Backend API:  https://training-s.airepro.in → 127.0.0.1:1411
 *
 * Prerequisites:
 * - Docker on the agent. If jenkins is not in the `docker` group, set DOCKER='sudo docker'.
 * - Admin secrets via Jenkins env or ~/.secrets/airepro-training.env:
 *     ADMIN_PASSWORD, ADMIN_TOKEN_SECRET
 * - Reverse proxy / Cloudflare Tunnel should target loopback 410 and 1411.
 */

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        DEPLOY_BRANCH       = "${env.DEPLOY_BRANCH ?: 'main'}"
        FRONTEND_IMAGE      = "${env.FRONTEND_IMAGE ?: 'airepro-training-frontend'}"
        BACKEND_IMAGE       = "${env.BACKEND_IMAGE ?: 'airepro-training-backend'}"
        FRONTEND_CONTAINER  = "${env.FRONTEND_CONTAINER ?: 'airepro-training-frontend'}"
        BACKEND_CONTAINER   = "${env.BACKEND_CONTAINER ?: 'airepro-training-backend'}"
        FRONTEND_PORT       = "${env.FRONTEND_PORT ?: '410'}"
        BACKEND_PORT        = "${env.BACKEND_PORT ?: '1411'}"
        DOMAIN              = "${env.DOMAIN ?: 'training.airepro.in'}"
        BACKEND_DOMAIN      = "${env.BACKEND_DOMAIN ?: 'training-s.airepro.in'}"
        VITE_API_BASE_URL   = "${env.VITE_API_BASE_URL ?: 'https://training-s.airepro.in'}"
        CORS_ORIGIN         = "${env.CORS_ORIGIN ?: 'https://training.airepro.in'}"
        TRAINING_VOLUME     = "${env.TRAINING_VOLUME ?: 'airepro-training-content'}"
        DOCKER              = "${env.DOCKER ?: 'docker'}"
        JENKINS_NODE_COOKIE = 'dontKillMe'
        BUILD_ID            = 'dontKillMe'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${env.DEPLOY_BRANCH}"]],
                    extensions: [],
                    userRemoteConfigs: scm.userRemoteConfigs,
                ])
                sh 'git log -1 --oneline'
            }
        }

        stage('Build backend image') {
            steps {
                sh '''
                set -e
                ${DOCKER} build \
                  -f Dockerfile.backend \
                  -t "${BACKEND_IMAGE}:${BUILD_NUMBER}" \
                  -t "${BACKEND_IMAGE}:latest" \
                  .
                '''
            }
        }

        stage('Build frontend image') {
            steps {
                sh '''
                set -e
                ${DOCKER} build \
                  -f Dockerfile.frontend \
                  --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL}" \
                  -t "${FRONTEND_IMAGE}:${BUILD_NUMBER}" \
                  -t "${FRONTEND_IMAGE}:latest" \
                  .
                '''
            }
        }

        stage('Deploy backend') {
            steps {
                sh '''
                set -e
                SECRETS_FILE="${HOME}/.secrets/airepro-training.env"
                ${DOCKER} volume create "${TRAINING_VOLUME}" >/dev/null 2>&1 || true
                ${DOCKER} rm -f "${BACKEND_CONTAINER}" >/dev/null 2>&1 || true

                if [ -f "${SECRETS_FILE}" ]; then
                  echo "Using secrets file: ${SECRETS_FILE}"
                  ${DOCKER} run -d \
                    --name "${BACKEND_CONTAINER}" \
                    --restart unless-stopped \
                    -p "127.0.0.1:${BACKEND_PORT}:8787" \
                    -e NODE_ENV=production \
                    -e PORT=8787 \
                    -e HOST=0.0.0.0 \
                    -e SERVE_FRONTEND=false \
                    -e CORS_ORIGIN="${CORS_ORIGIN}" \
                    --env-file "${SECRETS_FILE}" \
                    -v "${TRAINING_VOLUME}:/app/public/training" \
                    "${BACKEND_IMAGE}:${BUILD_NUMBER}"
                else
                  if [ -z "${ADMIN_PASSWORD}" ] || [ -z "${ADMIN_TOKEN_SECRET}" ]; then
                    echo "ERROR: Set ADMIN_PASSWORD and ADMIN_TOKEN_SECRET in the Jenkins job,"
                    echo "or create ${SECRETS_FILE}"
                    exit 1
                  fi
                  ${DOCKER} run -d \
                    --name "${BACKEND_CONTAINER}" \
                    --restart unless-stopped \
                    -p "127.0.0.1:${BACKEND_PORT}:8787" \
                    -e NODE_ENV=production \
                    -e PORT=8787 \
                    -e HOST=0.0.0.0 \
                    -e SERVE_FRONTEND=false \
                    -e CORS_ORIGIN="${CORS_ORIGIN}" \
                    -e "ADMIN_PASSWORD=${ADMIN_PASSWORD}" \
                    -e "ADMIN_TOKEN_SECRET=${ADMIN_TOKEN_SECRET}" \
                    -v "${TRAINING_VOLUME}:/app/public/training" \
                    "${BACKEND_IMAGE}:${BUILD_NUMBER}"
                fi
                '''
            }
        }

        stage('Deploy frontend') {
            steps {
                sh '''
                set -e
                ${DOCKER} rm -f "${FRONTEND_CONTAINER}" >/dev/null 2>&1 || true
                ${DOCKER} run -d \
                  --name "${FRONTEND_CONTAINER}" \
                  --restart unless-stopped \
                  -p "127.0.0.1:${FRONTEND_PORT}:80" \
                  "${FRONTEND_IMAGE}:${BUILD_NUMBER}"
                '''
            }
        }

        stage('Smoke test') {
            steps {
                sh '''
                set -e

                echo "Waiting for backend on :${BACKEND_PORT}..."
                for i in $(seq 1 20); do
                  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/health" >/dev/null; then
                    break
                  fi
                  [ "$i" = "20" ] && { ${DOCKER} logs --tail 80 "${BACKEND_CONTAINER}"; exit 1; }
                  sleep 2
                done
                curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/health"
                echo ""
                curl -fsS -o /dev/null -w "backend Host %{http_code}\\n" \
                  -H "Host: ${BACKEND_DOMAIN}" "http://127.0.0.1:${BACKEND_PORT}/api/health"

                echo "Waiting for frontend on :${FRONTEND_PORT}..."
                for i in $(seq 1 15); do
                  if curl -fsS -o /dev/null "http://127.0.0.1:${FRONTEND_PORT}/"; then
                    break
                  fi
                  [ "$i" = "15" ] && { ${DOCKER} logs --tail 80 "${FRONTEND_CONTAINER}"; exit 1; }
                  sleep 2
                done
                curl -fsS -o /dev/null -w "frontend Host %{http_code}\\n" \
                  -H "Host: ${DOMAIN}" "http://127.0.0.1:${FRONTEND_PORT}/"
                code_training=$(curl -sS -o /dev/null -w "%{http_code}" \
                  -H "Host: ${DOMAIN}" "http://127.0.0.1:${FRONTEND_PORT}/training")
                echo "frontend /training ${code_training}"
                [ "${code_training}" = "200" ] || {
                  echo "ERROR: expected /training to return 200, got ${code_training}"
                  ${DOCKER} logs --tail 40 "${FRONTEND_CONTAINER}" || true
                  exit 1
                }
                curl -fsS -o /dev/null -w "backend resources %{http_code}\\n" \
                  -H "Host: ${BACKEND_DOMAIN}" "http://127.0.0.1:${BACKEND_PORT}/api/training/resources"
                '''
            }
        }
    }

    post {
        success {
            sh '''
            ${DOCKER} images "${BACKEND_IMAGE}" --format '{{.Tag}}' \
              | grep -E '^[0-9]+$' | sort -rn | tail -n +4 \
              | xargs -r -I{} ${DOCKER} rmi "${BACKEND_IMAGE}:{}" || true
            ${DOCKER} images "${FRONTEND_IMAGE}" --format '{{.Tag}}' \
              | grep -E '^[0-9]+$' | sort -rn | tail -n +4 \
              | xargs -r -I{} ${DOCKER} rmi "${FRONTEND_IMAGE}:{}" || true
            '''
        }
    }
}
