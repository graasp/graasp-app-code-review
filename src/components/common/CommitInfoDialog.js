import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  Grid,
  Typography,
} from '@material-ui/core';
import { formatDistance } from 'date-fns';
import { enGB, fr } from 'date-fns/locale';
import { closeCommitInfoDialog } from '../../actions';
import { CODE } from '../../config/appInstanceResourceTypes';
import {
  DEFAULT_INSTRUCTOR_COMMIT_INFO,
  PLACEHOLDER_DATE,
} from '../../config/settings';

// to add a new language to the dates
const locales = { fr, en: enGB };

export class CommitInfoDialog extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    classes: PropTypes.shape({
      grid: PropTypes.string,
      gridItems: PropTypes.string,
      descriptionText: PropTypes.string,
    }).isRequired,
    dispatchCloseCommitInfoDialog: PropTypes.func.isRequired,
    commit: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ).isRequired,
  };

  static defaultProps = {};

  static styles = (theme) => ({
    grid: {
      width: '60vw',
      maxWidth: '700px',
    },
    gridItems: {
      padding: theme.spacing(2),
    },
    descriptionText: {
      whiteSpace: 'pre-line',
    },
  });

  state = {};

  handleClose = () => {
    const { dispatchCloseCommitInfoDialog } = this.props;
    dispatchCloseCommitInfoDialog();
  };

  renderContent = () => {
    const { t, commit, classes } = this.props;

    return (
      <Grid
        className={classes.grid}
        container
        direction="column"
        spacing={1}
        alignItems="stretch"
      >
        {commit.map(({ label, value }) => (
          <Grid item container spacing={1} key={label}>
            <Grid item xs={12} sm={4}>
              <FormLabel>{t(label)}</FormLabel>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography className={classes.descriptionText} variant="body1">
                {value}
              </Typography>
            </Grid>
          </Grid>
        ))}
      </Grid>
    );
  };

  render() {
    const { open, t } = this.props;

    return (
      <Dialog
        open={open}
        onClose={this.handleClose}
        scroll="body"
        maxWidth="lg"
      >
        <DialogTitle>{t('Commit Info')}</DialogTitle>
        <DialogContent>{this.renderContent()}</DialogContent>
        <DialogActions>
          <Button color="primary" onClick={this.handleClose}>
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

// get the app instance resources that are saved in the redux store
const mapStateToProps = ({ users, appInstanceResources, layout, context }) => {
  const { lang } = context;

  const commitResource = appInstanceResources.content.find(
    (r) => r.type === CODE && r._id === layout.codeEditorSettings.codeId,
  );

  const committerName = users.content.find(
    (u) => u.id === commitResource?.user,
  )?.name;

  const createdAt = commitResource?.createdAt || PLACEHOLDER_DATE;
  const formattedCreatedAt = formatDistance(Date.parse(createdAt), new Date(), {
    addSuffix: true, // adds "ago" at the end
    locale: locales[lang], // provides localization
  });

  const commit = commitResource
    ? [
        { label: 'Author', value: committerName },
        { label: 'Message', value: commitResource.data.commitMessage },
        { label: 'Description', value: commitResource.data.commitDescription },
        { label: 'Created', value: formattedCreatedAt },
      ]
    : DEFAULT_INSTRUCTOR_COMMIT_INFO;

  return {
    // list of labels and values to be displayed
    commit,
    open: layout.commitInfoDialog.open,
  };
};

// allow this component to dispatch a post
// request to create an app instance resource
const mapDispatchToProps = {
  dispatchCloseCommitInfoDialog: closeCommitInfoDialog,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(CommitInfoDialog);

const StyledComponent = withStyles(CommitInfoDialog.styles)(ConnectedComponent);

export default withTranslation()(StyledComponent);
