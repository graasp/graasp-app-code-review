import React from 'react';
import { uniqueId } from 'lodash';
import sha from 'sha1';
import { parseDiff, Diff, Hunk } from 'react-diff-view';
import { formatLines, diffLines } from 'unidiff';
import 'react-diff-view/style/index.css';

// creates fake indices
const fakeIndex = () => sha(uniqueId()).slice(0, 9);

// this creates the diff between the two sources
const createDiff = ({ oldSource, newSource }) => {
  const diffText = formatLines(diffLines(oldSource, newSource), { context: 3 });
  return {
    diff: diffText,
    source: oldSource,
  };
};

// this puts it in a format that can be rendered by the diff view
const createSnippetDiff = ({ diff }) => {
  const segments = [
    'diff --git a/a b/b',
    `index ${fakeIndex()}..${fakeIndex()} 100644`,
    diff,
  ];
  const [file] = parseDiff(segments.join('\n'), { nearbySequences: 'zip' });
  return file;
};

function DiffView() {
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

  // prepare diff
  const d = createDiff({ oldSource, newSource });

  // prepare snippet
  const snippet = createSnippetDiff(d);

  // this renders the diff view of the snippet
  const renderSnippetDiff = ({ oldRevision, newRevision, type, hunks }) => (
    <Diff
      key={`${oldRevision}-${newRevision}`}
      viewType="split"
      diffType={type}
      hunks={hunks}
      oldSource={oldSource}
    >
      {(hs) => hs.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
    </Diff>
  );

  return <div>{renderSnippetDiff(snippet)}</div>;
}

export default DiffView;
