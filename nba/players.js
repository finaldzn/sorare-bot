const { getNBAPlayersFromTeamSlug } = require("../scripts/constant_query");

const { initGraphQLCLient, sendGRAPHQLRequest } = require("../utils");

const fs = require("fs");
const { initClient, insertPlayerIntoDB } = require("../database");

const MY_EMAIL = "mouradianvictor@gmail.com";
const MY_PASS = "Redsox46Mm!!";

async function returnCleanData(data) {
  const clean = data.nbaTeam;
  let res = {};
  res.team = clean.name;
  res.slug = clean.slug;
  res.players = [];
  for (const player of clean.players) {
    res.players.push({
      team: clean.name,
      slug: player.slug,
      id: player.id,
      displayName: player.firstName + " " + player.lastName,
      firstName: player.firstName,
      lastName: player.lastName,
      shirtNumber: player.shirtNumber,
      positions: player.positions,
      tenGameAverage: player.tenGameAverage,
      avatarImageUrl: player.avatarImageUrl,
      birthDate: player.birthDate,
      birthPlaceCountry: player.birthPlaceCountry,
    });
  }
  return res;
}

async function getPlayersFromTeam(nba_client, teamslug) {
  const data = await sendGRAPHQLRequest(
    nba_client,
    { slug: teamslug },
    getNBAPlayersFromTeamSlug
  );
  if (data.nbaTeam === null) {
    console.log("No data for team: ", teamslug);
    return null;
  }
  return returnCleanData(data);
}

const MAX_LIMIT = 1;

async function getAllPlayersFromAllTeams(client) {
  const teams = fs.readFileSync("./TEAM_SLUGS.txt", "utf8");
  const teams_slugs = teams.split("\n");
  const [nba_client, slug] = await initGraphQLCLient(
    "https://api.sorare.com/sports/graphql",
    MY_EMAIL,
    MY_PASS
  );

  for (let team_slug of teams_slugs) {
    team_slug = team_slug.trim();
    const data = await getPlayersFromTeam(nba_client, team_slug);
    if (data === null) continue;
    const insertPlayer = (player) => {
      const goodplayer = {
        team: player.team,
        slug: player.slug,
        name: player.displayName,
        positions: player.positions,
        avgScore: player.tenGameAverage,
        avatarURL: player.avatarImageUrl,
      };
      insertPlayerIntoDB(client, goodplayer);
    };
    data.players.forEach(insertPlayer);
  }
}

module.exports = getAllPlayersFromAllTeams;
