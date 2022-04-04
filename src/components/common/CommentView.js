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
  Chip,
  FormLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  TextField,
  Tooltip,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { formatDistance } from 'date-fns';
import { fr, enGB } from 'date-fns/locale';
import {
  Flag,
  InsertEmoticon,
  MoreVert,
  MoreVertRounded,
  PanTool,
} from '@material-ui/icons';
import ConfirmDialog from './ConfirmDialog';
import {
  DEFAULT_REACTION_PICKER_COL_NUMBER,
  DEFAULT_REACTIONS,
  DEFAULT_USER,
  MAX_QUICK_REPLIES_TO_SHOW,
  MIN_EDITOR_HEIGHT,
  MIN_PREVIEW_HEIGHT,
  PUBLIC_VISIBILITY,
} from '../../config/settings';
// import Loader from './Loader';
import {
  BOT_COMMENT,
  BOT_USER,
  FLAG,
  REACTION,
  USER_COMMENT_TYPES,
} from '../../config/appInstanceResourceTypes';
import DotLoader from './DotLoader';
import {
  deleteAppInstanceResource,
  postAction,
  postAppInstanceResource,
} from '../../actions';
import {
  ASKED_FOR_HELP,
  FLAGGED_COMMENT,
  REMOVED_REACTION,
} from '../../config/verbs';
import FormDialog from './FormDialog';
import { getHumanIntervention } from '../../utils/autoBotEngine';

// helper method
const getInitials = (name) => {
  const initials = name.match(/\b(\w)/g);
  if (initials) {
    return initials.slice(0, 2).join('');
  }
  return '';
};

const getInitialReactionChipArray = () =>
  DEFAULT_REACTIONS.map((reaction) => ({
    // spread the label and emoji of the reaction
    ...reaction,
    // counter of the number of reaction from a specific type
    count: 0,
    // is set to the id of the app instance resource so that we can delete it when the user clicks it
    // is null when user has not given that reaction type
    // when not null it highlights the selects chip
    reactionIdFromUser: null,
  }));

const groupReactions = (reactionChipArray, reaction) => {
  const newReactionChipArray = [...reactionChipArray];
  const reactionIndex = reactionChipArray.findIndex(
    (r) => reaction.reaction === r.label,
  );
  newReactionChipArray[reactionIndex].count += 1;
  if (reaction.isSelf) {
    newReactionChipArray[reactionIndex].reactionIdFromUser = reaction.id;
  }
  return newReactionChipArray;
};

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
  quickReplyButtons: {
    textTransform: 'none',
    height: '40px',
    margin: '2px',
  },
  quickReplyLabel: {
    marginRight: '5px',
  },
  replyBox: {
    margin: '2px',
  },
  moreQuickReplyMenu: {
    height: '40px',
    width: '40px',
  },
  replyContainer: {
    gridTemplateColumns: 'auto max-content',
  },
  emojiButton: {
    height: '30px',
    width: '30px',
    padding: '0',
    margin: '1px',
    minWidth: '30px',
  },
  emojiPicker: {
    padding: theme.spacing(0.5),
  },
});

