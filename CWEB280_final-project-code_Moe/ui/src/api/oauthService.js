// oauthService.js intended to enforce structure to api calls meant to get authentication tokens from api
import {fetchCallToAPI} from "./apiService.js";

const URL_OAUTH_API = `${import.meta.env.VITE_OAUTH_BASE}`

/**
 * Gets JWT and UserInfo from the oauth section of api endpoints specifically google callback endpoint
 * @param googleResponse response object received after user signs into Google
 * @returns {token:string, userInfo:object, fetchError:string}
 */
export async function authenticateWithAPIGoogleCallback(googleResponse){
    // convert google response into query string to append to api url
    const queryString = new URLSearchParams(googleResponse);
    // call api with url customized to the google callback api endpoint
    return fetchCallToAPI(`${URL_OAUTH_API}/google/callback?${queryString}`);
}