import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import { FormControl, Grid, Tooltip } from '@material-ui/core';
import { ToggleButton } from '@material-ui/lab';
import {
  EditRounded,
  InfoOutlined,
  VisibilityOffRounded,
  VisibilityRounded,
  VerticalSplitRounded,
} from '@material-ui/icons';
import Select from 'react-select';
import { formatDistance } from 'date-fns';
import { enGB, fr } from 'date-fns/locale';
import {
  openCommitInfoDialog,
  openEditorView,
  setCodeEditorSettings,
  setDiffView,
} from '../../actions';
import {
  DEFAULT_CODE_ID,
  DEFAULT_TRUNCATION_COMMIT_MESSAGE_LENGTH,
  DEFAULT_USER,
  PLACEHOLDER_DATE,
} from '../../config/settings';
import { CODE } from '../../config/appInstanceResourceTypes';
import CommitInfoDialog from './CommitInfoDialog';

const locales = { fr, en: enGB };

// By default, the instructor is the first contributor
const DEFAULT_CODE_CONTRIBUTOR_INDEX = 0;
// By default, we select the first code version
const DEFAULT_CODE_VERSION = 0;

const mapCodeVersions = (codeContributors, codeSamples, lang) =>
  // create a row for each code contributor
  codeContributors.map(({ value: contributorName }) =>
    // create a row for every code sample by that contributor
    codeSamples
      // only get resources from the contributor
      .filter((resource) => resource.user === contributorName)
      .map((codeResource) => {
        const { commitMessage, code } = codeResource.data;
        let msg = commitMessage;
        // if message id too long: truncate and add ellipsis
        if (msg.length > DEFAULT_TRUNCATION_COMMIT_MESSAGE_LENGTH) {
          msg = `${commitMessage.slice(
            0,
            DEFAULT_TRUNCATION_COMMIT_MESSAGE_LENGTH,
          )}...`;
        }
        // format createdAt date
        // a placeholder is used if the property does not exist (fake API)
        const { createdAt = PLACEHOLDER_DATE } = codeResource;
        const date = formatDistance(Date.parse(createdAt), new Date(), {
          addSuffix: true, // adds "ago" at the end
          locale: locales[lang],
        });
        return {
          label: `${msg} - ${date}`,
          value: {
            code,
            codeId: codeResource._id,
          },
        };
      }),
  );

