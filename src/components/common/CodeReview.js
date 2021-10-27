import './CodeReview.css';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Prism from 'prismjs';
import _ from 'lodash';
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
};

const NEW_COMMENT_ID = '';

class CodeReview extends Component {
  static propTypes = {
    classes: PropTypes.shape({
      container: PropTypes.string,
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
    // selectedStudent: null,
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
    const { dispatchDeleteAppInstanceResource } = this.props;
    dispatchDeleteAppInstanceResource(_id);
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

  handleSubmit = (_id, line, content) => {
    const {
      dispatchPostAppInstanceResource,
      dispatchPatchAppInstanceResource,
      userId,
      selectedBot,
      isTeacherView,
    } = this.props;

    if (_id) {
      dispatchPatchAppInstanceResource({
        id: _id,
        data: {
          line,
          content,
        },
      });
    } else if (isTeacherView) {
      dispatchPostAppInstanceResource({
        data: {
          line,
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
          line,
          content,
        },
        type: COMMENT,
        visibility: PRIVATE_VISIBILITY,
        userId,
      });
    }
    this.setState({ focusedId: null });
  };

  handleAddComment(lineNum) {
    const { comments } = this.props;
    const newComments = [
      ...comments,
      {
        _id: NEW_COMMENT_ID,
        data: {
          line: lineNum,
          content: '',
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

  renderCommentList(commentList) {
    const { focusedId } = this.state;
    return commentList.map((comment) => (
      <tr key={comment._id} className="comment">
        <td className="comment editor" colSpan={2}>
          <CommentEditor
            comment={comment}
            readOnly={this.getReadOnlyProperty(comment)}
            focused={focusedId === comment._id}
            onEditComment={(_id) => this.handleEdit(_id)}
            onDeleteComment={(_id) => this.handleDelete(_id)}
            onCancel={this.handleCancel}
            onSubmit={(_id, line, content) =>
              this.handleSubmit(_id, line, content)
            }
          />
        </td>
      </tr>
    ));
  }

  renderCodeReview(code, commentList) {
    const { isFeedbackView, isTeacherView, botComments, teacherComments } =
      this.props;
    const { focusedId } = this.state;
    const highlightedCode = CodeReview.highlightCode(code, 'python').split(
      '\n',
    );
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

      const renderedComments = this.renderCommentList(lineComments);
      return (
        // add a key for each line ...
        <>
          <CodeLine
            htmlLine={line}
            lineNumber={i + 1}
            onClickAdd={(lineNum) => this.handleAddComment(lineNum)}
            disableButton={isFeedbackView}
          />
          {renderedComments}
        </>
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
    comments,
    botComments: appInstanceResources.content
      .filter((r) => r.type === BOT_COMMENT)
      .map((r) => ({
        ...r,
        _id: r.data.botId,
      })),
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
