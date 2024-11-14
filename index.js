const express = require("express");
const morgan = require("morgan");
const app = express();

// middleware json.parser
app.use(express.json());

morgan.token("body", (req) => {
  return req.method === "POST" ? JSON.stringify(req.body) : '{}';
});

// middleware morgan
app.use(morgan(":method :url :status :response-time ms :body"));

let persons = [
  { id: 1, name: "Arto Hellas", number: "040-123456" },
  { id: 2, name: "Ada Lovelace", number: "39-44-5323523" },
  { id: 3, name: "Dan Abramov", number: "12-43-234345" },
  { id: 4, name: "Mary Poppendieck", number: "39-23-6423122" },
];

app.get("/", (request, response) => {
  response.send("<h1>Welcome to Backend of Phonebook</h1>");
});

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

  response.send(`
        <p>Phonebook has ${persons.length} entries.</p>
        <p>${currentTime}</p>
    `);
});

app.get("/api/persons", (request, response) => {
  response.json(persons);
});

app.get("/api/persons/:id", (request, response) => {
  const id = Number(request.params.id);
  const personTarget = persons.find((person) => person.id === id);

  if (!personTarget) {
    return response.status(404).json({ error: "Person not found" });
  }

  response.json(personTarget);
});

app.delete("/api/persons/:id", (request, response) => {
  const id = Number(request.params.id);
  const personExists = persons.some((person) => person.id === id);

  if (!personExists) {
    return response.status(404).json({ error: "Person not found" });
  }

  // Eliminar la persona
  persons = persons.filter((person) => person.id !== id);

  // Reordenar los índices (si es necesario)
  persons = persons.map((person, index) => {
    person.id = index + 1;  // Reasignar id para que los índices sean consecutivos
    return person;
  });

  response.status(204).end();
});

app.post("/api/persons", (request, response) => {
  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({ error: "Name and number are required" });
  }

  if (persons.some(person => person.name === body.name)) {
    return response.status(400).json({ error: "Name already exists in the phonebook" });
  }

  const newPerson = {
    id: persons.length + 1,
    name: body.name,
    number: body.number,
  };

  persons = persons.concat(newPerson);
  response.status(201).json(newPerson);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
