import React from 'react';
import { Dialog, DialogActions, DialogTitle } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';

const ConfirmDialog = ({ open, setOpen, onClose }) => {
  const handleClose = (message) => {
    // console.log('Got closed', message);
    setOpen(false);
    onClose(message);
  };
  return (
    <Dialog
      open={open}
      // onClose={handleClose('maybe')}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Are you sure you want to delete this comment ?
      </DialogTitle>
      <DialogActions>
        <Button onClick={() => handleClose(false)} color="primary">
          Cancel
        </Button>
        <Button onClick={() => handleClose(true)} color="primary" autoFocus>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ConfirmDialog;
