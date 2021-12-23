import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import CodeReview from './CodeReview';
import CodeEditor from './CodeEditor';

function CodeReviewContainer({ editorOpen }) {
  return editorOpen ? <CodeEditor /> : <CodeReview />;
}

CodeReviewContainer.propTypes = {
  editorOpen: PropTypes.bool.isRequired,
};

const mapStateToProps = ({ layout }) => ({
  editorOpen: layout.editorView.open,
});

const ConnectedComponent = connect(mapStateToProps)(CodeReviewContainer);

export default ConnectedComponent;
