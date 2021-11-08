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
import { Reply } from '@material-ui/icons';
import _ from 'lodash';
import { formatDistance } from 'date-fns';
import { fr, enGB } from 'date-fns/locale';
import ConfirmDialog from './ConfirmDialog';
import { DEFAULT_USER } from '../../config/settings';
import Loader from './Loader';
import { BOT_COMMENT, BOT_USER } from '../../config/appInstanceResourceTypes';

// helper method
const getInitials = (name) =>
  name
    .match(/\b(\w)/g)
    .slice(0, 2)
    .join('');

// to add a new language to the dates
const locales = { fr, en: enGB };

const styles = (theme) => ({
  root: {
    padding: theme.spacing(1),
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
      data: PropTypes.shape({
        line: PropTypes.number.isRequired,
        content: PropTypes.string.isRequired,
        botId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        deleted: PropTypes.bool,
      }),
      type: PropTypes.string,
      user: PropTypes.string,
      updatedAt: PropTypes.string,
    }),
    focused: PropTypes.bool.isRequired,
    readOnly: PropTypes.bool,
    showReply: PropTypes.bool,
    onEditComment: PropTypes.func.isRequired,
    onReply: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onDeleteComment: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    classes: PropTypes.shape({
      root: PropTypes.string,
      header: PropTypes.string,
      content: PropTypes.string,
      actions: PropTypes.string,
      commentText: PropTypes.string,
    }).isRequired,
    users: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
      }),
    ),
    botUsers: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        initials: PropTypes.string,
      }),
    ),
    activity: PropTypes.number,
    lang: PropTypes.string.isRequired,
  };

  static defaultProps = {
    comment: {
      user: '',
      updatedAt: '',
    },
    activity: 0,
    users: [],
    botUsers: [],
    readOnly: false,
    showReply: true,
  };

  state = {
    isEdited: false,
    value: '',
    selectedTab: 'preview',
    isHovered: false,
    open: false,
  };

  converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
  });

  componentDidMount() {
    const { comment, focused, t } = this.props;
    const value = comment.data.deleted
      ? t(comment.data.content)
      : comment.data.content;
    this.setState({
      value,
      isEdited: focused,
      selectedTab: focused ? 'write' : 'preview',
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { comment: prevPropsComment, focused: prevPropsFocused } = prevProps;
    const { content: prevPropsCommentValue } = prevPropsComment.data;
    const { value: prevStateCommentValue, isEdited: prevStateFocused } =
      prevState;
    const { comment, focused, t } = this.props;
    let { content: value } = comment.data;
    if (
      !(
        _.isEqual(value, prevPropsCommentValue) ||
        _.isEqual(value, prevStateCommentValue)
      ) ||
      !(
        _.isEqual(focused, prevPropsFocused) ||
        _.isEqual(focused, prevStateFocused)
      )
    ) {
      // translate the text if the comment has the deleted flag
      value = comment.data.deleted
        ? t(comment.data.content)
        : comment.data.content;
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ value, isEdited: focused });
    }
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
    onSubmit(comment._id, value);
  };

  handleDelete = (id) => {
    const { onDeleteComment } = this.props;
    onDeleteComment(id);
  };

  renderAvatar(userName) {
    const { comment, botUsers } = this.props;
    if (comment.type === BOT_COMMENT) {
      const user = botUsers.find((u) => u.id === comment.data.botId);
      if (user) {
        return <Avatar alt={user.initials} src={user.uri} />;
      }
    }
    return <Avatar>{getInitials(userName)}</Avatar>;
  }

  renderCardHeader() {
    const {
      comment,
      classes,
      readOnly,
      users,
      botUsers,
      onReply,
      showReply,
      lang,
    } = this.props;
    const { updatedAt = new Date().toISOString() } = comment;
    // compare the date and format the distance to now
    const formattedUpdatedAt = formatDistance(
      new Date(),
      Date.parse(updatedAt),
      {
        addSuffix: true, // adds "ago" at the end
        locale: locales[lang], // provides localization
      },
    );

    const { isEdited, isHovered, open } = this.state;
    const userName =
      (comment.type === BOT_COMMENT
        ? botUsers.find((u) => u.id === comment.data.botId)?.name
        : users.find((u) => u.id === comment.user)?.name) || DEFAULT_USER;

    return isEdited ? null : (
      <CardHeader
        className={classes.header}
        avatar={this.renderAvatar(userName)}
        title={userName}
        subheader={formattedUpdatedAt}
        action={
          <>
            {isHovered && !readOnly ? (
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
            {showReply ? (
              <IconButton aria-label="reply" color="primary" onClick={onReply}>
                <Reply />
              </IconButton>
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
        onMouseEnter={() => this.setState({ isHovered: true })}
        onMouseLeave={() => this.setState({ isHovered: false })}
        elevation={0}
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

const mapStateToProps = ({ context, users, appInstanceResources }) => ({
  users: users.content,
  botUsers: appInstanceResources.content
    .filter((res) => res.type === BOT_USER)
    .map(({ _id, data }) => ({
      id: _id,
      name: data.name,
      initials: getInitials(data.name),
      uri: data.uri,
    })),
  activity: appInstanceResources.activity.length,
  lang: context.lang,
});

const ConnectedCommentEditor = connect(mapStateToProps)(CommentEditor);

const StyledCommentEditor = withStyles(styles)(ConnectedCommentEditor);

export default withTranslation()(StyledCommentEditor);
