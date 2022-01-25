import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { withStyles } from '@material-ui/core/styles';
import CodeReview from '../../common/CodeReview';
import DiffView from '../../common/DiffView';
import { DEFAULT_VIEW, DIFF_VIEW } from '../../../config/views';
import { DEFAULT_PROGRAMMING_LANGUAGE } from '../../../config/settings';

const styles = (theme) => ({
  main: {
    textAlign: 'center',
    margin: theme.spacing(),
  },
  message: {
    padding: theme.spacing(),
    backgroundColor: theme.status.danger.background[500],
    color: theme.status.danger.color,
    marginBottom: theme.spacing(2),
  },
});

export const StudentView = ({ view, programmingLanguage }) => {
  switch (view) {
    case DIFF_VIEW:
      return <DiffView programmingLanguage={programmingLanguage} />;

    case DEFAULT_VIEW:
    default:
      return <CodeReview />;
  }
};

StudentView.propTypes = {
  view: PropTypes.string,
  programmingLanguage: PropTypes.string,
};

StudentView.defaultProps = {
  view: DEFAULT_VIEW,
  programmingLanguage: DEFAULT_PROGRAMMING_LANGUAGE,
};

const mapStateToProps = ({ layout, appInstance }) => {
  const { view } = layout;
  const {
    content: {
      settings: { programmingLanguage },
    },
  } = appInstance;

  return {
    view,
    programmingLanguage,
  };
};

const StyledComponent = withStyles(styles)(StudentView);

const TranslatedComponent = withTranslation()(StyledComponent);

const connectedComponent = connect(mapStateToProps)(TranslatedComponent);

export default connectedComponent;
