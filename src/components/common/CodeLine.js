import React, { useState } from 'react';
import { Badge, createStyles, IconButton, makeStyles } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import PropTypes from 'prop-types';
import 'prismjs/themes/prism.css';
import { MessageOutlined } from '@material-ui/icons';
import { programmingLanguageSettings } from '../../constants/programmingLanguages';

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      marginRight: theme.spacing(1),
    },
    pre: {
      display: 'inline',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      tabSize: (props) =>
        programmingLanguageSettings[props.programmingLanguage].tabSize,
    },
    lineNumber: {
      width: '1%',
      minWidth: '50px',
      paddingRight: '10px',
      paddingLeft: '10px',
      marginRight: '30px',
      fontFamily:
        'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace',
      fontSize: '12px',
      lineHeight: '20px',
      color: '#545d68',
      textAlign: 'right',
      whiteSpace: 'nowrap',
      verticalAlign: 'top',
    },
    commentNumber: {
      width: '36px',
      minWidth: '36px',
      lineHeight: '20px',
    },
    lastCol: {
      width: '36px',
      height: '36px',
    },
    badgeRoot: {
      color: theme.palette.background.paper,
      '& .MuiBadge-badge': {
        backgroundColor: theme.palette.primary.main,
        border: `2px solid ${theme.palette.background.paper}`,
        right: 5,
        top: 5,
      },
    },
  }),
);

const CodeLine = ({
  htmlLine,
  lineNumber,
  onClickAdd,
  disableButton,
  numThreads,
  toggleHiddenStateCallback,
  programmingLanguage,
}) => {
  /* eslint-disable react/no-danger */
  const [showAdd, setShowAdd] = useState(false);
  const classes = useStyles({ programmingLanguage });

  const commentButton = (
    <IconButton
      size="small"
      onClick={() => toggleHiddenStateCallback(lineNumber)}
    >
      <MessageOutlined />
    </IconButton>
  );

  return (
    <tr
      onMouseOver={() => setShowAdd(true)}
      onFocus={() => setShowAdd(true)}
      onMouseOut={() => setShowAdd(false)}
      onBlur={() => setShowAdd(false)}
    >
      <td className={classes.lineNumber}>
        {lineNumber}
        {disableButton ? null : (
          <IconButton
            className={classes.root}
            color="primary"
            aria-label="add"
            size="small"
            disabled={!showAdd}
            onClick={() => onClickAdd(lineNumber)}
          >
            <AddIcon fontSize="inherit" />
          </IconButton>
        )}
      </td>
      <td className="code-line">
        <pre
          className={classes.pre}
          dangerouslySetInnerHTML={{ __html: htmlLine }}
        />
      </td>
      <td className={classes.commentNumber}>
        {numThreads ? (
          <Badge
            badgeContent={numThreads}
            className={classes.badgeRoot}
            max={9}
          >
            {commentButton}
          </Badge>
        ) : null}
      </td>
    </tr>
  );
};

CodeLine.propTypes = {
  htmlLine: PropTypes.string.isRequired,
  lineNumber: PropTypes.number.isRequired,
  onClickAdd: PropTypes.func.isRequired,
  disableButton: PropTypes.bool,
  numThreads: PropTypes.number,
  toggleHiddenStateCallback: PropTypes.func.isRequired,
  programmingLanguage: PropTypes.string.isRequired,
};

CodeLine.defaultProps = {
  disableButton: false,
  numThreads: 0,
};

export default CodeLine;
