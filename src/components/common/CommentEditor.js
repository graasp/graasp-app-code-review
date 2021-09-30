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
import EditIcon from '@material-ui/icons/Edit';
import { withTranslation } from 'react-i18next';
import ConfirmDialog from './ConfirmDialog';

const styles = (theme) => ({
  root: {
    padding: theme.spacing(1),
    margin: theme.spacing(1),
  },
  header: {
    padding: theme.spacing(1),
  },
  content: {
    paddingTop: 0,
    '&:last-child': {
      paddingBottom: 0,
    },
  },
  actions: {
    padding: theme.spacing(1),
    justifyContent: 'flex-end',
  },
  commentText: {
    paddingLeft: '38px',
  },
});

class CommentEditor extends Component {
  static propTypes = {
    t: PropTypes.func.isRequired,
    comment: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        line: PropTypes.number.isRequired,
        author: PropTypes.string,
        date: PropTypes.string,
        content: PropTypes.string.isRequired,
      }),
    ).isRequired,
    focused: PropTypes.bool.isRequired,
    onEditComment: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onDeleteComment: PropTypes.func.isRequired,
    classes: PropTypes.shape({
      root: PropTypes.string,
      header: PropTypes.string,
      content: PropTypes.string,
      actions: PropTypes.string,
    }).isRequired,
  };

  static defaultProps = {};

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
    if (isEdited) {
      onSubmit(value, comment.id);
    } else {
      onEditComment(comment.id);
    }
    this.setState({ isEdited: !isEdited });
  };

  onComDelete = (id) => {
    const { onDeleteComment } = this.props;
    onDeleteComment(id);
  };

  renderCardHeader() {
    /* eslint-disable react/prop-types */
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
              <>
                <IconButton
                  aria-label="edit"
                  color="primary"
                  onClick={this.onEdit}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="delete"
                  color="secondary"
                  onClick={() => this.setState({ open: true })}
                >
                  <DeleteIcon />
                </IconButton>
              </>
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
    const { classes, t } = this.props;
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
              onTabChange={(tab) => this.setState({ selectedTab: tab })}
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
            </Grid>
          )}
        </CardContent>
        {isEdited ? (
          <CardActions className={classes.actions}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={this.onCancel}
            >
              {t('Cancel')}
            </Button>
            <Button variant="contained" color="primary" onClick={this.onEdit}>
              {t('Finish')}
            </Button>
          </CardActions>
        ) : null}
      </Card>
    );
  }
}

const StyledCommentEditor = withStyles(styles)(CommentEditor);

export default withTranslation()(StyledCommentEditor);
