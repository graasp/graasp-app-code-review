import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const styles = (theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'start',
    listStyle: 'none',
    padding: '10px 0px 10px 10px',
    margin: '0',
  },
  hiddenText: {
    position: 'absolute',
    left: '-10000px',
    top: 'auto',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
  },
  dot: {
    borderRadius: '20px',
    animation: `$tp-loader-animation-1 1300ms infinite ease-in-out`,
    opacity: '0.2',
    width: '10px',
    height: '10px',
    backgroundColor: theme.palette.primary.dark,
    '&:nth-child(2)': {
      animationName: '$tp-loader-animation-2',
      marginLeft: '5px',
      marginRight: '5px',
    },
    '&:nth-child(3)': {
      animationName: '$tp-loader-animation-3',
    },
  },
  '@keyframes tp-loader-animation-1': {
    '0%': {},
    '70%': {},
    '100%': {
      opacity: '0.2',
    },
    '30%': {
      opacity: '1',
    },
  },
  '@keyframes tp-loader-animation-2': {
    '0%': {},
    '15%': {},
    '85%': {},
    '100%': {
      opacity: '0.2',
    },
    '45%': {
      opacity: '1',
    },
  },
  '@keyframes tp-loader-animation-3': {
    '0%': {},
    '30%': {},
    '100%': {
      opacity: '0.2',
    },
    '60%': {
      opacity: '1',
    },
  },
});

const DotLoader = ({ classes }) => (
  <ul className={classes.root}>
    <li className={classes.dot} />
    <li className={classes.dot} />
    <li className={classes.dot} />
    <li className={classes.hiddenText} />
  </ul>
);

DotLoader.propTypes = {
  classes: PropTypes.shape({
    dot: PropTypes.string,
    root: PropTypes.string,
    hiddenText: PropTypes.string,
  }).isRequired,
};

export default withStyles(styles)(DotLoader);
