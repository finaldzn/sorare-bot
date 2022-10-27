const { initClient } = require("./database");
const { createSubscription, getAllCards } = require("./nba/cards");
const getAllPlayersFromAllTeams = require("./nba/players");

async function main() {
  const client = initClient(
    "postgres://postgres:mysecretpassword@localhost:5432/postgres?sslmode=disable"
  );
  //   console.log("Getting Players");
  await getAllPlayersFromAllTeams(client);
  console.log("Setting subscriptions");
  createSubscription(client);
  console.log("Getting cards tokens");
  await getAllCards(client);
}

main();
