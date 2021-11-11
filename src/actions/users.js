import { flag, getApiContext, isErrorResponse, postMessage } from './common';
import {
  FLAG_GETTING_USERS,
  GET_USERS,
  GET_USERS_FAILED,
  GET_USERS_SUCCEEDED,
} from '../types';
import {
  DEFAULT_GET_REQUEST,
  JSON_GET_REQUEST,
  PICTURES_ENDPOINT,
  SPACES_ENDPOINT,
  USERS_ENDPOINT,
} from '../config/api';
import { GRAASP_MAIN_DOMAIN, GRAASP_USER_TYPE } from '../config/settings';

const flagGettingUsers = flag(FLAG_GETTING_USERS);

const getUsers = async () => async (dispatch, getState) => {
  dispatch(flagGettingUsers(true));
  try {
    const { spaceId, apiHost, offline, standalone } = getApiContext(getState);

    // if standalone, you cannot connect to api
    if (standalone) {
      return false;
    }

    // if offline send message to parent requesting resources
    if (offline) {
      return postMessage({
        type: GET_USERS,
      });
    }

    const url = `//${apiHost + SPACES_ENDPOINT}/${spaceId}/${USERS_ENDPOINT}`;

    const response = await fetch(url, DEFAULT_GET_REQUEST);

    // throws if it is an error
    await isErrorResponse(response);

    const simpleUsers = await response.json();

    const graaspUsers = simpleUsers.filter(
      (user) => user.type === GRAASP_USER_TYPE,
    );
    const lightUsers = simpleUsers.filter(
      (user) => user.type !== GRAASP_USER_TYPE,
    );

    const graaspUsersWithPictures = await Promise.all(
      graaspUsers.map(async (user) => {
        // fetch the user info
        const infoUrl = `${GRAASP_MAIN_DOMAIN + USERS_ENDPOINT}/${user.id}`;
        const userResponse = await fetch(infoUrl, JSON_GET_REQUEST);
        await isErrorResponse(userResponse);
        const graaspUserInfo = await userResponse.json();
        return {
          ...user,
          picture: `${GRAASP_MAIN_DOMAIN + PICTURES_ENDPOINT}/${
            user.id
          }/medium_${graaspUserInfo.picture}`,
        };
      }),
    );

    // assemble both list of users
    const finalUsers = [...graaspUsersWithPictures, ...lightUsers];
    return dispatch({
      type: GET_USERS_SUCCEEDED,
      payload: finalUsers,
    });
  } catch (err) {
    return dispatch({
      type: GET_USERS_FAILED,
      payload: err,
    });
  } finally {
    dispatch(flagGettingUsers(false));
  }
};

export {
  // todo: remove when more exports are here
  // eslint-disable-next-line import/prefer-default-export
  getUsers,
};
