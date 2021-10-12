import { connect } from 'react-redux';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Select from 'react-select';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import Button from '@material-ui/core/Button';
import React, { useState } from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Avatar, makeStyles } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import {
  getActions,
  getAppInstanceResources,
  patchAppInstanceResource,
  postAppInstanceResource,
  deleteAppInstanceResource,
} from '../../../actions';
import { BOT_USER } from '../../../config/appInstanceResourceTypes';
import { PUBLIC_VISIBILITY } from '../../../config/settings';

const generateRandomUserName = () => Math.random().toString(35).substr(2, 8);

/**
 * helper method to render the rows of the app instance resource table
 * @param appInstanceResources
 * @param dispatchPatchAppInstanceResource
 * @param dispatchDeleteAppInstanceResource
 * @returns {*}
 */
const renderAppInstanceResources = (
  appInstanceResources,
  { dispatchPatchAppInstanceResource, dispatchDeleteAppInstanceResource },
) => {
  // if there are no resources, show an empty table
  if (!appInstanceResources.length) {
    return (
      <TableRow>
        <TableCell colSpan={4}>No App Instance Resources</TableCell>
      </TableRow>
    );
  }
  // map each app instance resource to a row in the table
  return appInstanceResources.map(({ _id, appInstance, data }) => (
    <TableRow key={_id}>
      <TableCell scope="row">{_id}</TableCell>
      <TableCell>
        <Avatar alt={data.name} src={data.uri} />
      </TableCell>
      <TableCell>{data.name}</TableCell>
      <TableCell>{appInstance}</TableCell>
      <TableCell>
        <IconButton
          color="primary"
          onClick={() => {
            // change to open a modal to edit the name and properties of the fake user
            dispatchPatchAppInstanceResource({
              id: _id,
              data: {
                ...data,
                name: generateRandomUserName(),
              },
            });
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          color="primary"
          onClick={() => dispatchDeleteAppInstanceResource(_id)}
        >
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  ));
};

const generateNewBotUser = ({ dispatchPostAppInstanceResource }) => {
  dispatchPostAppInstanceResource({
    data: {
      uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Tux.svg/249px-Tux.svg.png',
      name: generateRandomUserName(),
    },
    type: BOT_USER,
    visibility: PUBLIC_VISIBILITY,
  });
};

const useStyles = makeStyles((theme) => ({
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
}));

const AvatarView = (props) => {
  const classes = useStyles();
  const [selectedUser, setSelectedUser] = useState('');

  const { t, botUsers, userOptions } = props;

  return (
    <Grid container spacing={0}>
      <Grid item xs={12} className={classes.main}>
        <Typography variant="h5" color="inherit">
          {t('View the Users in the Sample Space')}
        </Typography>
        <Select
          className="StudentSelect"
          value={selectedUser}
          options={userOptions}
          onChange={(v) => setSelectedUser(v)}
          isClearable
        />
        <hr />
        <Typography variant="h6" color="inherit">
          {t(
            'This table illustrates how an app can save resources on the server.',
          )}
        </Typography>
        <Paper className={classes.root}>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Avatar</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>App Instance</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{renderAppInstanceResources(botUsers, props)}</TableBody>
          </Table>
        </Paper>
        <Button
          color="primary"
          className={classes.button}
          variant="contained"
          onClick={() => generateNewBotUser(props)}
        >
          {t('Add a new bot user')}
        </Button>
      </Grid>
    </Grid>
  );
};

AvatarView.propTypes = {
  t: PropTypes.func.isRequired,
  botUsers: PropTypes.arrayOf(
    PropTypes.shape({
      // we need to specify number to avoid warnings with local server
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      appInstanceId: PropTypes.string,
      data: PropTypes.shape({}),
    }),
  ),
  userOptions: PropTypes.arrayOf(
    PropTypes.shape({
      // we need to specify number to avoid warnings with local server
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    }),
  ).isRequired,
};

AvatarView.defaultProps = {
  botUsers: [],
};

const mapStateToProps = ({ appInstanceResources }) => {
  const botUsers = appInstanceResources.content.filter(
    (r) => r.type === BOT_USER,
  );

  return {
    // only give bot users resources
    botUsers,
    userOptions: botUsers.map(({ _id, data }) => ({
      value: _id,
      label: data.name,
    })),
  };
};

const mapDispatchToProps = {
  dispatchGetAppInstanceResources: getAppInstanceResources,
  dispatchGetActions: getActions,
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchPatchAppInstanceResource: patchAppInstanceResource,
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(AvatarView);

export default withTranslation()(ConnectedComponent);
