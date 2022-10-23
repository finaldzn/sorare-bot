const { gql } = require("graphql-request");

const getTokenInfo = gql`
  query getTokenInfo($okenid: [String!]!) {
    tokens {
      nfts(assetIds: $okenid) {
        assetId
        contractAddress
        collectionName
        slug
        latestEnglishAuction {
          bestBid {
            amount
            amountInFiat {
              eur
            }
          }
        }
      }
    }
  }
`;

const getPlayerInfoQuery = gql`
  query getPlayerInfo($player_slug: String!) {
    baseballPlayers(slugs: [$player_slug]) {
      displayName
      slug
      last15AverageScore {
        pitching
        batting
      }
      currentSeasonAverageScore {
        pitching
        batting
      }
      positions
    }
  }
`;

const getAssetIdFromCardSlug = gql`
  query getAllExistingCards($cards_slug: [String!]!) {
    baseballCards(slugs: $cards_slug) {
      assetId
    }
  }
`;

const getAllNfts = gql`
  query getAllCards($cursor: String) {
    tokens {
      allNfts(after: $cursor) {
        nodes {
          assetId
          slug
          collectionName
          latestEnglishAuction {
            bestBid {
              amountInFiat {
                eur
              }
            }
          }
          metadata {
            ... on TokenCardMetadataInterface {
              rarity
              serialNumber
              playerSlug
              playerDisplayName
            }
          }
        }
        pageInfo {
          endCursor
        }
      }
    }
  }
`;

const getPlayersSlugFromTeam = gql`
  query getPlayersSlugFromTeam($team_slug: String!) {
    team(slug: $team_slug) {
      slug
      players {
        slug
      }
    }
  }
`;

const getPlayerTeamSlug = gql`
  query getPlayerTeamSlug($player_slug: String!) {
    baseballPlayers(slugs: [$player_slug]) {
      displayName
      slug
      team {
        slug
      }
    }
  }
`;

const getNBAPlayersFromTeamSlug = gql`
  query getNBAPlayersFromTeamSlug($slug: String!) {
    nbaTeam(slug: $slug) {
      name
      slug
      players {
        slug
        id
        displayName
        firstName
        lastName
        shirtNumber
        positions
        tenGameAverage
        avatarImageUrl
        birthDate
        birthPlaceCountry
      }
    }
  }
`;

const getAllNBACards = gql`
  query getAllnfts($cursor: String) {
    tokens {
      allNfts(sport: NBA, after: $cursor) {
        nodes {
          latestEnglishAuction {
            bestBid {
              amount
              amountInFiat {
                usd
              }
            }
            startDate
            open
            bidsCount
            endDate
          }
          name
          slug
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

module.exports = {
  getPlayersSlugFromTeam,
  getPlayerTeamSlug,
  getAllNfts,
  getAssetIdFromCardSlug,
  getPlayerInfoQuery,
  getTokenInfo,
  getNBAPlayersFromTeamSlug,
  getAllNBACards
};