const styles = (theme) => ({
  container: {
    borderSpacing: 0,
    maxWidth: '800px',
    width: '90%',
    margin: '0px auto auto',
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
  diffButton: {
    color: theme.palette.primary.main,
  },
  selectUsers: {
    width: '100%',
    display: 'block',
  },
  selectVersions: {
    width: '100%',
    display: 'block',
  },
  infoButton: {
    color: theme.palette.primary.main,
  },
});

const customSelectStyles = (height = '36px') => ({
  control: (provided) => ({
    ...provided,
    minHeight: height,
    height,
    maxHeight: height,
  }),
});

class CodeReviewTools extends React.Component {
  static propTypes = {
    classes: PropTypes.shape({
      container: PropTypes.string.isRequired,
      gridRow: PropTypes.string.isRequired,
      toolbar: PropTypes.string.isRequired,
      lastGrid: PropTypes.string.isRequired,
      selectUsers: PropTypes.string.isRequired,
      selectVersions: PropTypes.string.isRequired,
      toggleButton: PropTypes.string.isRequired,
      editButton: PropTypes.string.isRequired,
      infoButton: PropTypes.string.isRequired,
    }).isRequired,
    t: PropTypes.func.isRequired,
    dispatchSetDiffView: PropTypes.func.isRequired,
    dispatchOpenEditorView: PropTypes.func.isRequired,
    dispatchSetCodeEditorSettings: PropTypes.func.isRequired,
    dispatchOpenCommitInfoDialog: PropTypes.func.isRequired,
    showVisibilityButton: PropTypes.bool,
    showEditButton: PropTypes.bool,
    showDiffButton: PropTypes.bool,
    showHistoryDropdown: PropTypes.bool,
    hideCommentsCallback: PropTypes.func.isRequired,
    codeEditorSettings: PropTypes.shape({
      codeId: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
    }).isRequired,
    topBarVisible: PropTypes.bool.isRequired,
    allVisibleState: PropTypes.bool.isRequired,
    codeVersions: PropTypes.arrayOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.shape({
            code: PropTypes.string.isRequired,
            codeId: PropTypes.string.isRequired,
          }).isRequired,
        }),
      ),
    ).isRequired,
    codeContributors: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ).isRequired,
  };

  static defaultProps = {
    showVisibilityButton: true,
    showEditButton: true,
    showHistoryDropdown: true,
    showDiffButton: true,
  };

  state = (() => {
    const { codeContributors, codeVersions } = this.props;
    return {
      selectedBranch: codeContributors[DEFAULT_CODE_CONTRIBUTOR_INDEX],
      selectedVersion:
        codeVersions[DEFAULT_CODE_CONTRIBUTOR_INDEX][DEFAULT_CODE_VERSION],
      availableCodeVersions: codeVersions[DEFAULT_CODE_CONTRIBUTOR_INDEX],
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

  handleDiff = () => {
    const { dispatchSetDiffView } = this.props;
    dispatchSetDiffView();
  };

  handleChangeBranch = (value) => {
    const { codeVersions, codeContributors } = this.props;
    const { selectedVersion } = this.state;
    const availableCodeVersions = codeVersions[codeContributors.indexOf(value)];
    // check if the new set of choices includes the previously selected code version
    if (!availableCodeVersions.includes(selectedVersion)) {
      // instructor is selected and there is only one version available
      if (value.value === DEFAULT_CODE_ID) {
        this.handleChangeVersion(availableCodeVersions[0]);
      } else {
        this.setState({ selectedVersion: null });
      }
    }
    // change the code that is displayed and filter the history select
    this.setState({ selectedBranch: value, availableCodeVersions });
  };

  handleChangeVersion = (value) => {
    const { dispatchSetCodeEditorSettings } = this.props;
    // change the code that is displayed and filter the history select
    this.setState({ selectedVersion: value });
    // this.setState({ selectedBranch: value })
    dispatchSetCodeEditorSettings(value.value);
  };

  handleInfo = () => {
    const { dispatchOpenCommitInfoDialog } = this.props;
    dispatchOpenCommitInfoDialog();
  };

  renderTopBar = () => {
    const {
      t,
      classes,
      allVisibleState,
      showVisibilityButton,
      showEditButton,
      codeContributors,
      showHistoryDropdown,
      showDiffButton,
    } = this.props;
    const { selectedBranch, selectedVersion, availableCodeVersions } =
      this.state;
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

    const diffButtonControl = (
      <ToggleButton
        className={classes.editButton}
        variant="outlined"
        size="small"
        value="edit"
        onClick={this.handleDiff}
      >
        <VerticalSplitRounded fontSize="small" />
      </ToggleButton>
    );

    const infoButtonControl = (
      <ToggleButton
        className={classes.infoButton}
        variant="outlined"
        size="small"
        value="info"
        onClick={this.handleInfo}
      >
        <InfoOutlined fontSize="small" />
      </ToggleButton>
    );

    const branchSelectControl = (
      <Select
        styles={customSelectStyles()}
        value={selectedBranch}
        options={codeContributors}
        onChange={this.handleChangeBranch}
        isSearchable
      />
    );

    const versionSelectControl = (
      <Select
        styles={customSelectStyles()}
        value={selectedVersion}
        options={availableCodeVersions}
        onChange={this.handleChangeVersion}
        isSearchable
        isDisabled={selectedBranch.value === DEFAULT_CODE_ID}
      />
    );

    return (
      <>
        <Grid
          container
          direction="row"
          justifyContent="space-between"
          className={classes.container}
          spacing={2}
        >
          <Grid container item xs={10} spacing={1}>
            {showHistoryDropdown ? (
              <>
                <Grid item xs={3}>
                  <FormControl className={classes.selectUsers}>
                    {branchSelectControl}
                  </FormControl>
                </Grid>
                <Grid item xs={8}>
                  <FormControl className={classes.selectVersions}>
                    {versionSelectControl}
                  </FormControl>
                </Grid>
                {selectedVersion ? (
                  <Grid item xs={1} className={classes.infoButton}>
                    <FormControl>{infoButtonControl}</FormControl>
                  </Grid>
                ) : null}
              </>
            ) : null}
          </Grid>
          <Grid
            className={classes.toolbar}
            container
            item
            xs={2}
            spacing={1}
            justifyContent="space-between"
            justify="flex-end"
          >
            {showDiffButton ? (
              <Grid item>
                <Tooltip title={t('Diff')}>
                  <FormControl>{diffButtonControl}</FormControl>
                </Tooltip>
              </Grid>
            ) : null}
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
        <CommitInfoDialog />
      </>
    );
  };

  render() {
    const { topBarVisible } = this.props;
    return topBarVisible ? this.renderTopBar() : null;
  }
}

const mapStateToProps = (
  { appInstance, appInstanceResources, users, layout, context },
  ownProps,
) => {
  const { t } = ownProps;
  const { lang } = context;
  const codeSamples = appInstanceResources.content.filter(
    (r) => r.type === CODE,
  );
  const instructorContributor = {
    label: t('Instructor'),
    value: DEFAULT_CODE_ID,
  };
  // get unique id of users that contributed code
  const uniqueCodeContributors = [...new Set(codeSamples.map((r) => r.user))];
  const codeContributors = uniqueCodeContributors.map((contributorName) => ({
    label:
      users.content.find((u) => u.id === contributorName)?.name || DEFAULT_USER,
    value: contributorName,
  }));

  // build an array of arrays: [label: someTextAndADate, value: {code, codeId}]
  const codeVersions = mapCodeVersions(codeContributors, codeSamples, lang);

  const instructorCode = {
    label: t('Default Version'),
    value: {
      code: appInstance.content.settings.code,
      codeId: DEFAULT_CODE_ID,
    },
  };

  return {
    codeEditorSettings: layout.codeEditorSettings,
    topBarVisible: appInstance.content.settings.topBarVisible,
    codeContributors: [instructorContributor, ...codeContributors],
    // codeVersions is an array of array and to respect this convention instructorCode is put inside an array
    codeVersions: [[instructorCode], ...codeVersions],
  };
};

const mapDispatchToProps = {
  dispatchOpenEditorView: openEditorView,
  dispatchSetCodeEditorSettings: setCodeEditorSettings,
  dispatchOpenCommitInfoDialog: openCommitInfoDialog,
  dispatchSetDiffView: setDiffView,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(CodeReviewTools);

const TranslatedComponent = withTranslation()(ConnectedComponent);

export default withStyles(styles)(TranslatedComponent);
