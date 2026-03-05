const express = require("express");
const cors = require("cors");
const path = require("path");
const { watch } = require("fs");

const app = express();

app.use(cors({ origin: "*" }));

// Inject live reload script into JS
app.get("/entry.js", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "entry.js"));
});

app.get("/entry.css", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "entry.css"));
});

// SSE endpoint for live reload
let clients = [];

app.get("/reload", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  clients.push(res);
  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
  });
});

// Watch dist folder for changes
watch(path.join(__dirname, "dist"), { recursive: true }, () => {
  clients.forEach((c) => c.write("data: reload\n\n"));
});

app.listen(4000, () => {
  console.log("Catex CDN running:");
  console.log("JS  → http://localhost:4000/entry.js");
  console.log("CSS → http://localhost:4000/entry.css");
});