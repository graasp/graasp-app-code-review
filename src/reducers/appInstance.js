import _ from 'lodash';
import {
  GET_APP_INSTANCE_FAILED,
  GET_APP_INSTANCE_SUCCEEDED,
  PATCH_APP_INSTANCE_FAILED,
  PATCH_APP_INSTANCE_SUCCEEDED,
  FLAG_PATCHING_APP_INSTANCE,
  FLAG_GETTING_APP_INSTANCE,
} from '../types';
import { showErrorToast } from '../utils/toasts';
import {
  DEFAULT_HELP_WANTED_ONLY_SETTING,
  DEFAULT_PROGRAMMING_LANGUAGE,
  DEFAULT_ALLOW_COMMENTS_SETTING,
  DEFAULT_ALLOW_REPLIES_SETTING,
  DEFAULT_CODE_CONTENT_SETTING,
  DEFAULT_HEADER_VISIBLE_SETTING,
  DEFAULT_PROGRAMMING_LANGUAGE,
  DEFAULT_SHOW_EDIT_BUTTON_SETTING,
  DEFAULT_SHOW_VERSION_NAVIGATION_SETTING,
  DEFAULT_SHOW_VISIBILITY_BUTTON_SETTING,
  DEFAULT_TOP_BAR_VISIBLE_SETTING,
  DEFAULT_VISIBILITY_MODE_SETTING,
} from '../config/settings';

export const DEFAULT_SETTINGS = {
  headerVisible: DEFAULT_HEADER_VISIBLE_SETTING,
  topBarVisible: DEFAULT_TOP_BAR_VISIBLE_SETTING,
  showVersionNav: DEFAULT_SHOW_VERSION_NAVIGATION_SETTING,
  showEditButton: DEFAULT_SHOW_EDIT_BUTTON_SETTING,
  showVisibility: DEFAULT_SHOW_VISIBILITY_BUTTON_SETTING,
  visibility: DEFAULT_VISIBILITY_MODE_SETTING,
  allowComments: DEFAULT_ALLOW_COMMENTS_SETTING,
  allowReplies: DEFAULT_ALLOW_REPLIES_SETTING,
  code: DEFAULT_CODE_CONTENT_SETTING,
  helpWantedOnly: DEFAULT_HELP_WANTED_ONLY_SETTING,
  programmingLanguage: DEFAULT_PROGRAMMING_LANGUAGE,
};

const INITIAL_STATE = {
  content: {
    settings: DEFAULT_SETTINGS,
  },
  ready: false,
  // array of flags to keep track of various actions
  activity: [],
};

export default (state = INITIAL_STATE, { payload, type }) => {
  switch (type) {
    case FLAG_GETTING_APP_INSTANCE:
    case FLAG_PATCHING_APP_INSTANCE:
      return {
        ...state,
        // when true append to array, when false, pop from it
        activity: payload
          ? [...state.activity, payload]
          : [...state.activity.slice(1)],
      };

    case GET_APP_INSTANCE_SUCCEEDED:
    case PATCH_APP_INSTANCE_SUCCEEDED:
      // back to defaults if payload is null or settings are empty
      if (!payload || !payload.settings || _.isEmpty(payload.settings)) {
        return {
          ...state,
          content: {
            ...state.content,
            settings: DEFAULT_SETTINGS,
          },
          // mark instance as ready
          ready: true,
        };
      }
      return {
        ...state,
        content: payload,
        // mark instance as ready
        ready: true,
      };

    case PATCH_APP_INSTANCE_FAILED:
    case GET_APP_INSTANCE_FAILED:
      // show error to user
      showErrorToast(payload);
      return state;

    default:
      return state;
  }
};
