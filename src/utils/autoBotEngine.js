import { BOT_COMMENT, BOT_USER } from '../config/appInstanceResourceTypes';

const DEFAULT_STEP = {
  regex: '',
  text: '',
  options: [],
};

const DEFAULT_PERSONALITY_SEED_KEY = 'seed';
const DEFAULT_PERSONALITY_FALLBACK_KEY = 'fallback';
const DEFAULT_PERSONALITY_JSON = {
  seed: {
    text: 'Ask me about :',
    options: ['option 1', 'option 2'],
  },
  steps: [
    {
      regex: '1',
      text: 'You chose option 1 ! Now you can ask about :',
      options: ['the weather', 'my lovely dog'],
    },
    {
      regex: '2',
      text: 'You chose option 2 !',
      options: [],
    },
    {
      regex: 'dog',
      text: 'My dog is a german shepard',
      options: [],
    },
    {
      regex: 'weather',
      text: 'I heard it is going to rain tomorrow',
      options: [],
    },
  ],
  fallback: {
    text: 'Sorry, i could not understand what you meant. ',
  },
};

const DEFAULT_PERSONALITY_OPTION_SEPARATOR = '\n- ';

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

const getFormattedOptionText = (step) =>
  [step.text, ...step.options].join(DEFAULT_PERSONALITY_OPTION_SEPARATOR);

const getBotPersonality = (bot) => JSON.parse(bot.data.personality);

const getFallbackOptionText = (personality) => {
  let personalityObj = personality;
  if (typeof personality === 'string') {
    personalityObj = parsePersonality(personality);
  }
  return (
    personalityObj.fallback.text + getFormattedOptionText(personalityObj.seed)
  );
};

const getDefaultOptionText = (personality) => {
  let personalityObj = personality;
  if (typeof personality === 'string') {
    personalityObj = parsePersonality(personality);
  }
  return getFormattedOptionText(personalityObj.seed);
};

const validatePersonality = (personality) => {
  let personalityObj = personality;
  if (typeof personality === 'string') {
    personalityObj = parsePersonality(personality);
  }
  // check that there is a seed
  // eslint-disable-next-line no-prototype-builtins
  if (!personalityObj.hasOwnProperty(DEFAULT_PERSONALITY_SEED_KEY)) {
    throw Error(`Missing '${DEFAULT_PERSONALITY_SEED_KEY}' key`);
  }
  // check that there is a fallback
  // eslint-disable-next-line no-prototype-builtins
  if (!personalityObj.hasOwnProperty(DEFAULT_PERSONALITY_FALLBACK_KEY)) {
    throw Error(`Missing '${DEFAULT_PERSONALITY_FALLBACK_KEY}' key`);
  }
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
    // find an option that matches it's regex against the comment content
    const chosenOption = personality.steps.find((m) =>
      comment.data.content.match(new RegExp(m.regex, 'gim')),
    );
    let responseText = getFallbackOptionText(personality);
    if (chosenOption) {
      responseText = getFormattedOptionText(chosenOption);
    }
    // create comment
    return {
      data: {
        ...comment.data,
        parent: commentId,
        content: `> *${comment.data.content}*\n\n${responseText}`,
        botId: botAuthor._id,
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
  stringifyPersonality,
  validatePersonality,
  addEmptyStep,
  getFormattedOptionText,
  getDefaultOptionText,
  handleAutoResponse,
};
