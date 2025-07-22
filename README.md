# CinemaWeb (em construção...)

Projeto em desenvolvimento utilizando Nest.js. Tal projeto está sendo desenvolvido ao passo que aprendo novas tecnologias, abordagens, etc. no que tange arquitetura e design de software, deste modo, tenho especial foco em **qualidade de código**, **testes automátizados** e aprendendo atualmente **boas práticas de DevOps**.

## Quick start

### 1. Clone e Execute
```bash
git clone https://github.com/cleiton-silva-viana/cinema.git
cd cinema/backend
npm install
npm run start:dev
```

### 2. Testes
```bash
npm run test # Testes unitários
npm run test:e2e # Testes de integração e E2E
npm run test:cov # Cobertura de código
```

### 3. Docker
```bash
cd backend
docker build -t cinema-backend .
docker run -p 3000:3000 cinema-backend
```

### 4. Docker Compose (Em desenvolvimento...)
```bash
docker-compose up -d
```    

## CI/CD Pipeline

O projeto inclui um ***gitHub Actions** relativamente flexível:

### **Sempre Executa** (sem configuração prévia necessária)
- **Verificação de qualidade de código** (ESLint, Prettier)
- **Testes unitários e de integração** com relatório de cobertura
- **Build e teste do Docker**
- **Relatório de cobertura** (local)

### **Funcionalidades Opcionais** (necessário que seja manualmente configurada)
- **SonarQube** - Análise estática de código
- **Codecov** - Upload de cobertura para nuvem
- **Segurança Docker** - Trivy + Hadolint
- **Cache** - Acelera builds (recomendado caso deseje economizar recursos do github actions)

## Configuração da Pipeline

### **Configuração Básica** (Funciona imediatamente)
Após clonar o repositório, a pipeline já funciona! Não é necessária nenhuma configuração adicional.

### **Configuração Avançada** (Opcional)

Para habilitar funcionaldiades avançadas, configure estes **Secrets/Variables** no seu GitHub:

#### 1. **Cache**
**Settings** > **Secrets and variables** > **Actions** > **Variables**
ENABLE_CACHE = true

#### 2. **Sonarqube**
**Settings** > **Secrets and variables** > **Actions** > **Secrets**
SONAR_TOKEN = seu_token_sonarqube

#### 3. **Codecov**
**Settings** > **Secrets and variables** > **Actions** > **Secrets**
CODECOV_TOKEN = seu_token_codecov

#### 4. **Docker Security**
**Settings** → **Secrets and variables** → **Actions** → **Secrets**
DOCKER_USERNAME = seu_usuario_docker
DOCKER_PASSWORD = sua_senha_docker

## 📁 Estrutura do Projeto
cinema/
├── 📁 .github/workflows/        # CI/CD Pipeline
│   └── ci.yml                   # Workflow principal
├── 📁 frontend/                 # WebPages (...)
├── 📁 backend/                  # API NestJS
│   ├── 📁 src/                  # Código fonte
│   ├── 📁 test/                 # Testes
│   ├── 📁 scripts/              # Scripts de geração
│   ├── Dockerfile               # Container Docker
│   └── package.json             # Dependências
├── docker-compose.yml           # Orquestração local
└── README.md                    # Este arquivo