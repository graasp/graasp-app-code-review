// here you define the types of app instance resources you have
export const COMMENT = 'comment';
export const BOT_COMMENT = 'bot_comment';
export const TEACHER_COMMENT = 'teacher_comment';
export const BOT_USER = 'bot';
export const CODE = 'code';
export const REACTION = 'reaction';
export const FLAG = 'flag';

// Combine comments that are associated to user resources
export const USER_COMMENT_TYPES = [COMMENT, TEACHER_COMMENT];
export const ALL_COMMENT_TYPES = [COMMENT, TEACHER_COMMENT, BOT_COMMENT];
