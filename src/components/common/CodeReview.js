import './CodeReview.css';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Prism from 'prismjs';
import CodeLine from './CodeLine';
import CommentEditor from './CommentEditor';

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
  };

  static defaultProps = {};

  static highlightCode(code, syntax) {
    return Prism.highlight(code, Prism.languages[syntax], syntax);
  }

  state = {
    focusedId: null,
  };

  // id and date to be removed when hooked to the api
  comments = [
    {
      id: '1',
      line: 2,
      author: 'Foo Bar Elo The Great',
      date: 'Today at 5pm',
      content: 'a little comment about the `print`',
    },
    {
      id: '2',
      line: 2,
      author: 'Hannibal',
      date: 'Yesterday',
      content: 'a little comment about the print but oh nooo!',
    },
    {
      id: '3',
      line: 7,
      author: 'Foo Bar',
      date: '16 days ago',
      content: 'No empty line',
    },
  ];

  handleDelete = (id) => {
    this.comments = this.comments.filter((com) => com.id !== id);
    this.setState({ focusedId: null });
  };

  handleEdit = (id) => {
    this.setState({ focusedId: id });
  };

  handleSubmit = (text, id) => {
    this.comments = this.comments.map((com) => {
      if (com.id === id) {
        return { ...com, content: text };
      }
      return com;
    });
    this.setState({ focusedId: null });
  };

  handleAddComment(lineNum) {
    const id = `changeToUnique${lineNum}`;
    this.comments = [
      ...this.comments,
      {
        id,
        line: lineNum,
        author: 'Current Author',
        date: 'Yesterday',
        content: '',
      },
    ];
    this.setState({ focusedId: id });
  }

  renderCommentList(commentList) {
    const { focusedId } = this.state;
    return commentList.map((com) => (
      <tr key={com.id} className="comment">
        <td className="comment editor" colSpan={2}>
          <CommentEditor
            comment={com}
            focused={focusedId === com.id}
            onEditComment={(id) => this.handleEdit(id)}
            onDeleteComment={(id) => this.handleDelete(id)}
            onSubmit={(text, comId) => this.handleSubmit(text, comId)}
          />
        </td>
      </tr>
    ));
  }

  renderCodeReview(code, commentList) {
    const highlightedCode = CodeReview.highlightCode(code, 'python').split(
      '\n',
    );
    return highlightedCode.map((line, i) => {
      const lineComments = commentList.filter((el) => el.line === i + 1);
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

    return (
      <table className={classes.container}>
        <tbody className="code-area">
          {this.renderCodeReview(code, this.comments)}
        </tbody>
      </table>
    );
  }
}

const mapStateToProps = ({ appInstance }) => ({
  code: appInstance.content.settings.code,
});

const ConnectedCodeReview = connect(mapStateToProps)(CodeReview);

const StyledCodeReview = withStyles(styles, { withTheme: true })(
  ConnectedCodeReview,
);

export default StyledCodeReview;
