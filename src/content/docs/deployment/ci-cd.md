---
title: CI/CD Pipelines ⚙️
description: Automate Angular deployments with CI/CD - GitHub Actions, GitLab CI, Jenkins, and Azure DevOps
sidebar:
  order: 3
---

Automate your Angular application deployments with CI/CD pipelines. Learn to set up continuous integration and deployment across popular platforms for faster, more reliable releases.

## 🎯 CI/CD Fundamentals

**Continuous Integration (CI):**
- Automated testing on every commit
- Code quality checks
- Build verification
- Dependency scanning

**Continuous Deployment (CD):**
- Automated deployments
- Environment management
- Rollback capabilities
- Release automation

**Benefits:**
- **⚡ Faster Releases** - Deploy multiple times per day
- **🛡️ Quality Assurance** - Automated testing
- **🔄 Consistency** - Repeatable deployments
- **📊 Visibility** - Track all changes
- **🚀 Confidence** - Automated validation

## 🚀 GitHub Actions

### Complete CI/CD Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '20'
  CACHE_KEY: node-modules-${{ hashFiles('**/package-lock.json') }}

jobs:
  # Job 1: Install and Cache Dependencies
  install:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Cache node modules
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ env.CACHE_KEY }}

  # Job 2: Lint
  lint:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Restore cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ env.CACHE_KEY }}

      - name: Run linter
        run: npm run lint

  # Job 3: Test
  test:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Restore cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ env.CACHE_KEY }}

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # Job 4: Build
  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Restore cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ env.CACHE_KEY }}

      - name: Build application
        run: npm run build -- --configuration production

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  # Job 5: Deploy to Staging
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist/your-app/browser'
          production-deploy: false
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_STAGING_SITE_ID }}

  # Job 6: Deploy to Production
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist/your-app/browser'
          production-deploy: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ github.run_number }}
          release_name: Release v${{ github.run_number }}
          draft: false
          prerelease: false
```

## 🎨 GitLab CI/CD

### Complete Pipeline Configuration

```yaml
# .gitlab-ci.yml
image: node:20-alpine

stages:
  - install
  - lint
  - test
  - build
  - deploy

variables:
  npm_config_cache: "$CI_PROJECT_DIR/.npm"
  CYPRESS_CACHE_FOLDER: "$CI_PROJECT_DIR/cache/Cypress"

cache:
  key:
    files:
      - package-lock.json
  paths:
    - .npm
    - node_modules
    - cache/Cypress

# Install Dependencies
install:
  stage: install
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules
    expire_in: 1 hour

# Lint Code
lint:
  stage: lint
  dependencies:
    - install
  script:
    - npm run lint

# Unit Tests
test:unit:
  stage: test
  dependencies:
    - install
  script:
    - npm run test:ci
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      junit: coverage/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# E2E Tests
test:e2e:
  stage: test
  dependencies:
    - install
  script:
    - npm run e2e:ci
  artifacts:
    when: on_failure
    paths:
      - cypress/screenshots
      - cypress/videos
    expire_in: 1 week

# Build Application
build:
  stage: build
  dependencies:
    - install
  script:
    - npm run build -- --configuration production
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

# Deploy to Staging
deploy:staging:
  stage: deploy
  dependencies:
    - build
  environment:
    name: staging
    url: https://staging.example.com
  script:
    - npm install -g netlify-cli
    - netlify deploy --dir=dist/your-app/browser --site=$NETLIFY_STAGING_SITE_ID --auth=$NETLIFY_AUTH_TOKEN
  only:
    - develop

# Deploy to Production
deploy:production:
  stage: deploy
  dependencies:
    - build
  environment:
    name: production
    url: https://example.com
  script:
    - npm install -g netlify-cli
    - netlify deploy --prod --dir=dist/your-app/browser --site=$NETLIFY_SITE_ID --auth=$NETLIFY_AUTH_TOKEN
  only:
    - main
  when: manual
```

## 🎨 Real-World Examples

<blockquote>
<p><strong>Note:</strong> Always test CI/CD pipelines in a separate branch first.</p>
</blockquote>

### 1. **Docker Build and Push**

Let's create a pipeline that builds and pushes Docker images.

```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    branches: [ main ]
    tags:
      - 'v*'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NODE_VERSION=20
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}
```

### 2. **Multi-Environment Deployment**

Let's create a pipeline for deploying to multiple environments.

```yaml
# .github/workflows/multi-env.yml
name: Multi-Environment Deployment

on:
  push:
    branches: [ main, develop, staging ]

jobs:
  determine-environment:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.set-env.outputs.environment }}
      url: ${{ steps.set-env.outputs.url }}
    steps:
      - name: Set environment
        id: set-env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
            echo "url=https://example.com" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
            echo "url=https://staging.example.com" >> $GITHUB_OUTPUT
          else
            echo "environment=development" >> $GITHUB_OUTPUT
            echo "url=https://dev.example.com" >> $GITHUB_OUTPUT
          fi

  build-and-deploy:
    needs: determine-environment
    runs-on: ubuntu-latest
    environment:
      name: ${{ needs.determine-environment.outputs.environment }}
      url: ${{ needs.determine-environment.outputs.url }}
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build -- --configuration ${{ needs.determine-environment.outputs.environment }}

      - name: Deploy
        run: |
          echo "Deploying to ${{ needs.determine-environment.outputs.environment }}"
          # Add deployment commands here
