import './CodeReview.css';
import React, { Component, Fragment } from 'react';
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
} from '../../actions';
import {
  BOT_COMMENT,
  COMMENT,
  TEACHER_COMMENT,
} from '../../config/appInstanceResourceTypes';
import { PRIVATE_VISIBILITY, PUBLIC_VISIBILITY } from '../../config/settings';

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

const NEW_COMMENT_ID = '';
const DELETED_COMMENT = '[DELETED]';

class CodeReview extends Component {
  static propTypes = {
    classes: PropTypes.shape({
      container: PropTypes.string,
      commentContainer: PropTypes.string,
    }).isRequired,
    isTeacherView: PropTypes.bool,
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
    dispatchPostAppInstanceResource: PropTypes.func.isRequired,
    dispatchPatchAppInstanceResource: PropTypes.func.isRequired,
    dispatchDeleteAppInstanceResource: PropTypes.func.isRequired,
    dispatchGetUsers: PropTypes.func.isRequired,
  };

  static defaultProps = {
    isTeacherView: false,
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
  }

  handleDelete = (_id) => {
    const {
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
    if (allChildComments.length) {
      const comment = allComments.find((c) => c._id === _id);
      dispatchPatchAppInstanceResource({
        id: _id,
        data: {
          ...comment.data,
          content: DELETED_COMMENT,
          deleted: true,
        },
      });
    } else {
      dispatchDeleteAppInstanceResource(_id);
    }
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
      dispatchPatchAppInstanceResource({
        id: _id,
        data: {
          ...comment.data,
          content,
        },
      });
    } else if (isTeacherView) {
      dispatchPostAppInstanceResource({
        data: {
          ...comment.data,
          content,
          // only add the botId property when the comment is from a bot
          ...(selectedBot && { botId: selectedBot.value }),
        },
        type: selectedBot ? BOT_COMMENT : TEACHER_COMMENT,
        visibility: PUBLIC_VISIBILITY,
        userId,
      });
    } else {
      dispatchPostAppInstanceResource({
        data: {
          ...comment.data,
          content,
        },
        type: COMMENT,
        visibility: PRIVATE_VISIBILITY,
        userId,
      });
    }
    this.setState({ focusedId: null });
  };

  handleAddComment(lineNum, parentId = null) {
    const { comments } = this.props;
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

  renderChildrenComments(comments, parentId) {
    const { classes, isFeedbackView } = this.props;
    const { focusedId } = this.state;
    const childrenComments = comments
      .filter((comment) => comment.data.parent === parentId)
      .sort((comment) => comment.createdAt);
    if (childrenComments.length === 0) {
      return null;
    }

    return childrenComments.map((comment) => (
      <Paper
        key={comment._id}
        className={classes.commentContainer}
        variant="outlined"
      >
        <CommentEditor
          comment={comment}
          // if a comment has the deleted flag it should not be editable
          readOnly={this.getReadOnlyProperty(comment) || comment.data.deleted}
          showReply={!isFeedbackView}
          focused={focusedId === comment._id}
          onReply={() => this.handleAddComment(comment.data.line, comment._id)}
          onEditComment={(_id) => this.handleEdit(_id)}
          onDeleteComment={(_id) => this.handleDelete(_id)}
          onCancel={this.handleCancel}
          onSubmit={(_id, content) => this.handleSubmit(_id, content)}
        />
        {this.renderChildrenComments(comments, comment._id)}
      </Paper>
    ));
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
      <table className={classes.container}>
        <tbody className="code-area">
          {this.renderCodeReview(code, comments)}
        </tbody>
      </table>
    );
  }
}

const mapStateToProps = (
  { context, appInstance, appInstanceResources },
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
    selectedBot: appInstance.content.settings.selectedBot,
  };
};

const mapDispatchToProps = {
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
