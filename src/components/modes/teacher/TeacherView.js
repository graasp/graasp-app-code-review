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
import IconButton from '@material-ui/core/IconButton';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import './TeacherView.css';
import { Input, PanTool } from '@material-ui/icons';
import { Chip, FormControlLabel, Switch, Tooltip } from '@material-ui/core';
import {
  patchAppInstanceResource,
  postAppInstanceResource,
  deleteAppInstanceResource,
  openSettings,
  getUsers,
  setSelectedStudent,
  openFeedbackView,
  getAppInstanceResources,
  patchAppInstance,
} from '../../../actions';
import Settings from './Settings';
import { BOT_COMMENT, COMMENT } from '../../../config/appInstanceResourceTypes';
import FeedbackView from './FeedbackView';
import { DEFAULT_HELP_WANTED_ONLY_SETTING } from '../../../config/settings';

export class TeacherView extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    dispatchOpenSettings: PropTypes.func.isRequired,
    dispatchOpenFeedbackView: PropTypes.func.isRequired,
    classes: PropTypes.shape({
      root: PropTypes.string,
      table: PropTypes.string,
      main: PropTypes.string,
      button: PropTypes.string,
      message: PropTypes.string,
      fab: PropTypes.string,
    }).isRequired,
    dispatchGetUsers: PropTypes.func.isRequired,
    dispatchGetAppInstanceResources: PropTypes.func.isRequired,
    dispatchSetSelectedStudent: PropTypes.func.isRequired,
    dispatchPatchAppInstance: PropTypes.func.isRequired,
    // inside the shape method you should put the shape
    // that the resources your app uses will have
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        // we need to specify number to avoid warnings with local server
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        appInstanceId: PropTypes.string,
        data: PropTypes.shape({
          line: PropTypes.number,
          content: PropTypes.string,
        }),
      }),
    ),
    students: PropTypes.arrayOf(
      PropTypes.shape({
        // we need to specify number to avoid warnings with local server
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        spaceId: PropTypes.string,
      }),
    ),
    settings: PropTypes.shape({
      helpWantedOnly: PropTypes.bool,
    }).isRequired,
  };

  static defaultProps = {
    comments: [],
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
    message: {
      padding: theme.spacing(),
      backgroundColor: theme.status.danger.background[500],
      color: theme.status.danger.color,
      marginBottom: theme.spacing(2),
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

  renderStudentList = () => {
    const {
      students,
      comments,
      t,
      dispatchOpenFeedbackView,
      dispatchSetSelectedStudent,
      dispatchGetAppInstanceResources,
      settings: { helpWantedOnly = DEFAULT_HELP_WANTED_ONLY_SETTING },
    } = this.props;
    // if there are no resources, show an empty table
    if (!comments.length) {
      return (
        <TableRow>
          <TableCell colSpan={4}>No App Instance Resources</TableCell>
        </TableRow>
      );
    }
    // map each app instance resource to a row in the table
    return students.map(({ id, name }) => {
      const numberOfComments =
        comments.filter((r) => r.user === id)?.length || 0;
      const numberOfInterventions =
        comments.filter((r) => r.user === id && r.data.requireIntervention)
          ?.length || 0;
      // only show a row when the student has made comments
      // and if the `helpWantedOnly` setting is true only include users that asked for help
      return numberOfComments && !(!numberOfInterventions && helpWantedOnly) ? (
        <TableRow key={id}>
          <TableCell>{name}</TableCell>
          <TableCell>
            {numberOfInterventions ? (
              <Tooltip title={t('Help requested')}>
                <Chip
                  color="primary"
                  variant="outlined"
                  icon={<PanTool color="primary" />}
                  label={numberOfInterventions}
                />
              </Tooltip>
            ) : null}
          </TableCell>
          <TableCell>{numberOfComments}</TableCell>
          <TableCell>
            <Tooltip title={t('View in Context')}>
              <IconButton
                color="primary"
                onClick={() => {
                  // force update the comments
                  dispatchGetAppInstanceResources();
                  // dispatch the selected student to layout
                  dispatchSetSelectedStudent({
                    selectedStudent: id,
                  });
                  dispatchOpenFeedbackView();
                }}
              >
                <Input />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
      ) : null;
    });
  };

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

  handleChangeHelpWantedFilter = ({ target: { checked } }) => {
    const settingsToChange = {
      helpWantedOnly: checked,
    };
    this.saveSettings(settingsToChange);
  };

  render() {
    // extract properties from the props object
    const {
      // this property allows us to do styling and is injected by withStyles
      classes,
      // this property allows us to do translations and is injected by i18next
      t,
      dispatchOpenSettings,
      settings: { helpWantedOnly = DEFAULT_HELP_WANTED_ONLY_SETTING },
    } = this.props;

    const switchComponent = (
      <Switch
        checked={helpWantedOnly}
        onChange={this.handleChangeHelpWantedFilter}
        name="helpWantedOnly"
        color="primary"
      />
    );

    return (
      <>
        <Grid container spacing={0}>
          <Grid item xs={12} className={classes.main}>
            <Typography variant="h6" color="inherit">
              {t('Student Comments')}
            </Typography>
            <div align="right">
              <FormControlLabel
                control={switchComponent}
                label={t('Need Help Only')}
              />
            </div>
            <Paper className={classes.root}>
              <Table className={classes.table}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Name')}</TableCell>
                    <TableCell>{t('Help needed')}</TableCell>
                    <TableCell>{t('Total Number of comments')}</TableCell>
                    <TableCell>{t('View Student comments')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{this.renderStudentList()}</TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
        <FeedbackView />
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
  comments: appInstanceResources.content.filter((r) =>
    [COMMENT, BOT_COMMENT].includes(r.type),
  ),
  settings: appInstance.content.settings,
});

// allow this component to dispatch a post
// request to create an app instance resource
const mapDispatchToProps = {
  dispatchGetUsers: getUsers,
  dispatchGetAppInstanceResources: getAppInstanceResources,
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchPatchAppInstanceResource: patchAppInstanceResource,
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
  dispatchOpenSettings: openSettings,
  dispatchOpenFeedbackView: openFeedbackView,
  dispatchSetSelectedStudent: setSelectedStudent,
  dispatchPatchAppInstance: patchAppInstance,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(TeacherView);

const StyledComponent = withStyles(TeacherView.styles)(ConnectedComponent);

export default withTranslation()(StyledComponent);
