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
} from '@material-ui/icons';
import IconButton from '@material-ui/core/IconButton';
import { ReactComponent as Logo } from '../../resources/logo.svg';
import './Header.css';
import { addQueryParamsToUrl } from '../../utils/url';
import { AVATAR_VIEW, DEFAULT_VIEW, PRESET_VIEW } from '../../config/views';

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
    appInstanceId: PropTypes.string,
    spaceId: PropTypes.string,
    view: PropTypes.string,
  };

  static defaultProps = {
    appInstanceId: null,
    spaceId: null,
    view: DEFAULT_VIEW,
  };

  renderAppInstanceLink = () => {
    const { appInstanceId, t } = this.props;
    if (!appInstanceId) {
      return (
        <a
          href={addQueryParamsToUrl({
            appInstanceId: '6156e70ab253020033364411',
          })}
          className="HeaderLink"
        >
          {t('Use Sample App Instance')}
        </a>
      );
    }
    return <div />;
  };

  renderSpaceLink = () => {
    const { spaceId, t } = this.props;
    if (!spaceId) {
      return (
        <a
          href={addQueryParamsToUrl({ spaceId: '5b56e70ab253020033364411' })}
          className="HeaderLink"
        >
          {t('Use Sample Space')}
        </a>
      );
    }
    return <div />;
  };

  renderTeacherButtons = () => {
    const { view, classes } = this.props;
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
        key="table"
        disabled={view === PRESET_VIEW}
        className={classes.button}
        href={`index.html${addQueryParamsToUrl({ view: PRESET_VIEW })}`}
      >
        <Code />
      </IconButton>,
    ];
  };

  render() {
    const { t, classes } = this.props;
    return (
      <header>
        <AppBar position="static">
          <Toolbar>
            <Logo className={classes.logo} />
            <Typography variant="h6" color="inherit" className={classes.grow}>
              {t('Graasp App Starter')}
            </Typography>
            {this.renderSpaceLink()}
            {this.renderAppInstanceLink()}
            {this.renderTeacherButtons()}
          </Toolbar>
        </AppBar>
      </header>
    );
  }
}

const mapStateToProps = ({ context }) => ({
  appInstanceId: context.appInstanceId,
  spaceId: context.spaceId,
  view: context.view,
});

const ConnectedComponent = connect(mapStateToProps)(Header);
const TranslatedComponent = withTranslation()(ConnectedComponent);

export default withStyles(styles)(TranslatedComponent);