class CommentView extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    comment: PropTypes.shape({
      _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      data: PropTypes.shape({
        line: PropTypes.number.isRequired,
        content: PropTypes.string.isRequired,
        botId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        deleted: PropTypes.bool,
        end: PropTypes.bool,
        thinking: PropTypes.number,
        options: PropTypes.arrayOf(PropTypes.string),
        flag: PropTypes.bool,
        requireIntervention: PropTypes.bool,
      }),
      type: PropTypes.string,
      user: PropTypes.string,
      updatedAt: PropTypes.string,
    }),
    focused: PropTypes.bool.isRequired,
    readOnly: PropTypes.bool,
    showReply: PropTypes.bool,
    showDelete: PropTypes.bool,
    showEdit: PropTypes.bool,
    onEditComment: PropTypes.func.isRequired,
    onReply: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onQuickResponse: PropTypes.func.isRequired,
    onAddReaction: PropTypes.func.isRequired,
    onDeleteThread: PropTypes.func.isRequired,
    onDeleteComment: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    adaptStyle: PropTypes.func.isRequired,
    classes: PropTypes.shape({
      root: PropTypes.string,
      header: PropTypes.string,
      content: PropTypes.string,
      actions: PropTypes.string,
      commentText: PropTypes.string,
      quickReplyButtons: PropTypes.string,
      quickReplyLabel: PropTypes.string,
      replyBox: PropTypes.string,
      moreQuickReplyMenu: PropTypes.string,
      replyContainer: PropTypes.string,
      emojiButton: PropTypes.string,
      emojiPicker: PropTypes.string,
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
        allowHumanIntervention: PropTypes.bool,
        data: { personality: PropTypes.string },
      }),
    ),
    // activity: PropTypes.number,
    lang: PropTypes.string.isRequired,
    reactions: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.string,
        label: PropTypes.string,
        count: PropTypes.number,
        reactionIdFromUser: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
        ]),
      }),
    ),
    userId: PropTypes.string.isRequired,
    dispatchDeleteAppInstanceResource: PropTypes.func.isRequired,
    dispatchPostAppInstanceResource: PropTypes.func.isRequired,
    dispatchPostAction: PropTypes.func.isRequired,
  };

  static defaultProps = {
    comment: {
      user: '',
      updatedAt: '',
    },
    // activity: 0,
    users: [],
    botUsers: [],
    reactions: [],
    readOnly: false,
    showReply: true,
    showDelete: true,
    showEdit: true,
  };

  state = {
    isEdited: false,
    value: '',
    selectedTab: 'preview',
    open: false,
    quickReplyAnchorEl: null,
    addReactionsAnchorEl: null,
    actionsMenuAnchorEl: null,
    openQuickReplyMenu: false,
    openAddReactionsMenu: false,
    openActionsMenu: false,
    openFlagDialog: false,
  };

  converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
  });

  constructor(props) {
    super(props);
    // create ref to anchor the dialogs at the height of the comment
    this.commentRef = createRef();
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

  handleOnQuickReply = (text) => {
    const { comment, onQuickResponse } = this.props;
    onQuickResponse(comment, text);
  };

  handleOnAddReaction = (reactionLabel) => {
    const { comment, onAddReaction } = this.props;
    this.handleOnCloseAddReactionMenu();
    onAddReaction(comment._id, reactionLabel);
  };

  handleOnClickAddReactionDisplay = (reactionLabel, reactionId) => {
    const {
      dispatchDeleteAppInstanceResource,
      dispatchPostAction,
      onAddReaction,
      comment,
    } = this.props;
    // close menu
    this.handleOnCloseAddReactionMenu();
    // the reaction id is not null -> the reaction exists, so we want to remove it
    if (reactionId) {
      dispatchDeleteAppInstanceResource(reactionId.toString());
      dispatchPostAction({
        data: {
          label: reactionLabel,
        },
        verb: REMOVED_REACTION,
      });
    } else {
      onAddReaction(comment._id, reactionLabel);
    }
  };

  handleOnClickQuickReplyMenu = (event) => {
    this.setState({
      quickReplyAnchorEl: event.currentTarget,
      openQuickReplyMenu: true,
    });
  };

  handleOnCloseQuickReplyMenu = () => {
    this.setState({ quickReplyAnchorEl: null, openQuickReplyMenu: false });
  };

  handleOnClickActionsMenu = (event) => {
    this.setState({
      actionsMenuAnchorEl: event.currentTarget,
      openActionsMenu: true,
    });
  };

  handleOnCloseActionsMenu = () => {
    this.setState({ actionsMenuAnchorEl: null, openActionsMenu: false });
  };

  handleOnClickAddReactionMenu = (event) => {
    this.setState({
      addReactionsAnchorEl: event.currentTarget,
      openAddReactionsMenu: true,
    });
  };

  handleOnCloseAddReactionMenu = () => {
    this.setState({ addReactionsAnchorEl: null, openAddReactionsMenu: false });
  };

  handleOnClickFlagComment = () => {
    this.setState({ openFlagDialog: true });
  };

  handleOnCloseFlagDialog = () => {
    this.setState({ openFlagDialog: false });
    this.handleOnCloseActionsMenu();
  };

  handleOnConfirmFlag = (reason) => {
    const {
      dispatchPostAction,
      dispatchPostAppInstanceResource,
      comment,
      userId,
    } = this.props;
    dispatchPostAppInstanceResource({
      data: {
        comment,
        reason,
      },
      type: FLAG,
      visibility: PUBLIC_VISIBILITY,
      userId,
    });
    dispatchPostAction({
      data: {
        reason,
        comment,
      },
      verb: FLAGGED_COMMENT,
    });
    this.handleOnCloseFlagDialog();
  };

  handleOnClickHumanIntervention = () => {
    const {
      comment,
      userId,
      dispatchPostAppInstanceResource,
      dispatchPostAction,
    } = this.props;
    const botUser = this.getBotUser();
    const response = getHumanIntervention(botUser, comment, userId);
    dispatchPostAppInstanceResource(response);
    dispatchPostAction({
      data: response,
      verb: ASKED_FOR_HELP,
    });
  };

  handleDeleteClicked = () => {
    this.setState({ open: true });
  };

  handleDelete = (id) => {
    const { onDeleteComment, adaptStyle } = this.props;
    onDeleteComment(id);
    adaptStyle();
  };

  getBotUser = () => {
    const { botUsers, comment } = this.props;
    return botUsers.find((b) => b.id === comment.data.botId);
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

  renderActionMenu() {
    const { t, comment, showDelete, showEdit } = this.props;
    const { open, openActionsMenu, actionsMenuAnchorEl, openFlagDialog } =
      this.state;

    const menuList = [];

    if (!comment.data.deleted && showEdit) {
      menuList.push(
        <MenuItem
          dense
          onClick={(e) => {
            this.handleOnCloseActionsMenu();
            this.onEdit(e);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText dense>{t('Edit')}</ListItemText>
        </MenuItem>,
      );
    }

    if (showDelete) {
      menuList.push(
        <MenuItem
          dense
          onClick={(e) => {
            this.handleOnCloseActionsMenu();
            this.handleDeleteClicked(e);
          }}
        >
          <ListItemIcon dense>
            <DeleteIcon fontSize="small" color="secondary" />
          </ListItemIcon>
          <ListItemText dense>{t('Delete')}</ListItemText>
        </MenuItem>,
      );
    }

    if (!comment.data.deleted) {
      menuList.push(
        <MenuItem
          dense
          onClick={(e) => {
            this.handleOnCloseActionsMenu();
            this.handleOnClickFlagComment(e);
          }}
        >
          <ListItemIcon>
            <Flag fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText dense>{t('Report')}</ListItemText>
        </MenuItem>,
      );
    }

    if (menuList.length) {
      return (
        <>
          <Tooltip title={t('Actions')}>
            <IconButton onClick={(e) => this.handleOnClickActionsMenu(e)}>
              <MoreVert />
            </IconButton>
          </Tooltip>
          <Menu
            dense
            open={openActionsMenu}
            anchorEl={actionsMenuAnchorEl}
            getContentAnchorEl={null}
            // center the popover
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            onClose={() => this.handleOnCloseActionsMenu()}
          >
            {menuList}
          </Menu>
          {showDelete ? (
            <ConfirmDialog
              open={open}
              setOpen={(v) => this.setState({ open: v })}
              onClose={(m) => {
                if (m) {
                  this.handleDelete(comment._id);
                }
              }}
              anchor={this.commentRef}
            />
          ) : null}

          <FormDialog
            open={openFlagDialog}
            title={t('Report a comment')}
            content={t(
              'Please provide below the reason for reporting this comment',
            )}
            handleClose={this.handleOnCloseFlagDialog}
            handleConfirm={(reason) => this.handleOnConfirmFlag(reason)}
            anchor={this.commentRef}
          />
        </>
      );
    }
    return null;
  }

  renderCardHeader() {
    const { comment, classes, readOnly, users, botUsers, lang } = this.props;
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

    const { isEdited } = this.state;
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
        action={!readOnly ? this.renderActionMenu() : null}
      />
    );
  }

  renderThinkingComment() {
    const { comment, classes, botUsers } = this.props;
    const userName =
      botUsers.find((u) => u.id === comment.data.botId)?.name || DEFAULT_USER;

    return (
      <Card className={classes.root} elevation={0}>
        <CardHeader
          className={classes.header}
          avatar={this.renderAvatar()}
          title={userName}
        />
        <CardContent className={`${classes.content} ${classes.commentText}`}>
          <DotLoader />
        </CardContent>
      </Card>
    );
  }

  renderReactions() {
    const { reactions } = this.props;
    // if there are no reactions show nothing
    if (reactions.every((g) => g.count === 0)) {
      return null;
    }
    return reactions.map((reaction) =>
      reaction.count ? (
        <Grid item key={reaction.label}>
          <Chip
            label={`${reaction.icon} ${reaction.count}`}
            size="small"
            color="primary"
            variant={reaction.reactionIdFromUser ? 'default' : 'outlined'}
            onClick={() =>
              this.handleOnClickAddReactionDisplay(
                reaction.label,
                reaction.reactionIdFromUser,
              )
            }
          />
        </Grid>
      ) : null,
    );
  }

  renderAddReactions(size = 'medium') {
    const { reactions, classes, t } = this.props;
    const { openAddReactionsMenu, addReactionsAnchorEl } = this.state;
    return (
      <>
        <Tooltip title={t('Add Reaction')}>
          <IconButton
            aria-label="add reaction"
            color="primary"
            size={size}
            onClick={(e) => this.handleOnClickAddReactionMenu(e)}
          >
            <InsertEmoticon />
          </IconButton>
        </Tooltip>
        <Popover
          open={openAddReactionsMenu}
          anchorEl={addReactionsAnchorEl}
          getContentAnchorEl={null}
          // center the popover
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          onClose={() => this.handleOnCloseAddReactionMenu()}
        >
          <Grid container direction="column" className={classes.emojiPicker}>
            {_.chunk(reactions, DEFAULT_REACTION_PICKER_COL_NUMBER).map(
              (row) => (
                <Grid container item direction="row">
                  {row.map((reaction) => (
                    <Grid item>
                      <Button
                        className={classes.emojiButton}
                        key={reaction.label}
                        disableElevation
                        color="primary"
                        variant={
                          reaction.reactionIdFromUser ? 'contained' : 'outlined'
                        }
                        onClick={() =>
                          this.handleOnClickAddReactionDisplay(
                            reaction.label,
                            reaction.reactionIdFromUser,
                          )
                        }
                      >
                        {reaction.icon}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              ),
            )}
          </Grid>
        </Popover>
      </>
    );
  }

  renderInteractions() {
    return (
      <Grid container item direction="row" spacing={1} alignItems="center">
        <Grid item>{this.renderAddReactions('small')}</Grid>
        {this.renderReactions()}
      </Grid>
    );
  }

  renderReplyOptions() {
    const { t, onReply, comment, classes, onDeleteThread } = this.props;
    const { openQuickReplyMenu, quickReplyAnchorEl } = this.state;
    const { options = null } = comment.data;

    let replyButtons = null;
    let replyMenu = null;

    if (options) {
      replyButtons = options
        .slice(0, MAX_QUICK_REPLIES_TO_SHOW)
        .map((optText) => (
          <Button
            className={classes.quickReplyButtons}
            variant="contained"
            color="primary"
            onClick={() => this.handleOnQuickReply(optText)}
          >
            {optText}
          </Button>
        ));

      if (options.length > MAX_QUICK_REPLIES_TO_SHOW) {
        replyMenu = (
          <>
            <IconButton
              className={classes.moreQuickReplyMenu}
              onClick={(e) => this.handleOnClickQuickReplyMenu(e)}
            >
              <MoreVertRounded />
            </IconButton>
            <Menu
              open={openQuickReplyMenu}
              anchorEl={quickReplyAnchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              onClose={() => this.handleOnCloseQuickReplyMenu()}
            >
              {options
                .slice(MAX_QUICK_REPLIES_TO_SHOW, options.length)
                .map((optText) => (
                  <MenuItem
                    key={optText}
                    onClick={() => this.handleOnQuickReply(optText)}
                  >
                    {optText}
                  </MenuItem>
                ))}
            </Menu>
          </>
        );
      }
    }

    return (
      <Grid
        className={classes.replyContainer}
        container
        justifyContent="space-between"
      >
        <Grid item>
          {
            // if the comment is not the end
            _.isUndefined(comment.data.end) ? (
              <TextField
                className={classes.replyBox}
                size="small"
                variant="outlined"
                placeholder={`${t('Reply')}...`}
                fullWidth
                onClick={onReply}
              />
            ) : (
              <Button
                color="secondary"
                variant="outlined"
                onClick={() => onDeleteThread(comment._id)}
              >
                {t('Restart interaction')}
              </Button>
            )
          }
        </Grid>
        <Grid item>
          {_.isEmpty(replyButtons) ? null : (
            <FormLabel className={classes.quickReplyLabel}>
              {t('Quick Replies')}:
            </FormLabel>
          )}
          {replyButtons}
          {replyMenu}
          {comment.type === BOT_COMMENT &&
          !comment.data.end &&
          this.getBotUser()?.allowHumanIntervention ? (
            <Tooltip title={t('Ask for Human Intervention')}>
              <IconButton
                color="primary"
                onClick={() => this.handleOnClickHumanIntervention()}
              >
                <PanTool />
              </IconButton>
            </Tooltip>
          ) : null}
        </Grid>
      </Grid>
    );
  }

  render() {
    const { selectedTab, value, isEdited } = this.state;
    const {
      classes,
      t,
      readOnly,
      // activity,
      comment,
      showReply,
    } = this.props;

    // todo: change activity to target a specific comment
    // if (activity) {
    //   return <Loader />;
    // }

    if (comment.data.thinking) {
      return this.renderThinkingComment();
    }

    return (
      <div ref={this.commentRef}>
        <Card
          className={classes.root}
          elevation={0}
          // this is used to color the comments that need help in the feedback view only
          style={
            comment.data.requireIntervention && readOnly
              ? { backgroundColor: '#eeeeee' }
              : null
          }
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
                minEditorHeight={MIN_EDITOR_HEIGHT}
                minPreviewHeight={MIN_PREVIEW_HEIGHT}
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
                {this.renderInteractions()}
                {showReply ? this.renderReplyOptions() : null}
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
                {t('Send')}
              </Button>
            </CardActions>
          ) : null}
        </Card>
      </div>
    );
  }
}

const mapStateToProps = (
  { context, users, appInstanceResources },
  ownProps,
) => ({
  users: users.content,
  botUsers: appInstanceResources.content
    .filter((res) => res.type === BOT_USER)
    .map(({ _id, data }) => ({
      id: _id,
      name: data.name,
      initials: getInitials(data.name),
      uri: data.uri,
      description: data.description,
      allowHumanIntervention: data.allowHumanIntervention,
      data: { personality: data.personality },
    })),
  // activity: appInstanceResources.activity.length,
  lang: context.lang,
  reactions: appInstanceResources.content
    .filter((res) => res.type === REACTION)
    // filter reactions that belong to this comment
    .filter((res) => res.data.commentId === ownProps.comment._id)
    // spread the reaction data and keep the id
    .map(({ _id, user, data }) => ({
      id: _id,
      isSelf: user === context.userId,
      ...data,
    }))
    // get the grouped reactions
    .reduce(groupReactions, getInitialReactionChipArray()),
  userId: context.userId,
});

const mapDispatchToProps = {
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchPostAction: postAction,
};

const ConnectedCommentView = connect(
  mapStateToProps,
  mapDispatchToProps,
)(CommentView);

const StyledCommentView = withStyles(styles)(ConnectedCommentView);

export default withTranslation()(StyledCommentView);
