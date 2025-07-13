// src/core/database/database.js
const { Sequelize } = require('sequelize');
const config = require('./config');
const fs = require('fs');
const path = require('path');

let sequelize;

if (config.database.url) {
  // Configuración SSL predeterminada para MySQL/MariaDB en la nube
  let sslConfig = {
    rejectUnauthorized: true, // Por defecto, siempre verificar certificados
  };

  // Intentar cargar el certificado CA si existe y estamos en producción
  if (process.env.NODE_ENV === 'production' && process.env.DB_CERT_CA_PATH) {
      try {
          // Asegúrate de que el certificado CA se sube a Vercel con la aplicación
          // o que se pega directamente como variable de entorno si es pequeño.
          sslConfig.ca = fs.readFileSync(path.join(process.cwd(), process.env.DB_CERT_CA_PATH));
      } catch (e) {
          console.error("Advertencia: No se pudo cargar el certificado CA para la base de datos:", e.message);
          // Si no se carga el CA y rejectUnauthorized es true, la conexión fallará.
          // En este punto, decidir si rejectUnauthorized debe ser false para continuar con el despliegue
          // o si es un error fatal. Para desarrollo, se puede dejar en false.
      }
  }

  // Si estás depurando y quieres desactivar temporalmente rejectUnauthorized:
  // if (process.env.DISABLE_DB_SSL_VERIFICATION === 'true') {
  //   sslConfig.rejectUnauthorized = false;
  //   console.warn("ADVERTENCIA: Verificación SSL de la base de datos deshabilitada. NO USAR EN PRODUCCIÓN.");
  // }


  sequelize = new Sequelize(config.database.url, {
    dialect: config.database.dialect,
    dialectModule: config.database.dialectModule,
    // --- CAMBIO CRÍTICO AQUÍ ---
    dialectOptions: {
      ssl: sslConfig, // Pasamos el objeto sslConfig directamente
    },
    // --- FIN DEL CAMBIO CRÍTICO ---
    logging: true, // Mantener en true para ver los logs detallados
  });
} else {
  // Código de desarrollo local (sin cambios)
  sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
      host: config.database.host,
      dialect: config.database.dialect,
      logging: config.logging.level === 'debug' ? console.log : false,
    }
  );
}

module.exports = sequelize;