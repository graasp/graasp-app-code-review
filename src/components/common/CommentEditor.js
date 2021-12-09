import React, { Component, createRef } from 'react';
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
  Collapse,
  Tooltip,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { withTranslation } from 'react-i18next';
import { ExpandMore, Reply } from '@material-ui/icons';
import _ from 'lodash';
import { formatDistance } from 'date-fns';
import { fr, enGB } from 'date-fns/locale';
import ConfirmDialog from './ConfirmDialog';
import { DEFAULT_USER } from '../../config/settings';
import Loader from './Loader';
import {
  BOT_COMMENT,
  BOT_USER,
  USER_COMMENT_TYPES,
} from '../../config/appInstanceResourceTypes';

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
    padding: theme.spacing(0),
  },
  content: {
    padding: 0,
    '&:last-child': {
      paddingBottom: 0,
    },
  },
  actions: {
    paddingRight: 0,
    paddingBottom: 0,
    justifyContent: 'flex-end',
  },
  commentText: {
    // shift text left to align it with the Author name
    paddingLeft: '46px',
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
    showDelete: PropTypes.bool,
    onEditComment: PropTypes.func.isRequired,
    onReply: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onDeleteComment: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    adaptStyle: PropTypes.func.isRequired,
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
    showDelete: true,
  };

  state = {
    isEdited: false,
    value: '',
    selectedTab: 'preview',
    isHovered: false,
    open: false,
    expanded: true,
  };

  converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
  });

  constructor(props) {
    super(props);
    // create ref to focus confirmation dialog
    this.dialogRef = createRef();
  }

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
    const { comment, onCancel, adaptStyle } = this.props;
    this.setState({
      selectedTab: 'write',
      value: comment.data.content,
      isEdited: false,
    });
    onCancel();
    adaptStyle();
  };

  onEdit = () => {
    const { isEdited } = this.state;
    const { onEditComment, comment, adaptStyle } = this.props;
    this.setState({ selectedTab: isEdited ? 'preview' : 'write' });
    onEditComment(comment._id);
    this.setState({ isEdited: !isEdited });
    adaptStyle();
  };

  handleOnSubmit = () => {
    const { value } = this.state;
    const { onSubmit, comment, adaptStyle } = this.props;
    this.setState({
      isEdited: false,
    });
    onSubmit(comment._id, value);
    adaptStyle();
  };

  handleDeleteClicked = () => {
    // focus the confirmation dialog
    const { current: confirmationDialogElement } = this.dialogRef;
    if (confirmationDialogElement !== null) {
      confirmationDialogElement.focus();
    }
    this.setState({ open: true });
  };

  handleDelete = (id) => {
    const { onDeleteComment, adaptStyle } = this.props;
    onDeleteComment(id);
    adaptStyle();
  };

  handleExpandComment = () => {
    this.setState((prevState) => ({ expanded: !prevState.expanded }));
  };

  renderAvatar() {
    const { comment, botUsers, users } = this.props;
    if (comment.type === BOT_COMMENT) {
      const user = botUsers.find((u) => u.id === comment.data.botId);
      if (user) {
        return (
          <Tooltip title={user.description} disableInteractive arrow>
            <Avatar alt={user.initials} src={user.uri} />
          </Tooltip>
        );
      }
    }
    // for the other types of comments, we have to look
    else if (USER_COMMENT_TYPES.includes(comment.type)) {
      const user = users.find((u) => u.id === comment.user);
      if (user) {
        // user has a picture
        if (user.picture) {
          return <Avatar alt={user.initials} src={user.picture} />;
        }
        return <Avatar>{getInitials(user.name)}</Avatar>;
      }
    }
    return <Avatar>{getInitials(DEFAULT_USER)}</Avatar>;
  }

  renderCardHeader() {
    const {
      t,
      comment,
      classes,
      readOnly,
      users,
      botUsers,
      onReply,
      showReply,
      showDelete,
      lang,
    } = this.props;
    const { updatedAt = new Date().toISOString() } = comment;
    // compare the date and format the distance to now
    const formattedUpdatedAt = formatDistance(
      Date.parse(updatedAt),
      new Date(),
      {
        addSuffix: true, // adds "ago" at the end
        locale: locales[lang], // provides localization
      },
    );

    const { isEdited, isHovered, open, expanded } = this.state;
    const userName =
      (comment.type === BOT_COMMENT
        ? botUsers.find((u) => u.id === comment.data.botId)?.name
        : users.find((u) => u.id === comment.user)?.name) || DEFAULT_USER;

    return isEdited ? null : (
      <CardHeader
        className={classes.header}
        avatar={this.renderAvatar()}
        title={userName}
        subheader={formattedUpdatedAt}
        action={
          <>
            {isHovered && !readOnly ? (
              <>
                {!comment.data.deleted ? (
                  <IconButton
                    aria-label="edit"
                    color="primary"
                    onClick={this.onEdit}
                  >
                    <EditIcon />
                  </IconButton>
                ) : null}
                {showDelete ? (
                  <IconButton
                    aria-label="delete"
                    color="secondary"
                    onClick={this.handleDeleteClicked}
                  >
                    <DeleteIcon />
                  </IconButton>
                ) : null}
              </>
            ) : null}
            {showReply ? (
              <IconButton aria-label="reply" color="primary" onClick={onReply}>
                <Reply />
              </IconButton>
            ) : null}
            <Tooltip title={t('Toggle Visibility')}>
              <IconButton
                onClick={this.handleExpandComment}
                aria-expanded={expanded}
                aria-label={t('show more')}
                style={{
                  transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
                  marginLeft: 'auto',
                }}
              >
                <ExpandMore />
              </IconButton>
            </Tooltip>
            <ConfirmDialog
              ref={this.dialogRef}
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
    const { selectedTab, value, isEdited, expanded } = this.state;
    const { classes, t, activity } = this.props;

    if (activity) {
      return <Loader />;
    }

    return (
      <Card
        className={classes.root}
        onMouseEnter={() => this.setState({ isHovered: true })}
        onMouseLeave={() => this.setState({ isHovered: false })}
        onFocus={() => this.setState({ isHovered: true })}
        onBlur={() => this.setState({ isHovered: false })}
        elevation={0}
      >
        {this.renderCardHeader()}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
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
                minEditorHeight={60}
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
        </Collapse>
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
      description: data.description,
    })),
  activity: appInstanceResources.activity.length,
  lang: context.lang,
});

const ConnectedCommentEditor = connect(mapStateToProps)(CommentEditor);

const StyledCommentEditor = withStyles(styles)(ConnectedCommentEditor);

export default withTranslation()(StyledCommentEditor);
