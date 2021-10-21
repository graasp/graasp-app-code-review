import {
  CLOSE_AVATAR_SETTINGS,
  CLOSE_SETTINGS,
  OPEN_AVATAR_SETTINGS,
  OPEN_SETTINGS,
} from '../types';

const openSettings = () => (dispatch) =>
  dispatch({
    type: OPEN_SETTINGS,
  });

const closeSettings = () => (dispatch) =>
  dispatch({
    type: CLOSE_SETTINGS,
  });

const openAvatarDialog = () => (dispatch) =>
  dispatch({
    type: OPEN_AVATAR_SETTINGS,
  });

const closeAvatarDialog = () => (dispatch) =>
  dispatch({
    type: CLOSE_AVATAR_SETTINGS,
  });

export { openSettings, closeSettings, openAvatarDialog, closeAvatarDialog };
