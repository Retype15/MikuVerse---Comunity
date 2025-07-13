# **Documentación de la API de MikuVerse - v1.0**

## **Introducción**

Esta documentación detalla los endpoints disponibles en la API del backend de MikuVerse. El objetivo es proporcionar una guía clara para el desarrollo del frontend y cualquier otro cliente que necesite interactuar con nuestros servicios.

## **URL Base**

La URL base para todas las peticiones a la API es la del servidor donde se está ejecutando el backend.

-   **Entorno de Desarrollo:** `http://localhost:3001`
-   **Entorno de Producción:** `https://api.dominio-final.com`

Todas las rutas de la API están prefijadas con `/api`. Por lo tanto, un endpoint como `/auth/login` se convierte en `http://localhost:3001/api/auth/login`.

## **Autenticación**

La mayoría de los endpoints requieren autenticación mediante **JSON Web Token (JWT)**. Para realizar una petición a un endpoint protegido, el cliente debe incluir una cabecera `Authorization` con el token JWT.

-   **Formato de la Cabecera:**
    `Authorization: Bearer <tu_token_jwt>`

El token se obtiene a través de los endpoints de login (`/auth/login` y `/auth/google/callback`). El cliente debe almacenar este token de forma segura (por ejemplo, en `localStorage`) y enviarlo en cada petición subsiguiente a rutas protegidas.

## **Formato de Respuestas**

-   **Respuestas Exitosas (Código `2xx`):**
    -   Las respuestas exitosas devolverán un objeto JSON. El formato exacto dependerá del endpoint.
    -   `GET`: Devolverá los datos solicitados.
    -   `POST`/`PUT`/`PATCH`: A menudo devolverá el recurso creado/actualizado o un mensaje de éxito.
    -   `DELETE`: Generalmente devolverá un código `204 No Content` o un mensaje de éxito.

-   **Respuestas de Error (Código `4xx`, `5xx`):**
    -   Las respuestas de error devolverán un objeto JSON con la siguiente estructura:
        ```json
        {
          "message": "Descripción legible del error."
        }
        ```

---

## **Endpoints Disponibles**

### **Módulo de Configuración (`/api/misc`)**

Endpoints para obtener configuraciones públicas necesarias para el frontend.

#### **`GET /api/misc/config`**

Obtiene configuraciones públicas del servidor, como la Site Key de Cloudflare.

-   **Autenticación:** No requerida.
-   **Respuesta Exitosa (Código `200 OK`):**
    ```json
    {
      "cloudflareSiteKey": "0x4AAAAAAA...TU_SITE_KEY_PUBLICA"
    }
    ```

---

### **Módulo de Autenticación (`/api/auth`)**

Endpoints para el registro, inicio de sesión y autenticación de usuarios.

#### **`POST /api/auth/register`**

Registra un nuevo usuario en el sistema mediante correo electrónico y contraseña.

-   **Autenticación:** No requerida.
-   **Cuerpo de la Petición (Request Body):** `application/json`
    ```json
    {
      "username": "nuevo_usuario",
      "email": "usuario@ejemplo.com",
      "password": "una_contraseña_segura",
      "cf-turnstile-response": "TOKEN_PROPORCIONADO_POR_CLOUDFLARE_WIDGET"
    }
    ```
-   **Respuesta Exitosa (Código `201 Created`):**
    ```json
    {
      "message": "Usuario registrado con éxito. Ahora puedes iniciar sesión."
    }
    ```
-   **Posibles Errores:**
    -   `400 Bad Request`: Faltan campos requeridos o el captcha no fue proporcionado.
    -   `403 Forbidden`: El captcha de Cloudflare no pudo ser verificado.
    -   `409 Conflict`: El `username` o `email` ya existen en la base de datos.
    -   `500 Internal Server Error`: Error en el servidor.

#### **`POST /api/auth/login`**

Inicia sesión con un usuario existente y devuelve un token JWT.

-   **Autenticación:** No requerida.
-   **Cuerpo de la Petición (Request Body):** `application/json`
    ```json
    {
      "email": "usuario@ejemplo.com",
      "password": "una_contraseña_segura",
      "cf-turnstile-response": "TOKEN_PROPORCIONADO_POR_CLOUDFLARE_WIDGET"
    }
    ```
-   **Respuesta Exitosa (Código `200 OK`):**
    ```json
    {
      "token": "ey...UN_TOKEN_JWT_MUY_LARGO...sA"
    }
    ```
