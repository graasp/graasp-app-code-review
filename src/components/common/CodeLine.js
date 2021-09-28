import React, { useState } from 'react';
import { createStyles, IconButton, makeStyles } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import PropTypes from 'prop-types';
import 'prismjs/themes/prism.css';

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      marginRight: theme.spacing(1),
    },
  }),
);

const CodeLine = ({ htmlLine, lineNumber, onClickAdd }) => {
  /* eslint-disable react/no-danger */
  const [showAdd, setShowAdd] = useState(false);
  const classes = useStyles();
  return (
    <tr
      onMouseOver={() => setShowAdd(true)}
      onFocus={() => setShowAdd(true)}
      onMouseOut={() => setShowAdd(false)}
      onBlur={() => setShowAdd(false)}
    >
      <td className="line-number">
        {lineNumber}
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
      </td>
      <td className="code-line">
        <pre
          style={{
            display: 'inline',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: htmlLine }}
        />
      </td>
    </tr>
  );
};

CodeLine.propTypes = {
  htmlLine: PropTypes.string.isRequired,
  lineNumber: PropTypes.number.isRequired,
  onClickAdd: PropTypes.func.isRequired,
};

export default CodeLine;
