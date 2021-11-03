import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Fab from '@material-ui/core/Fab';
import SettingsIcon from '@material-ui/icons/Settings';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Select from 'react-select';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import './TeacherView.css';
import {
  patchAppInstanceResource,
  postAppInstanceResource,
  deleteAppInstanceResource,
  openSettings,
  patchAppInstance,
  getUsers,
} from '../../../actions';
import Settings from './Settings';
import { BOT_USER } from '../../../config/appInstanceResourceTypes';
import CodeReview from '../../common/CodeReview';

export class PresetView extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    dispatchOpenSettings: PropTypes.func.isRequired,
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
      selectedBot: PropTypes.string,
    }).isRequired,
    botOptions: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
      }),
    ).isRequired,
  };

  static defaultProps = {};

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
      botOptions,
      dispatchOpenSettings,
      settings,
    } = this.props;
    const { selectedBot } = settings;

    return (
      <>
        <Grid container spacing={1} direction="column">
          <Grid item xs={12} className={classes.main}>
            <Typography variant="h6" color="inherit">
              {t('Select a bot to impersonate')}
            </Typography>
            <Select
              className={classes.select}
              value={selectedBot}
              options={botOptions}
              onChange={this.handleChangeBot}
              isClearable
            />
          </Grid>
          <Grid item className={classes.main}>
            {selectedBot ? (
              <Paper className={classes.message}>
                {t(
                  'Warning ! You are impersonating a bot. Clear the field above to write comments as yourself.',
                )}
              </Paper>
            ) : null}
          </Grid>
          <CodeReview isTeacherView />
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
const mapStateToProps = ({ appInstance, appInstanceResources }) => ({
  // we transform the list of students in the database
  // to the shape needed by the select component
  botOptions: appInstanceResources.content
    .filter((res) => res.type === BOT_USER)
    .map(({ _id, data }) => ({
      value: _id,
      label: data.name,
    })),
  settings: appInstance.content.settings,
  appInstanceResources: appInstanceResources.content,
});

// allow this component to dispatch a post
// request to create an app instance resource
const mapDispatchToProps = {
  dispatchGetUsers: getUsers,
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchPatchAppInstanceResource: patchAppInstanceResource,
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
  dispatchPatchAppInstance: patchAppInstance,
  dispatchOpenSettings: openSettings,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PresetView);

const StyledComponent = withStyles(PresetView.styles)(ConnectedComponent);

export default withTranslation()(StyledComponent);
