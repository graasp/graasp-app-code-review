import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { FormControl, Grid, Tooltip } from '@material-ui/core';
import { ToggleButton } from '@material-ui/lab';
import {
  EditRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from '@material-ui/icons';
import Select from 'react-select';
import { openEditorView, setCodeEditorSettings } from '../../actions';
import { DEFAULT_CODE_ID, DEFAULT_USER } from '../../config/settings';
import { CODE } from '../../config/appInstanceResourceTypes';

const styles = (theme) => ({
  container: {
    borderSpacing: 0,
    maxWidth: '800px',
    width: '90%',
    margin: '20px auto auto',
    paddingLeft: '20px',
    boxSizing: 'border-box',
    paddingRight: '0px',
  },
  toolbar: {
    paddingRight: '0px !important',
  },
  toggleButton: {
    color: theme.palette.primary.main,
  },
  editButton: {
    color: theme.palette.primary.main,
  },
  select: {
    marginLeft: 0,
    margin: 'auto',
    maxWidth: 400,
    width: '100%',
    display: 'block',
  },
});

class CodeReviewTools extends React.Component {
  static propTypes = {
    classes: PropTypes.shape({
      container: PropTypes.string.isRequired,
      gridRow: PropTypes.string.isRequired,
      toolbar: PropTypes.string.isRequired,
      lastGrid: PropTypes.string.isRequired,
      select: PropTypes.string.isRequired,
      toggleButton: PropTypes.string.isRequired,
      editButton: PropTypes.string.isRequired,
    }).isRequired,
    t: PropTypes.func.isRequired,
    dispatchOpenEditorView: PropTypes.func.isRequired,
    dispatchSetCodeEditorSettings: PropTypes.func.isRequired,
    showVisibilityButton: PropTypes.bool,
    showEditButton: PropTypes.bool,
    showHistoryDropdown: PropTypes.bool,
    hideCommentsCallback: PropTypes.func.isRequired,
    codeEditorSettings: PropTypes.shape({
      codeId: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
    }).isRequired,
    topBarVisible: PropTypes.bool.isRequired,
    allVisibleState: PropTypes.bool.isRequired,
    branchOptions: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.shape({
          code: PropTypes.string.isRequired,
          codeId: PropTypes.string.isRequired,
        }).isRequired,
      }),
    ).isRequired,
  };

  static defaultProps = {
    showVisibilityButton: true,
    showEditButton: true,
    showHistoryDropdown: true,
  };

  state = (() => {
    const { branchOptions, codeEditorSettings } = this.props;
    return {
      selectedBranch: branchOptions.find(
        (opt) => opt.value.codeId === codeEditorSettings.codeId,
      ),
    };
  })();

  handleEdit = () => {
    const { dispatchOpenEditorView } = this.props;
    // change layout to edit mode
    dispatchOpenEditorView();
  };

  handleHiddenToggle = (visibility) => {
    const { hideCommentsCallback } = this.props;
    // send true if the visibility is not "visible" -> the comments are hidden
    hideCommentsCallback(visibility !== 'show');
  };

  handleChangeBranch = (value) => {
    const { dispatchSetCodeEditorSettings } = this.props;
    // change the code that is displayed and filter the history select
    this.setState({ selectedBranch: value });
    // this.setState({ selectedBranch: value })
    dispatchSetCodeEditorSettings(value.value);
  };

  renderTopBar = () => {
    const {
      t,
      classes,
      allVisibleState,
      showVisibilityButton,
      showEditButton,
      branchOptions,
      showHistoryDropdown,
    } = this.props;
    const { selectedBranch } = this.state;

    const selectedVisibility = allVisibleState ? 'hide' : 'show';

    const hideAllCommentsToggleControl = (
      <ToggleButton
        className={classes.toggleButton}
        size="small"
        value={selectedVisibility}
        onChange={() => this.handleHiddenToggle(selectedVisibility)}
      >
        {allVisibleState ? (
          <VisibilityOffRounded fontSize="small" />
        ) : (
          <VisibilityRounded fontSize="small" />
        )}
      </ToggleButton>
    );

    const editButtonControl = (
      <ToggleButton
        className={classes.editButton}
        variant="outlined"
        size="small"
        value="edit"
        onClick={this.handleEdit}
      >
        <EditRounded fontSize="small" />
      </ToggleButton>
    );

    const branchSelectControl = (
      <Select
        className={classes.select}
        value={selectedBranch}
        options={branchOptions}
        onChange={this.handleChangeBranch}
      />
    );

    return (
      <Grid
        container
        direction="row"
        justifyContent="space-between"
        className={classes.container}
        spacing={2}
      >
        <Grid container item xs={9}>
          {showHistoryDropdown ? (
            <FormControl className={classes.select}>
              {branchSelectControl}
            </FormControl>
          ) : null}
        </Grid>
        <Grid
          className={classes.toolbar}
          container
          item
          xs={3}
          spacing={1}
          justifyContent="space-between"
          justify="flex-end"
        >
          {showEditButton ? (
            <Grid item>
              <Tooltip title={t('Edit')}>
                <FormControl>{editButtonControl}</FormControl>
              </Tooltip>
            </Grid>
          ) : null}
          {showVisibilityButton ? (
            <Grid item>
              <Tooltip
                title={
                  allVisibleState
                    ? t('Hide All Comments')
                    : t('Show All Comments')
                }
              >
                <FormControl>{hideAllCommentsToggleControl}</FormControl>
              </Tooltip>
            </Grid>
          ) : null}
        </Grid>
      </Grid>
    );
  };

  render() {
    const { topBarVisible } = this.props;
    return topBarVisible ? this.renderTopBar() : null;
  }
}

const mapStateToProps = (
  { appInstance, appInstanceResources, users, layout },
  ownProps,
) => {
  const { t } = ownProps;
  const codeSamples = appInstanceResources.content.filter(
    (r) => r.type === CODE,
  );
  const codeVersions = codeSamples.map((c) => ({
    code: c.data.code,
    codeId: c._id,
    commitMessage: c.data.commitMessage,
    userName: users.content.find((u) => u.id === c.user)?.name || DEFAULT_USER,
  }));
  const instructorCode = {
    label: t('Instructor'),
    value: {
      code: appInstance.content.settings.code,
      codeId: DEFAULT_CODE_ID,
    },
  };
  return {
    codeEditorSettings: layout.codeEditorSettings,
    topBarVisible: appInstance.content.settings.topBarVisible,
    branchOptions: [
      instructorCode,
      ...codeVersions.map((v) => ({
        label: `${v.userName} - ${v.commitMessage}`,
        value: {
          code: v.code,
          codeId: v.codeId,
        },
      })),
    ],
  };
};

const mapDispatchToProps = {
  dispatchOpenEditorView: openEditorView,
  dispatchSetCodeEditorSettings: setCodeEditorSettings,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(CodeReviewTools);

const TranslatedComponent = withTranslation()(ConnectedComponent);

export default withStyles(styles)(TranslatedComponent);
