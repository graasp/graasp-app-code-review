import React, { useState } from 'react';
import { createStyles, IconButton, makeStyles } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      // backgroundColor: theme.palette.secondary.light,
      spacing: theme.spacing(0),
    },
  }),
);

const CodeLine = ({ line, lineNumber, onClickAdd }) => {
  const [showAdd, setShowAdd] = useState(false);
  const classes = useStyles();
  return (
    <tr
      onMouseOver={() => setShowAdd(true)}
      onFocus={() => setShowAdd(true)}
      onMouseOut={() => setShowAdd(false)}
      onBlur={() => setShowAdd(false)}
    >
      <td className="line-number">{lineNumber}</td>
      <td className="code-line">
        <IconButton
          className={classes.root}
          // color="primary"
          aria-label="add"
          size="small"
          disabled={!showAdd}
          onClick={() => onClickAdd(lineNumber)}
        >
          <AddIcon fontSize="inherit" />
        </IconButton>
        {line}
      </td>
    </tr>
  );
};

CodeLine.propTypes = {
  line: PropTypes.string.isRequired,
  lineNumber: PropTypes.number.isRequired,
  onClickAdd: PropTypes.func.isRequired,
};

export default CodeLine;
