import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import './TeacherView.css';
import { Close } from '@material-ui/icons';
import { IconButton } from '@material-ui/core';
import {
  patchAppInstanceResource,
  postAppInstanceResource,
  deleteAppInstanceResource,
  patchAppInstance,
  getUsers,
} from '../../../actions';
import { BOT_USER } from '../../../config/appInstanceResourceTypes';
import CodeReview from '../../common/CodeReview';
import { addQueryParamsToUrl } from '../../../utils/url';
import { DEFAULT_VIEW } from '../../../config/views';

export class FeedbackView extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    classes: PropTypes.shape({
      root: PropTypes.string,
      select: PropTypes.string,
      grid: PropTypes.string,
      table: PropTypes.string,
      main: PropTypes.string,
      button: PropTypes.string,
      message: PropTypes.string,
      fab: PropTypes.string,
    }).isRequired,
    dispatchGetUsers: PropTypes.func.isRequired,
    dispatchPatchAppInstance: PropTypes.func.isRequired,
    settings: PropTypes.shape({
      selectedStudent: PropTypes.string.isRequired,
    }).isRequired,
    studentName: PropTypes.string,
  };

  static defaultProps = {
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
    select: {
      margin: 'auto',
      maxWidth: 300,
    },
    button: {
      marginTop: theme.spacing(1),
      marginRight: theme.spacing(2),
    },
    table: {
      minWidth: 700,
    },
    message: {
      padding: theme.spacing(),
      backgroundColor: theme.status.danger.background[500],
      color: theme.status.danger.color,
      marginBottom: theme.spacing(2),
    },
    fab: {
      margin: theme.spacing(),
      position: 'fixed',
      top: theme.spacing(2),
      right: theme.spacing(2),
    },
  });

  state = {};

  constructor(props) {
    super(props);
    const { dispatchGetUsers } = this.props;
    dispatchGetUsers();
  }

  handleChangeBot = (value) => {
    const { settings, dispatchPatchAppInstance } = this.props;
    dispatchPatchAppInstance({
      data: { ...settings, selectedBot: value },
    });
  };

  render() {
    // extract properties from the props object
    const {
      // this property allows us to do styling and is injected by withStyles
      classes,
      // this property allows us to do translations and is injected by i18next
      t,
      // these properties are injected by the redux mapStateToProps method
      // appInstanceResources,
      settings,
      studentName,
      dispatchPatchAppInstance,
    } = this.props;
    const { selectedStudent } = settings;

    return (
      <>
        <IconButton
          color="primary"
          aria-label={t('Close')}
          className={classes.button}
          onClick={() => {
            dispatchPatchAppInstance({
              data: {
                ...settings,
                selectedStudent: null,
              },
            });
          }}
          href={`index.html${addQueryParamsToUrl({ view: DEFAULT_VIEW })}`}
        >
          <Close />
        </IconButton>
        <Grid container spacing={1} direction="column">
          <Grid item xs={12} className={classes.main}>
            <Typography variant="h6" color="inherit">
              {t('Viewing comments from ') + studentName}
            </Typography>
          </Grid>
          <CodeReview isFeedbackView selectedStudent={selectedStudent} />
        </Grid>
      </>
    );
  }
}

// get the app instance resources that are saved in the redux store
const mapStateToProps = ({ users, appInstance, appInstanceResources }) => {
  const { settings } = appInstance.content;
  const studentName = users.content.find(
    (u) => u.id === settings.selectedStudent,
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
    settings,
    studentName,
    appInstanceResources: appInstanceResources.content,
  };
};

// allow this component to dispatch a post
// request to create an app instance resource
const mapDispatchToProps = {
  dispatchGetUsers: getUsers,
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchPatchAppInstanceResource: patchAppInstanceResource,
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
  dispatchPatchAppInstance: patchAppInstance,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(FeedbackView);

const StyledComponent = withStyles(FeedbackView.styles)(ConnectedComponent);

export default withTranslation()(StyledComponent);
