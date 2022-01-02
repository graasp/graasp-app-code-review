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
export const JSON_LANG = 'json';
export const DEFAULT_PROGRAMMING_LANGUAGE = PYTHON;

export const DEFAULT_USER = 'Anonymous';
export const DEFAULT_CODE_ID = 'Instructor';

// time to wait in ms
export const ADAPT_HEIGHT_TIMEOUT = 50;

// special id for newly created comments
export const NEW_COMMENT_ID = '';

// default comment
export const DEFAULT_COMMENT_CONTENT = { content: '' };
export const DEFAULT_COMMENT_HIDDEN_STATE = false;

// default commit message
export const DEFAULT_COMMIT_MESSAGE = '';
// default commit message length (in char)
export const DEFAULT_MAX_COMMIT_MESSAGE_LENGTH = 72;
export const DEFAULT_TRUNCATION_COMMIT_MESSAGE_LENGTH = 15;
export const COMMIT_MESSAGE_TOO_LONG = `Great commit summaries contain fewer than ${DEFAULT_MAX_COMMIT_MESSAGE_LENGTH} characters. Place extra information in the extended description.`;
export const DEFAULT_WARNING_COLOR = '#f3974d';
export const PLACEHOLDER_DATE = '2021-12-18T14:41:04.881Z';
// make this configurable by the teacher
export const DEFAULT_INSTRUCTOR_COMMIT_INFO = [
  {
    label: 'Author',
    value: 'Instructor',
  },
  {
    label: 'Message',
    value: 'Initial code',
  },
  {
    label: 'Description',
    value: 'This is the initial code set by the instructor.',
  },
];

// default text to display when comment is deleted but has active children
export const DELETED_COMMENT_TEXT = '[DELETED]';

// user type
export const GRAASP_USER_TYPE = 'graasp';

// main domain
export const GRAASP_MAIN_DOMAIN = 'https://graasp.eu/';
