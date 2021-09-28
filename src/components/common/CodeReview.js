import './CodeReview.css';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Prism from 'prismjs';
import CodeLine from './CodeLine';
import CommentEditor from './CommentEditor';

Prism.manual = true;

const codeSnippet =
  'import discord\n' +
  'from discord.ext import commands\n' +
  '\n' +
  'import random\n' +
  'import res.courses_messages as course_msg\n' +
  'import utils.messages as u_msg\n' +
  'import config.config as cfg\n' +
  '\n' +
  '\n' +
  'class Course(commands.Cog):\n' +
  '    def __init__(self, bot):\n' +
  '        self.bot = bot\n' +
  '\n' +
  "    @commands.group(name='course', aliases=['crs', 'c', 'cours', 'courses'],\n" +
  "                    help='Manage Course channels', invoke_without_command=True)\n" +
  '    async def course(self, ctx):\n' +
  "        await ctx.channel.send('This command lets you manage the channels for courses')\n" +
  '\n' +
  "    @course.command(name='create', aliases=['creer', '+'], help='Create a channel for a course.')\n" +
  '    async def create_course(self, ctx, course_name):\n' +
  '        # create role:\n' +
  "        role_name = 'sub2:' + course_name.lower()\n" +
  '        try:\n' +
  "            role = await ctx.guild.create_role(name=role_name, reason='New course channel')\n" +
  '            # get category\n' +
  '            course_category = discord.utils.get(ctx.guild.categories, id=cfg.COURSE_CHANNEL_ID)\n' +
  '            overwrite_rules = {role: discord.PermissionOverwrite(read_messages=True),\n' +
  '                               ctx.guild.default_role: discord.PermissionOverwrite(read_messages=False)}\n' +
  '            await ctx.guild.create_text_channel(name=course_name, category=course_category, overwrites=overwrite_rules)\n' +
  '            await ctx.message.author.add_roles(role)\n' +
  '        except (discord.Forbidden, discord.HTTPException):\n' +
  "            await u_msg.send_error(ctx, f'Woops something went wrong, contacting <@!{cfg.DEV_ID}>')\n" +
  '        else:\n' +
  "            await ctx.message.add_reaction('✅')\n" +
  '\n' +
  "    @course.command(name='sub', aliases=['join', 'rejoindre'], help='Subscribe to a course channel')\n" +
  '    async def sub_course(self, ctx, course_name):\n' +
  '        # Check if role is authorized\n' +
  '        member = ctx.message.author\n' +
  "        new_role = discord.utils.get(member.guild.roles, name='sub2:' + course_name)\n" +
  '        if new_role:\n' +
  '            try:\n' +
  '                await member.add_roles(new_role)\n' +
  '            except (discord.Forbidden, discord.HTTPException):\n' +
  "                await u_msg.send_error(ctx, f'Woops something went wrong, contacting <@!{cfg.DEV_ID}>')\n" +
  '            else:\n' +
  "                await ctx.message.add_reaction('✅')\n" +
  '        else:\n' +
  "            await ctx.send(f'There is no course named : {course_name}.')\n" +
  '\n' +
  "    '''\n" +
  '    # not quite\n' +
  '    @delete_course.error\n' +
  '    async def del_course_error(error, ctx):\n' +
  '        if isinstance(error, discord.ext.commands.MissingPermissions):\n' +
  "            await msg_error(ctx, 'You are lacking the necessary permissions. Sorry.')\n" +
  "    '''\n";

class CodeReview extends Component {
  static propTypes = {
    classes: PropTypes.shape({
      root: PropTypes.string,
      table: PropTypes.string,
      actions: PropTypes.string,
      button: PropTypes.string,
    }).isRequired,
  };

  static defaultProps = {};

  static styles = (theme) => ({
    root: {
      padding: theme.spacing(1),
      margin: theme.spacing(1),
    },
    button: {
      marginTop: theme.spacing(3),
    },
    actions: {
      justifyContent: 'flex-end',
    },
  });

  static highlightCode(code, syntax) {
    let highlighted;
    if (syntax === 'python') {
      highlighted = Prism.highlight(code, Prism.languages.python, 'python');
    } else {
      highlighted = Prism.highlight(
        code,
        Prism.languages.javascript,
        'javascript',
      );
    }
    return highlighted;
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
    // console.log('Delete', id);
    this.comments = this.comments.filter((com) => com.id !== id);
    this.setState({ focusedId: null });
  };

  handleEdit = (id) => {
    // console.log('Edit', id)
    this.setState({ focusedId: id });
  };

  handleSubmit = (text, id) => {
    // console.log('Submit', id)
    this.comments = this.comments.map((com) => {
      if (com.id === id) {
        return { ...com, content: text };
      }
      return com;
    });
    this.setState({ focusedId: null });
  };

  handleAddComment(lineNum) {
    // console.log('Add a comment on', lineNum);
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
    return (
      <table className="code-review container">
        <tbody className="code-area">
          {this.renderCodeReview(codeSnippet, this.comments)}
        </tbody>
      </table>
    );
  }
}

const StyledCodeReview = withStyles(CodeReview.style, { withTheme: true })(
  CodeReview,
);

export default StyledCodeReview;
