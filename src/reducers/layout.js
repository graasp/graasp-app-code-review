import {
  OPEN_SETTINGS,
  CLOSE_SETTINGS,
  CLOSE_AVATAR_DIALOG,
  OPEN_AVATAR_DIALOG,
} from '../types';

const INITIAL_STATE = {
  settings: {
    open: false,
  },
  avatarDialog: {
    open: false,
  },
};

export default (state = INITIAL_STATE, { type }) => {
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
    default:
      return state;
  }
};
