import './CodeReview.css';
import React, { Component } from 'react';
// import Fab from "@material-ui/core/Fab";
// import AddIcon from "@material-ui/icons/Add"
import PropTypes from 'prop-types';
// import {IconButton} from "@material-ui/core";
import { withStyles } from '@material-ui/core/styles';

import CodeLine from './CodeLine';
import CommentEditor from './CommentEditor';

const codeSnippet =
  '# this is a bit of python code\n' +
  "print('hello world')\n" +
  '\n' +
  '# and here we use an f-string\n' +
  "name = 'Garrett'\n" +
  "print(f'Hello {name}!\\nHow are you ?')\n" +
  '\n' +
  '\n' +
  'exit()\n';

class CodeReview extends Component {
  static propTypes = {
    classes: PropTypes.shape({
      root: PropTypes.string,
      content: PropTypes.string,
      actions: PropTypes.string,
      main: PropTypes.string,
      button: PropTypes.string,
    }).isRequired,
  };

  static defaultProps = {};

  static styles = (theme) => ({
    root: {
      padding: theme.spacing(1),
      margin: theme.spacing(1),
    },
    content: {
      padding: theme.spacing(1),
    },
    button: {
      marginTop: theme.spacing(3),
    },
    actions: {
      justifyContent: 'flex-end',
    },
  });

  state = {
    focusedId: null,
  };

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
    // console.log('Delete ', id);
    this.comments = this.comments.filter((com) => com.id !== id);
    this.setState({ focusedId: null });
  };

  handleEdit = (id) => {
    // console.log(id)
    this.setState({ focusedId: id });
  };

  handleSubmit = (text, comId) => {
    // console.log(comId)
    this.comments = this.comments.map((com) => {
      if (com.id === comId) {
        return { ...com, content: text };
      }
      return com;
    });
    this.setState({ focusedId: null });
  };

  handleAddComment(lineNum) {
    // console.log('Add a comment on ', lineNum);
    // TODO: change to unique id and give better author names and time !
    const id = `changeintoUnique${lineNum}`;
    this.comments = [
      ...this.comments,
      {
        id,
        line: lineNum,
        author: 'Current Author',
        date: 'Yesterday',
        content: null,
      },
    ];
    this.setState({ focusedId: id });
  }

  renderCodeReview(code, commentList) {
    const { focusedId } = this.state;
    return code.map((line, i) => {
      const lineComments = commentList.filter((el) => el.line === i + 1);
      return (
        <>
          <CodeLine
            line={line}
            lineNumber={i + 1}
            onClickAdd={(lineNum) => this.handleAddComment(lineNum)}
          />
          {lineComments.map((com) => (
            <tr className="comment">
              <td className="comment editor" colSpan="2">
                <CommentEditor
                  comment={com}
                  focused={focusedId === com.id}
                  onEditComment={(id) => this.handleEdit(id)}
                  onDeleteComment={(id) => this.handleDelete(id)}
                  onSubmit={(text, comId) => this.handleSubmit(text, comId)}
                />
              </td>
            </tr>
          ))}
        </>
      );
    });
  }

  render() {
    return (
      <table className="code-review container">
        <tbody className="code-area">
          {this.renderCodeReview(codeSnippet.split('\n'), this.comments)}
        </tbody>
      </table>
    );
  }
}

const StyledCodeReview = withStyles(CodeReview.style)(CodeReview);

export default StyledCodeReview;
