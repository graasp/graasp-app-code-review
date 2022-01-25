// import { refractor } from 'refractor';
import { tokenize, markEdits } from 'react-diff-view';

export default ({ hunks, programmingLanguage }) => {
  if (!hunks) {
    return undefined;
  }

  const options = {
    // todo: hijack highlight function or make compatible with refractor
    // refractor: {
    //   highlight: (text, language) => {
    //     const h = Prism.highlight(text, Prism.languages[language], language);
    //     console.log(h);
    //     return h;
    //   },
    // },
    // highlight: true,
    language: programmingLanguage,
    enhancers: [markEdits(hunks, { type: 'block' })],
  };

  try {
    return tokenize(hunks, options);
  } catch (ex) {
    return undefined;
  }
};
