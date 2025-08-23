## Alunos:

- Augusto Fuscaldi Cerezo
- Filipe Faria Melo

## Limites da arquitetura

**Banco de Dados:**
- Utiliza SQLite, que não é recomendado para ambientes de alta concorrência ou produção com muitos acessos simultâneos.

**Escalabilidade:**
- O servidor é monolítico e não possui balanceamento de carga, cache distribuído ou filas de processamento.

**Rate Limiting:**
- Implementado apenas em memória, não é distribuído entre múltiplas instâncias.

**Testes Automatizados:**
- Não há cobertura de testes automatizados (unitários ou de integração).

**Documentação:**
- Não há documentação automática (Swagger/OpenAPI), apenas este README.

**Logs:**
- Logs são feitos apenas no console, sem persistência.

**Segurança:**
- JWT é utilizado, mas não há proteção contra brute force, CSRF, CORS configurado, etc.
---

**Métricas de Performance Reais:**

- Latência:	6,283 ms
- Throughput:	300 RPS
- Memória:	2,1 MB

---
## Documentação da API

Autenticação - Registrar usuário

**POST** ```/api/auth/register```

**Payload:**

```js
{
  "email": "user@email.com",
  "username": "usuario",
  "password": "senha123",
  "firstName": "Nome",
  "lastName": "Sobrenome"
}
```

**Resposta:**

201 Created

```js
{
  "success": true,
  "message": "Usuário registrado com sucesso"
}
```

---

## Login

Realizar Login

**POST** ```/api/auth/login```

**Payload:**

```js
{
  "identifier": "user@email.com", // ou username
  "password": "senha123"
}
```
**Resposta:**
200 OK

```js

{
  "success": true,
  "token": "TOKEN JWT"
}

```

---

## Tasks

Criar Task

**POST** ```/api/tasks```

**Payload:**

```js
{
  "title": "Minha tarefa",
  "description": "Detalhes da tarefa",
  "priority": "low" // ou "medium", "high", "urgent"
}
```
**Resposta:**
200 OK

```js

{
  "success": true,
  "token": "TOKEN JWT"
}

```
Listar Tasks

*GET* ```/api/tasks?page=1&limit=3```

**Resposta:**

200 ok
```js
{
  "success": true,
  "data": [
    {
      "id": "9a230f50-8f46-4e79-9a63-00bb0a5fbb2f",
      "title": "test3",
      "description": "is a database",
      "completed": 0,
      "priority": "low",
      "userId": "049313bc-a59c-469b-b5b9-92774182b7bf",
      "createdAt": "2025-08-23 21:50:16"
    },
    {
      "id": "09efd30b-3d99-43bb-8984-a2e44ed3a44a",
      "title": "test2",
      "description": "is a database",
      "completed": 0,
      "priority": "low",
      "userId": "049313bc-a59c-469b-b5b9-92774182b7bf",
      "createdAt": "2025-08-23 21:50:05"
    },
    {
      "id": "c064da07-eab8-4bfe-8af4-47e3016de66c",
      "title": "test",
      "description": "is a database",
      "completed": 0,
      "priority": "low",
      "userId": "049313bc-a59c-469b-b5b9-92774182b7bf",
      "createdAt": "2025-08-23 20:53:00"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 3,
    "total": 10
  }
}
```

Buscar tasks por descrição

**GET** ```/api/tasks/by-description?description=base```

**Resposta:**
200 OK

```js
{
  "success": true,
  "data": [
    {
      "id": "9a230f50-8f46-4e79-9a63-00bb0a5fbb2f",
      "title": "test3",
      "description": "is a database",
      "completed": 0,
      "priority": "low",
      "userId": "049313bc-a59c-469b-b5b9-92774182b7bf",
      "createdAt": "2025-08-23 21:50:16"
    },
    {
      "id": "09efd30b-3d99-43bb-8984-a2e44ed3a44a",
      "title": "test2",
      "description": "is a database",
      "completed": 0,
      "priority": "low",
      "userId": "049313bc-a59c-469b-b5b9-92774182b7bf",
      "createdAt": "2025-08-23 21:50:05"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 3
  }
}
```

Buscar tasks por data

**GET** ```api/tasks/by-date?date=2025```

**Resposta:**
200 OK

```js
{
  "success": true,
  "data": [
    {
      "id": "9a230f50-8f46-4e79-9a63-00bb0a5fbb2f",
      "title": "test3",
      "description": "is a database",
      "completed": 0,
      "priority": "low",
      "userId": "049313bc-a59c-469b-b5b9-92774182b7bf",
      "createdAt": "2025-08-23 21:50:16"
    },
    {
      "id": "09efd30b-3d99-43bb-8984-a2e44ed3a44a",
      "title": "test2",
      "description": "is a database",
      "completed": 0,
      "priority": "low",
      "userId": "049313bc-a59c-469b-b5b9-92774182b7bf",
      "createdAt": "2025-08-23 21:50:05"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 3
  }
}
```

Buscar tarefas por prioridade

**GET** ```api/tasks/by-priority?priority=low```

**Resposta:**
200 OK

```js
{
  "success": true,
  "data": [
    {
      "id": "9a230f50-8f46-4e79-9a63-00bb0a5fbb2f",
      "title": "test3",
      "description": "is a database",
      "completed": 0,
      "priority": "low",
      "userId": "049313bc-a59c-469b-b5b9-92774182b7bf",
      "createdAt": "2025-08-23 21:50:16"
    },
    {
      "id": "09efd30b-3d99-43bb-8984-a2e44ed3a44a",
      "title": "test2",
      "description": "is a database",
      "completed": 0,
      "priority": "low",
      "userId": "049313bc-a59c-469b-b5b9-92774182b7bf",
      "createdAt": "2025-08-23 21:50:05"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 3
  }
}
```

Buscar tarefa por ID

**GET** ```api/tasks/c064da07-eab8-4bfe-8af4-47e3016de66c```

**Resposta:**
200 OK

```js
{
  "success": true,
  "data": {
    "id": "c064da07-eab8-4bfe-8af4-47e3016de66c",
    "title": "test",
    "description": "is a database",
    "completed": 0,
    "priority": "low",
    "userId": "049313bc-a59c-469b-b5b9-92774182b7bf",
    "createdAt": "2025-08-23 20:53:00"
  }
}
```
---

## Exceções:

400 Bad request

```js
  {"success":false,"message":"Bad request"}
```

401 Falha de autentificação

```js
  {"success":false,"message":"Falha de autentificação"}
```

404 Endpoint não encontrado

```js
  {"success":false,"message":"Endpoint não encontrado"}
```

429 Limite de requisições excedido

```js
  {"success":false,"message":"Limite de requisições excedido"}
```

500 Erro interno do Servidor

```js
  {"success":false,"message":"Erro interno do Servidor"}
```
---







