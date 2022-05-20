import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Divider,
  FormControlLabel,
  Switch,
  Button,
  Modal,
  Grid,
  FormLabel,
  FormControl,
  FormGroup,
  Tabs,
  Tab,
  Box,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { connect } from 'react-redux';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { withTranslation } from 'react-i18next';
import Editor from '@monaco-editor/react';
import { closeSettings, patchAppInstance, postAction } from '../../../actions';
import Loader from '../../common/Loader';
import {
  DEFAULT_ALLOW_COMMENTS_SETTING,
  DEFAULT_ALLOW_REPLIES_SETTING,
  DEFAULT_CODE_CONTENT_SETTING,
  DEFAULT_PROGRAMMING_LANGUAGE,
  DEFAULT_SHOW_EDIT_BUTTON_SETTING,
  DEFAULT_SHOW_VERSION_NAVIGATION_SETTING,
  DEFAULT_SHOW_VISIBILITY_BUTTON_SETTING,
  DEFAULT_TOP_BAR_VISIBLE_SETTING,
  DEFAULT_VISIBILITY_MODE_SETTING,
  JAVA,
  JAVASCRIPT,
  MATLAB,
  PYTHON,
} from '../../../config/settings';
import {
  SAVE_SETTINGS_BUTTON_CYPRESS,
  SETTINGS_MODAL_CYPRESS,
} from '../../../config/selectors';
import { DEFAULT_SETTINGS } from '../../../reducers/appInstance';
import { programmingLanguageSettings } from '../../../constants/programmingLanguages';
import { EDITED_SETTINGS } from '../../../config/verbs';

const CODE_SETTINGS_TAB = 'code-settings-tab';
const DISPLAY_SETTINGS_TAB = 'display-settings-tab';
const DEFAULT_TAB = CODE_SETTINGS_TAB;
const TABS = [CODE_SETTINGS_TAB, DISPLAY_SETTINGS_TAB];

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
    minWidth: 180,
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
  editor: {},
  tabBox: {},
  container: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
});

class Settings extends Component {
  static propTypes = {
    classes: PropTypes.shape({
      divider: PropTypes.string,
      formControl: PropTypes.string,
      right: PropTypes.string,
      noMaxWidth: PropTypes.string,
      formControlSpace: PropTypes.string,
      appBar: PropTypes.string,
      fullScreen: PropTypes.string,
      fab: PropTypes.string,
      button: PropTypes.string,
      editor: PropTypes.string,
      paper: PropTypes.string,
      tabBox: PropTypes.string,
      container: PropTypes.string,
    }).isRequired,
    open: PropTypes.bool.isRequired,
    activity: PropTypes.number.isRequired,
    settings: PropTypes.shape({
      programmingLanguage: PropTypes.string.isRequired,
      headerVisible: PropTypes.bool.isRequired,
      topBarVisible: PropTypes.bool.isRequired,
      showVersionNav: PropTypes.bool.isRequired,
      showEditButton: PropTypes.bool.isRequired,
      showVisibility: PropTypes.bool.isRequired,
      visibility: PropTypes.bool.isRequired,
      allowComments: PropTypes.bool.isRequired,
      allowReplies: PropTypes.bool.isRequired,
      code: PropTypes.string.isRequired,
    }).isRequired,
    t: PropTypes.func.isRequired,
    dispatchCloseSettings: PropTypes.func.isRequired,
    dispatchPatchAppInstance: PropTypes.func.isRequired,
    dispatchPostAction: PropTypes.func.isRequired,
    i18n: PropTypes.shape({
      defaultNS: PropTypes.string,
    }).isRequired,
  };

  state = (() => {
    const { settings } = this.props;

    return {
      settings,
      tabIndex: TABS.indexOf(DEFAULT_TAB),
    };
  })();

  handleSave = () => {
    const {
      dispatchPatchAppInstance,
      dispatchCloseSettings,
      dispatchPostAction,
    } = this.props;
    const { settings } = this.state;

    // todo: trim string values on save
    dispatchPatchAppInstance({
      data: settings,
    });
    dispatchCloseSettings();
    // record settings changed
    dispatchPostAction({
      data: {
        settings,
      },
      verb: EDITED_SETTINGS,
    });
  };

