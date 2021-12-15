import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Editor from '@monaco-editor/react';
import _ from 'lodash';
import { Button, Divider, Grid, Paper, TextField } from '@material-ui/core';
import {
  closeEditorView,
  postAppInstanceResource,
  setCodeEditorSettings,
} from '../../actions';
import { CODE } from '../../config/appInstanceResourceTypes';
import {
  DEFAULT_COMMIT_MESSAGE,
  PUBLIC_VISIBILITY,
} from '../../config/settings';

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
  editor: {
    minHeight: '100px',
    height: '100%',
  },
  button: {
    marginRight: theme.spacing(),
  },
  noFlex: {
    display: 'block',
  },
  paper: {
    padding: theme.spacing(1),
  },
  divider: {
    marginBottom: theme.spacing(2),
  },
});

class CodeEditor extends React.Component {
  static propTypes = {
    classes: PropTypes.shape({
      container: PropTypes.string,
      editor: PropTypes.string,
      button: PropTypes.string,
      noFlex: PropTypes.string,
      paper: PropTypes.string,
      divider: PropTypes.string,
    }).isRequired,
    t: PropTypes.func.isRequired,
    dispatchCloseEditorView: PropTypes.func.isRequired,
    dispatchPostAppInstanceResource: PropTypes.func.isRequired,
    // dispatchSetCodeEditorSettings: PropTypes.func.isRequired,
    commit: PropTypes.shape({
      code: PropTypes.string.isRequired,
      commitMessage: PropTypes.string.isRequired,
    }).isRequired,
    programmingLanguage: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
  };

  state = (() => {
    const { commit } = this.props;
    return {
      commit,
    };
  })();

  handleChangeEditor = (key) => (value) => {
    this.setState((prevState) => {
      // get the previous state's settings
      const commit = { ...prevState.commit };
      // use lodash to be able to use dot and array notation
      _.set(commit, key, value);
      return { commit };
    });
  };

  handleChangeTextField =
    (key) =>
    ({ target: { value } }) => {
      this.setState((prevState) => {
        // get the previous state's settings
        const commit = { ...prevState.commit };
        // use lodash to be able to use dot and array notation
        _.set(commit, key, value);
        return { commit };
      });
    };

  handleCommit = () => {
    const { dispatchPostAppInstanceResource, userId } = this.props;
    const { commit } = this.state;
    // post app instance resource as public
    dispatchPostAppInstanceResource({
      data: commit,
      type: CODE,
      visibility: PUBLIC_VISIBILITY,
      userId,
    });

    // set layout variable to hold the current commit
    // handle close
    this.handleClose();
  };

  handleClose = () => {
    const { dispatchCloseEditorView } = this.props;
    // change layout view to viewing code
    dispatchCloseEditorView();
  };

  renderCodeEditor = () => {
    const { t, classes, commit: commitProp, programmingLanguage } = this.props;

    const { commit } = this.state;
    const { code, commitMessage } = commit;

    const hasChanged = !_.isEqual(commitProp, commit);

    const commitMessageControl = (
      <TextField
        color="primary"
        variant="outlined"
        label={t('Commit Message')}
        placeholder={t('Updated code sample')}
        onChange={this.handleChangeTextField('commitMessage')}
        value={commitMessage}
        fullWidth
        size="small"
      />
    );

    return (
      <>
        <Grid
          container
          className={classes.container}
          direction="column"
          spacing={2}
        >
          <Paper variant="outlined" className={classes.paper}>
            <Grid className={classes.editor} item spacing={2}>
              <Editor
                height="40vh"
                defaultLanguage={programmingLanguage}
                language={programmingLanguage}
                value={code}
                onChange={this.handleChangeEditor('code')}
                options={{
                  scrollBeyondLastLine: false,
                  detectIndentation: false,
                  tabSize: 2,
                }}
              />
            </Grid>
            <Divider className={classes.divider} />
            <Grid
              container
              item
              direction="column"
              alignContent="stretch"
              spacing={1}
            >
              <Grid item alignContent="stretch">
                {commitMessageControl}
              </Grid>
              <Grid container item direction="row">
                <Grid item>
                  <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={this.handleCommit}
                    disabled={!hasChanged}
                  >
                    {t('Commit changes')}
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="secondary"
                    className={classes.button}
                    onClick={this.handleClose}
                  >
                    {t('Cancel')}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </>
    );
  };

  render() {
    return this.renderCodeEditor();
  }
}

const mapStateToProps = ({ appInstance, layout, context }) => {
  const { code } = layout.codeEditorSettings;
  const { code: defaultCode } = appInstance.content.settings;
  return {
    userId: context.userId,
    programmingLanguage: appInstance.content.settings.programmingLanguage,
    commit: {
      code: code || defaultCode,
      commitMessage: DEFAULT_COMMIT_MESSAGE,
    },
  };
};

const mapDispatchToProps = {
  dispatchCloseEditorView: closeEditorView,
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchSetCodeEditorSettings: setCodeEditorSettings,
};

const ConnectedComponent = connect(
  mapStateToProps,
  mapDispatchToProps,
)(CodeEditor);

const TranslatedComponent = withTranslation()(ConnectedComponent);

export default withStyles(styles)(TranslatedComponent);
