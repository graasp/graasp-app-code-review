import React from 'react';
import { withTranslation } from 'react-i18next';
import { withStyles } from '@material-ui/core/styles';
import CodeReview from '../../common/CodeReview';

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

export const StudentView = () => <CodeReview isStudentView />;

StudentView.propTypes = {};

const StyledComponent = withStyles(styles)(StudentView);

export default withTranslation()(StyledComponent);
