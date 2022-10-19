const {gql } = require("graphql-request");

// const getprice = gql`
//  query getplayerPrice($slug: String!){
//      player(slug: $slug){
//       displayName
//       id
//       slug
//       cards{
//         nodes{
//           rarity
//           latestEnglishAuction{
//             currentPrice
//           }
//         }
//       }
//   	}
// 	}
// `

// const GetBaseballCardBySlug = gql`
//   query GetBaseballCardBySlug($slug: String!) {
//     player(slug: $slug) {
//       displayName
//       currentSeasonAverageScore {
//         pitching
//         batting
//       }
//       last15AverageScore {
//           pitching
//           batting
//       }
//     }
//   }
// `;

// const queryBaseballCards = gql`
//   query QueryBaseballCards {
//     cards {
//       assetId
//       slug
//       rarity
//       season
//       serialNumber
//       positions
//       team {
//         name
//       }
//       player {
//         displayName
//       }
//     }
//   }`

// const AllCards = gql`
//   query getAllCards {
//     allCards {
//         nodes {
//             name
//             age
//             slug
//         }
//     }
//   }
// `;

// const AllCardsFromUser = gql`
//   query AllCardsFromUser($slug: String!, $cursor: String) {
//     user(slug: $slug) {
//       paginatedCards(after: $cursor) {
//         nodes {
//           slug
//           userOwnersWithRate {
//             from
//             price
//           }
//         }
//         pageInfo {
//           endCursor
//         }
//       }
//     }
//   }
// `;


// async function getAllcardsFromUser(client, slug) {
//   let cursor = null;
//   const data = await client.request(AllCardsFromUser, {
//     slug,
//     cursor,
//   });
//   return data
// }

// async function getAllCards(client) {
//   const data = await client.request(AllCards);
//   return data
// }

// async function getAllBaseballCards(client, slug) {
//   const data = await client.request(getprice,{
//     slug : slug
//   });
//   return data
// // }

// // module.exports = getAllcardsFromUser
// // module.exports = getAllCards
// module.exports = {
//   getAllBaseballCards,
//   getAllCards,
//   getAllcardsFromUser
// }