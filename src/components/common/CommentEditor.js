import React, { Component } from 'react';
import * as Showdown from 'showdown';
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
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import ConfirmDialog from './ConfirmDialog';

class CommentEditor extends Component {
  static propTypes = {
    comment: PropTypes.arrayOf().isRequired,
    focused: PropTypes.bool.isRequired,
    onEditComment: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onDeleteComment: PropTypes.func.isRequired,
    classes: PropTypes.shape({
      root: PropTypes.string,
      header: PropTypes.string,
      content: PropTypes.string,
      actions: PropTypes.string,
      table: PropTypes.string,
      main: PropTypes.string,
      button: PropTypes.string,
      message: PropTypes.string,
      fab: PropTypes.string,
    }).isRequired,
  };

  static defaultProps = {};

  static styles = (theme) => ({
    root: {
      padding: theme.spacing(1),
      margin: theme.spacing(1),
    },
    header: {
      padding: theme.spacing(1),
    },
    content: {
      padding: theme.spacing(1),
    },
    button: {
      padding: theme.spacing(5),
    },
    actions: {
      justifyContent: 'flex-end',
    },
    table: {
      minWidth: 700,
    },
    message: {
      padding: theme.spacing(),
      backgroundColor: theme.status.danger.background[500],
      color: theme.status.danger.color,
      marginBottom: theme.spacing(2),
    },
    fab: {
      margin: theme.spacing(),
      position: 'fixed',
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
  });

  state = {
    isEdited: false,
    value: '',
    selectedTab: 'preview',
    showDelete: false,
    open: false,
  };

  converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
  });

  componentDidMount() {
    const { comment, focused } = this.props;
    this.setState({
      value: comment.content,
      isEdited: focused,
      selectedTab: focused ? 'write' : 'preview',
    });
  }

  onCancel = () => {
    const { comment, onDeleteComment } = this.props;
    // console.log(comment)
    if (!comment.content) {
      onDeleteComment(comment.id);
      return;
    }
    this.setState({
      selectedTab: 'write',
      value: comment.content,
      isEdited: false,
    });
  };

  onEdit = () => {
    const { isEdited, value } = this.state;
    const { onSubmit, onEditComment, comment } = this.props;
    this.setState({ selectedTab: isEdited ? 'preview' : 'write' });
    // console.log('Edit clicked', comment.id, isEdited)
    if (isEdited) {
      // console.log('calling submit')
      onSubmit(value, comment.id);
    } else {
      // console.log('calling handle edit clicked')
      onEditComment(comment.id);
    }
    this.setState({ isEdited: !isEdited });
  };

  onComDelete = (id) => {
    const { onDeleteComment } = this.props;
    // console.log('saving it to be deleted', id);
    onDeleteComment(id);
  };

  renderCardHeader() {
    const { comment, classes } = this.props;
    const { author, date } = comment;
    const { isEdited, showDelete, open } = this.state;
    return isEdited ? null : (
      <CardHeader
        className={classes.header}
        avatar={
          <Avatar>
            {author
              .match(/\b(\w)/g)
              .slice(0, 2)
              .join('')}
          </Avatar>
        }
        title={author}
        subheader={date}
        action={
          <>
            {showDelete ? (
              <IconButton
                aria-label="delete"
                onClick={() => this.setState({ open: true })}
              >
                <DeleteIcon />
              </IconButton>
            ) : null}
            <ConfirmDialog
              open={open}
              setOpen={(v) => this.setState({ open: v })}
              onClose={(m) => {
                if (m) {
                  this.onComDelete(comment.id);
                }
              }}
            />
          </>
        }
      />
    );
  }

  render() {
    const { selectedTab, value, isEdited } = this.state;
    const { classes } = this.props;
    return (
      <Card
        className={classes.root}
        onMouseEnter={() => this.setState({ showDelete: true })}
        onMouseLeave={() => this.setState({ showDelete: false })}
        variant="outlined"
      >
        {this.renderCardHeader()}
        <CardContent className={classes.content}>
          {isEdited ? (
            <ReactMde
              value={value}
              onChange={(v) => this.setState({ value: v })}
              selectedTab={selectedTab}
              onTabChange={(t) => this.setState({ selectedTab: t })}
              generateMarkdownPreview={(markdown) =>
                Promise.resolve(this.converter.makeHtml(markdown))
              }
              childProps={{
                writeButton: {
                  tabIndex: -1,
                },
                textArea: {
                  autoFocus: true,
                },
              }}
            />
          ) : (
            <Grid container className="mde-preview standalone">
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
        <CardActions className={classes.actions}>
          {isEdited ? (
            <Button
              variant="outlined"
              color="secondary"
              onClick={this.onCancel}
            >
              Cancel
            </Button>
          ) : null}
          <Button variant="contained" color="primary" onClick={this.onEdit}>
            {isEdited ? 'Finish' : 'Edit'}
          </Button>
        </CardActions>
      </Card>
    );
  }
}

const StyledCommentEditor = withStyles(CommentEditor.styles)(CommentEditor);

export default StyledCommentEditor;
