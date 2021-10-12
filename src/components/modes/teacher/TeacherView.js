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
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import './TeacherView.css';
import { Star } from '@material-ui/icons';
import {
  patchAppInstanceResource,
  postAppInstanceResource,
  deleteAppInstanceResource,
  openSettings,
  getUsers,
} from '../../../actions';
import { addQueryParamsToUrl } from '../../../utils/url';
import Settings from './Settings';
import { COMMENT } from '../../../config/appInstanceResourceTypes';

const generateRandomAppInstanceResource = ({
  dispatchPostAppInstanceResource,
}) => {
  dispatchPostAppInstanceResource({
    data: { value: Math.random() },
  });
};

export class TeacherView extends Component {
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
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        spaceId: PropTypes.string,
      }),
    ),
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

  state = {
    selectedStudent: null,
  };

  constructor(props) {
    super(props);
    const { dispatchGetUsers } = this.props;
    dispatchGetUsers();
  }

  renderStudentList = () => {
    const { students, comments } = this.props;
    const { selectedStudent } = this.state;
    // if there are no resources, show an empty table
    if (!comments.length) {
      return (
        <TableRow>
          <TableCell colSpan={4}>No App Instance Resources</TableCell>
        </TableRow>
      );
    }
    // map each app instance resource to a row in the table
    return students.map(({ _id, name }) => {
      const numberOfComments =
        comments.filter((r) => r.user === _id)?.length || 0;
      return numberOfComments ? (
        <TableRow key={_id}>
          <TableCell scope="row">{_id}</TableCell>
          <TableCell>{name}</TableCell>
          <TableCell>{numberOfComments}</TableCell>
          <TableCell>
            <IconButton
              color="primary"
              disabled={_id === selectedStudent}
              onClick={() => {
                this.setState({ selectedStudent: _id });
              }}
            >
              <Star />
            </IconButton>
          </TableCell>
        </TableRow>
      ) : null;
    });
  };

  handleChangeStudent = (value) => {
    this.setState({
      selectedStudent: value,
    });
  };

  render() {
    // extract properties from the props object
    const {
      // this property allows us to do styling and is injected by withStyles
      classes,
      // this property allows us to do translations and is injected by i18next
      t,
      dispatchOpenSettings,
      students,
    } = this.props;
    const { selectedStudent } = this.state;
    const selectedStudentName = students.find(
      (s) => s._id === selectedStudent,
    )?.name;
    return (
      <>
        <Grid container spacing={0}>
          <Grid item xs={12} className={classes.main}>
            <Paper className={classes.message}>
              {t(
                'This is the teacher view. Switch to the student view by clicking on the URL below.',
              )}
              <a href={addQueryParamsToUrl({ mode: 'student' })}>
                <pre>
                  {`${window.location.host}/${addQueryParamsToUrl({
                    mode: 'student',
                  })}`}
                </pre>
              </a>
            </Paper>
            <hr />
            <Typography variant="h6" color="inherit">
              {selectedStudentName
                ? `${t('Selected Student is:')} ${selectedStudentName}`
                : t('No student selected')}
            </Typography>
            <Paper className={classes.root}>
              <Table className={classes.table}>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Number of comments</TableCell>
                    <TableCell>Select Student</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{this.renderStudentList()}</TableBody>
              </Table>
            </Paper>
            <Button
              color="primary"
              className={classes.button}
              variant="contained"
              onClick={() => generateRandomAppInstanceResource(this.props)}
            >
              {t('Save a Random App Instance Resource via the API')}
            </Button>
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
  students: users.content.map(({ _id, name }) => ({
    _id,
    name,
  })),
  comments: appInstanceResources.content.filter((r) => r.type === COMMENT),
});

// allow this component to dispatch a post
// request to create an app instance resource
const mapDispatchToProps = {
  dispatchGetUsers: getUsers,
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchPatchAppInstanceResource: patchAppInstanceResource,
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
  dispatchOpenSettings: openSettings,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(TeacherView);

const StyledComponent = withStyles(TeacherView.styles)(ConnectedComponent);

export default withTranslation()(StyledComponent);
