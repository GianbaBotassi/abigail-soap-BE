const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Shop',
      version: '1.0.0',
      description: 'Documentazione API per prodotti, ordini e clienti',
    },
    servers: [
      {
        url: 'http://localhost:3000', // URL base del tuo server
      },
    ],
  },
  apis: ['./routes/*.js'], // punti in cui Swagger cercherà i commenti
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
