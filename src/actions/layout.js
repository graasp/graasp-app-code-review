import {
  CLOSE_AVATAR_DIALOG,
  CLOSE_SETTINGS,
  OPEN_AVATAR_DIALOG,
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
    type: OPEN_AVATAR_DIALOG,
  });

const closeAvatarDialog = () => (dispatch) =>
  dispatch({
    type: CLOSE_AVATAR_DIALOG,
  });

export { openSettings, closeSettings, openAvatarDialog, closeAvatarDialog };
