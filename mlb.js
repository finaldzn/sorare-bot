const { GraphQLClient } = require("graphql-request");
const runSignIn = require("./scripts/authUser");
const {
  getPlayersSlugFromTeam,
  getAllNfts,
  getAssetIdFromCardSlug,
  getPlayerInfoQuery,
  getTokenInfo,
  getNBAPlayersFromTeamSlug
} = require("./scripts/constant_query");

const {
  parseTeams,
  writePlayerList,
  initGraphQLCLient,
  sendGRAPHQLRequest,
  readTeamsFile,
  writePlayerInfo,
  mergeJSONFILES,
} = require("./utils");

const fs = require("fs");

const MY_EMAIL = "mouradianvictor@gmail.com";
const MY_PASS = "Redsox46Mm!!";

/**
 * Get all players slug from all teams
 */
async function getAllPlayersSlugFromTeams(email, pass) {
  const team_slugs = parseTeams();
  const [client, slug] = await initGraphQLCLient(
    "https://api.sorare.com/mlb/graphql",
    (email = email),
    (pass = pass)
  );
  const players_by_teams_slugs = [];
  for (const team_slug of team_slugs) {
    const data = await sendGRAPHQLRequest(
      client,
      { team_slug },
      getPlayersSlugFromTeam
    );
    if (data.team === null) {
      console.log("No team found for slug: ", team_slug);
    } else {
      players_by_teams_slugs.push({
        team_slug: team_slug,
        players: data.team.players.map((player) => player.slug),
      });
    }
  }
  writePlayerList(players_by_teams_slugs);
}

function generateAllPossibleCardSlugsFromPlayerSlugs(player_slug) {
  const rarity = {
    limited: 200,
    rare: 50,
    super_rare: 15,
    unique: 1,
  };
  const season = 2022;
  const card_slugs = [];
  Object.keys(rarity).forEach((key) => {
    for (let i = 1; i <= rarity[key]; i++) {
      card_slugs.push(
        `${player_slug}-${season}-${key.replace("_", "-")}-${i}`.toLowerCase()
      );
    }
  });
  return card_slugs;
}

function getScore(score) {
  if (score.pitching === 0) return score.batting;
  else return score.pitching;
}

function PriceAVGPerRarity(tokens) {
  const rarities = {
    limited: [0, 0],
    rare: [0, 0],
    "super-rare": [0, 0],
    unique: [0, 0],
  };
  let avg = 0;
  for (const token of tokens) {
    if (token.latestEnglishAuction === null) continue;
    if (token.latestEnglishAuction.bestBid === null) continue;
    if (token.slug.includes("limited")) {
      rarities["limited"][0] +=
        token.latestEnglishAuction.bestBid.amountInFiat.eur;
      rarities["limited"][1] += 1;
    } else if (token.slug.includes("rare")) {
      rarities["rare"][0] +=
        token.latestEnglishAuction.bestBid.amountInFiat.eur;
      rarities["rare"][1] += 1;
    } else if (token.slug.includes("super-rare")) {
      rarities["super-rare"][0] +=
        token.latestEnglishAuction.bestBid.amountInFiat.eur;
      rarities["super-rare"][1] += 1;
    } else if (token.slug.includes("unique")) {
      rarities["unique"][0] +=
        token.latestEnglishAuction.bestBid.amountInFiat.eur;
      rarities["unique"][1] += 1;
    }
  }
  const returnAvg = (rarity) => {
    if (rarities[rarity][1] === 0) return 0;
    return rarities[rarity][0] / rarities[rarity][1];
  };
  return {
    limited: returnAvg("limited"),
    rare: returnAvg("rare"),
    super_rare: returnAvg("super-rare"),
    unique: returnAvg("unique"),
  };
}

function parseInfo(player_slug, token) {
  const player_info = {
    player_slug: player_slug.baseballPlayers[0].slug,
    avg15: getScore(player_slug.baseballPlayers[0].last15AverageScore),
    avgSeason: getScore(
      player_slug.baseballPlayers[0].currentSeasonAverageScore
    ),
    positions: player_slug.baseballPlayers[0].positions,
    price: PriceAVGPerRarity(token),
  };
  return player_info;
}

