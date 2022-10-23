const { default: axios } = require("axios");
const { GraphQLClient, gql } = require("graphql-request");

const signIn=   gql`
mutation SignInMutation($input: signInInput!) {
    signIn(input: $input) {
      currentUser {
        slug
        jwtToken(aud: "totwsorare") {
          token
          expiredAt
        }
      }
      otpSessionChallenge
      errors {
        message
      }
    }
  }
`;

/**
 * Salt password using salt from sorare
 * and hash it using bcrypt
 * @param {*} password 
 */
async function saltPassword(email, password) {
    const salt = await axios.get(`https://api.sorare.com/api/v1/users/${email}`)
    const bcrypt = require('bcrypt');
    return bcrypt.hashSync(password, salt.data.salt)
}


/**
 * auth user
 * @param {string} email email
 * @param {string} password hashed password
 */
async function runSignIn(email, password) {
    const graphQLClient = new GraphQLClient("https://api.sorare.com/graphql");
    const saltedpass = await saltPassword(email, password)
    const data = await graphQLClient.request(signIn, {
        input: {
            otpSessionChallenge: "1f7aa494d7369066bbfa4edcf4590317",
            otpAttempt: "734089"
        },
    });
    console.log(data)
    return data.signIn.currentUser
}


module.exports = runSignIn