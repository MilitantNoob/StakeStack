const express = require("express");
const app = express();
const port = 8000;

// Set the Cross-Origin-Opener-Policy header to allow popups in Safari
app.use((req, res, next) => {
  res.header("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use(express.static("."));

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`),
);