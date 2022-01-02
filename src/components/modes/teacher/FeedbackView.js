import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import {
  patchAppInstanceResource,
  postAppInstanceResource,
  deleteAppInstanceResource,
  setSelectedStudent,
  closeFeedbackView,
} from '../../../actions';
import { BOT_USER } from '../../../config/appInstanceResourceTypes';
import CodeReview from '../../common/CodeReview';

export class FeedbackView extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    classes: PropTypes.shape({
      root: PropTypes.string,
      grid: PropTypes.string,
      paper: PropTypes.string,
      main: PropTypes.string,
      button: PropTypes.string,
    }).isRequired,
    // dispatchGetUsers: PropTypes.func.isRequired,
    dispatchCloseFeedbackView: PropTypes.func.isRequired,
    dispatchSetSelectedStudent: PropTypes.func.isRequired,
    selectedStudent: PropTypes.string,
    studentName: PropTypes.string,
  };

  static defaultProps = {
    selectedStudent: null,
    studentName: '',
  };

  static styles = (theme) => ({
    root: {
      width: '100%',
      marginTop: theme.spacing(3),
      overflowX: 'auto',
    },
    main: {
      textAlign: 'center',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: theme.spacing(),
      marginBottom: theme.spacing(),
    },
    grid: {},
    button: {
      marginTop: theme.spacing(1),
      marginRight: theme.spacing(2),
    },
    paper: {},
  });

  state = {};

  handleClose = () => {
    const { dispatchCloseFeedbackView, dispatchSetSelectedStudent } =
      this.props;
    dispatchSetSelectedStudent({ selectedStudent: null });
    dispatchCloseFeedbackView();
  };

  render() {
    const { open, t, studentName, selectedStudent } = this.props;

    return (
      <Dialog
        open={open}
        onClose={this.handleClose}
        scroll="body"
        maxWidth="lg"
      >
        <DialogTitle>{t('Viewing comments from ') + studentName}</DialogTitle>
        <DialogContent>
          <CodeReview isFeedbackView selectedStudent={selectedStudent} />
        </DialogContent>
        <DialogActions>
          <Button color="primary" variant="outlined" onClick={this.handleClose}>
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

// get the app instance resources that are saved in the redux store
const mapStateToProps = ({ users, appInstanceResources, layout }) => {
  const studentName = users.content.find(
    (u) => u.id === layout.selectedStudent,
  )?.name;
  return {
    // we transform the list of students in the database
    // to the shape needed by the select component
    botOptions: appInstanceResources.content
      .filter((res) => res.type === BOT_USER)
      .map(({ _id, data }) => ({
        value: _id,
        label: data.name,
      })),
    selectedStudent: layout.selectedStudent,
    studentName,
    appInstanceResources: appInstanceResources.content,
    open: layout.feedbackView.open,
  };
};

// allow this component to dispatch a post
// request to create an app instance resource
const mapDispatchToProps = {
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchPatchAppInstanceResource: patchAppInstanceResource,
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
  dispatchCloseFeedbackView: closeFeedbackView,
  dispatchSetSelectedStudent: setSelectedStudent,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(FeedbackView);

const StyledComponent = withStyles(FeedbackView.styles)(ConnectedComponent);

export default withTranslation()(StyledComponent);
