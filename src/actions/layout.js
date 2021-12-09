import {
  CLOSE_AVATAR_DIALOG,
  CLOSE_FEEDBACK_VIEW,
  CLOSE_SETTINGS,
  OPEN_AVATAR_DIALOG,
  OPEN_FEEDBACK_VIEW,
  OPEN_SETTINGS,
  SET_SELECTED_BOT,
  SET_SELECTED_STUDENT,
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

const openFeedbackView = () => (dispatch) =>
  dispatch({
    type: OPEN_FEEDBACK_VIEW,
  });

const closeFeedbackView = () => (dispatch) =>
  dispatch({
    type: CLOSE_FEEDBACK_VIEW,
  });

const setSelectedStudent =
  ({ selectedStudent }) =>
  (dispatch) =>
    dispatch({
      type: SET_SELECTED_STUDENT,
      payload: selectedStudent,
    });

const setSelectedBot =
  ({ selectedBot }) =>
  (dispatch) =>
    dispatch({
      type: SET_SELECTED_BOT,
      payload: selectedBot,
    });

export {
  openSettings,
  closeSettings,
  openAvatarDialog,
  closeAvatarDialog,
  openFeedbackView,
  closeFeedbackView,
  setSelectedStudent,
  setSelectedBot,
};
