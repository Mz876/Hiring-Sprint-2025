const app = require("./app");
const config = require("./config/env");

app.listen(config.port, () => {
  console.log(`SmartDamage backend listening on http://localhost:${config.port}`);
  console.log(`Swagger docs at http://localhost:${config.port}/api-docs`);
});
