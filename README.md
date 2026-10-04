# 🏦 BankApp Frontend

![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Vite](https://img.shields.io/badge/Vite-646CFF)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC)
![Keycloak](https://img.shields.io/badge/Authentication-Keycloak-red)
![JWT](https://img.shields.io/badge/Security-OAuth2%20%2F%20JWT-orange)
![Cloudflare Pages](https://img.shields.io/badge/Deployment-Cloudflare%20Pages-F38020)

> Modern web interface for the BankApp Microservices platform, built with React and TypeScript and integrated with a secured Java/Spring Boot backend.

BankApp Frontend is the client application of the BankApp platform. It communicates with the backend through a centralized **Spring Cloud Gateway**, uses **Keycloak** for authentication and JWT-based security, and is deployed on **Cloudflare Pages**.

---

## ✨ Features

* 🔐 Keycloak authentication
* 🎟️ OAuth2 / JWT authentication
* 🛡️ Bearer-token API requests
* 👥 Employee management
* 🏢 Department management
* 📋 Mission management
* 💬 Message management
* 🤝 Partner management
* 🌐 REST API integration
* ⚙️ Environment-based configuration
* 📱 Responsive web interface
* ☁️ Cloudflare Pages deployment

---

## 🏗️ Architecture

```text
                         ┌─────────────────────┐
                         │   BankApp Frontend  │
                         │   React + TypeScript│
                         │        + Vite       │
                         └──────────┬──────────┘
                                    │
                                    │ Authentication
                                    ▼
                         ┌─────────────────────┐
                         │      Keycloak       │
                         │    OAuth2 / JWT     │
                         │      Port 8081       │
                         └──────────┬──────────┘
                                    │
                                    │ JWT
                                    ▼
                         ┌─────────────────────┐
                         │    API Gateway      │
                         │  Spring Cloud       │
                         │      Port 8082      │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
             HR Service       Mission Service   Message Router
                8083               8084              8085
                                                        │
                                                        ▼
                                                     IBM MQ
```

The frontend communicates with the backend through the Gateway rather than directly accessing each microservice.

---

## 🔐 Authentication & Security

Authentication is handled by **Keycloak**.

### Keycloak configuration

```text
Realm:  spring-app
Client: spring-boot-client
```

After authentication, the frontend receives a JWT access token.

Authenticated API requests use:

```http
Authorization: Bearer <JWT_TOKEN>
```

The backend Gateway validates the authenticated request before routing it to the appropriate microservice.

---

## 🌐 API Integration

The frontend communicates with the backend using REST APIs through the Gateway.

### Available routes

```text
/api/employees/**  → HR Service
/api/missions/**   → Mission Service
/api/messages/**   → Message Router
/api/partners/**   → Message Router
```

This architecture keeps the frontend independent from the internal network addresses of the individual microservices.

---

## 🔄 Request Flow

```text
User
 │
 ▼
BankApp Frontend
 │
 │ Login
 ▼
Keycloak
 │
 │ JWT Access Token
 ▼
Frontend
 │
 │ Authorization: Bearer JWT
 ▼
API Gateway
 │
 ├──────────────► HR Service
 │
 ├──────────────► Mission Service
 │
 ├──────────────► Message Router
 │
 └──────────────► Partner APIs
                       │
                       ▼
                    IBM MQ
```

---

## 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* HTML5
* CSS

The repository contains the Vite, TypeScript and Tailwind configuration used by the application.

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

## ⚙️ Environment Configuration

The frontend uses Vite environment variables for backend and Keycloak configuration.

### Local development

Create a `.env` file:

```env
VITE_API_URL=http://localhost:8082
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=spring-app
VITE_KEYCLOAK_CLIENT_ID=spring-boot-client
```

For production, configure the corresponding environment variables in the hosting platform.

> Do not commit private credentials or sensitive environment files to Git.

---

## ☁️ Deployment

The application is deployed using **Cloudflare Pages**.

```text
                 Cloudflare Pages
                        │
                        ▼
              ┌──────────────────┐
              │ BankApp Frontend │
              └────────┬─────────┘
                       │
                       │ HTTPS
                       ▼
                 API Gateway
                       │
                       ▼
             Spring Boot Backend
```

The deployed frontend communicates with the backend through the configured API Gateway URL.

---

## 🔗 CORS

Because the frontend and backend can run on different origins, the API Gateway is configured to support cross-origin requests.

The configuration allows the frontend to send authenticated requests containing:

```http
Authorization: Bearer <JWT_TOKEN>
```

This enables the browser-based frontend to communicate securely with the backend Gateway.

---

## 📁 Project Structure

```text
bankapp-frontend/
│
├── .bolt/
├── public/
│
├── src/
│
├── .gitignore
├── README.md
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

The current GitHub repository contains this React/Vite project structure.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/youssefJmaiel/bankapp-frontend.git
cd bankapp-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create:

```text
.env
```

with:

```env
VITE_API_URL=http://localhost:8082
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=spring-app
VITE_KEYCLOAK_CLIENT_ID=spring-boot-client
```

### 4. Start the development server

```bash
npm run dev
```

---

## 🏦 Complete BankApp Platform

The frontend is part of a larger distributed banking application:

```text
                         BANKAPP
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
        FRONTEND                         BACKEND
             │                             │
       React + TypeScript            Spring Boot
             │                             │
             │                         Microservices
             │                             │
             │                       ┌─────┼─────┐
             │                       │     │     │
             │                      HR  Mission Message
             │                                   Router
             │                                     │
             │                                     ▼
             │                                   IBM MQ
             │
             └──────────────┐
                            │
                         Keycloak
                         OAuth2/JWT
                            │
                            ▼
                       API Gateway
```

---

## 🎯 Project Objectives

The frontend was developed to demonstrate the integration of a modern web application with an enterprise-oriented distributed backend.

The project demonstrates:

* Modern React application development
* TypeScript-based frontend development
* Responsive user interface development
* Authentication with Keycloak
* OAuth2 / JWT integration
* Secure REST API consumption
* API Gateway integration
* Microservices frontend integration
* Environment-based configuration
* Cloud deployment

---

## 📸 Screenshots

Screenshots of the BankApp interface can be added here to demonstrate the main application features.

Recommended sections:

```text
screenshots/
├── dashboard.png
├── employees.png
├── missions.png
├── messages.png
├── partners.png
└── authentication.png
```

---

## 🔗 Related Repository

### Backend — BankApp Microservices

[BankApp Microservices Backend](https://github.com/youssefJmaiel/bankapp-microservice?utm_source=chatgpt.com)

### Frontend

[BankApp Frontend](https://github.com/youssefJmaiel/bankapp-frontend?utm_source=chatgpt.com)

---

## 👨‍💻 Author

**Youssef Jmaiel**

Computer Science Engineer focused on:

```text
Java
Spring Boot
Microservices
React
TypeScript
REST APIs
Keycloak
OAuth2 / JWT
Docker
Cloud Technologies
```

---

## 📜 License

This project is licensed under the MIT License.