  handleChangeSwitch =
    (key) =>
    ({ target: { checked } }) => {
      this.setState((prevState) => ({
        settings: {
          ...prevState.settings,
          [key]: checked,
        },
      }));
    };

  handleChangeCheckbox =
    (key) =>
    ({ target: { checked } }) => {
      this.setState((prevState) => ({
        settings: {
          ...prevState.settings,
          [key]: checked,
        },
      }));
    };

  handleChangeTextField =
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

  handleChangeEditor = (key) => (value) => {
    this.setState((prevState) => {
      // get the previous state's settings
      const settings = { ...prevState.settings };
      // use lodash to be able to use dot and array notation
      _.set(settings, key, value);
      return { settings };
    });
  };

  handleChangeIntegerField =
    (key) =>
    ({ target: { value } }) => {
      this.setState((prevState) => {
        // get the previous state's settings
        const settings = { ...prevState.settings };
        // parse integer and fall back to default if not a number
        const parsedValue = parseInt(value, 10) || DEFAULT_SETTINGS[key];
        // use lodash to be able to use dot and array notation
        _.set(settings, key, parsedValue);
        return { settings };
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

  handleChangeTab = (event, newValue) => {
    this.setState({ tabIndex: newValue });
  };

  handleClose = () => {
    const { dispatchCloseSettings, settings } = this.props;
    this.setState({ ...DEFAULT_SETTINGS, ...settings });
    dispatchCloseSettings();
  };

  renderModalContent() {
    const { t, activity, classes, settings: settingsProp } = this.props;
    const { settings, tabIndex } = this.state;
    const {
      topBarVisible = DEFAULT_TOP_BAR_VISIBLE_SETTING,
      code = DEFAULT_CODE_CONTENT_SETTING,
      programmingLanguage = DEFAULT_PROGRAMMING_LANGUAGE,
      showVersionNav = DEFAULT_SHOW_VERSION_NAVIGATION_SETTING,
      showEditButton = DEFAULT_SHOW_EDIT_BUTTON_SETTING,
      showVisibility = DEFAULT_SHOW_VISIBILITY_BUTTON_SETTING,
      visibility = DEFAULT_VISIBILITY_MODE_SETTING,
      allowComments = DEFAULT_ALLOW_COMMENTS_SETTING,
      allowReplies = DEFAULT_ALLOW_REPLIES_SETTING,
    } = settings;

    const hasChanged = !_.isEqual(settingsProp, settings);

    if (activity) {
      return <Loader />;
    }

    const topBarVisibleSwitchControl = (
      <Switch
        color="primary"
        checked={topBarVisible}
        onChange={this.handleChangeSwitch('topBarVisible')}
        value="topBarVisibility"
      />
    );

    const versionNavSwitchControl = (
      <Switch
        color="primary"
        value="showVersionNav"
        checked={showVersionNav}
        onChange={this.handleChangeCheckbox('showVersionNav')}
        disabled={!topBarVisible}
      />
    );

    const editButtonSwitchControl = (
      <Switch
        color="primary"
        value="showEditButton"
        checked={showEditButton}
        onChange={this.handleChangeCheckbox('showEditButton')}
        disabled={!topBarVisible}
      />
    );

    const visibilityToggleSwitchControl = (
      <Switch
        color="primary"
        value="showVisibility"
        checked={showVisibility}
        onChange={this.handleChangeCheckbox('showVisibility')}
        disabled={!topBarVisible}
      />
    );

    const codeSampleVisibilitySwitchControl = (
      <Switch
        color="primary"
        value="visibility"
        checked={visibility}
        onChange={this.handleChangeCheckbox('visibility')}
        disabled={!topBarVisible}
      />
    );

    const allowCommentsSwitchControl = (
      <Switch
        color="primary"
        value="allowComments"
        checked={allowComments}
        onChange={this.handleChangeCheckbox('allowComments')}
      />
    );

    const allowRepliesSwitchControl = (
      <Switch
        color="primary"
        value="allowReplies"
        checked={allowReplies}
        onChange={this.handleChangeCheckbox('allowReplies')}
      />
    );

    const programmingLanguageSelectControl = (
      <Select
        className={classes.formControl}
        value={programmingLanguage}
        onChange={this.handleChangeSelect('programmingLanguage')}
        inputProps={{
          name: 'programmingLanguage',
          id: 'programmingLanguageSelect',
        }}
      >
        <MenuItem value={JAVASCRIPT}>JavaScript</MenuItem>
        <MenuItem value={JAVA}>Java</MenuItem>
        <MenuItem value={PYTHON}>Python</MenuItem>
        <MenuItem value={MATLAB}>MATLAB</MenuItem>
      </Select>
    );

    return (
      <>
        <div hidden={tabIndex !== TABS.indexOf(DISPLAY_SETTINGS_TAB)}>
          <Grid
            className={classes.container}
            container
            direction="column"
            spacing={2}
            alignItems="stretch"
          >
            <Grid item>
              <FormControl>
                <FormGroup>
                  <FormControlLabel
                    control={topBarVisibleSwitchControl}
                    label={t('Show Top Bar to Students')}
                  />
                  <FormControlLabel
                    control={versionNavSwitchControl}
                    label={t('Show Version Navigation')}
                  />
                  <FormControlLabel
                    control={editButtonSwitchControl}
                    label={t('Show Code Edit Button')}
                  />
                  <FormControlLabel
                    control={visibilityToggleSwitchControl}
                    label={t('Show Visibility Toggle')}
                  />
                  <FormControlLabel
                    control={codeSampleVisibilitySwitchControl}
                    label={t("Allow students to see other students' code")}
                  />
                </FormGroup>
              </FormControl>
              <FormControl>
                <FormGroup>
                  <FormControlLabel
                    control={allowCommentsSwitchControl}
                    label={t('Allow Comments')}
                  />
                  <FormControlLabel
                    control={allowRepliesSwitchControl}
                    label={t('Allow Replies')}
                  />
                </FormGroup>
              </FormControl>
            </Grid>
          </Grid>
        </div>
        <div hidden={tabIndex !== TABS.indexOf(CODE_SETTINGS_TAB)}>
          <Grid
            className={classes.container}
            container
            direction="column"
            spacing={2}
            alignItems="stretch"
          >
            <Grid item>
              <FormControlLabel
                control={programmingLanguageSelectControl}
                label={t('Programming Language')}
              />
            </Grid>
            <Grid item className={classes.editor}>
              <FormLabel>{t('Code')}</FormLabel>
              <Editor
                height="50vh"
                defaultLanguage={programmingLanguage}
                language={programmingLanguage}
                value={code}
                onChange={this.handleChangeEditor('code')}
                options={{
                  scrollBeyondLastLine: false,
                  detectIndentation: false,
                  tabSize:
                    programmingLanguageSettings[programmingLanguage].tabSize,
                }}
              />
            </Grid>
          </Grid>
        </div>
        <Divider className={classes.divider} />
        <Button
          variant="contained"
          color="primary"
          className={classes.button}
          onClick={this.handleSave}
          disabled={!hasChanged}
          data-cy={SAVE_SETTINGS_BUTTON_CYPRESS}
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
          data-cy={SETTINGS_MODAL_CYPRESS}
          aria-labelledby="settings-modal"
          aria-describedby="settings-modal-description"
          open={open}
          onClose={this.handleClose}
        >
          <div style={getModalStyle()} className={classes.paper}>
            <Typography variant="h5" id="settings-modal-title">
              {t('Settings')}
            </Typography>
            <Box
              sx={{ borderBottom: 1, borderColor: 'divider', margin: 'auto' }}
            >
              <Tabs
                centered
                value={tabIndex}
                onChange={this.handleChangeTab}
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label={t('Code Settings')} id={CODE_SETTINGS_TAB} />
                <Tab label={t('Display Settings')} id={DISPLAY_SETTINGS_TAB} />
              </Tabs>
            </Box>
            {this.renderModalContent()}
          </div>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = ({ layout, appInstance }) => ({
  open: layout.settings.open,
  settings: appInstance.content.settings,
  activity: appInstance.activity.length,
});

const mapDispatchToProps = {
  dispatchCloseSettings: closeSettings,
  dispatchPatchAppInstance: patchAppInstance,
  dispatchPostAction: postAction,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Settings);
const TranslatedComponent = withTranslation()(ConnectedComponent);

export default withStyles(styles)(TranslatedComponent);
