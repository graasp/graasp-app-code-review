import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Divider, Button, Modal, Grid, TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import {
  closeAvatarDialog,
  postAppInstanceResource,
  patchAppInstanceResource,
} from '../../../actions';
import Loader from '../../common/Loader';
import { BOT_USER } from '../../../config/appInstanceResourceTypes';
import { PUBLIC_VISIBILITY } from '../../../config/settings';

const DEFAULT_AVATAR = {
  name: '',
  uri: '',
  description: '',
};

function getModalStyle() {
  const top = 50;
  const left = 50;
  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}

const styles = (theme) => ({
  paper: {
    position: 'absolute',
    width: theme.spacing(80),
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(4),
    outline: 'none',
  },
  title: {
    marginBottom: theme.spacing(2),
  },
  fullScreen: {
    position: 'absolute',
    // 64px is the height of the header
    marginTop: '64px',
    height: 'calc(100% - 64px)',
    width: 'calc(100% - 32px)',
    backgroundColor: theme.palette.background.paper,
    outline: 'none',
  },
  button: {
    margin: theme.spacing(),
  },
  right: {
    position: 'absolute',
    right: theme.spacing(),
  },
  formControlSpace: {
    left: theme.spacing(2),
  },
  noMaxWidth: {
    maxWidth: 'none',
  },
  formControl: {
    width: '100%',
  },
  fab: {
    margin: theme.spacing(),
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  divider: {
    marginTop: '10px',
  },
});

class AvatarDialog extends Component {
  static propTypes = {
    classes: PropTypes.shape({
      title: PropTypes.string,
      divider: PropTypes.string,
      formControl: PropTypes.string,
      formLabel: PropTypes.string,
      right: PropTypes.string,
      noMaxWidth: PropTypes.string,
      formControlSpace: PropTypes.string,
      appBar: PropTypes.string,
      fullScreen: PropTypes.string,
      fab: PropTypes.string,
      button: PropTypes.string,
      editor: PropTypes.string,
      paper: PropTypes.string,
    }).isRequired,
    open: PropTypes.bool.isRequired,
    activity: PropTypes.number.isRequired,
    avatarId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    avatar: PropTypes.shape({
      name: PropTypes.string,
      uri: PropTypes.string,
      description: PropTypes.string,
    }),
    t: PropTypes.func.isRequired,
    dispatchCloseAvatarDialog: PropTypes.func.isRequired,
    dispatchPostAppInstanceResource: PropTypes.func.isRequired,
    dispatchPatchAppInstanceResource: PropTypes.func.isRequired,
  };

  static defaultProps = {
    avatar: DEFAULT_AVATAR,
  };

  state = (() => {
    const { avatar: avatarProps } = this.props;
    const avatar = avatarProps;
    return {
      avatar,
    };
  })();

  componentDidUpdate(prevProps, prevState) {
    const { avatar: prevPropsAvatar } = prevProps;
    const { avatar: prevStateAvatar } = prevState;
    const { avatar } = this.props;
    if (
      !(
        _.isEqual(avatar, prevPropsAvatar) || _.isEqual(avatar, prevStateAvatar)
      )
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ avatar });
    }
  }

  handleSave = () => {
    const {
      avatarId,
      dispatchPostAppInstanceResource,
      dispatchCloseAvatarDialog,
      dispatchPatchAppInstanceResource,
    } = this.props;
    const { avatar } = this.state;

    // this is a new bot
    if (avatarId === '') {
      dispatchPostAppInstanceResource({
        data: avatar,
        type: BOT_USER,
        visibility: PUBLIC_VISIBILITY,
      });
    }
    // editing an existing bot
    else {
      dispatchPatchAppInstanceResource({
        id: avatarId,
        data: avatar,
      });
    }
    dispatchCloseAvatarDialog();
  };

  handleChangeTextField =
    (key) =>
    ({ target: { value } }) => {
      this.setState((prevState) => {
        // get the previous state's settings
        const avatar = { ...prevState.avatar };
        // use lodash to be able to use dot and array notation
        _.set(avatar, key, value);
        return { avatar };
      });
    };

  handleChangeSelect =
    (key) =>
    ({ target: { value } }) => {
      this.setState((prevState) => {
        // get the previous state's settings
        const settings = { ...prevState.settings };
        // use lodash to be able to use dot and array notation
        _.set(settings, key, value);
        return { settings };
      });
    };

  handleClose = () => {
    const { dispatchCloseAvatarDialog } = this.props;
    this.setState({ ...DEFAULT_AVATAR });
    dispatchCloseAvatarDialog();
  };

  renderModalContent() {
    const { t, activity, classes, avatar: avatarProp } = this.props;
    const { avatar } = this.state;

    const hasChanged = !_.isEqual(avatarProp, avatar);

    if (activity) {
      return <Loader />;
    }

    const nameControl = (
      <TextField
        color="primary"
        variant="outlined"
        label={t('Name')}
        onChange={this.handleChangeTextField('name')}
        value={avatar.name}
        fullWidth
        multiline
        maxRows={3}
        size="small"
      />
    );

    const uriControl = (
      <TextField
        color="primary"
        variant="outlined"
        label={t('Image Uri')}
        onChange={this.handleChangeTextField('uri')}
        value={avatar.uri}
        fullWidth
        multiline
        maxRows={3}
        size="small"
      />
    );

    const descriptionControl = (
      <TextField
        color="primary"
        variant="outlined"
        label={t('Description')}
        onChange={this.handleChangeTextField('description')}
        value={avatar.description}
        fullWidth
        multiline
        maxRows={4}
        size="small"
      />
    );

    return (
      <>
        <Grid container direction="column" spacing={3} alignItems="stretch">
          <Grid item>{nameControl}</Grid>
          <Grid item>{uriControl}</Grid>
          <Grid item>{descriptionControl}</Grid>
        </Grid>
        <Divider className={classes.divider} />
        <Button
          variant="contained"
          color="primary"
          className={classes.button}
          onClick={this.handleSave}
          disabled={!hasChanged}
        >
          {t('Save')}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          className={classes.button}
          onClick={this.handleClose}
        >
          {t('Cancel')}
        </Button>
      </>
    );
  }

  render() {
    const { open, classes, t } = this.props;
    return (
      <div>
        <Modal
          aria-labelledby="avatar-modal"
          aria-describedby="avatar-modal-description"
          open={open}
          onClose={this.handleClose}
        >
          <div style={getModalStyle()} className={classes.paper}>
            <Typography
              className={classes.title}
              variant="h5"
              id="settings-modal-title"
            >
              {t('Settings')}
            </Typography>
            {this.renderModalContent()}
          </div>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = ({ layout, appInstance, appInstanceResources }) => {
  const { avatarId } = appInstance.content.settings;
  return {
    open: layout.avatarDialog.open,
    activity: appInstance.activity.length,
    avatarId,
    avatar: appInstanceResources.content.find(
      (r) => r.type === BOT_USER && r._id === avatarId,
    )?.data,
  };
};

const mapDispatchToProps = {
  dispatchPatchAppInstanceResource: patchAppInstanceResource,
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchCloseAvatarDialog: closeAvatarDialog,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(AvatarDialog);
const TranslatedComponent = withTranslation()(ConnectedComponent);

export default withStyles(styles)(TranslatedComponent);
