
# 🛡️ JWT Authentication  
Proyecto básico de autenticación con **Express**, **JWT (JSON Web Tokens)** y **bcrypt**. Permite registrar y autenticar usuarios, manejando tokens de sesión mediante cookies.  

Este proyecto sirve como molde base para implementar autenticación con JWT en aplicaciones Node.js.. Su estructura modular y funcionalidad básica están pensadas para ser reutilizadas y adaptadas fácilmente en futuros desarrollos. Ideal para comenzar nuevos proyectos con una base sólida de autenticación ya integrada.

## Tecnologías utilizadas  
- Node.js  
- Express 5  
- EJS (para vistas simples)  
- bcrypt (para hashear contraseñas)  
- jsonwebtoken (para generar y verificar tokens)  
- cookie-parser (para manejar cookies en el navegador)  

## Instalación  
1. Clonar este repositorio:  
   git clone https://github.com/lautaroncantero/jwt_authentication.git  
   cd jwt_authentication  

2. Instala las dependencias:  
   pnpm install  

3. Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:  
   JWT_SECRET=tu_secreto_jwt  
   PORT=3000  

4. Inicia el servidor en modo desarrollo:  
   pnpm run dev  

## Estructura básica del proyecto  
jwt_authentication/  
├── index.js            # Punto de entrada del servidor  
├── views/              # Vistas EJS (login, registro, dashboard, etc.)  
├── public/             # Archivos estáticos (CSS, JS, imágenes)  
├── routes/             # Rutas de autenticación  
├── middlewares/        # Middleware para validar JWT  
└── package.json  

## Funcionalidades principales  
- **Registro de usuario:** Hashea la contraseña con bcrypt antes de guardarla y devuelve un token JWT tras el registro exitoso.  
- **Inicio de sesión:** Verifica las credenciales y genera un nuevo token JWT, guardándolo en una cookie para mantener la sesión.  
- **Protección de rutas:** Middleware para validar el token JWT en rutas privadas.  