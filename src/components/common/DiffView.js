import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Grid } from '@material-ui/core';
import { parseDiff, Diff, Hunk } from 'react-diff-view';
import { formatLines, diffLines } from 'unidiff';
import tokenize from '../../utils/tokenize';
import 'react-diff-view/style/index.css';
import 'prismjs/themes/prism.css';
import { DEFAULT_PROGRAMMING_LANGUAGE } from '../../config/settings';

const renderToken = (token, defaultRender, i) => {
  switch (token.type) {
    case 'space':
      return (
        <span key={i} className="space">
          {token.children &&
            token.children.map((t, j) => renderToken(t, defaultRender, j))}
        </span>
      );
    default:
      return defaultRender(token, i);
  }
};

function DiffView({ programmingLanguage }) {
  const oldSource =
    'const d = ({ oldSource, newSource }) => {\n' +
    '  const diffText = formatLines(diffLines(oldSource, newSource), {context: 3});\n' +
    '  const data = {\n' +
    '    diff: diffText,\n' +
    '    source: oldSource,\n' +
    '  };\n' +
    '  return data;\n' +
    '};';
  const newSource =
    'const d = ({ oldSource, newSource }) => {\n' +
    '  const dext = formatLines(diffLines(oldSource, newSource), {context: 3});\n' +
    '  const d = {\n' +
    '    diff: dext,\n' +
    '    source: oldSource,\n' +
    '  };\n' +
    '  return dd;\n' +
    '};';

  const [{ type, hunks }, setDiff] = useState('');
  const updateDiffText = useCallback(() => {
    const diffText = formatLines(diffLines(oldSource, newSource), {
      context: 3,
    });
    const [diff] = parseDiff(diffText, { nearbySequences: 'zip' });
    setDiff(diff);
  }, [oldSource, newSource, setDiff]);
  const tokens = useMemo(
    () => tokenize({ hunks, programmingLanguage }),
    [hunks],
  );

  return (
    <>
      <Diff
        viewType="split"
        diffType={type}
        hunks={hunks || []}
        tokens={tokens}
        renderToken={renderToken}
      >
        {(hunkList) =>
          hunkList.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
        }
      </Diff>
      <Grid container justifyContent="center" alignItems="center">
        <Grid item>
          <Button variant="outlined" color="primary" onClick={updateDiffText}>
            GENERATE DIFF
          </Button>
        </Grid>
      </Grid>
    </>
  );
}

DiffView.propTypes = {
  programmingLanguage: PropTypes.string,
};

DiffView.defaultProps = {
  programmingLanguage: DEFAULT_PROGRAMMING_LANGUAGE,
};

export default DiffView;
