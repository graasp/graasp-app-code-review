import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import { withTranslation } from 'react-i18next';
import {
  AssignmentInd as AccountIcon,
  Code,
  TableChart as TableIcon,
  Refresh as RefreshIcon,
} from '@material-ui/icons';
import IconButton from '@material-ui/core/IconButton';
import { ReactComponent as Logo } from '../../resources/logo.svg';
import './Header.css';
import { addQueryParamsToUrl } from '../../utils/url';
import { AVATAR_VIEW, DEFAULT_VIEW, PRESET_VIEW } from '../../config/views';
import { DEFAULT_MODE, TEACHER_MODES } from '../../config/settings';
import { getAppInstanceResources, getUsers } from '../../actions';

const styles = (theme) => ({
  root: {
    flexGrow: 1,
  },
  grow: {
    flexGrow: 1,
  },
  logo: {
    height: '48px',
    marginRight: theme.spacing(2),
  },
  button: {
    '&:disabled': {
      backgroundColor: 'red!important',
    },
  },
});

class Header extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    classes: PropTypes.shape({
      root: PropTypes.string,
      logo: PropTypes.string,
      grow: PropTypes.string,
      button: PropTypes.string,
      disabled: PropTypes.string,
    }).isRequired,
    view: PropTypes.string,
    mode: PropTypes.string,
    dispatchGetAppInstanceResources: PropTypes.func.isRequired,
    dispatchGetUsers: PropTypes.func.isRequired,
  };

  static defaultProps = {
    view: DEFAULT_VIEW,
    mode: DEFAULT_MODE,
  };

  handleRefresh = () => {
    const { dispatchGetAppInstanceResources, dispatchGetUsers } = this.props;

    dispatchGetAppInstanceResources();
    dispatchGetUsers();
  };

  renderTeacherButtons = () => {
    const { view, classes, mode } = this.props;
    if (TEACHER_MODES.includes(mode)) {
      return [
        <IconButton
          key="table"
          disabled={view === DEFAULT_VIEW}
          className={classes.button}
          href={`index.html${addQueryParamsToUrl({ view: DEFAULT_VIEW })}`}
        >
          <TableIcon />
        </IconButton>,
        <IconButton
          key="avatar"
          disabled={view === AVATAR_VIEW}
          className={classes.button}
          href={`index.html${addQueryParamsToUrl({ view: AVATAR_VIEW })}`}
        >
          <AccountIcon />
        </IconButton>,
        <IconButton
          key="preset"
          disabled={view === PRESET_VIEW}
          className={classes.button}
          href={`index.html${addQueryParamsToUrl({ view: PRESET_VIEW })}`}
        >
          <Code />
        </IconButton>,
      ];
    }
    return null;
  };

  renderReloadButton = () => {
    const { mode } = this.props;

    if (TEACHER_MODES.includes(mode)) {
      return [
        <IconButton onClick={this.handleRefresh} key="refresh">
          <RefreshIcon />
        </IconButton>,
      ];
    }
    return null;
  };

  render() {
    const { t, classes } = this.props;
    return (
      <header>
        <AppBar position="static">
          <Toolbar>
            <Logo className={classes.logo} />
            <Typography variant="h6" color="inherit" className={classes.grow}>
              {t('Code Review')}
            </Typography>
            {this.renderTeacherButtons()}
            {this.renderReloadButton()}
          </Toolbar>
        </AppBar>
      </header>
    );
  }
}

const mapStateToProps = ({ context }) => ({
  view: context.view,
  mode: context.mode,
});

const mapDispatchToProps = {
  dispatchGetAppInstanceResources: getAppInstanceResources,
  dispatchGetUsers: getUsers,
};

const ConnectedComponent = connect(mapStateToProps, mapDispatchToProps)(Header);
const TranslatedComponent = withTranslation()(ConnectedComponent);

export default withStyles(styles)(TranslatedComponent);
