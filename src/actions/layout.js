import {
  CLOSE_AVATAR_DIALOG,
  CLOSE_COMMIT_INFO_DIALOG,
  CLOSE_EDITOR_VIEW,
  CLOSE_FEEDBACK_VIEW,
  CLOSE_SETTINGS,
  OPEN_AVATAR_DIALOG,
  OPEN_COMMIT_INFO_DIALOG,
  OPEN_EDITOR_VIEW,
  OPEN_FEEDBACK_VIEW,
  OPEN_SETTINGS,
  SET_AVATAR_ID,
  SET_CODE_EDITOR_SETTINGS,
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

const setAvatarId =
  ({ avatarId }) =>
  (dispatch) =>
    dispatch({
      type: SET_AVATAR_ID,
      payload: avatarId,
    });

const openCommitInfoDialog = () => (dispatch) =>
  dispatch({
    type: OPEN_COMMIT_INFO_DIALOG,
  });

const closeCommitInfoDialog = () => (dispatch) =>
  dispatch({
    type: CLOSE_COMMIT_INFO_DIALOG,
  });

const openFeedbackView = () => (dispatch) =>
  dispatch({
    type: OPEN_FEEDBACK_VIEW,
  });

const closeFeedbackView = () => (dispatch) =>
  dispatch({
    type: CLOSE_FEEDBACK_VIEW,
  });

const openEditorView = () => (dispatch) =>
  dispatch({
    type: OPEN_EDITOR_VIEW,
  });

const closeEditorView = () => (dispatch) =>
  dispatch({
    type: CLOSE_EDITOR_VIEW,
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

const setCodeEditorSettings = (data) => (dispatch) =>
  dispatch({
    type: SET_CODE_EDITOR_SETTINGS,
    payload: data,
  });

export {
  openSettings,
  closeSettings,
  openAvatarDialog,
  closeAvatarDialog,
  setAvatarId,
  openCommitInfoDialog,
  closeCommitInfoDialog,
  openFeedbackView,
  closeFeedbackView,
  openEditorView,
  closeEditorView,
  setSelectedStudent,
  setSelectedBot,
  setCodeEditorSettings,
};
