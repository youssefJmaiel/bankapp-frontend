# 🏦 BankApp Frontend

![Frontend](https://img.shields.io/badge/Frontend-Web%20Application-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Vite](https://img.shields.io/badge/Vite-Fast%20Development-646CFF)
![Keycloak](https://img.shields.io/badge/Authentication-Keycloak-red)
![JWT](https://img.shields.io/badge/Security-JWT-orange)
![Cloudflare Pages](https://img.shields.io/badge/Deployment-Cloudflare%20Pages-F38020)

> **Modern web interface for BankApp Microservices, connected to a secured Java/Spring Boot backend through an API Gateway.**

BankApp Frontend is the web client of the **BankApp Microservices** platform.

It provides a user interface for interacting with the backend microservices through a centralized API Gateway, with authentication handled by **Keycloak** and access secured using **OAuth2 / JWT**.

The frontend is designed to work with the distributed backend architecture and is deployed using **Cloudflare Pages**.

---

# ✨ Main Features

* 🔐 Keycloak authentication
* 🎟️ JWT-based authentication flow
* 🌐 Communication with the Spring Boot API Gateway
* 👥 Employee management interface
* 🏢 Department management
* 📋 Mission management
* 💬 Message management
* 🤝 Partner management
* 🛡️ Authenticated API requests using Bearer tokens
* ⚙️ Environment-based API configuration
* 📱 Responsive web interface
* ☁️ Cloudflare Pages deployment

---

# 🏗️ Application Architecture

```text
┌──────────────────────────────┐
│       BankApp Frontend       │
│                              │
│       React + Vite           │
└──────────────┬───────────────┘
               │
               │ Authentication
               ▼
┌──────────────────────────────┐
│           Keycloak           │
│       OAuth2 / JWT           │
└──────────────────────────────┘
               │
               │ JWT
               ▼
┌──────────────────────────────┐
│        Spring Gateway        │
│           :8082              │
└──────────────┬───────────────┘
               │
       ┌───────┼────────┬────────────┐
       ▼       ▼        ▼            ▼
      HR    Mission   Messages     Partners
     :8083    :8084     :8085        :8085
```

The frontend does not communicate directly with every backend service.

Instead, requests are centralized through the **API Gateway**.

---

# 🔐 Authentication

Authentication is handled by **Keycloak**.

The frontend uses the configured Keycloak realm and client:

```text
Realm:
spring-app

Client:
spring-boot-client
```

After successful authentication, the frontend receives an access token.

The token is then included in API requests:

```http
Authorization: Bearer <JWT_TOKEN>
```

This allows the backend to authenticate the user and apply the appropriate security rules.

---

# 🌐 Backend Integration

The frontend communicates with the backend through the Gateway.

```text
Frontend
   │
   │ HTTP Request
   │ Authorization: Bearer JWT
   ▼
API Gateway :8082
   │
   ├── /api/employees/**
   │        ↓
   │    HR Service
   │
   ├── /api/missions/**
   │        ↓
   │    Mission Service
   │
   ├── /api/messages/**
   │        ↓
   │    Message Router
   │
   └── /api/partners/**
            ↓
       Message Router
```

This architecture keeps the frontend independent from the internal service topology.

---

# ⚙️ Environment Configuration

The frontend uses Vite environment variables to configure the backend and Keycloak URLs.

Example:

```env
VITE_API_URL=http://localhost:8082
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=spring-app
VITE_KEYCLOAK_CLIENT_ID=spring-boot-client
```

For deployment, these values can be changed without modifying the application source code.

> **Important:** environment files containing local or private configuration should not be committed to Git.

---

# ☁️ Deployment

The frontend is deployed using **Cloudflare Pages**.

The deployment architecture is:

```text
                 Cloudflare Pages
                       │
                       ▼
              ┌─────────────────┐
              │ BankApp Frontend│
              └────────┬────────┘
                       │
                       │ HTTPS
                       ▼
                API Gateway
                       │
                       ▼
              Spring Boot Services
```

The deployed frontend communicates with the backend Gateway through its configured API URL.

---

# 🔗 CORS Configuration

Because the frontend and backend can run on different origins, the backend Gateway includes CORS configuration.

The allowed frontend origins include local development URLs and the deployed Cloudflare Pages application.

This allows authenticated browser requests to reach the API Gateway while preserving the `Authorization` header.

---

# 🛠️ Technology Stack

### Frontend

* React
* Vite
* JavaScript
* HTML5
* CSS3

### Authentication

* Keycloak
* OAuth2
* JWT
* Bearer Authentication

### Backend Integration

* REST APIs
* Spring Cloud Gateway
* Spring Boot Microservices
* JSON

### Deployment

* Cloudflare Pages

---

# 📁 Project Structure

```text
bankapp-frontend/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── ...
│
├── .env
├── package.json
├── vite.config.*
└── README.md
```

> The exact structure may evolve as the frontend continues to be developed.

---

# 🚀 Running Locally

## 1. Clone the repository

```bash
git clone <YOUR_FRONTEND_REPOSITORY>
cd <YOUR_FRONTEND_DIRECTORY>
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a local `.env` file:

```env
VITE_API_URL=http://localhost:8082
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=spring-app
VITE_KEYCLOAK_CLIENT_ID=spring-boot-client
```

## 4. Start the development server

```bash
npm run dev
```

The Vite development server will provide the local URL.

---

# 🔄 Application Flow

```text
1. User opens BankApp
          │
          ▼
2. Frontend checks authentication
          │
          ▼
3. Keycloak authenticates the user
          │
          ▼
4. Frontend receives JWT
          │
          ▼
5. Frontend calls API Gateway
          │
          ▼
6. Gateway validates the request
          │
          ▼
7. Gateway routes request
          │
          ▼
8. Microservice processes request
          │
          ▼
9. Response returned to frontend
```

---

# 🧩 Integration With BankApp Backend

The frontend is part of the complete BankApp platform:

```text
                    BANKAPP
                       │
          ┌────────────┴────────────┐
          │                         │
       FRONTEND                  BACKEND
          │                         │
     React + Vite              Spring Boot
          │                         │
     Keycloak ◄──────────────► OAuth2/JWT
          │                         │
          └──────────► Gateway ◄────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
               HR        Mission    Message Router
                                      │
                                      ▼
                                    IBM MQ
```

---

# 🎯 Project Objectives

The frontend was developed as the client layer of a distributed enterprise-style application.

The main objectives are:

* Build a modern web interface for a microservices backend
* Integrate frontend authentication with Keycloak
* Handle JWT-based authenticated requests
* Consume REST APIs through an API Gateway
* Separate frontend configuration from source code
* Deploy the application to a cloud hosting platform
* Integrate a web client with a distributed Java backend

---

# 📸 Screenshots

Screenshots of the BankApp interface can be added here to demonstrate the application's user interface and main functionalities.

Example:

```text
screenshots/
├── dashboard.png
├── employees.png
├── missions.png
├── messages.png
└── authentication.png
```

---

# 🔗 Related Project

### BankApp Microservices Backend

The frontend is connected to the Java/Spring Boot microservices backend:

**GitHub:**
https://github.com/youssefJmaiel/bankapp-microservice

---

# 👨‍💻 Author

**Youssef Jmaiel**

Computer Science Engineer focused on:

```text
Java
Spring Boot
Microservices
REST APIs
Keycloak
OAuth2 / JWT
Docker
Cloud Technologies
```

---

# 📜 License

This project is licensed under the MIT License.
