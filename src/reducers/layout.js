import {
  OPEN_SETTINGS,
  CLOSE_SETTINGS,
  CLOSE_AVATAR_DIALOG,
  OPEN_AVATAR_DIALOG,
  SET_SELECTED_STUDENT,
  SET_SELECTED_BOT,
  OPEN_FEEDBACK_VIEW,
  CLOSE_FEEDBACK_VIEW,
} from '../types';

const INITIAL_STATE = {
  settings: {
    open: false,
  },
  avatarDialog: {
    open: false,
  },
  feedbackView: {
    open: false,
  },
  selectedStudent: null,
  selectedBot: null,
};

export default (state = INITIAL_STATE, { payload, type }) => {
  switch (type) {
    case OPEN_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          open: true,
        },
      };
    case CLOSE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          open: false,
        },
      };
    case OPEN_AVATAR_DIALOG:
      return {
        ...state,
        avatarDialog: {
          ...state.avatarDialog,
          open: true,
        },
      };
    case CLOSE_AVATAR_DIALOG:
      return {
        ...state,
        avatarDialog: {
          ...state.avatarDialog,
          open: false,
        },
      };
    case OPEN_FEEDBACK_VIEW:
      return {
        ...state,
        feedbackView: {
          ...state.feedbackView,
          open: true,
        },
      };
    case CLOSE_FEEDBACK_VIEW:
      return {
        ...state,
        feedbackView: {
          ...state.feedbackView,
          open: false,
        },
      };
    case SET_SELECTED_STUDENT:
      return {
        ...state,
        selectedStudent: payload,
      };
    case SET_SELECTED_BOT:
      return {
        ...state,
        selectedBot: payload,
      };
    default:
      return state;
  }
};
