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
  Tabs,
  Tab,
  List,
  ListItem,
  Checkbox,
  ListItemText,
  ListItemIcon,
  Paper,
  RadioGroup,
  Radio,
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
  getUsers,
} from '../../../actions';
import Loader from '../../common/Loader';
import { BOT_USER } from '../../../config/appInstanceResourceTypes';
import {
  DEFAULT_BOT_USE_USER_LIST_SETTING,
  DEFAULT_BOT_USER_LIST_POLARITY_SETTING,
  DEFAULT_BOT_USER_LIST_SETTING,
  HIDE_BOT,
  JSON_LANG,
  PUBLIC_VISIBILITY,
  SHOW_BOT,
} from '../../../config/settings';
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
  description: '',
  autoBot: false,
  autoSeed: false,
  personality: stringifyPersonality(DEFAULT_PERSONALITY_JSON),
  useUserList: DEFAULT_BOT_USE_USER_LIST_SETTING,
  userListPolarity: DEFAULT_BOT_USER_LIST_POLARITY_SETTING,
  userList: DEFAULT_BOT_USER_LIST_SETTING,
};

const BOT_IDENTITY_SETTINGS_TAB = 'BOT_IDENTITY_SETTINGS_TAB';
const AUTO_BOT_SETTINGS_TAB = 'AUTO_BOT_SETTINGS_TAB';
const MORE_SETTINGS_TAB = 'MORE_SETTINGS_TAB';
const DEFAULT_TAB = BOT_IDENTITY_SETTINGS_TAB;
const TABS = [
  BOT_IDENTITY_SETTINGS_TAB,
  AUTO_BOT_SETTINGS_TAB,
  MORE_SETTINGS_TAB,
];

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
  container: {
    display: 'block',
    marginTop: theme.spacing(2),
  },
  noFlex: {
    display: 'block',
  },
  userListContainer: {
    maxHeight: '40vh',
    overflow: 'auto',
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
      userListContainer: PropTypes.string,
      container: PropTypes.string,
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
      useUserList: PropTypes.bool,
      userListPolarity: PropTypes.string,
      userList: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      ),
      personality: PropTypes.string,
      description: PropTypes.string,
    }),
    t: PropTypes.func.isRequired,
    dispatchCloseAvatarDialog: PropTypes.func.isRequired,
    dispatchPostAppInstanceResource: PropTypes.func.isRequired,
    dispatchPatchAppInstanceResource: PropTypes.func.isRequired,
    dispatchGetUsers: PropTypes.func.isRequired,
    users: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      }),
    ),
  };

  static defaultProps = {
    avatar: DEFAULT_AVATAR,
    users: [],
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
      tabIndex: TABS.indexOf(DEFAULT_TAB),
    };
  })();

  componentDidMount() {
    const { dispatchGetUsers } = this.props;
    dispatchGetUsers();
  }

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
    const { avatar: avatarState } = this.state;

    // merging non-existing default settings with spread
    // properties from default avatar that do not exist in
    // state will be added with their default value
    const avatar = {
      ...DEFAULT_AVATAR,
      ...avatarState,
    };

    // this is a new bot so avatarId is null
    if (!avatarId) {
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

  handleChangeBotVisibility = (value) => {
    this.setState((prevState) => ({
      avatar: { ...prevState.avatar, userListPolarity: value },
    }));
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

  handleOnClickUserChecked = (value) => {
    const { avatar } = this.state;
    const { userList = DEFAULT_BOT_USER_LIST_SETTING } = avatar;
    const currentIndex = userList.indexOf(value);
    // make a copy of the array
    const newUserList = [...userList];

    // not found
    if (currentIndex === -1) {
      // user is added to the list (checkbox -> true)
      newUserList.push(value);
    } else {
      // user is removed from the list (checkbox -> false)
      newUserList.splice(currentIndex, 1);
    }
    this.setState((prevState) => ({
      avatar: { ...prevState.avatar, userList: newUserList },
    }));
  };

  handleOnClickAllUsers = (check) => {
    const { users } = this.props;
    if (check) {
      // add all users to the list
      this.setState((prevState) => ({
        avatar: { ...prevState.avatar, userList: users.map((u) => u.id) },
      }));
    } else {
      // remove all users from the list -> set the list ot empty array
      this.setState((prevState) => ({
        avatar: { ...prevState.avatar, userList: [] },
      }));
    }
  };

  handleChangeTab = (event, newValue) => {
    this.setState({ tabIndex: newValue });
  };

  renderModalContent() {
    const { t, activity, classes, avatar: avatarProp, users } = this.props;
    const { avatar, validator, tabIndex } = this.state;
    const {
      useUserList = DEFAULT_BOT_USE_USER_LIST_SETTING,
      userList = DEFAULT_BOT_USER_LIST_SETTING,
      userListPolarity = DEFAULT_BOT_USER_LIST_POLARITY_SETTING,
    } = avatar;

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

    const userListSwitchControl = (
      <Switch
        color="primary"
        value="useUserList"
        size="small"
        checked={useUserList}
        onChange={this.handleChangeSwitch('useUserList')}
      />
    );

    const checkAllButton = (
      <Button
        color="primary"
        variant="outlined"
        onClick={() => this.handleOnClickAllUsers(true)}
      >
        {t('Check all')}
      </Button>
    );

    const unCheckAllButton = (
      <Button
        color="primary"
        variant="outlined"
        onClick={() => this.handleOnClickAllUsers(false)}
      >
        {t('Uncheck all')}
      </Button>
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
        <div hidden={tabIndex !== TABS.indexOf(BOT_IDENTITY_SETTINGS_TAB)}>
          <Grid
            container
            direction="column"
            spacing={3}
            alignItems="stretch"
            className={classes.container}
          >
            <Grid item className={classes.noFlex}>
              {nameControl}
            </Grid>
            <Grid item className={classes.noFlex}>
              {uriControl}
            </Grid>
            <Grid item className={classes.noFlex}>
              {descriptionControl}
            </Grid>
          </Grid>
        </div>
        <div hidden={tabIndex !== TABS.indexOf(AUTO_BOT_SETTINGS_TAB)}>
          <Grid
            container
            direction="column"
            spacing={3}
            alignItems="stretch"
            className={classes.container}
          >
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
        </div>
        <div hidden={tabIndex !== TABS.indexOf(MORE_SETTINGS_TAB)}>
          <Grid
            container
            direction="column"
            spacing={3}
            alignItems="stretch"
            className={classes.container}
          >
            <Grid item>
              <FormControlLabel
                control={userListSwitchControl}
                label={t('Enable selective audience')}
              />
            </Grid>
            {useUserList ? (
              <>
                <Grid
                  container
                  item
                  direction="row"
                  justifyContent="space-evenly"
                >
                  <Grid item>{checkAllButton}</Grid>
                  <Grid item>{unCheckAllButton}</Grid>
                </Grid>
                <Grid item>
                  <FormLabel component="legend">
                    {t('For the selected users, bot will be')}{' '}
                  </FormLabel>
                  <RadioGroup
                    aria-label="show-bot"
                    name="userListPolarity"
                    value={userListPolarity}
                    onChange={(e) =>
                      this.handleChangeBotVisibility(e.target.value)
                    }
                  >
                    <FormControlLabel
                      value={SHOW_BOT}
                      control={<Radio color="primary" />}
                      label={t(SHOW_BOT)}
                    />
                    <FormControlLabel
                      value={HIDE_BOT}
                      control={<Radio color="primary" />}
                      label={t(HIDE_BOT)}
                    />
                  </RadioGroup>
                </Grid>
                <Grid item>
                  <Paper
                    elevation={0}
                    variant="outlined"
                    className={classes.userListContainer}
                  >
                    <List>
                      {users.map((u) => (
                        <ListItem
                          key={u.id}
                          dense
                          button
                          onClick={() => this.handleOnClickUserChecked(u.id)}
                        >
                          <ListItemIcon>
                            <Checkbox
                              color="primary"
                              // check if user is in the userList
                              checked={userList.includes(u.id)}
                            />
                          </ListItemIcon>
                          <ListItemText primary={u.name} secondary={u.id} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </>
            ) : null}
          </Grid>
        </div>
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
    const { tabIndex } = this.state;
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
            <Tabs
              centered
              value={tabIndex}
              onChange={(e, v) => this.handleChangeTab(e, v)}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab
                label={t('Bot Identity Settings')}
                id={BOT_IDENTITY_SETTINGS_TAB}
              />
              <Tab label={t('Auto Bot Settings')} id={AUTO_BOT_SETTINGS_TAB} />
              <Tab label={t('More Settings')} id={MORE_SETTINGS_TAB} />
            </Tabs>
            {this.renderModalContent()}
          </div>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = ({
  layout,
  appInstance,
  appInstanceResources,
  users,
}) => {
  const { avatarId } = layout.avatarDialog;
  return {
    open: layout.avatarDialog.open,
    activity: appInstance.activity.length,
    avatarId,
    avatar: appInstanceResources.content.find(
      (r) => r.type === BOT_USER && r._id === avatarId,
    )?.data,
    users: users.content,
  };
};

const mapDispatchToProps = {
  dispatchPatchAppInstanceResource: patchAppInstanceResource,
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchCloseAvatarDialog: closeAvatarDialog,
  dispatchGetUsers: getUsers,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(AvatarDialog);
const TranslatedComponent = withTranslation()(ConnectedComponent);

export default withStyles(styles)(TranslatedComponent);
