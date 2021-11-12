import { LOCAL_API_HOST } from './api';

export const DEFAULT_LANG = 'en';
export const DEFAULT_MODE = 'student';

// avoid breaking the app in production when embedded in different contexts
let defaultApiHost;
try {
  defaultApiHost =
    window.parent.location.hostname === 'localhost' ? LOCAL_API_HOST : null;
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(e);
  defaultApiHost = null;
}

export const DEFAULT_API_HOST = defaultApiHost;

// we haven't decided what to call the teacher mode
export const TEACHER_MODES = ['teacher', 'producer', 'educator', 'admin'];
export const STUDENT_MODES = ['student', 'consumer', 'learner'];

export const PUBLIC_VISIBILITY = 'public';
export const PRIVATE_VISIBILITY = 'private';
export const DEFAULT_VISIBILITY = PRIVATE_VISIBILITY;

export const JAVASCRIPT = 'javascript';
export const PYTHON = 'python';
export const MATLAB = 'matlab';
export const DEFAULT_PROGRAMMING_LANGUAGE = PYTHON;

export const DEFAULT_USER = 'Anonymous';

// time to wait in ms
export const ADAPT_HEIGHT_TIMEOUT = 50;

// special id for newly created comments
export const NEW_COMMENT_ID = '';

// default text to display when comment is deleted but has active children
export const DELETED_COMMENT_TEXT = '[DELETED]';

// user type
export const GRAASP_USER_TYPE = 'graasp';

// main domain
export const GRAASP_MAIN_DOMAIN = 'https://graasp.eu/';
