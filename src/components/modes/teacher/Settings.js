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
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { connect } from 'react-redux';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { withTranslation } from 'react-i18next';
import Editor from '@monaco-editor/react';
import { closeSettings, patchAppInstance } from '../../../actions';
import Loader from '../../common/Loader';
import { JAVASCRIPT, MATLAB, PYTHON } from '../../../config/settings';
import {
  HEADER_VISIBILITY_SWITCH_CYPRESS,
  SAVE_SETTINGS_BUTTON_CYPRESS,
  SETTINGS_MODAL_CYPRESS,
} from '../../../config/selectors';
import { DEFAULT_SETTINGS } from '../../../reducers/appInstance';

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
    }).isRequired,
    open: PropTypes.bool.isRequired,
    activity: PropTypes.number.isRequired,
    settings: PropTypes.shape({
      programmingLanguage: PropTypes.string.isRequired,
      headerVisible: PropTypes.bool.isRequired,
      code: PropTypes.string.isRequired,
    }).isRequired,
    t: PropTypes.func.isRequired,
    dispatchCloseSettings: PropTypes.func.isRequired,
    dispatchPatchAppInstance: PropTypes.func.isRequired,
    i18n: PropTypes.shape({
      defaultNS: PropTypes.string,
    }).isRequired,
  };

  state = (() => {
    const { settings } = this.props;

    return {
      settings,
    };
  })();

  handleSave = () => {
    const { dispatchPatchAppInstance, dispatchCloseSettings } = this.props;
    const { settings } = this.state;

    // todo: trim string values on save
    dispatchPatchAppInstance({
      data: settings,
    });
    dispatchCloseSettings();
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

  handleClose = () => {
    const { dispatchCloseSettings, settings } = this.props;
    this.setState({ ...DEFAULT_SETTINGS, ...settings });
    dispatchCloseSettings();
  };

  renderModalContent() {
    const { t, activity, classes, settings: settingsProp } = this.props;
    const { settings } = this.state;
    const { headerVisible, code, programmingLanguage } = settings;

    const hasChanged = !_.isEqual(settingsProp, settings);

    if (activity) {
      return <Loader />;
    }

    const headerVisibleSwitchControl = (
      <Switch
        data-cy={HEADER_VISIBILITY_SWITCH_CYPRESS}
        color="primary"
        checked={headerVisible}
        onChange={this.handleChangeSwitch('headerVisible')}
        value="headerVisibility"
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
        <MenuItem value={PYTHON}>Python</MenuItem>
        <MenuItem value={MATLAB}>MATLAB</MenuItem>
      </Select>
    );

    return (
      <>
        <Grid container direction="column" spacing={2} alignItems="stretch">
          <Grid item>
            <FormControlLabel
              control={headerVisibleSwitchControl}
              label={t('Show Header to Students')}
            />
          </Grid>
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
              options={{ scrollBeyondLastLine: false }}
            />
          </Grid>
        </Grid>
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
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Settings);
const TranslatedComponent = withTranslation()(ConnectedComponent);

export default withStyles(styles)(TranslatedComponent);
