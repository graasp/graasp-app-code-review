import { max, min } from 'lodash/math';
import { BOT_COMMENT, BOT_USER } from '../config/appInstanceResourceTypes';

const DEFAULT_STEP = {
  id: null,
  referer: [],
  match: '',
  text: '',
  options: [],
};
const DEFAULT_VALIDATOR_MESSAGE = 'Valid Personality!';
const VALIDATOR_ERROR = 'error';
const VALIDATOR_SUCCESS = 'success';
const DEFAULT_PERSONALITY_START_KEY = 'start';
const DEFAULT_PERSONALITY_FALLBACK_KEY = 'fallback';
const DEFAULT_PERSONALITY_END_KEY = 'end';
const DEFAULT_PERSONALITY_MATCH_KEY = 'match';
const DEFAULT_PERSONALITY_TEXT_KEY = 'text';
const DEFAULT_PERSONALITY_OPTIONS_KEY = 'options';
const DEFAULT_PERSONALITY_STEP_KEYS = [
  DEFAULT_PERSONALITY_MATCH_KEY,
  DEFAULT_PERSONALITY_TEXT_KEY,
  DEFAULT_PERSONALITY_OPTIONS_KEY,
];
const DEFAULT_PERSONALITY_JSON = {
  start: {
    id: 0,
    text: 'Ask me about:',
    options: ['option 1', 'option 2'],
  },
  steps: [
    {
      id: 1,
      referer: [0],
      match: '1',
      text: 'You chose option 1! Now you can ask about:',
      options: ['the weather', 'my lovely dog'],
    },
    {
      id: 2,
      referer: [0],
      match: '2',
      text: 'You chose option 2!',
      options: [],
    },
    {
      id: 3,
      referer: [1],
      match: 'dog',
      text: 'My dog is a German Shepherd',
      options: [],
    },
    {
      id: 4,
      referer: [1],
      match: 'weather',
      text: 'I heard it is going to rain tomorrow',
      options: [],
    },
    {
      id: 5,
      referer: [0, 1, 2, 3, 4],
      match: 'help',
      text: 'I can help you!',
      options: [],
    },
  ],
  fallback: {
    text: 'Sorry, I could not understand what you meant.',
  },
  end: {
    text:
      "We've arrived to the end of this interaction. I don't have anything else to say.\n\n" +
      'If you want to restart this conversation, please reply to the first comment I added in this thread.',
  },
};

// this is used to join the options of a step and display them as a list
const DEFAULT_PERSONALITY_OPTION_SEPARATOR = '\n- ';
// this is used to join the fallback text with the previous option text
const DEFAULT_PERSONALITY_FALLBACK_SEPARATOR = '\n\n';
// timeout value per character in ms
const TIMEOUT_PER_CHAR = 50;
// minimum timeout value in ms
const DEFAULT_MIN_TIMEOUT_VAL = 2000;
const DEFAULT_MAX_TIMEOUT_VAL = 10000;

const stringifyPersonality = (personality) =>
  JSON.stringify(personality, null, 2);

const parsePersonality = (personality) => JSON.parse(personality);

const addEmptyStep = (personality) => {
  let personalityObj = personality;
  if (typeof personality === 'string') {
    personalityObj = parsePersonality(personality);
  }
  return {
    ...personalityObj,
    steps: [...personalityObj.steps, DEFAULT_STEP],
  };
};

// only return the text without the bullet points
const getFormattedOptionText = (step) => step.text;
// [step.text, ...step.options].join(DEFAULT_PERSONALITY_OPTION_SEPARATOR);

const getBotPersonality = (bot) => JSON.parse(bot.data.personality);

const getFallbackOptionText = (personality, id) => {
  let personalityObj = personality;
  if (typeof personality === 'string') {
    personalityObj = parsePersonality(personality);
  }
  let step = personalityObj.steps.find((m) => m.id === id);
  if (!step) {
    step = personalityObj.start;
  }
  return `${
    personalityObj.fallback.text
  }${DEFAULT_PERSONALITY_FALLBACK_SEPARATOR}${getFormattedOptionText(step)}`;
};

const getDefaultOptionText = (personality) => {
  let personalityObj = personality;
  if (typeof personality === 'string') {
    personalityObj = parsePersonality(personality);
  }
  return {
    content: getFormattedOptionText(personalityObj.start),
    optionId: personalityObj.start.id,
    options: personalityObj.start.options,
  };
};

