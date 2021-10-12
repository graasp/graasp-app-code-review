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
import { BOT_COMMENT, COMMENT } from '../../config/appInstanceResourceTypes';
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

class CodeReview extends Component {
  static propTypes = {
    classes: PropTypes.shape({
      container: PropTypes.string,
    }).isRequired,
    botUser: PropTypes.string,
    botComments: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        appInstanceId: PropTypes.string,
        data: PropTypes.shape({}),
      }),
    ),
    code: PropTypes.string.isRequired,
    userId: PropTypes.string,
    comments: PropTypes.string.isRequired,
    dispatchPostAppInstanceResource: PropTypes.func.isRequired,
    dispatchPatchAppInstanceResource: PropTypes.func.isRequired,
    dispatchDeleteAppInstanceResource: PropTypes.func.isRequired,
    dispatchGetUsers: PropTypes.func.isRequired,
  };

  static defaultProps = {
    userId: null,
    botUser: null,
    botComments: [],
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
    if (focusedId === '') {
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
      botUser,
    } = this.props;

    if (_id) {
      dispatchPatchAppInstanceResource({
        id: _id,
        data: {
          line,
          content,
        },
      });
    } else {
      dispatchPostAppInstanceResource({
        data: {
          line,
          content,
        },
        type: botUser ? BOT_COMMENT : COMMENT,
        visibility: botUser ? PUBLIC_VISIBILITY : PRIVATE_VISIBILITY,
        // when bot, not able to set the user property ...
        userId: botUser ? botUser.label : userId,
      });
    }
    this.setState({ focusedId: null });
  };

  handleAddComment(lineNum) {
    const { comments } = this.props;
    const newComments = [
      ...comments,
      {
        _id: '',
        data: {
          line: lineNum,
          content: '',
        },
      },
    ];
    this.setState({
      comments: newComments,
      focusedId: '',
    });
  }

  renderCommentList(commentList) {
    const { focusedId } = this.state;
    return commentList.map((comment) => (
      <tr key={comment._id} className="comment">
        <td className="comment editor" colSpan={2}>
          <CommentEditor
            comment={comment}
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
    const { botComments } = this.props;
    const highlightedCode = CodeReview.highlightCode(code, 'python').split(
      '\n',
    );
    return highlightedCode.map((line, i) => {
      const lineComments = [
        ...commentList.filter((comment) => comment.data.line === i + 1),
        ...botComments.filter((comment) => comment.data.line === i + 1),
      ];
      const renderedComments = this.renderCommentList(lineComments);
      return (
        <>
          <CodeLine
            htmlLine={line}
            lineNumber={i + 1}
            onClickAdd={(lineNum) => this.handleAddComment(lineNum)}
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

const mapStateToProps = ({
  context,
  users,
  appInstance,
  appInstanceResources,
}) => ({
  userId: context.userId,
  users: users.content,
  code: appInstance.content.settings.code,
  // filter resources that are comments
  comments: appInstanceResources.content.filter((r) => r.type === COMMENT),
  botComments: appInstanceResources.content.filter(
    (r) => r.type === BOT_COMMENT,
  ),
});

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