-   **Posibles Errores:**
    -   `400 Bad Request`: Faltan campos requeridos o el captcha no fue proporcionado.
    -   `401 Unauthorized`: Credenciales incorrectas.
    -   `403 Forbidden`: El captcha de Cloudflare no pudo ser verificado.
    -   `500 Internal Server Error`: Error en el servidor.

#### **`GET /api/auth/google`**

Inicia el flujo de autenticación con Google. Este endpoint no se consume con `fetch`, sino que el navegador debe ser redirigido a él.

-   **Uso:** `<a href="http://localhost:3001/api/auth/google">Login con Google</a>`
-   **Comportamiento:** Redirige al usuario a la página de consentimiento de Google. Tras la aprobación, Google redirige al usuario a la URL de callback configurada (`/api/auth/google/callback`).

#### **`GET /api/auth/google/callback`**

Endpoint de callback para Google. No es consumido directamente por el frontend.

-   **Comportamiento:** Procesa la respuesta de Google, crea o encuentra al usuario, y redirige al frontend (`/app.html`) con el token JWT como parámetro en la URL.
-   **Ejemplo de Redirección:** `http://localhost:3001/app.html?token=ey...UN_TOKEN_JWT...sA`

---

## **Comunicación por WebSockets (Socket.IO)**

La comunicación en tiempo real (chat) se maneja a través de WebSockets usando la librería Socket.IO.

### **Conexión**

El cliente debe establecer una conexión con el servidor de Socket.IO. **La autenticación se realiza en el momento de la conexión.**

-   **URL del Servidor:** `http://localhost:3001` (la misma que la API)
-   **Método de Conexión (JavaScript):**
    ```javascript
    const token = localStorage.getItem('mikuverse_token');

    const socket = io("http://localhost:3001", {
      auth: {
        token: token // El token JWT se envía aquí
      }
    });
    ```

### **Eventos Emitidos por el Cliente (Cliente -> Servidor)**

#### **`send_message`**

Envía un nuevo mensaje al chat global.

-   **Payload:**
    ```javascript
    {
      "content": "¡Hola a todos en el MikuVerse!"
    }
    ```
-   **Uso:** `socket.emit('send_message', { content: 'Mi mensaje' });`

#### **`delete_message`**

Borra un mensaje existente.

-   **Autenticación:** Requiere que el usuario tenga el rol de `moderator` o `admin`.
-   **Payload:**
    ```javascript
    {
      "messageId": 123 // El ID del mensaje a borrar
    }
    ```
-   **Uso:** `socket.emit('delete_message', { messageId: 123 });`

### **Eventos Recibidos por el Cliente (Servidor -> Cliente)**

#### **`connect_error`**

Se dispara si la autenticación del socket falla (token inválido, expirado, etc.).

-   **Payload:** Un objeto de error con una propiedad `message`.
-   **Acción recomendada:** Desloguear al usuario y redirigirlo a la página de login.

#### **`user_profile`**

Se emite inmediatamente después de una conexión exitosa. Envía los datos del perfil del usuario conectado.

-   **Payload:**
    ```json
    {
      "username": "usuario_conectado",
      "email": "usuario@ejemplo.com",
      "avatarUrl": "https://...url_del_avatar.jpg",
      "role": "user"
    }
    ```

#### **`chat_history`**

Se emite después de una conexión exitosa. Envía los últimos 50 mensajes del chat global.

-   **Payload:** Un array de objetos de mensaje.
    ```json
    [
      {
        "id": 1,
        "content": "Primer mensaje",
        "createdAt": "2023-10-27T10:00:00.000Z",
        "User": {
          "username": "Usuario1",
          "avatarUrl": "https://...url.jpg"
        }
      },
      // ... más mensajes
    ]
    ```

#### **`receive_message`**

Se emite a todos los clientes cuando se envía un nuevo mensaje.

-   **Payload:** Un objeto de mensaje (mismo formato que en `chat_history`).

#### **`message_deleted`**

Se emite a todos los clientes cuando un mensaje es borrado por un moderador.

-   **Payload:**
    ```json
    {
      "messageId": 123 // El ID del mensaje que fue borrado
    }
    ```
-   **Acción recomendada:** Buscar el elemento del mensaje en el DOM con `data-message-id="123"` y eliminarlo.