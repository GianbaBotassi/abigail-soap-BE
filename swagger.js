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
        url: process.env.NODE_ENV === 'production'
          ? `${process.env.BACKEND_URL}`
          : 'http://localhost:3000',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;