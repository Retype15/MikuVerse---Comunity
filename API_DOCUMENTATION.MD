# MikuVerse Community - Documentación de la API

¡Bienvenido al equipo! Este documento describe cómo interactuar con el backend de MikuVerse. Cubre tanto la API RESTful como los eventos de WebSockets (Socket.IO) para la funcionalidad en tiempo real como el chat.

## Tabla de Contenidos

1.  [Configuración Inicial del Frontend](#1-configuración-inicial-del-frontend)
2.  [API REST](#2-api-rest)
    *   [Autenticación](#autenticación)
    *   [Misceláneos](#misceláneos)
3.  [API de WebSockets (Socket.IO)](#3-api-de-websockets-socketio)
    *   [Conexión](#conexión)
    *   [Eventos del Servidor (Escuchar)](#eventos-del-servidor-escuchar)
    *   [Eventos del Cliente (Emitir)](#eventos-del-cliente-emitir)

---

## 1. Configuración Inicial del Frontend

Antes de que un usuario pueda interactuar con las partes seguras de la API, el frontend necesita obtener la clave del sitio de Cloudflare Turnstile.

### Obtener Configuración del Frontend

-   **Endpoint:** `GET /api/misc/config`
-   **Descripción:** Obtiene la configuración pública necesaria para el frontend. Actualmente, solo devuelve la `siteKey` de Cloudflare.
-   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "cloudflareSiteKey": "your_cloudflare_site_key_here"
    }
    ```
-   **Uso:** Llama a este endpoint al cargar la página de login/registro para poder renderizar el widget de Turnstile.

---

## 2. API REST

Todas las peticiones a endpoints protegidos deben incluir un token JWT en la cabecera de autorización.

**Formato de la Cabecera:** `Authorization: Bearer <tu_jwt_token>`

### Autenticación

#### Registro de Usuario Manual

-   **Endpoint:** `POST /api/auth/register`
-   **Descripción:** Crea una nueva cuenta de usuario. Requiere verificación de Cloudflare.
-   **Cuerpo de la Petición (Body):**
    ```json
    {
      "username": "nuevo_usuario",       // (Requerido)
      "email": "usuario@ejemplo.com",  // (Requerido)
      "password": "una_contraseña",    // (Requerido)
      "avatarUrl": "https://url.com/a/mi/imagen.png", // (Opcional)
      "cf-turnstile-response": "el_token_de_cloudflare" // (Requerido)
    }
    ```
-   **Respuesta Exitosa (201 Created):**
    ```json
    {
      "message": "Usuario registrado con éxito. Ahora puedes iniciar sesión."
    }
    ```
-   **Respuestas de Error:**
    -   `400 Bad Request`: Faltan campos.
    -   `409 Conflict`: El email o el nombre de usuario ya existen.

#### Inicio de Sesión Manual

-   **Endpoint:** `POST /api/auth/login`
-   **Descripción:** Autentica a un usuario y devuelve un token JWT.
-   **Cuerpo de la Petición (Body):**
    ```json
    {
      "identifier": "nombre_de_usuario_o_email", // (Requerido)
      "password": "una_contraseña_segura",       // (Requerido)
      "cf-turnstile-response": "el_token_de_cloudflare" // (Requerido)
    }
    ```
-   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "token": "ey..." // Token JWT para usar en peticiones futuras
    }
    ```
-   **Respuestas de Error:**
    -   `401 Unauthorized`: Credenciales incorrectas.

#### Autenticación con Google

Este es un flujo de redirección:

1.  **Paso 1: Iniciar el Flujo**
    -   El usuario hace clic en un enlace que apunta a `GET /api/auth/google`.
    -   El backend lo redirige a la página de consentimiento de Google.

2.  **Paso 2: Callback de Google**
    -   Tras la autorización, Google redirige al usuario a `GET /api/auth/google/callback`. El backend gestiona esto automáticamente.
    -   **Si el usuario ya existe:** Se le redirige a `/app.html?token=<jwt_token>`. El frontend debe capturar este token de la URL y guardarlo.
    -   **Si es un usuario nuevo:** Se le redirige a `/index.html?tempToken=<temp_token>`. El frontend debe mostrar un formulario para completar el registro.

#### Completar Registro de Google

-   **Endpoint:** `POST /api/auth/complete-google`
-   **Descripción:** Finaliza el registro de un usuario que se autenticó con Google por primera vez.
-   **Cuerpo de la Petición (Body):**
    ```json
    {
      "username": "usuario_elegido",
      "password": "una_contraseña_elegida",
      "tempToken": "el_temp_token_recibido_en_la_url",
      "cf-turnstile-response": "el_token_de_cloudflare"
    }
    ```
-   **Respuesta Exitosa (201 Created):**
    ```json
    {
      "token": "ey..." // Token JWT de sesión final
    }
    ```
-   **Respuestas de Error:**
    -   `401 Unauthorized`: `tempToken` expirado o inválido.
    -   `409 Conflict`: El nombre de usuario elegido ya existe.

### Misceláneos
_(Esta sección puede crecer con más endpoints públicos en el futuro)_

- `GET /api/health`: Endpoint de estado para verificar que el backend está funcionando.

---

## 3. API de WebSockets (Socket.IO)

Para toda la comunicación en tiempo real.

### Conexión

El cliente debe conectarse al servidor de Socket.IO proporcionando el token JWT en las opciones de autenticación.

```javascript
const token = localStorage.getItem('jwt_token');
const socket = io({
  auth: { token: token }
});
```

### Eventos del Servidor (Escuchar)

El cliente debe registrar escuchadores para estos eventos que el servidor emite.

-   **Evento:** `connect`
    -   **Descripción:** Se dispara cuando la conexión se establece con éxito. Es un buen momento para solicitar datos iniciales.

-   **Evento:** `connect_error`
    -   **Descripción:** Se dispara si la conexión falla (p. ej., token inválido).
    -   **Payload:** `(error)` - Un objeto de error. Si `error.message` contiene "Authentication error", se debe desloguear al usuario.

-   **Evento:** `user_profile`
    -   **Descripción:** El servidor envía los datos del perfil del usuario conectado justo después de la conexión.
    -   **Payload:**
        ```json
        {
          "username": "nombre_de_usuario",
          "email": "usuario@ejemplo.com",
          "avatarUrl": "https://...",
          "role": "user" // o "moderator", "admin"
        }
        ```

-   **Evento:** `receive_message`
    -   **Descripción:** Se recibe un nuevo mensaje de chat en un canal.
    -   **Payload:**
        ```json
        {
          "id": 123,
          "content": "Hola a todos!", // Contenido HTML ya saneado
          "createdAt": "2023-10-27T10:00:00.000Z",
          "User": {
            "id": 1,
            "username": "usuario_que_envio",
            "avatarUrl": "https://..."
          }
        }
        ```

-   **Evento:** `message_deleted`
    -   **Descripción:** Notifica que un moderador ha borrado un mensaje.
    -   **Payload:**
        ```json
        {
          "messageId": 123
        }
        ```
    -   **Acción:** El frontend debe encontrar y eliminar el elemento del DOM con el ID correspondiente.

### Eventos del Cliente (Emitir)

El cliente emite estos eventos para realizar acciones en el servidor.

-   **Evento:** `request_chat_history`
    -   **Descripción:** Solicita el historial de mensajes de un canal específico.
    -   **Payload:**
        ```json
        {
          "channel": "global" // En el futuro, podría ser otro canal
        }
        ```
    -   **Callback (Respuesta del servidor):** El servidor responde a través de un callback.
        ```javascript
        socket.emit('request_chat_history', { channel: 'global' }, (response) => {
          if (response.error) {
            console.error(response.error);
          } else {
            // response.history es un array de objetos de mensaje
            renderizarHistorial(response.history);
          }
        });
        ```

-   **Evento:** `send_message`
    -   **Descripción:** Envía un nuevo mensaje al chat.
    -   **Payload:**
        ```json
        {
          "content": "Mi nuevo mensaje.", // El frontend NO necesita sanearlo.
          "channel": "global"
        }
        ```

-   **Evento:** `delete_message`
    -   **Descripción:** (Solo para moderadores/admins) Solicita borrar un mensaje.
    -   **Payload:**
        ```json
        {
          "messageId": 123
        }
        ```