import './CodeReview.css';
import React, { Component, createRef, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Prism from 'prismjs';
import _ from 'lodash';
import { Paper } from '@material-ui/core';
import CodeLine from './CodeLine';
import CommentEditor from './CommentEditor';
import {
  patchAppInstanceResource,
  postAppInstanceResource,
  deleteAppInstanceResource,
  getUsers,
  postAction,
} from '../../actions';
import {
  BOT_COMMENT,
  COMMENT,
  TEACHER_COMMENT,
} from '../../config/appInstanceResourceTypes';
import {
  ADAPT_HEIGHT_TIMEOUT,
  DELETED_COMMENT_TEXT,
  NEW_COMMENT_ID,
  PRIVATE_VISIBILITY,
  PUBLIC_VISIBILITY,
  STUDENT_MODES,
} from '../../config/settings';
import {
  CLICKED_ADD_COMMENT,
  CREATED_COMMENT,
  DELETED_COMMENT,
  UPDATED_COMMENT,
} from '../../config/verbs';

Prism.manual = true;

const styles = {
  container: {
    borderSpacing: 0,
    maxWidth: '800px',
    width: '90%',
    margin: '20px auto auto',
    boxSizing: 'border-box',
  },
  commentContainer: {
    margin: '5px',
    marginLeft: '20px',
  },
};

class CodeReview extends Component {
  static propTypes = {
    classes: PropTypes.shape({
      container: PropTypes.string,
      commentContainer: PropTypes.string,
    }).isRequired,
    isTeacherView: PropTypes.bool,
    isStudentView: PropTypes.bool,
    isFeedbackView: PropTypes.bool,
    selectedBot: PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    }),
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
    programmingLanguage: PropTypes.string.isRequired,
    userId: PropTypes.string,
    comments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        appInstanceId: PropTypes.string,
        data: PropTypes.shape({}),
      }),
    ),
    standalone: PropTypes.bool.isRequired,
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
    botComments: [],
    teacherComments: [],
    comments: [],
  };

  static highlightCode(code, syntax) {
    return Prism.highlight(code, Prism.languages[syntax], syntax);
  }

  constructor(props) {
    super(props);
    // create ref to track the height of the component
    this.rootRef = createRef();
  }

  state = (() => {
    const { comments } = this.props;

    return {
      focusedId: null,
      comments,
    };
  })();

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
        // only add the botId property when the comment is from a bot
        ...(selectedBot && { botId: selectedBot.value }),
      };
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
    const { comments, dispatchPostAction } = this.props;
    const newComments = [
      ...comments,
      {
        _id: NEW_COMMENT_ID,
        data: {
          line: lineNum,
          content: '',
          parent: parentId,
        },
      },
    ];
    this.setState({
      comments: newComments,
      focusedId: NEW_COMMENT_ID,
    });
    // track that this line was clicked
    dispatchPostAction({
      data: {
        line: lineNum,
      },
      verb: CLICKED_ADD_COMMENT,
    });
  }

  getReadOnlyProperty(comment) {
    const { isTeacherView, isFeedbackView } = this.props;
    if (isTeacherView) {
      // teacher can edit all comments
      return false;
    }
    if (isFeedbackView) {
      return true;
    }
    // readOnly just for comments that are not from users
    return comment.type !== COMMENT;
  }

  adaptHeight = () => {
    // set timeout to leave time for the height to be set
    setTimeout(() => {
      const { standalone, isStudentView } = this.props;
      // adapt height when :
      // - not in standalone (so when in an iframe)
      // - is in studentView
      if (!standalone && isStudentView) {
        // get height from the root element and add a small margin
        const actualHeight = this.rootRef.current.scrollHeight + 30;
        if (window.frameElement) {
          window.frameElement.style['min-height'] = `${actualHeight}px`;
          window.frameElement.style.overflowY = 'hidden';
          window.frameElement.scrolling = 'no';
          window.frameElement.style.height = `${actualHeight}px`;
        }
      }
    }, ADAPT_HEIGHT_TIMEOUT);
  };

  renderChildrenComments(comments, parentId) {
    const { classes, isFeedbackView } = this.props;
    const { focusedId } = this.state;
    const childrenComments = comments
      .filter((comment) => comment.data.parent === parentId)
      .sort((comment) => comment.createdAt);
    if (childrenComments.length === 0) {
      return null;
    }

    return childrenComments.map((comment) => {
      // verify if the comment has children by
      // checking the length of the array of first order children
      const hasChildrenComments =
        comments.filter(
          (childComment) => childComment.data.parent === comment._id,
        ).length !== 0;

      // set to true if:
      // - the comment is not delete
      // - the comment is deleted but it is the last comment in the tree -> so it can be deleted
      const showDelete =
        (comment.data.deleted && !hasChildrenComments) || !comment.data.deleted;

      return (
        <Paper
          key={comment._id}
          className={classes.commentContainer}
          variant="outlined"
        >
          <CommentEditor
            comment={comment}
            readOnly={this.getReadOnlyProperty(comment)}
            showReply={!isFeedbackView}
            showDelete={showDelete}
            focused={focusedId === comment._id}
            onReply={() =>
              this.handleAddComment(comment.data.line, comment._id)
            }
            onEditComment={(_id) => this.handleEdit(_id)}
            onDeleteComment={(_id) => this.handleDelete(_id)}
            onCancel={this.handleCancel}
            onSubmit={(_id, content) => this.handleSubmit(_id, content)}
            adaptStyle={this.adaptHeight}
          />
          {this.renderChildrenComments(comments, comment._id)}
        </Paper>
      );
    });
  }

  renderCodeReview(code, commentList) {
    const {
      isFeedbackView,
      isTeacherView,
      botComments,
      teacherComments,
      programmingLanguage,
    } = this.props;
    const { focusedId } = this.state;
    const highlightedCode = CodeReview.highlightCode(
      code,
      programmingLanguage,
    ).split('\n');
    return highlightedCode.map((line, i) => {
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
      // if there are any, just do not render a row
      const renderedComments = lineComments.filter(
        (comment) => comment.data.parent === null,
      ).length ? (
        <tr className="comment">
          <td className="comment editor" colSpan={2}>
            {this.renderChildrenComments(lineComments, null)}
          </td>
        </tr>
      ) : null;

      return (
        <Fragment
          // eslint-disable-next-line react/no-array-index-key
          key={`$KEY${line}ID${i}`}
        >
          <CodeLine
            htmlLine={line}
            lineNumber={i + 1}
            onClickAdd={(lineNum) => this.handleAddComment(lineNum)}
            disableButton={isFeedbackView}
          />
          {renderedComments}
        </Fragment>
      );
    });
  }

  render() {
    const { classes, code } = this.props;
    const { comments } = this.state;

    return (
      <table ref={this.rootRef} className={classes.container}>
        <tbody className="code-area">
          {this.renderCodeReview(code, comments)}
        </tbody>
      </table>
    );
  }
}

const mapStateToProps = (
  { context, appInstance, appInstanceResources, layout },
  { isFeedbackView, selectedStudent },
) => {
  // filter resources that are comments
  const comments = appInstanceResources.content.filter(
    (r) =>
      r.type === COMMENT &&
      // select only comments from the selected user when in FeedbackView
      ((isFeedbackView && r.user === selectedStudent) || !isFeedbackView),
  );
  return {
    userId: context.userId,
    code: appInstance.content.settings.code,
    programmingLanguage: appInstance.content.settings.programmingLanguage,
    comments,
    botComments: appInstanceResources.content.filter(
      (r) => r.type === BOT_COMMENT,
    ),
    teacherComments: appInstanceResources.content.filter(
      (r) => r.type === TEACHER_COMMENT,
    ),
    selectedBot: layout.selectedBot,
    standalone: context.standalone,
    isStudentView: STUDENT_MODES.includes(context.mode),
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
