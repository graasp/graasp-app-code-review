import {
  OPEN_SETTINGS,
  CLOSE_SETTINGS,
  CLOSE_AVATAR_DIALOG,
  OPEN_AVATAR_DIALOG,
  SET_SELECTED_STUDENT,
  SET_SELECTED_BOT,
  OPEN_FEEDBACK_VIEW,
  CLOSE_FEEDBACK_VIEW,
  CLOSE_EDITOR_VIEW,
  OPEN_EDITOR_VIEW,
  SET_CODE_EDITOR_SETTINGS,
} from '../types';
import { DEFAULT_CODE_ID } from '../config/settings';

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
  editorView: {
    open: false,
  },
  selectedStudent: null,
  selectedBot: null,
  codeEditorSettings: {
    code: null,
    codeId: DEFAULT_CODE_ID,
  },
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
    case OPEN_EDITOR_VIEW:
      return {
        ...state,
        editorView: {
          ...state.editorView,
          open: true,
        },
      };
    case CLOSE_EDITOR_VIEW:
      return {
        ...state,
        editorView: {
          ...state.editorView,
          open: false,
        },
      };
    case SET_CODE_EDITOR_SETTINGS:
      return {
        ...state,
        codeEditorSettings: {
          ...state.codeEditorSettings,
          ...payload,
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