async function getPlayerInfo(client, slug) {
  const playerInfo = await sendGRAPHQLRequest(
    client,
    { player_slug: slug },
    getPlayerInfoQuery
  );
  return playerInfo;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// first generate all posibble slugs
// then get asset id for each slug
// then get nft object corresponding to each asset id
async function getAssetsIdFromAllPossibleSlugs() {
  // init client
  const [mlb_client, slug] = await initGraphQLCLient(
    "https://api.sorare.com/mlb/graphql",
    MY_EMAIL,
    MY_PASS
  );
  const [football_client, slug_ec] = await initGraphQLCLient(
    "https://api.sorare.com/graphql",
    MY_EMAIL,
    MY_PASS
  );

  // read player list
  const team_dump = readTeamsFile();
  const TEAM_LIMIT = 25;
  let nbOfReq = 0;
  // occurate over each team
  for (let i = 0; i < TEAM_LIMIT; i++) {
    // occurate over each player
    const team_player = [];
    console.log("Team: ", team_dump[i].team_slug);
    for (const player of team_dump[i].players) {
      console.log("Player: ", player);
      // get player info
      const info = await getPlayerInfo(mlb_client, player);
      var tokens = [];
      // generate all slugs for the player
      const possible_slugs =
        generateAllPossibleCardSlugsFromPlayerSlugs(player);
      // go through the list of possible slugs 25 by 25
      const MAX_PER_REQUEST = 50;
      for (let i = 0; i < possible_slugs.length; i = i + MAX_PER_REQUEST) {
        if (nbOfReq > 50) {
          console.log("sleeping for refresh rate");
          await sleep(60000);
          nbOfReq = 0;
        }
        // get the 25 possible assetsID
        const assetsID = await sendGRAPHQLRequest(
          mlb_client,
          { cards_slug: possible_slugs.slice(i, i + MAX_PER_REQUEST) },
          getAssetIdFromCardSlug
        );

        // get the 25 possible nfts
        const token_information = await sendGRAPHQLRequest(
          football_client,
          { okenid: assetsID.baseballCards.map((res) => res.assetId) },
          getTokenInfo
        );
        tokens = tokens.concat(token_information.tokens.nfts);
        nbOfReq += 2;
      }
      const player_info = parseInfo(info, tokens);
      team_player.push(player_info);
    }
    writePlayerInfo(team_dump[i].team_slug, team_player);
    console.log("Done Team: ", team_dump[i].team_slug);
    console.log("Waiting 30 seconds for rate limit");
  }
}

async function getAllBaseballNfts() {
  const [client, slug] = await initGraphQLCLient(
    "https://api.sorare.com/graphql",
    MY_EMAIL,
    MY_PASS
  );
  var cursor = null;
  const baseballCardList = [];
  do {
    console.log("Page starting from cursor", cursor);
    const data = await sendGRAPHQLRequest(
      client,
      { cursor, first: 13 },
      getAllNfts
    );
    const paginatedCards = data["tokens"]["allNfts"];
    paginatedCards["nodes"].forEach((card) => {
      if (card.collectionName.toLowerCase() === "baseball") {
        console.log(card);
        baseballCardList.push(card);
      }
    });
    cursor = paginatedCards["pageInfo"]["endCursor"];
  } while (cursor != null);
  return baseballCardList;
}

async function getEachPlayerItsPriceAndScore() {
  // read PLAYER_DUMP.json file
  const [client, slug] = await initGraphQLCLient(MY_EMAIL, MY_PASS);
  const team_dump = readTeamsFile();
  for (const team of team_dump) {
    for (const player of team.players) {
      const playerCards = await getAllBaseballCards(client, player);
      console.log(playerCards);
    }
  }
  // for each player
}


async function main() {
  //await getAllPlayersSlugFromTeams(MY_EMAIL, MY_PASS);
  // //const allPlayers = await getAllCards(client)
  // const allcards = await getAllBaseballCards(client, "kylian-mbappe-lottin")
  // console.log(allcards)
  //await getAssetsIdFromAllPossibleSlugs();
  //await mergeJSONFILES();
  await generateTeamSlugs();
}

main();