```

### 3. **Automated Testing with Cypress**

Let's add E2E testing to the pipeline.

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [ main, develop ]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox, edge]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Cypress run
        uses: cypress-io/github-action@v6
        with:
          build: npm run build
          start: npm start
          wait-on: 'http://localhost:4200'
          wait-on-timeout: 120
          browser: ${{ matrix.browser }}
          record: true
          parallel: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots-${{ matrix.browser }}
          path: cypress/screenshots

      - name: Upload videos
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: cypress-videos-${{ matrix.browser }}
          path: cypress/videos
```

### 4. **Azure DevOps Pipeline**

Let's create an Azure DevOps pipeline.

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '20.x'
  buildConfiguration: 'production'

stages:
  - stage: Build
    displayName: 'Build Stage'
    jobs:
      - job: BuildJob
        displayName: 'Build Angular App'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'

          - task: Npm@1
            inputs:
              command: 'ci'
            displayName: 'npm ci'

          - task: Npm@1
            inputs:
              command: 'custom'
              customCommand: 'run lint'
            displayName: 'Run Linter'

          - task: Npm@1
            inputs:
              command: 'custom'
              customCommand: 'run test:ci'
            displayName: 'Run Tests'

          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/TESTS-*.xml'
            displayName: 'Publish Test Results'

          - task: PublishCodeCoverageResults@1
            inputs:
              codeCoverageTool: 'Cobertura'
              summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml'
            displayName: 'Publish Code Coverage'

          - task: Npm@1
            inputs:
              command: 'custom'
              customCommand: 'run build -- --configuration $(buildConfiguration)'
            displayName: 'Build Application'

          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: 'dist'
              ArtifactName: 'dist'
            displayName: 'Publish Artifacts'

  - stage: Deploy
    displayName: 'Deploy Stage'
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployProduction
        displayName: 'Deploy to Production'
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadBuildArtifacts@1
                  inputs:
                    buildType: 'current'
                    downloadType: 'single'
                    artifactName: 'dist'
                    downloadPath: '$(System.ArtifactsDirectory)'

                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-Subscription'
                    appType: 'webApp'
                    appName: 'your-app-name'
                    package: '$(System.ArtifactsDirectory)/dist'
```

### 5. **Jenkins Pipeline**

Let's create a Jenkinsfile for Jenkins CI/CD.

```groovy
// Jenkinsfile
pipeline {
    agent {
        docker {
            image 'node:20-alpine'
        }
    }

    environment {
        npm_config_cache = 'npm-cache'
        HOME = '.'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test:ci'
            }
            post {
                always {
                    junit 'coverage/junit.xml'
                    publishHTML([
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build -- --configuration production'
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    npm install -g netlify-cli
                    netlify deploy --dir=dist/your-app/browser --site=$NETLIFY_STAGING_SITE_ID --auth=$NETLIFY_AUTH_TOKEN
                '''
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                sh '''
                    npm install -g netlify-cli
                    netlify deploy --prod --dir=dist/your-app/browser --site=$NETLIFY_SITE_ID --auth=$NETLIFY_AUTH_TOKEN
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
```

## ✅ Best Practices

### 1. **Use Caching**

```yaml
# ✅ Good - Cache dependencies
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ hashFiles('package-lock.json') }}

# ❌ Avoid - No caching
- run: npm install
```

### 2. **Parallel Jobs**

```yaml
# ✅ Good - Run tests in parallel
jobs:
  test:
    strategy:
      matrix:
        node: [18, 20]
        os: [ubuntu-latest, windows-latest]
```

### 3. **Environment Secrets**

```yaml
# ✅ Good - Use secrets
env:
  API_KEY: ${{ secrets.API_KEY }}

# ❌ Avoid - Hardcoded values
env:
  API_KEY: 'my-api-key'
```

### 4. **Fail Fast**

```yaml
# ✅ Good - Fail fast on errors
- name: Run tests
  run: npm test
  continue-on-error: false
```

### 5. **Artifact Management**

```yaml
# ✅ Good - Upload artifacts
- uses: actions/upload-artifact@v3
  with:
    name: build
    path: dist/
    retention-days: 7
```

## 🎯 CI/CD Checklist

- [ ] Automated testing on every commit
- [ ] Code quality checks (linting)
- [ ] Build verification
- [ ] Automated deployments
- [ ] Environment-specific configurations
- [ ] Secrets management
- [ ] Rollback strategy
- [ ] Monitoring and notifications
- [ ] Documentation

## 🎓 Learning Checklist

- [ ] Understand CI/CD concepts
- [ ] Set up GitHub Actions
- [ ] Configure GitLab CI/CD
- [ ] Create Azure DevOps pipelines
- [ ] Write Jenkinsfiles
- [ ] Implement automated testing
- [ ] Manage secrets securely
- [ ] Deploy to multiple environments

## 🚀 Next Steps

1. **[Deployment Strategies](/deployment/strategies/)** - Choose deployment approach
2. **[Docker & Containers](/deployment/docker/)** - Containerize applications
3. **[Performance Optimization](/advanced/performance/)** - Optimize before deploying

---

**Pro Tip**: Start simple and iterate! Begin with basic CI (build + test), then add CD (deployment). Use branch protection rules and require CI checks before merging. Monitor pipeline performance and optimize caching! ⚙️
