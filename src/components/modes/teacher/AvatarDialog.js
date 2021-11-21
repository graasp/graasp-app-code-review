import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Divider,
  Button,
  Modal,
  Grid,
  TextField,
  FormLabel,
  Switch,
  FormControlLabel,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Alert from '@material-ui/lab/Alert';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import Editor from '@monaco-editor/react';
import {
  closeAvatarDialog,
  postAppInstanceResource,
  patchAppInstanceResource,
} from '../../../actions';
import Loader from '../../common/Loader';
import { BOT_USER } from '../../../config/appInstanceResourceTypes';
import { JSON_LANG, PUBLIC_VISIBILITY } from '../../../config/settings';
import {
  DEFAULT_PERSONALITY_JSON,
  DEFAULT_VALIDATOR_MESSAGE,
  VALIDATOR_ERROR,
  VALIDATOR_SUCCESS,
  addEmptyStep,
  stringifyPersonality,
  validatePersonality,
} from '../../../utils/autoBotEngine';

const DEFAULT_AVATAR = {
  name: '',
  uri: '',
  autoBot: false,
  autoSeed: false,
  personality: stringifyPersonality(DEFAULT_PERSONALITY_JSON),
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
    minWidth: theme.spacing(80),
    maxWidth: theme.spacing(80),
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
  formControlSpace: {
    left: theme.spacing(2),
  },
  noMaxWidth: {
    maxWidth: 'none',
  },
  formControl: {
    width: '100%',
  },
  divider: {
    marginTop: '10px',
  },
  modal: {
    overflowY: 'scroll',
  },
  noFlex: {
    display: 'block',
  },
  lastGrid: {
    margin: '0px',
    '&:last-child': {
      paddingBottom: '10px',
    },
  },
  input: {
    // do not display the upload file default button
    display: 'none',
  },
  editor: {
    paddingBottom: '10px',
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
      fullScreen: PropTypes.string,
      input: PropTypes.string,
      button: PropTypes.string,
      editor: PropTypes.string,
      paper: PropTypes.string,
      noFlex: PropTypes.string,
      modal: PropTypes.string,
      lastGrid: PropTypes.string,
    }).isRequired,
    open: PropTypes.bool.isRequired,
    activity: PropTypes.number.isRequired,
    avatarId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    avatar: PropTypes.shape({
      name: PropTypes.string,
      uri: PropTypes.string,
      autoBot: PropTypes.bool,
      autoSeed: PropTypes.bool,
      personality: PropTypes.string,
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
      validator: {
        severity: VALIDATOR_SUCCESS,
        message: DEFAULT_VALIDATOR_MESSAGE,
      },
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
        // get the previous state's avatar
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
        // get the previous state's avatar
        const avatar = { ...prevState.avatar };
        // use lodash to be able to use dot and array notation
        _.set(avatar, key, value);
        return { avatar };
      });
    };

  handleChangeEditor = (key) => (value) => {
    this.setState((prevState) => {
      // get the previous state's avatar
      const avatar = { ...prevState.avatar };
      // use lodash to be able to use dot and array notation
      _.set(avatar, key, value);
      return { avatar };
    });
    this.handlePersonalityVerification();
  };

  handleAddEmptyStep = () => {
    this.setState((prevState) => {
      const newPersonality = stringifyPersonality(
        addEmptyStep(prevState.avatar.personality),
      );
      return { avatar: { ...prevState.avatar, personality: newPersonality } };
    });
    this.handlePersonalityVerification();
  };

  handleResetToDefaultPersonality = () => {
    this.setState((prevState) => ({
      avatar: {
        ...prevState.avatar,
        personality: stringifyPersonality(DEFAULT_PERSONALITY_JSON),
      },
    }));
    this.handlePersonalityVerification();
  };

  handleChangeSwitch =
    (key) =>
    ({ target: { checked } }) => {
      this.setState((prevState) => ({
        avatar: {
          ...prevState.avatar,
          [key]: checked,
        },
      }));
    };

  handleFile = ({ target }) => {
    const reader = new FileReader();
    reader.addEventListener('load', ({ target: fileTarget }) => {
      const fileContent = fileTarget.result;
      this.setState((prevSate) => ({
        avatar: { ...prevSate.avatar, personality: fileContent },
      }));
      this.handlePersonalityVerification();
    });
    reader.readAsText(target.files[0]);
  };

  handlePersonalityVerification = () => {
    const { avatar } = this.state;
    try {
      validatePersonality(avatar.personality);
      this.setState({
        validator: {
          severity: VALIDATOR_SUCCESS,
          message: DEFAULT_VALIDATOR_MESSAGE,
        },
      });
    } catch (e) {
      this.setState({
        validator: { severity: VALIDATOR_ERROR, message: e.message },
      });
    }
  };

  handleClose = () => {
    const { dispatchCloseAvatarDialog } = this.props;
    this.setState({ avatar: DEFAULT_AVATAR });
    dispatchCloseAvatarDialog();
  };

  renderModalContent() {
    const { t, activity, classes, avatar: avatarProp } = this.props;
    const { avatar, validator } = this.state;

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
      />
    );

    const autoBotSwitchControl = (
      <Switch
        color="primary"
        value="autoBot"
        size="small"
        checked={avatar.autoBot}
        onChange={this.handleChangeSwitch('autoBot')}
      />
    );

    const autoSeedSwitchControl = (
      <Switch
        color="primary"
        value="autoSeed"
        size="small"
        checked={avatar.autoSeed}
        onChange={this.handleChangeSwitch('autoSeed')}
      />
    );

    const addEmptyStepButton = (
      <Button
        color="primary"
        variant="outlined"
        onClick={this.handleAddEmptyStep}
      >
        {t('Add Empty Step')}
      </Button>
    );

    const resetToDefaultButton = (
      <Button
        color="primary"
        variant="outlined"
        onClick={this.handleResetToDefaultPersonality}
      >
        {t('Reset Defaults')}
      </Button>
    );

    const fileUploadControl = (
      <label htmlFor="button-file">
        <input
          accept="application/json"
          className={classes.input}
          id="button-file"
          type="file"
          onChange={this.handleFile}
        />
        <Button color="primary" variant="outlined" component="span">
          {t('Upload File')}
        </Button>
      </label>
    );

    return (
      <>
        <Grid
          container
          direction="column"
          spacing={3}
          alignItems="stretch"
          className={classes.noFlex}
        >
          <Grid item className={classes.noFlex}>
            {nameControl}
          </Grid>
          <Grid item className={classes.noFlex}>
            {uriControl}
          </Grid>
          <Grid
            container
            direction="row"
            spacing={3}
            justifyContent="space-between"
            alignItems="center"
            className={classes.lastGrid}
          >
            <Grid item>
              <FormControlLabel
                control={autoBotSwitchControl}
                label={t('Enable Auto Reply')}
              />
            </Grid>
            {avatar.autoBot ? (
              <Grid item>
                <FormControlLabel
                  control={autoSeedSwitchControl}
                  label={t('Enable Automatic Message Seeding')}
                />
              </Grid>
            ) : null}
          </Grid>
          {avatar.autoBot ? (
            <>
              <Grid container direction="row" justifyContent="space-evenly">
                <Grid item>{addEmptyStepButton}</Grid>
                <Grid item>{resetToDefaultButton}</Grid>
                <Grid item>{fileUploadControl}</Grid>
              </Grid>
              <Grid item>
                <FormLabel>{t('Bot Personality')}</FormLabel>
                <Editor
                  className={classes.editor}
                  height="20vh"
                  defaultLanguage={JSON_LANG}
                  value={avatar.personality}
                  onChange={this.handleChangeEditor('personality')}
                  options={{
                    scrollBeyondLastLine: false,
                    detectIndentation: false,
                    tabSize: 2,
                  }}
                />
                <Alert
                  variant={
                    validator.severity === VALIDATOR_ERROR
                      ? 'filled'
                      : 'outlined'
                  }
                  severity={validator.severity}
                >
                  {t(validator.message)}
                </Alert>
              </Grid>
            </>
          ) : null}
        </Grid>
        <Divider className={classes.divider} />
        <Button
          variant="contained"
          color="primary"
          className={classes.button}
          onClick={this.handleSave}
          disabled={!hasChanged || validator.severity === VALIDATOR_ERROR}
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
          className={classes.modal}
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
