import { connect } from 'react-redux';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import TableBody from '@material-ui/core/TableBody';
import Button from '@material-ui/core/Button';
import React from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Avatar, makeStyles, Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { DeleteForever } from '@material-ui/icons';
import {
  getAppInstanceResources,
  patchAppInstanceResource,
  postAppInstanceResource,
  deleteAppInstanceResource,
  openAvatarDialog,
  setAvatarId,
} from '../../../actions';
import {
  BOT_COMMENT,
  BOT_USER,
} from '../../../config/appInstanceResourceTypes';
import AvatarDialog from './AvatarDialog';

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

  const {
    t,
    botUsers,
    botComments,
    dispatchOpenAvatarDialog,
    dispatchSetAvatarId,
    dispatchDeleteAppInstanceResource,
  } = props;

  const handleDeleteBot = (_id) => {
    dispatchDeleteAppInstanceResource(_id);
  };

  const handleDeleteAllBotComments = (_id) => {
    botComments
      .filter((r) => r.botId === _id)
      .forEach(({ resourceId }) =>
        dispatchDeleteAppInstanceResource(resourceId),
      );
  };

  const handleNewBot = () => {
    dispatchSetAvatarId({ avatarId: null });
    dispatchOpenAvatarDialog();
  };

  const renderBotUsers = () => {
    // if there are no resources, show an empty table
    if (!botUsers.length) {
      return (
        <TableRow>
          <TableCell colSpan={4}>{t('No Bots')}</TableCell>
        </TableRow>
      );
    }
    // map each app instance resource to a row in the table
    return botUsers.map(({ _id, data }) => (
      <TableRow key={_id}>
        <TableCell>
          <Avatar alt={data.name} src={data.uri} />
        </TableCell>
        <TableCell>{data.name}</TableCell>
        <TableCell>{data.description}</TableCell>
        <TableCell>
          <IconButton
            color="primary"
            onClick={() => {
              // sending the avatarId that is being edited to the modal through layout
              dispatchSetAvatarId({ avatarId: _id });
              dispatchOpenAvatarDialog();
            }}
          >
            <EditIcon />
          </IconButton>
          <Tooltip title={t('Delete Bot')}>
            <IconButton
              color="primary"
              // remove the bot
              onClick={() => handleDeleteBot(_id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('Delete All Comments for Bot')}>
            <IconButton
              color="primary"
              // remove all the comments linked to this bot
              onClick={() => handleDeleteAllBotComments(_id)}
            >
              <DeleteForever />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <>
      <Grid container spacing={0}>
        <Grid item xs={12} className={classes.main}>
          <Typography variant="h6" color="inherit">
            {t('Bot Users')}
          </Typography>
          <Paper className={classes.root}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('Avatar')}</TableCell>
                  <TableCell>{t('Name')}</TableCell>
                  <TableCell>{t('Description')}</TableCell>
                  <TableCell>{t('Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{renderBotUsers()}</TableBody>
            </Table>
          </Paper>
          <Button
            color="primary"
            className={classes.button}
            variant="contained"
            onClick={() => handleNewBot()}
          >
            {t('Add a New Bot User')}
          </Button>
        </Grid>
      </Grid>
      <AvatarDialog />
    </>
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
  botComments: PropTypes.arrayOf(
    PropTypes.shape({
      botId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      resourceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ),

  dispatchOpenAvatarDialog: PropTypes.func.isRequired,
  dispatchSetAvatarId: PropTypes.func.isRequired,
  dispatchDeleteAppInstanceResource: PropTypes.func.isRequired,
};

AvatarView.defaultProps = {
  botUsers: [],
  botComments: [],
};

const mapStateToProps = ({ appInstanceResources }) => {
  const botUsers = appInstanceResources.content.filter(
    (r) => r.type === BOT_USER,
  );
  // filter bot comments and map to bot ids and resource id
  const botComments = appInstanceResources.content
    .filter((r) => r.type === BOT_COMMENT)
    .map(({ _id, data }) => ({
      botId: data.botId,
      resourceId: _id,
    }));
  return {
    // only give bot users resources
    botUsers,
    // array of botIds and resource ids corresponding to bot comments
    botComments,
    userOptions: botUsers.map(({ _id, data }) => ({
      value: _id,
      label: data.name,
    })),
  };
};

const mapDispatchToProps = {
  dispatchGetAppInstanceResources: getAppInstanceResources,
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchPatchAppInstanceResource: patchAppInstanceResource,
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
  dispatchSetAvatarId: setAvatarId,
  dispatchOpenAvatarDialog: openAvatarDialog,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(AvatarView);

export default withTranslation()(ConnectedComponent);
