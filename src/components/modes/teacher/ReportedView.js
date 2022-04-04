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
import { openSettings, getUsers } from '../../../actions';
import Settings from './Settings';
import { FLAG } from '../../../config/appInstanceResourceTypes';

export class ReportedView extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    dispatchOpenSettings: PropTypes.func.isRequired,
    classes: PropTypes.shape({
      root: PropTypes.string,
      table: PropTypes.string,
      main: PropTypes.string,
      button: PropTypes.string,
      message: PropTypes.string,
      fab: PropTypes.string,
    }).isRequired,
    dispatchGetUsers: PropTypes.func.isRequired,
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

  renderReportedCommentsList = () => {
    const { students, reportedComments } = this.props;
    // if there are no resources, show an empty table
    if (!reportedComments.length) {
      return (
        <TableRow>
          <TableCell colSpan={5}>No App Instance Resources</TableCell>
        </TableRow>
      );
    }
    // map each app instance resource to a row in the table
    return reportedComments.map(
      ({ id, data, user, createdAt = new Date().toDateString() }) => {
        const reportingUser = students.find((u) => u.id === user)?.name;
        const {
          reason,
          comment: {
            user: commentUser,
            data: { content },
          },
        } = data;
        const reportedUser = students.find((u) => u.id === commentUser)?.name;
        return (
          <TableRow key={id}>
            <TableCell>{reportingUser}</TableCell>
            <TableCell>{reportedUser}</TableCell>
            <TableCell>{createdAt}</TableCell>
            <TableCell>{reason}</TableCell>
            <TableCell>{content}</TableCell>
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
    } = this.props;

    return (
      <>
        <Grid container spacing={0}>
          <Grid item xs={12} className={classes.main}>
            <Typography variant="h6" color="inherit">
              {t('Reported Comments')}
            </Typography>
            <Paper className={classes.root}>
              <Table className={classes.table}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Reported by')}</TableCell>
                    <TableCell>{t('From')}</TableCell>
                    <TableCell>{t('Report Date')}</TableCell>
                    <TableCell>{t('Reason')}</TableCell>
                    <TableCell>{t('Comment')}</TableCell>
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
const mapStateToProps = ({ users, appInstanceResources }) => ({
  // we transform the list of students in the database
  // to the shape needed by the select component
  students: users.content.map(({ id, name }) => ({
    id,
    name,
  })),
  reportedComments: appInstanceResources.content.filter((r) => r.type === FLAG),
});

// allow this component to dispatch a post
// request to create an app instance resource
const mapDispatchToProps = {
  dispatchGetUsers: getUsers,
  dispatchOpenSettings: openSettings,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ReportedView);

const StyledComponent = withStyles(ReportedView.styles)(ConnectedComponent);

export default withTranslation()(StyledComponent);
