import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import Fab from '@material-ui/core/Fab';
import SettingsIcon from '@material-ui/icons/Settings';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Delete, Visibility, VisibilityOff } from '@material-ui/icons';
import IconButton from '@material-ui/core/IconButton';
import { FormControlLabel, Switch, Tooltip } from '@material-ui/core';
import clsx from 'clsx';
import {
  openSettings,
  getUsers,
  deleteAppInstanceResource,
  postAction,
  patchAppInstanceResource,
  patchAppInstance,
} from '../../../actions';
import Settings from './Settings';
import { FLAG } from '../../../config/appInstanceResourceTypes';
import { CLEARED_FLAGGED_COMMENT } from '../../../config/verbs';
import {
  DEFAULT_PENDING_FLAGS_ONLY_SETTING,
  HIDDEN_FLAGGED_COMMENT,
  PENDING_FLAGGED_COMMENT,
} from '../../../config/settings';

export class ReportedView extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    dispatchOpenSettings: PropTypes.func.isRequired,
    classes: PropTypes.shape({
      root: PropTypes.string,
      table: PropTypes.string,
      main: PropTypes.string,
      button: PropTypes.string,
      hiddenFlag: PropTypes.string,
      fab: PropTypes.string,
    }).isRequired,
    dispatchGetUsers: PropTypes.func.isRequired,
    dispatchPatchAppInstance: PropTypes.func.isRequired,
    dispatchPatchAppInstanceResource: PropTypes.func.isRequired,
    dispatchDeleteAppInstanceResource: PropTypes.func.isRequired,
    dispatchPostAction: PropTypes.func.isRequired,
    // inside the shape method you should put the shape
    // that the resources your app uses will have
    reportedComments: PropTypes.arrayOf(
      PropTypes.shape({
        data: PropTypes.shape({
          comment: PropTypes.shape({
            // we need to specify number to avoid warnings with local server
            _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            user: PropTypes.string,
            data: PropTypes.shape({
              line: PropTypes.number,
              content: PropTypes.string,
            }),
          }),
          reason: PropTypes.string,
          state: PropTypes.string,
        }),
        user: PropTypes.string,
      }),
    ),
    students: PropTypes.arrayOf(
      PropTypes.shape({
        // we need to specify number to avoid warnings with local server
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
      }),
    ),
    settings: PropTypes.shape({
      pendingFlagsOnly: PropTypes.bool,
    }).isRequired,
  };

  static defaultProps = {
    reportedComments: [],
    students: [],
  };

  static styles = (theme) => ({
    root: {
      width: '100%',
      marginTop: theme.spacing(3),
      overflowX: 'auto',
    },
    main: {
      textAlign: 'center',
      margin: theme.spacing(),
    },
    button: {
      marginTop: theme.spacing(3),
    },
    table: {
      minWidth: 700,
    },
    hiddenFlag: {
      backgroundColor: '#e5e5e5',
    },
    fab: {
      margin: theme.spacing(),
      position: 'fixed',
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
  });

  constructor(props) {
    super(props);
    const { dispatchGetUsers } = this.props;
    dispatchGetUsers();
  }

  saveSettings = (settingsToChange) => {
    const { settings, dispatchPatchAppInstance } = this.props;
    const newSettings = {
      ...settings,
      ...settingsToChange,
    };
    dispatchPatchAppInstance({
      data: newSettings,
    });
  };

  handleDeleteFlag = (id) => {
    const {
      dispatchDeleteAppInstanceResource,
      dispatchPostAction,
      reportedComments,
    } = this.props;
    const flaggedComment = reportedComments.find((item) => item._id === id);
    if (flaggedComment) {
      dispatchDeleteAppInstanceResource(flaggedComment._id);
      dispatchPostAction({
        data: flaggedComment,
        verb: CLEARED_FLAGGED_COMMENT,
      });
    }
  };

  handleChangeFlagState = (id, state) => {
    const { dispatchPatchAppInstanceResource, reportedComments } = this.props;
    const flaggedComment = reportedComments.find((c) => c._id === id);
    if (flaggedComment) {
      dispatchPatchAppInstanceResource({
        id: flaggedComment._id,
        data: {
          ...flaggedComment.data,
          state,
        },
      });
    }
  };

  handleHideFlag = (flaggedComment) => {
    const { dispatchPatchAppInstanceResource } = this.props;
    dispatchPatchAppInstanceResource({
      id: flaggedComment._id,
      data: {
        ...flaggedComment.data,
        state: HIDDEN_FLAGGED_COMMENT,
      },
    });
  };

  handleChangeHelpWantedFilter = ({ target: { checked } }) => {
    const settingsToChange = {
      pendingFlagsOnly: checked,
    };
    this.saveSettings(settingsToChange);
  };

  renderReportedCommentsList = () => {
    const { students, reportedComments, t, settings, classes } = this.props;
    const { pendingFlagsOnly = DEFAULT_PENDING_FLAGS_ONLY_SETTING } = settings;

    const filteredFlags = reportedComments.filter(
      (item) =>
        (item.data.state === PENDING_FLAGGED_COMMENT && pendingFlagsOnly) ||
        !pendingFlagsOnly,
    );
    // if there are no resources, show an empty table
    if (!filteredFlags.length) {
      return (
        <TableRow>
          <TableCell colSpan={5}>{t('No Flags to show')}</TableCell>
        </TableRow>
      );
    }
    // map each app instance resource to a row in the table
    return filteredFlags.map(
      ({ _id: id, data, user, createdAt = new Date().toDateString() }) => {
        const reportingUser = students.find((u) => u.id === user)?.name;
        const {
          reason,
          comment: {
            user: commentUser,
            data: { content },
          },
          state,
        } = data;
        const reportedUser = students.find((u) => u.id === commentUser)?.name;
        return (
          <TableRow
            key={id}
            className={clsx({
              [classes.hiddenFlag]: state === HIDDEN_FLAGGED_COMMENT,
            })}
          >
            <TableCell>{reportingUser}</TableCell>
            <TableCell>{reportedUser}</TableCell>
            <TableCell>{createdAt}</TableCell>
            <TableCell>{reason}</TableCell>
            <TableCell>{content}</TableCell>
            <TableCell>{state}</TableCell>
            <TableCell>
              {state === PENDING_FLAGGED_COMMENT ? (
                <Tooltip title={t('Set Flag to hidden')}>
                  <IconButton
                    onClick={() =>
                      this.handleChangeFlagState(id, HIDDEN_FLAGGED_COMMENT)
                    }
                  >
                    <VisibilityOff color="primary" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title={t('Set Flag to pending')}>
                  <IconButton
                    onClick={() =>
                      this.handleChangeFlagState(id, PENDING_FLAGGED_COMMENT)
                    }
                  >
                    <Visibility color="primary" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={t('Delete Flag')}>
                <IconButton onClick={() => this.handleDeleteFlag(id)}>
                  <Delete color="primary" />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        );
      },
    );
  };

  render() {
    // extract properties from the props object
    const {
      // this property allows us to do styling and is injected by withStyles
      classes,
      // this property allows us to do translations and is injected by i18next
      t,
      dispatchOpenSettings,
      settings,
    } = this.props;

    const { pendingFlagsOnly = DEFAULT_PENDING_FLAGS_ONLY_SETTING } = settings;

    const switchComponent = (
      <Switch
        checked={pendingFlagsOnly}
        onChange={this.handleChangeHelpWantedFilter}
        name="pendingFlagsOnly"
        color="primary"
      />
    );

    return (
      <>
        <Grid container spacing={0}>
          <Grid item xs={12} className={classes.main}>
            <Typography variant="h6" color="inherit">
              {t('Reported Comments')}
            </Typography>
            <div align="right">
              <FormControlLabel
                control={switchComponent}
                label={t('Only Show Pending Flags')}
              />
            </div>
            <Paper className={classes.root}>
              <Table className={classes.table}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Reported by')}</TableCell>
                    <TableCell>{t('From')}</TableCell>
                    <TableCell>{t('Report Date')}</TableCell>
                    <TableCell>{t('Reason')}</TableCell>
                    <TableCell>{t('Comment')}</TableCell>
                    <TableCell>{t('State')}</TableCell>
                    <TableCell>{t('Actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{this.renderReportedCommentsList()}</TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
        <Settings />
        <Fab
          color="primary"
          aria-label={t('Settings')}
          className={classes.fab}
          onClick={dispatchOpenSettings}
        >
          <SettingsIcon />
        </Fab>
      </>
    );
  }
}

// get the app instance resources that are saved in the redux store
const mapStateToProps = ({ users, appInstanceResources, appInstance }) => ({
  // we transform the list of students in the database
  // to the shape needed by the select component
  students: users.content.map(({ id, name }) => ({
    id,
    name,
  })),
  settings: appInstance.content.settings,
  reportedComments: appInstanceResources.content.filter((r) => r.type === FLAG),
});

// allow this component to dispatch a post
// request to create an app instance resource
const mapDispatchToProps = {
  dispatchGetUsers: getUsers,
  dispatchOpenSettings: openSettings,
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
  dispatchPatchAppInstanceResource: patchAppInstanceResource,
  dispatchPatchAppInstance: patchAppInstance,
  dispatchPostAction: postAction,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ReportedView);

const StyledComponent = withStyles(ReportedView.styles)(ConnectedComponent);

export default withTranslation()(StyledComponent);
