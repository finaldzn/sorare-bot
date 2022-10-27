const { getAllNBACards } = require("../scripts/constant_query");
const { initGraphQLCLient, sendGRAPHQLRequest } = require("../utils");
const { insertCard, updateOrCreateCard, createTable } = require("../database");
const { ActionCable } = require("@sorare/actioncable");
const { createReadStream } = require("fs");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRarityFromCardSlug(slug) {
  if(slug.includes("rare")) {
    return "rare";
  }
  if(slug.includes("limited")) {
    return "limited";
  }
  if(slug.includes("super_rare")) {
    return "super_rare";
  }
  if(slug.includes("unique")) {
    return "unique";
  }
  return ""
}

async function getAllCards(client) {
  const [graphClient, slug] = await initGraphQLCLient(
    "https://api.sorare.com/graphql",
    "",
    ""
  );

  createTable(client);

  let cursor = null;
  let i = 0;
  do {
    if (i > 50) {
      console.log("sleeping for a minute");
      await sleep(1000 * 60);
      i = 0;
    }
    const data = await sendGRAPHQLRequest(
      graphClient,
      {
        cursor: cursor,
      },
      getAllNBACards
    );
    i++;
    const paginatedCards = data["tokens"]["allNfts"]["nodes"];
    for (const card of paginatedCards) {
      if (!card.latestEnglishAuction) {
        continue;
      }
      if (card.latestEnglishAuction.bestBid) {
        await insertCard(client, {
          ...card,
          rarity: getRarityFromCardSlug(card.slug),
        });
      } else {
        await insertCard(client, {
          ...card,
          latestEnglishAuction: {
            ...card.latestEnglishAuction,
            bestBid: {
              amount: 0,
              amountInFiat: {
                usd: 0,
              },
            },
          },
          rarity: getRarityFromCardSlug(card.slug),
        });
      }
    }
    cursor = data["tokens"]["allNfts"]["pageInfo"]["endCursor"];
    if (!data["tokens"]["allNfts"]["pageInfo"]["hasNextPage"]) {
      console.log("reached the end");
      break;
    }
  } while (cursor != null);
}

const tokenAuctionWasUpdated = `tokenAuctionWasUpdated(sports: [NBA]) {
    open
    startDate
    endDate
    currentPrice
    bidsCount
    bestBid {
      amount
      amountInFiat {
        usd
      }
    }
    nfts {
      slug
      name
      metadata {
        ... on TokenCardMetadataInterface {
          playerSlug
          rarity
          serialNumber
        }
      }
    }
  }
  `;

function createSubscription(client, authorization) {
  const cable = new ActionCable({
    headers: {
      Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3NzgxMGI1My0yZjgwLTQ3OTEtOWMzYy00OTBhNWU0MjcxMDMiLCJzY3AiOiJ1c2VyIiwiYXVkIjoidG90d3NvcmFyZSIsImlhdCI6MTY2NjU0NzAyOSwiZXhwIjoiMTY2OTEzOTAyOSIsImp0aSI6IjNlODFkMmU4LWQ4ZDMtNDIxNy04OTIzLWY3NjQyN2U0ZDlmNSJ9.MyvMSFb3l1PiUv2ECYDdfd3Ze_D4Cb_Fu-Jec8N2JUY`,
      // 'APIKEY': '<YourOptionalAPIKey>'
    },
  });
  cable.subscribe(tokenAuctionWasUpdated, {
    received(data) {
      console.log("received data");
      if (data?.result?.errors?.length > 0) {
        console.log("error", data?.result?.errors);
        return;
      }
      const tokenOffer = data?.result?.data;
      if (tokenOffer.tokenAuctionWasUpdated) {
        const returnProperFormat = (data) => {
          if (!data.bestBid){
            data.bestBid = {
              amount: 0,
              amountInFiat: {
                usd: 0
              }
            }
          }
          return {
            slug: data.nfts[0].slug,
            name: data.nfts[0].name,
            latestEnglishAuction: {
              bestBid: {
                amount: data.bestBid.amount,
                amountInFiat: {
                  usd: data.bestBid.amountInFiat.usd,
                },
              },
              startDate: data.startDate,
              endDate: data.endDate,
              bidCount: data.bidsCount,
              open: data.open,
              rarity: data.nfts[0].metadata.rarity,
            },
          };
        };

        updateOrCreateCard(
          client,
          returnProperFormat(tokenOffer.tokenAuctionWasUpdated)
        );
      }
    },
  });
}

module.exports = {
  getAllCards,
  createSubscription,
};
