const { initClient } = require("./database");
const { createSubscription, getAllCards } = require("./nba/cards");

async function main() {
    const client = initClient("postgres://postgres:mysecretpassword@localhost:5432/postgres?sslmode=disable");
    createSubscription(client);
    await getAllCards(client);
}

main()