require("./domain.test");

const { run } = require("./http.test");

run()
  .then(() => {
    console.log("Suíte completa passou.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