const validatePersonality = (personality) => {
  let personalityObj = personality;
  // try to parse the object
  if (typeof personality === 'string') {
    personalityObj = parsePersonality(personality);
  }
  // check that there is a start
  // eslint-disable-next-line no-prototype-builtins
  if (!personalityObj.hasOwnProperty(DEFAULT_PERSONALITY_START_KEY)) {
    throw Error(`Missing '${DEFAULT_PERSONALITY_START_KEY}' key`);
  }
  // check that there is a fallback
  // eslint-disable-next-line no-prototype-builtins
  if (!personalityObj.hasOwnProperty(DEFAULT_PERSONALITY_FALLBACK_KEY)) {
    throw Error(`Missing '${DEFAULT_PERSONALITY_FALLBACK_KEY}' key`);
  }
  // check that there is an end key
  // eslint-disable-next-line no-prototype-builtins
  if (!personalityObj.hasOwnProperty(DEFAULT_PERSONALITY_END_KEY)) {
    throw Error(`Missing '${DEFAULT_PERSONALITY_END_KEY}' key`);
  }
  personalityObj.steps.forEach((step) => {
    DEFAULT_PERSONALITY_STEP_KEYS.forEach((key) => {
      // eslint-disable-next-line no-prototype-builtins
      if (!step.hasOwnProperty(key)) {
        throw Error(`Missing '${key}' key`);
      }
    });
    if (!Array.isArray(step.options)) {
      throw Error(`'options' property must be an array`);
    }
  });
};

const getTimeOutValue = (responseText) => {
  const timeout = responseText.length * TIMEOUT_PER_CHAR;
  return min([
    max([timeout, DEFAULT_MIN_TIMEOUT_VAL]),
    DEFAULT_MAX_TIMEOUT_VAL,
  ]);
};

const handleAutoResponse = (commentId, comment, getState) => {
  const { context, appInstanceResources } = getState();
  const botComments = appInstanceResources.content.filter(
    (r) => r.type === BOT_COMMENT,
  );
  const botUsers = appInstanceResources.content.filter(
    (r) => r.type === BOT_USER,
  );
  const { userId } = context;

  // find if parent comment is a bot comment
  const parentComment = botComments.find((c) => c._id === comment.data.parent);
  // find author bot of parent comment
  const botAuthor = parentComment
    ? botUsers.find((bot) => bot._id === parentComment.data.botId)
    : null;

  if (botAuthor && botAuthor.data.autoBot) {
    // get the matching option
    const personality = getBotPersonality(botAuthor);
    // filter only the options that are reachable
    const prevCommentOptionId = parentComment.data.optionId;
    const prevCommentStep = personality.steps.find(
      (m) => m.id === prevCommentOptionId,
    );
    const availableOptions = personality.steps.filter((m) =>
      m.referer.includes(prevCommentOptionId),
    );

    let responseText = getFallbackOptionText(personality, prevCommentOptionId);
    let optionId = prevCommentOptionId;
    let isEnd = false;
    let chosenOption = null;

    if (prevCommentStep && !prevCommentStep.options.length) {
      responseText = personality.end.text;
      isEnd = true;
    } else if (availableOptions.length) {
      // find an option that matches its regex against the comment content
      chosenOption = availableOptions.find((m) =>
        comment.data.content.match(new RegExp(m.match, 'gim')),
      );
      if (chosenOption) {
        optionId = chosenOption.id;
        responseText = getFormattedOptionText(chosenOption);
      }
    }
    // create comment
    return {
      data: {
        ...comment.data,
        parent: commentId,
        content: `> *${comment.data.content.trim()}*\n\n${responseText}`,
        botId: botAuthor._id,
        optionId,
        // add an end property if the optionId is negative
        ...(isEnd ? { end: true } : null),
        options: chosenOption ? chosenOption.options : null,
        thinking: getTimeOutValue(responseText),
      },
      type: BOT_COMMENT,
      userId,
    };
  }
  // exit as we do not have to respond
  return null;
};

export {
  DEFAULT_STEP,
  DEFAULT_PERSONALITY_JSON,
  DEFAULT_PERSONALITY_OPTION_SEPARATOR,
  DEFAULT_VALIDATOR_MESSAGE,
  VALIDATOR_ERROR,
  VALIDATOR_SUCCESS,
  stringifyPersonality,
  validatePersonality,
  addEmptyStep,
  getFormattedOptionText,
  getDefaultOptionText,
  handleAutoResponse,
};
