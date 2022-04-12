import './CodeReview.css';
import React, { Component, createRef, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Prism from 'prismjs';
import _ from 'lodash';
import { Paper } from '@material-ui/core';
import CodeLine from './CodeLine';
import {
  patchAppInstanceResource,
  postAppInstanceResource,
  deleteAppInstanceResource,
  getUsers,
  postAction,
} from '../../actions';
import {
  BOT_COMMENT,
  BOT_USER,
  COMMENT,
  REACTION,
  TEACHER_COMMENT,
} from '../../config/appInstanceResourceTypes';
import {
  ADAPT_HEIGHT_TIMEOUT,
  DEFAULT_ALLOW_COMMENTS_SETTING,
  DEFAULT_ALLOW_REPLIES_SETTING,
  DEFAULT_BOT_USER_LIST_POLARITY_SETTING,
  DEFAULT_BOT_USER_LIST_SETTING,
  DEFAULT_CODE_ID,
  DEFAULT_COMMENT_CONTENT,
  DEFAULT_COMMENT_HIDDEN_STATE,
  DEFAULT_SHOW_EDIT_BUTTON_SETTING,
  DEFAULT_SHOW_VERSION_NAVIGATION_SETTING,
  DEFAULT_VISIBILITY_MODE_SETTING,
  DELETED_COMMENT_TEXT,
  HIDE_BOT,
  NEW_COMMENT_ID,
  PRIVATE_VISIBILITY,
  PUBLIC_VISIBILITY,
  SHOW_BOT,
  STUDENT_MODES,
} from '../../config/settings';
import {
  ADDED_REACTION,
  CLICKED_ADD_COMMENT,
  CREATED_COMMENT,
  CREATED_QUICK_REPLY,
  DELETED_COMMENT,
  RESTARTED_INTERACTION,
  UPDATED_COMMENT,
} from '../../config/verbs';
import { getDefaultOptionText } from '../../utils/autoBotEngine';
import CodeReviewTools from './CodeReviewTools';
import CodeEditor from './CodeEditor';
import CommentView from './CommentView';

Prism.manual = true;

const styles = {
  container: {
    borderSpacing: 0,
    maxWidth: '800px',
    width: '90%',
    margin: '0 auto auto',
    paddingTop: '5px',
    boxSizing: 'border-box',
  },
  commentContainer: {
    margin: '5px',
    marginLeft: '20px',
  },
};

const findChild = (comments, parentId) =>
  comments.find((c) => c.data.parent === parentId);

class CodeReview extends Component {
  static propTypes = {
    classes: PropTypes.shape({
      container: PropTypes.string,
      commentContainer: PropTypes.string,
      requireHelpComment: PropTypes.string,
    }).isRequired,
    isTeacherView: PropTypes.bool,
    isStudentView: PropTypes.bool,
    isFeedbackView: PropTypes.bool,
    selectedBot: PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    }),
    botUsers: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        data: PropTypes.shape({
          name: PropTypes.string,
          autoBot: PropTypes.bool,
          autoSeed: PropTypes.bool,
          personality: PropTypes.string,
        }),
      }),
    ),
    botComments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        appInstanceId: PropTypes.string,
        data: PropTypes.shape({}),
      }),
    ),
    teacherComments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        appInstanceId: PropTypes.string,
        data: PropTypes.shape({}),
      }),
    ),
    code: PropTypes.string.isRequired,
    codeId: PropTypes.string.isRequired,
    programmingLanguage: PropTypes.string.isRequired,
    settings: PropTypes.shape({
      showEditButton: PropTypes.bool.isRequired,
      showVersionNav: PropTypes.bool.isRequired,
      showVisibility: PropTypes.bool.isRequired,
      allowReplies: PropTypes.bool.isRequired,
      allowComments: PropTypes.bool.isRequired,
      visibility: PropTypes.bool.isRequired,
    }).isRequired,
    userId: PropTypes.string,
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        appInstanceId: PropTypes.string,
        data: PropTypes.shape({
          line: PropTypes.number,
          content: PropTypes.string,
          createdAt: PropTypes.string,
          parent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        }),
      }),
    ),
    standalone: PropTypes.bool.isRequired,
    editorOpen: PropTypes.bool.isRequired,
    dispatchPostAppInstanceResource: PropTypes.func.isRequired,
    dispatchPatchAppInstanceResource: PropTypes.func.isRequired,
    dispatchDeleteAppInstanceResource: PropTypes.func.isRequired,
    dispatchGetUsers: PropTypes.func.isRequired,
    dispatchPostAction: PropTypes.func.isRequired,
  };

  static defaultProps = {
    isTeacherView: false,
    isStudentView: false,
    isFeedbackView: false,
    userId: null,
    selectedBot: null,
    botUsers: [],
    botComments: [],
    teacherComments: [],
    comments: [],
  };

  static highlightCode(code, syntax) {
    return Prism.highlight(code, Prism.languages[syntax], syntax);
  }

  state = (() => {
    const { comments, code } = this.props;
    const numLines = code.split('\n').length;
    return {
      lineCommentsHiddenState: new Array(numLines).fill(
        DEFAULT_COMMENT_HIDDEN_STATE,
      ),
      focusedId: null,
      comments,
    };
  })();

  constructor(props) {
    super(props);
    // create ref to track the height of the component
    this.rootRef = createRef();
  }

  componentDidMount() {
    const { dispatchGetUsers } = this.props;
    dispatchGetUsers();
  }

  componentDidUpdate(prevProps, prevState) {
    const { comments: prevPropsComments } = prevProps;
    const { comments: prevStateComments } = prevState;
    const { comments } = this.props;
    if (
      !(
        _.isEqual(comments, prevPropsComments) ||
        _.isEqual(comments, prevStateComments)
      )
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ comments });
    }
    this.adaptHeight();
  }

  handleDelete = (_id) => {
    const {
      dispatchPostAction,
      dispatchDeleteAppInstanceResource,
      dispatchPatchAppInstanceResource,
      teacherComments,
      comments,
      botComments,
    } = this.props;
    const allComments = [...teacherComments, ...comments, ...botComments];
    const allChildComments = allComments.filter(
      (comment) => comment.data.parent === _id,
    );
    const comment = allComments.find((c) => c._id === _id);
    if (allChildComments.length) {
      dispatchPatchAppInstanceResource({
        id: _id,
        data: {
          ...comment.data,
          content: DELETED_COMMENT_TEXT,
          deleted: true,
        },
      });
    } else {
      dispatchDeleteAppInstanceResource(_id);
    }
    // track that this comment was deleted, along
    // with the state at the time of deletion
    dispatchPostAction({
      data: {
        ...comment.data,
        type: comment.type,
      },
      verb: DELETED_COMMENT,
    });
    this.setState({ focusedId: null });
  };

  handleDeleteThread = (commentId) => {
    const { dispatchDeleteAppInstanceResource, dispatchPostAction } =
      this.props;
    const thread = this.getCommentIdsInThread(commentId);
    // remove the line comment
    thread.pop();
    // this approach does not work because of the delay
    // thread.forEach((id) => this.handleDelete(id));
    thread.forEach((id) => dispatchDeleteAppInstanceResource(id));
    // track that this thread was deleted
    dispatchPostAction({
      verb: RESTARTED_INTERACTION,
    });
  };

  handleCancel = () => {
    const { focusedId } = this.state;
    if (focusedId === NEW_COMMENT_ID) {
      this.setState((prevState) => {
        const prevComments = prevState.comments;
        const newComments = prevComments.filter(
          (comment) => comment._id !== focusedId,
        );
        return {
          focusedId: null,
          comments: newComments,
        };
      });
    }
  };

  handleEdit = (_id) => {
    this.setState({ focusedId: _id });
  };

  handleSubmit = (_id, content) => {
    const {
      dispatchPostAppInstanceResource,
      dispatchPatchAppInstanceResource,
      dispatchPostAction,
      userId,
      selectedBot,
      isTeacherView,
    } = this.props;
    const { comments } = this.state;
    const { teacherComments, botComments } = this.props;
    const comment = [...comments, ...teacherComments, ...botComments].find(
      (c) => c._id === _id,
    );
    if (_id) {
      const data = {
        ...comment.data,
        content,
      };
      // update comment
      dispatchPatchAppInstanceResource({
        id: _id,
        data,
      });
      // track that this comment was edited,
      // along with its updated state
      dispatchPostAction({
        data: {
          ...data,
          type: comment.type,
        },
        verb: UPDATED_COMMENT,
      });
    } else if (isTeacherView) {
      const data = {
        ...comment.data,
        content,
        // label this comment as belonging to the teacher version
        codeId: DEFAULT_CODE_ID,
        // only add the botId property when the comment is from a bot
        ...(selectedBot && { botId: selectedBot.value }),
      };

      // this check is too weak and results in incorrect behavior when a bot is still selected
      const type = selectedBot ? BOT_COMMENT : TEACHER_COMMENT;
      // create comment
      dispatchPostAppInstanceResource({
        data,
        type,
        visibility: PUBLIC_VISIBILITY,
        userId,
      });
      // track that this comment was created, along with its state
      dispatchPostAction({
        data: {
          ...data,
          type,
        },
        verb: CREATED_COMMENT,
      });
    } else {
      const data = {
        ...comment.data,
        content,
      };
      const type = COMMENT;
      // create comment
      dispatchPostAppInstanceResource({
        data,
        type,
        // todo: dependant on the switch
        visibility: PRIVATE_VISIBILITY,
        userId,
      });
      // track that this comment was created, along with its state
      dispatchPostAction({
        data: {
          ...data,
          type,
        },
        verb: CREATED_COMMENT,
      });
    }
    this.setState({ focusedId: null });
  };

  handleAddComment(lineNum, parentId = null) {
    const {
      comments,
      dispatchPostAction,
      selectedBot,
      botUsers,
      isStudentView,
      codeId,
    } = this.props;

    const { lineCommentsHiddenState } = this.state;

    // check if a bot is selected
    const bot =
      selectedBot && !isStudentView
        ? botUsers.find((b) => b._id === selectedBot.value)
        : null;
    // if a bot is selected and the bot is configured for automatic seeding
    let textContent = DEFAULT_COMMENT_CONTENT;
    // get startup text only if a bot is selected, and it is a line comment and not a response
    if (bot && !parentId && bot.data.autoBot && bot.data.autoSeed) {
      // is an object with `content`, `optionId` and `options` which is used for context
      textContent = getDefaultOptionText(bot.data.personality);
    }

    const newComments = [
      ...comments,
      {
        _id: NEW_COMMENT_ID,
        data: {
          line: lineNum,
          ...textContent,
          parent: parentId,
          codeId,
        },
      },
    ];
    this.setState({
      comments: newComments,
      focusedId: NEW_COMMENT_ID,
    });
    // make sure the comments on that line are not hidden
    // lineNum is 1-indexed while the array is 0-indexed, so we subtract 1
    if (lineCommentsHiddenState[lineNum - 1]) {
      this.toggleHiddenCommentState(lineNum);
    }

    // track that this line was clicked
    dispatchPostAction({
      data: {
        line: lineNum,
      },
      verb: CLICKED_ADD_COMMENT,
    });
  }

  handleQuickResponse = (parentComment, option) => {
    const {
      dispatchPostAppInstanceResource,
      dispatchPostAction,
      codeId,
      userId,
      isTeacherView,
    } = this.props;
    const { line } = parentComment.data;

    const data = {
      line,
      codeId,
      parent: parentComment._id,
      content: option,
    };
    // when the quick reply is clicked in the teacher view it is saved as a teacher comment
    // when it is in the student view it is saved as a simple comment
    const type = isTeacherView ? TEACHER_COMMENT : COMMENT;
    // create comment
    dispatchPostAppInstanceResource({
      data,
      type,
      // todo: dependant on the switch
      visibility: PRIVATE_VISIBILITY,
      userId,
    });
    // track that this quick reply was created, along with its state
    dispatchPostAction({
      data: {
        ...data,
        type,
      },
      verb: CREATED_QUICK_REPLY,
    });
  };

  handleAddReaction = (commentId, reaction) => {
    const {
      dispatchPostAppInstanceResource,
      dispatchPostAction,
      userId,
      settings,
    } = this.props;

    const { visibility: visibilitySetting = DEFAULT_VISIBILITY_MODE_SETTING } =
      settings;

    // define the data
    const data = {
      reaction,
      commentId,
    };
    const type = REACTION;
    const visibility = visibilitySetting
      ? PUBLIC_VISIBILITY
      : PRIVATE_VISIBILITY;

    dispatchPostAppInstanceResource({
      data,
      type,
      visibility,
      userId,
    });
    // post action that the user has reacted
    dispatchPostAction({
      data: {
        data,
        type,
      },
      verb: ADDED_REACTION,
    });
  };

  handleHideAllComments = (checked) => {
    // set hidden state
    this.setState((prevState) => ({
      lineCommentsHiddenState: prevState.lineCommentsHiddenState.fill(checked),
    }));
  };

  getReadOnlyProperty(comment) {
    const { isTeacherView, isFeedbackView, userId } = this.props;
    if (isTeacherView) {
      // teacher can edit all comments
      return false;
    }
    if (isFeedbackView) {
      return true;
    }
    if (comment.type === BOT_COMMENT && comment.user === userId) {
      return false;
    }
    // readOnly just for comments that are not from users
    return comment.type !== COMMENT;
  }

  toggleHiddenCommentState = (lineNumber) => {
    const indexInArray = lineNumber - 1;
    // set hidden state
    this.setState((prevState) => {
      const arr = prevState.lineCommentsHiddenState;
      arr[indexInArray] = !arr[indexInArray];
      return { lineCommentsHiddenState: [...arr] };
    });
  };

  adaptHeight = () => {
    // set timeout to leave time for the height to be set
    setTimeout(() => {
      const { standalone, isStudentView } = this.props;
      // adapt height when :
      // - not in standalone (so when in an iframe)
      // - is in studentView
      if (!standalone && isStudentView) {
        // get height from the root element and add a small margin
        const actualHeight = this.rootRef.current.scrollHeight + 60;
        if (window.frameElement) {
          window.frameElement.style['min-height'] = `${actualHeight}px`;
          window.frameElement.style.overflowY = 'hidden';
          window.frameElement.scrolling = 'no';
          window.frameElement.style.height = `${actualHeight}px`;
        }
      }
    }, ADAPT_HEIGHT_TIMEOUT);
  };

  buildThread = (parentComment, comments) => {
    // build thread list
    const thread = [parentComment];
    let parentId = parentComment._id;
    let nextChild = null;
    do {
      nextChild = findChild(comments, parentId);
      if (nextChild) {
        thread.push(nextChild);
        parentId = nextChild._id;
      }
    } while (nextChild);

    return thread;
  };

  findParent = (comments, parentId) => comments.find((c) => c._id === parentId);

  getCommentIdsInThread = (commentId) => {
    const { comments, botComments, teacherComments } = this.props;
    const allComments = [...comments, ...botComments, ...teacherComments];
    const thread = [];
    let parentId = commentId;
    let parent = null;
    do {
      parent = this.findParent(allComments, parentId);
      if (parent) {
        thread.push(parentId);
        parentId = parent.data.parent;
      }
    } while (parent);

    return thread;
  };

  getNumberOfThreadsShown = () => {
    const { botComments, teacherComments } = this.props;
    const { comments } = this.state;
    const allComments = [...comments, ...botComments, ...teacherComments];
    const allParentComments = allComments.filter((c) => c.data.parent === null);
    const allShownParentComments = allParentComments.filter((c) =>
      this.shouldShowComment(c),
    );
    return allShownParentComments.length;
  };

  getReplySetting = () => {
    const { isFeedbackView, isStudentView, settings } = this.props;
    const { allowReplies = DEFAULT_ALLOW_REPLIES_SETTING } = settings;
    if (isStudentView) {
      return allowReplies;
    }
    return !isFeedbackView;
  };

  getLineCommentSetting = () => {
    const { isFeedbackView, isStudentView, settings } = this.props;
    const { allowComments = DEFAULT_ALLOW_COMMENTS_SETTING } = settings;
    if (isStudentView) {
      // when comments are allowed, disableButton is false -> invert the value
      return !allowComments;
    }
    return isFeedbackView;
  };

  shouldShowComment = (comment) => {
    const { userId, botUsers, isStudentView, isFeedbackView } = this.props;
    // only apply the visibility filter in the student view and when the teacher sees the comments in context
    if (isStudentView || isFeedbackView) {
      // check bot visibility setting
      if (comment.type === BOT_COMMENT) {
        const bot = botUsers.find((u) => u._id === comment.data.botId);
        // check that the bot is found and that it wants to restrict access
        if (bot && bot.data?.useUserList) {
          const {
            userListPolarity = DEFAULT_BOT_USER_LIST_POLARITY_SETTING,
            userList = DEFAULT_BOT_USER_LIST_SETTING,
          } = bot.data;
          // when polarity is HIDE_BOT, users in the list should not see the bot
          // when polarity is SHOW_BOT, users outside the list should not see the bot
          if (
            (userListPolarity === HIDE_BOT && userList.includes(userId)) ||
            (userListPolarity === SHOW_BOT && !userList.includes(userId))
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  renderCommentThread(parentComment, comments) {
    const { isStudentView } = this.props;
    const { focusedId } = this.state;

    const thread = this.buildThread(parentComment, comments);

    return thread.map((comment, i) => {
      // verify if the comment has children by
      // checking the length of the array of first order children
      const hasChildrenComments = i !== thread.length - 1;

      // set to true if:
      // - the comment is not delete
      // - the comment is deleted, but it is the last comment in the tree -> so it can be deleted
      const showDelete =
        (comment.data.deleted && !hasChildrenComments) || !comment.data.deleted;

      // users should not be allowed to edit bot responses even if they are made in their name
      const showEdit = !(
        isStudentView &&
        comment.type === BOT_COMMENT &&
        comment.visibility === PRIVATE_VISIBILITY
      );

      return (
        <Fragment key={comment._id}>
          <CommentView
            comment={comment}
            readOnly={this.getReadOnlyProperty(comment)}
            // replies are disabled for comments with a response
            showReply={this.getReplySetting() && !hasChildrenComments}
            showDelete={showDelete}
            showEdit={showEdit}
            focused={focusedId === comment._id}
            onReply={() =>
              this.handleAddComment(comment.data.line, comment._id)
            }
            onEditComment={(_id) => this.handleEdit(_id)}
            onDeleteComment={(_id) => this.handleDelete(_id)}
            onCancel={this.handleCancel}
            onSubmit={(_id, content) => this.handleSubmit(_id, content)}
            onQuickResponse={this.handleQuickResponse}
            onAddReaction={this.handleAddReaction}
            onDeleteThread={(_id) => this.handleDeleteThread(_id)}
            adaptStyle={this.adaptHeight}
          />
        </Fragment>
      );
    });
  }

  renderCodeReviewBody(code, commentList) {
    const {
      isTeacherView,
      botComments,
      teacherComments,
      programmingLanguage,
      classes,
    } = this.props;
    const { focusedId, lineCommentsHiddenState } = this.state;
    const highlightedCode = CodeReview.highlightCode(
      code,
      programmingLanguage,
    ).split('\n');
    return highlightedCode.map((line, i) => {
      // get hidden comments state
      const hiddenCommentState = lineCommentsHiddenState[i];
      const filteredComments = commentList.filter(
        (comment) =>
          (isTeacherView && comment._id === focusedId) || !isTeacherView,
      );
      const lineComments = [
        ...teacherComments.filter((comment) => comment.data.line === i + 1),
        ...botComments.filter((comment) => comment.data.line === i + 1),
        ...filteredComments.filter((comment) => comment.data.line === i + 1),
      ];

      // check if there are any first level comments
      // if there are none, do not render a row
      const parentComments = lineComments.filter(
        (comment) => comment.data.parent === null,
      );

      // should render this comment (bot list)
      const parentCommentsToShow = parentComments.filter((c) =>
        this.shouldShowComment(c),
      );
      const renderedComments = !hiddenCommentState
        ? parentCommentsToShow.map((comment) => (
            <tr className="comment" key={comment._id}>
              <td className="comment editor" colSpan={2}>
                <Paper
                  key={comment._id}
                  className={classes.commentContainer}
                  variant="outlined"
                >
                  {this.renderCommentThread(comment, lineComments)}
                </Paper>
              </td>
            </tr>
          ))
        : null;
      const numThreads = parentCommentsToShow.length;
      return (
        <Fragment
          // eslint-disable-next-line react/no-array-index-key
          key={`$KEY${line}ID${i}`}
        >
          <CodeLine
            htmlLine={line}
            lineNumber={i + 1}
            onClickAdd={(lineNum) => this.handleAddComment(lineNum)}
            disableButton={this.getLineCommentSetting()}
            numThreads={numThreads}
            toggleHiddenStateCallback={this.toggleHiddenCommentState}
            programmingLanguage={programmingLanguage}
          />
          {renderedComments}
        </Fragment>
      );
    });
  }

  renderCodeReview() {
    const { classes, code, isStudentView, isFeedbackView, settings } =
      this.props;
    const { comments, lineCommentsHiddenState } = this.state;
    const {
      showEditButton = DEFAULT_SHOW_EDIT_BUTTON_SETTING,
      showVersionNav = DEFAULT_SHOW_VERSION_NAVIGATION_SETTING,
      showVisibility = DEFAULT_VISIBILITY_MODE_SETTING,
    } = settings;

    const totalNumberOfComments = this.getNumberOfThreadsShown();

    return (
      <>
        <CodeReviewTools
          showVisibilityButton={totalNumberOfComments > 0 && showVisibility}
          showEditButton={isStudentView && showEditButton}
          showHistoryDropdown={
            (isFeedbackView || isStudentView) && showVersionNav
          }
          hideCommentsCallback={this.handleHideAllComments}
          allHiddenState={lineCommentsHiddenState.every((s) => s === true)}
          allVisibleState={lineCommentsHiddenState.every((s) => s === false)}
        />
        <table className={classes.container}>
          <tbody className="code-area">
            {this.renderCodeReviewBody(code, comments)}
          </tbody>
        </table>
      </>
    );
  }

  render() {
    const { editorOpen } = this.props;

    return (
      <div ref={this.rootRef}>
        {editorOpen ? <CodeEditor /> : this.renderCodeReview()}
      </div>
    );
  }
}

const mapStateToProps = (
  { context, appInstance, appInstanceResources, layout },
  { isFeedbackView, selectedStudent },
) => {
  const { codeId } = layout.codeEditorSettings;
  // filter resources that are comments
  const comments = appInstanceResources.content.filter(
    (r) =>
      r.type === COMMENT &&
      // select only comments from the selected user when in FeedbackView
      ((isFeedbackView && r.user === selectedStudent) || !isFeedbackView) &&
      (r.data.codeId === codeId ||
        (_.isUndefined(r.data.codeId) && codeId === DEFAULT_CODE_ID)),
  );
  return {
    userId: context.userId,
    // get the code from the codeEditorSettings
    // as this might be empty, we default to the instructor code set in the appInstance settings
    code: layout.codeEditorSettings.code || appInstance.content.settings.code,
    codeId,
    programmingLanguage: appInstance.content.settings.programmingLanguage,
    comments,
    botComments: appInstanceResources.content.filter(
      (r) => r.type === BOT_COMMENT,
    ),
    teacherComments: appInstanceResources.content.filter(
      (r) => r.type === TEACHER_COMMENT,
    ),
    botUsers: appInstanceResources.content.filter(
      (res) => res.type === BOT_USER,
    ),
    selectedBot: layout.selectedBot,
    standalone: context.standalone,
    isStudentView: STUDENT_MODES.includes(context.mode),
    settings: appInstance.content.settings,
    editorOpen: layout.editorView.open,
  };
};

const mapDispatchToProps = {
  dispatchPostAction: postAction,
  dispatchPostAppInstanceResource: postAppInstanceResource,
  dispatchPatchAppInstanceResource: patchAppInstanceResource,
  dispatchDeleteAppInstanceResource: deleteAppInstanceResource,
  dispatchGetUsers: getUsers,
};

const ConnectedCodeReview = connect(
  mapStateToProps,
  mapDispatchToProps,
)(CodeReview);

const StyledCodeReview = withStyles(styles, { withTheme: true })(
  ConnectedCodeReview,
);

export default StyledCodeReview;
