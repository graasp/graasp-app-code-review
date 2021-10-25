import React, { Component } from 'react';
import * as Showdown from 'showdown';
import { connect } from 'react-redux';
import ReactMde from 'react-mde';
import 'react-mde/lib/styles/css/react-mde-all.css';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import {
  Avatar,
  Card,
  CardActions,
  CardContent,
  CardHeader,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { withTranslation } from 'react-i18next';
import ConfirmDialog from './ConfirmDialog';
import { DEFAULT_USER } from '../../config/settings';
import Loader from './Loader';
import { BOT_COMMENT, BOT_USER } from '../../config/appInstanceResourceTypes';

const styles = (theme) => ({
  root: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
  },
  header: {
    padding: theme.spacing(1),
  },
  content: {
    paddingTop: 0,
    '&:last-child': {
      paddingBottom: 0,
    },
  },
  actions: {
    padding: theme.spacing(1),
    justifyContent: 'flex-end',
  },
  commentText: {
    paddingLeft: '38px',
  },
});

class CommentEditor extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    comment: PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      data: {
        line: PropTypes.number.isRequired,
        content: PropTypes.string.isRequired,
      },
      user: PropTypes.string,
      updatedAt: PropTypes.string,
    }),
    focused: PropTypes.bool.isRequired,
    readOnly: PropTypes.bool,
    onEditComment: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onDeleteComment: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    classes: PropTypes.shape({
      root: PropTypes.string,
      header: PropTypes.string,
      content: PropTypes.string,
      actions: PropTypes.string,
    }).isRequired,
    users: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
      }),
    ),
    activity: PropTypes.number,
  };

  static defaultProps = {
    comment: {
      user: '',
      updatedAt: '',
    },
    activity: 0,
    users: [],
    readOnly: false,
  };

  state = {
    isEdited: false,
    value: '',
    selectedTab: 'preview',
    showDelete: false,
    open: false,
  };

  converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
  });

  componentDidMount() {
    const { comment, focused } = this.props;
    this.setState({
      value: comment.data.content,
      isEdited: focused,
      selectedTab: focused ? 'write' : 'preview',
    });
  }

  handleOnCancel = () => {
    const { comment, onCancel } = this.props;
    this.setState({
      selectedTab: 'write',
      value: comment.data.content,
      isEdited: false,
    });
    onCancel();
  };

  onEdit = () => {
    const { isEdited } = this.state;
    const { onEditComment, comment } = this.props;
    this.setState({ selectedTab: isEdited ? 'preview' : 'write' });
    onEditComment(comment._id);
    this.setState({ isEdited: !isEdited });
  };

  handleOnSubmit = () => {
    const { value } = this.state;
    const { onSubmit, comment } = this.props;
    this.setState({
      isEdited: false,
    });
    onSubmit(comment._id, comment.data.line, value);
  };

  handleDelete = (id) => {
    const { onDeleteComment } = this.props;
    onDeleteComment(id);
  };

  renderCardHeader() {
    /* eslint-disable react/prop-types */
    const { comment, classes, users, botUsers, readOnly } = this.props;
    const { updatedAt = new Date().toISOString() } = comment;

    const { isEdited, showDelete, open } = this.state;

    const bot = botUsers.find((u) => u._id === comment.user);
    const user =
      users.find((u) => u._id === comment.user)?.name ||
      botUsers.find((u) => u._id === comment.user)?.name ||
      DEFAULT_USER;
    const userInitials = user
      .match(/\b(\w)/g)
      .slice(0, 2)
      .join('');
    const userAvatar =
      comment.type === BOT_COMMENT ? (
        <Avatar alt={userInitials} src={bot.uri} />
      ) : (
        <Avatar>{userInitials}</Avatar>
      );

    return isEdited ? null : (
      <CardHeader
        className={classes.header}
        avatar={userAvatar}
        title={user}
        subheader={updatedAt}
        action={
          <>
            {showDelete && !readOnly ? (
              <>
                <IconButton
                  aria-label="edit"
                  color="primary"
                  onClick={this.onEdit}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="delete"
                  color="secondary"
                  onClick={() => this.setState({ open: true })}
                >
                  <DeleteIcon />
                </IconButton>
              </>
            ) : null}
            <ConfirmDialog
              open={open}
              setOpen={(v) => this.setState({ open: v })}
              onClose={(m) => {
                if (m) {
                  this.handleDelete(comment._id);
                }
              }}
            />
          </>
        }
      />
    );
  }

  render() {
    const { selectedTab, value, isEdited } = this.state;
    const { classes, t, activity } = this.props;

    if (activity) {
      return <Loader />;
    }

    return (
      <Card
        className={classes.root}
        onMouseEnter={() => this.setState({ showDelete: true })}
        onMouseLeave={() => this.setState({ showDelete: false })}
        variant="outlined"
      >
        {this.renderCardHeader()}
        <CardContent className={classes.content}>
          {isEdited ? (
            <ReactMde
              value={value}
              onChange={(v) => this.setState({ value: v })}
              selectedTab={selectedTab}
              onTabChange={(tab) => this.setState({ selectedTab: tab })}
              generateMarkdownPreview={(markdown) =>
                Promise.resolve(this.converter.makeHtml(markdown))
              }
              l18n={{
                write: t('Write'),
                preview: t('Preview'),
              }}
              childProps={{
                writeButton: {
                  tabIndex: -1,
                },
                textArea: {
                  autoFocus: true,
                },
              }}
            />
          ) : (
            <Grid
              container
              className={`mde-preview standalone ${classes.commentText}`}
            >
              <Grid
                item
                xs={12}
                className="mde-preview-content"
                dangerouslySetInnerHTML={{
                  __html: this.converter.makeHtml(value),
                }}
              />
            </Grid>
          )}
        </CardContent>
        {isEdited ? (
          <CardActions className={classes.actions}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={this.handleOnCancel}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleOnSubmit}
            >
              {t('Save')}
            </Button>
          </CardActions>
        ) : null}
      </Card>
    );
  }
}

const mapStateToProps = ({ users, appInstanceResources }) => ({
  users: users.content,
  botUsers: appInstanceResources.content
    .filter((res) => res.type === BOT_USER)
    .map(({ _id, data }) => ({
      _id,
      name: data.name,
      uri: data.uri,
    })),
  activity: appInstanceResources.activity.length,
});

const ConnectedCommentEditor = connect(mapStateToProps)(CommentEditor);

const StyledCommentEditor = withStyles(styles)(ConnectedCommentEditor);

export default withTranslation()(StyledCommentEditor);
