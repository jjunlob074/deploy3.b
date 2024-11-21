// Importar dependencias
require('dotenv').config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const Person = require("./models/person");

// Configuración de la aplicación Express
const app = express();

// Middleware para parsear el cuerpo de la solicitud como JSON
app.use(express.json());

// Middleware para permitir solicitudes desde diferentes orígenes (CORS)
app.use(cors());

// Middleware para servir archivos estáticos desde la carpeta 'dist' (Frontend)
app.use(express.static('dist'));

// Configuración de morgan para el registro de las solicitudes
morgan.token("body", (req) => {
  return req.method === "POST" ? JSON.stringify(req.body) : '{}';
});
app.use(morgan(":method :url :status :response-time ms :body"));

// Ruta principal para obtener información general sobre el phonebook
app.get("/info", (request, response) => {
  const currentTime = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZoneName: "long",
  });

  Person.countDocuments().then((count) => {
    response.send(`
        <p>Phonebook has ${count} entries.</p>
        <p>${currentTime}</p>
    `);
  });
});

// Rutas para manejar personas

// Obtener todas las personas
app.get("/api/persons", (request, response, next) => {
  Person.find({})
    .then((persons) => {
      response.json(persons);
    })
    .catch((error) => next(error));  // Pasar el error al siguiente middleware
});

// Obtener una persona por ID
app.get("/api/persons/:id", (request, response, next) => {
  const id = request.params.id;

  Person.findById(id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).json({ error: "Person not found" });
      }
    })
    .catch((error) => next(error));  // Pasar el error al siguiente middleware
});

// Eliminar una persona por ID
app.delete("/api/persons/:id", (request, response, next) => {
  const id = request.params.id;

  Person.findByIdAndDelete(id)
    .then((result) => {
      if (result) {
        response.status(204).end();
      } else {
        response.status(404).json({ error: "Person not found" });
      }
    })
    .catch((error) => next(error));  // Pasar el error al siguiente middleware
});

// Crear una nueva persona
app.post("/api/persons", (request, response, next) => {
  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({ error: "Name and number are required" });
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person.save()
    .then((newPerson) => {
      console.log(`added ${newPerson.name} number ${newPerson.number} to phonebook`);
      response.json(newPerson);
    })
    .catch((error) => next(error));  // Pasar el error al siguiente middleware
});

// Actualizar una persona por ID
app.put("/api/persons/:id", (request, response, next) => {
  const id = request.params.id;
  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({ error: "Name and number are required" });
  }

  Person.findByIdAndUpdate(id, body, { new: true,runValidators: true, context: 'query' })
    .then((updatedPerson) => {
      if (updatedPerson) {
        response.json(updatedPerson);
      } else {
        response.status(404).json({ error: "Person not found" });
      }
    })
    .catch((error) => next(error));  // Pasar el error al siguiente middleware
});

// Middleware para manejar rutas no conocidas (404)
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};
app.use(unknownEndpoint);

// Middleware para manejar errores
const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  }

  if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message });
  }

  next(error);  // Pasa al controlador de errores predeterminado de Express
};
app.use(errorHandler);

// Configuración y arranque del servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
