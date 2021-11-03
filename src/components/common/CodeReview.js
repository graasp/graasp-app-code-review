import './CodeReview.css';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Prism from 'prismjs';
import CodeLine from './CodeLine';
import CommentEditor from './CommentEditor';
import {
  patchAppInstanceResource,
  postAppInstanceResource,
  deleteAppInstanceResource,
  getUsers,
} from '../../actions';
import { COMMENT } from '../../config/appInstanceResourceTypes';

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
    code: PropTypes.string.isRequired,
    programmingLanguage: PropTypes.string.isRequired,
    userId: PropTypes.string,
    comments: PropTypes.string.isRequired,
    dispatchPostAppInstanceResource: PropTypes.func.isRequired,
    dispatchPatchAppInstanceResource: PropTypes.func.isRequired,
    dispatchDeleteAppInstanceResource: PropTypes.func.isRequired,
    dispatchGetUsers: PropTypes.func.isRequired,
  };

  static defaultProps = {
    userId: null,
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
        type: COMMENT,
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
    const { programmingLanguage } = this.props;
    const highlightedCode = CodeReview.highlightCode(
      code,
      programmingLanguage,
    ).split('\n');
    return highlightedCode.map((line, i) => {
      const lineComments = commentList.filter(
        (comment) => comment.data.line === i + 1,
      );
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
  programmingLanguage: appInstance.content.settings.programmingLanguage,
  // filter resources that are comments
  comments: appInstanceResources.content.filter((r) => r.type === COMMENT),
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
